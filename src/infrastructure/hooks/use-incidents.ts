import {
  IncidentDraft,
  LocalIncidentRecord,
} from "@/core/entities/incidents.entity";
import axios from "axios";
import { getSessionVersion } from "@/infrastructure/auth/auth-session";
import { queryClient } from "@/config/query/query-client";
import { incidentsService } from "@/infrastructure/services/incidents.service";
import { useIncidentDraftStore } from "@/infrastructure/storage/incident-draft-storage";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

export const incidentKeys = {
  history: (id: string) => ["incidents", id, "history"] as const,
  evidence: (id: string) => ["incidents", id, "evidence"] as const,
  assignments: (id: string) => ["incidents", id, "assignments"] as const,
};

async function submitIncidentDraft(draft: IncidentDraft) {
  const store = useIncidentDraftStore.getState();
  const session = getSessionVersion();
  const checkSession = () => {
    if (getSessionVersion() !== session) throw new Error("La sesión cambió.");
  };
  let incident = draft.serverIncident;
  let current = incident
    ? await incidentsService.detail(incident.id).then(
        (response) => response.data,
        (error: unknown) => {
          if (axios.isAxiosError(error) && error.response?.status === 404)
            return null;
          throw error;
        },
      )
    : null;
  checkSession();
  const recoveringLegacy = Boolean(incident && !current);
  if (recoveringLegacy) {
    for (const evidence of draft.evidences) {
      store.updateEvidence(evidence.localId, { status: "queued" });
    }
  }
  if (!current) incident = null;

  if (!incident) {
    const response = await incidentsService.create({
      clientRequestId: draft.clientRequestId,
      originalMessage: draft.originalMessage,
      latitude: draft.latitude as number,
      longitude: draft.longitude as number,
      address: draft.address || undefined,
      addressReference: draft.addressReference || undefined,
    });
    checkSession();
    incident = response.data;
    store.setServerIncident(incident);
  }

  current ??= (await incidentsService.detail(incident.id)).data;
  checkSession();
  let submittedAt = current.submittedAt;
  if (current.status === "RECEIVED") {
    for (const evidence of draft.evidences) {
      if (evidence.status === "confirmed" && !recoveringLegacy) continue;
      try {
        store.updateEvidence(evidence.localId, {
          status: "uploading",
          error: undefined,
        });
        const { data } = await incidentsService.uploadEvidence(
          incident.id,
          evidence,
        );
        checkSession();
        current = { ...current, version: data.incidentVersion };
        store.setServerIncident({ ...incident, version: current.version });
        store.updateEvidence(evidence.localId, { status: "confirmed" });
      } catch (error) {
        checkSession();
        store.updateEvidence(evidence.localId, { status: "error" });
        throw error;
      }
    }
    try {
      const { data } = await incidentsService.submit(
        incident.id,
        current.version,
      );
      checkSession();
      current = { ...current, status: data.status, version: data.version };
      submittedAt = new Date().toISOString();
    } catch (error) {
      const reconciled = await incidentsService
        .detail(incident.id)
        .catch(() => null);
      if (!reconciled?.data.submittedAt) throw error;
      current = reconciled.data;
      submittedAt = current.submittedAt;
    }
  }
  checkSession();
  if (!submittedAt) throw new Error("La incidencia ya no se puede enviar.");
  const latestDraft = useIncidentDraftStore.getState().draft;
  const record: LocalIncidentRecord = {
    id: incident.id,
    trackingCode: incident.trackingCode,
    clientRequestId: draft.clientRequestId,
    originalMessage: latestDraft.originalMessage,
    address: latestDraft.address,
    addressReference: latestDraft.addressReference,
    latitude: latestDraft.latitude as number,
    longitude: latestDraft.longitude as number,
    status: current.status,
    createdAt: incident.createdAt,
    submittedAt,
    evidences: latestDraft.evidences,
  };
  store.completeIncident(record);
  return record;
}

export function useSubmitIncident() {
  return useMutation({
    mutationFn: submitIncidentDraft,
    onSuccess: (incident) => {
      void queryClient.invalidateQueries({ queryKey: ["incidents", "list"] });
      void queryClient.invalidateQueries({
        queryKey: incidentKeys.history(incident.id),
      });
    },
  });
}

function nextPage({
  data: { pagination },
}: {
  data: { pagination: { page: number; pages: number } };
}) {
  return pagination.page < pagination.pages ? pagination.page + 1 : undefined;
}

export function useIncidentHistory(id: string | null) {
  return useInfiniteQuery({
    queryKey: incidentKeys.history(id ?? ""),
    queryFn: ({ pageParam }) =>
      incidentsService.history(id as string, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: Boolean(id),
  });
}

export function useIncidentEvidence(id: string | null) {
  return useInfiniteQuery({
    queryKey: incidentKeys.evidence(id ?? ""),
    queryFn: ({ pageParam }) =>
      incidentsService.listEvidence(id as string, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: Boolean(id),
  });
}

export function useIncidentEvidenceImage(
  incidentId: string,
  evidenceId: string,
) {
  return useQuery({
    queryKey: ["incident-image", incidentId, evidenceId],
    queryFn: ({ signal }) =>
      incidentsService.evidenceImage(incidentId, evidenceId, signal),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });
}

export function useIncidentAssignments(id: string | null) {
  return useQuery({
    queryKey: incidentKeys.assignments(id ?? ""),
    queryFn: () => incidentsService.assignments(id as string),
    enabled: Boolean(id),
    refetchInterval: 30_000,
  });
}

export function useIncidentList() {
  return useInfiniteQuery({
    queryKey: ["incidents", "list"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => incidentsService.list(pageParam),
    getNextPageParam: ({ data: { pagination } }) =>
      pagination.page < pagination.pages ? pagination.page + 1 : undefined,
  });
}

export function useIncidentDetail(id: string | null) {
  return useQuery({
    queryKey: ["incidents", id, "detail"],
    queryFn: () => incidentsService.detail(id as string),
    enabled: Boolean(id),
    refetchInterval: 30_000,
  });
}
