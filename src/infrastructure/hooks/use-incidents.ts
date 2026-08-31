import {
  IncidentDraft,
  LocalIncidentRecord,
} from "@/core/entities/incidents.entity";
import { queryClient } from "@/config/query/query-client";
import { uploadEvidenceToMinio } from "@/infrastructure/services/evidence-upload.service";
import { incidentsService } from "@/infrastructure/services/incidents.service";
import { useIncidentDraftStore } from "@/infrastructure/storage/incident-draft-storage";
import { useMutation, useQuery } from "@tanstack/react-query";

export const incidentKeys = {
  history: (id: string) => ["incidents", id, "history"] as const,
  evidence: (id: string) => ["incidents", id, "evidence"] as const,
  assignments: (id: string) => ["incidents", id, "assignments"] as const,
};

async function confirmEvidenceWithRecovery(
  incidentId: string,
  uploadId: string,
) {
  try {
    await incidentsService.confirmEvidence(incidentId, uploadId);
  } catch (error) {
    try {
      const evidence = await incidentsService.listEvidence(incidentId);
      if (evidence.data.some((item) => item.uploadId === uploadId)) return;
    } catch {
      // Preserve the original confirmation error when reconciliation also fails.
    }
    throw error;
  }
}

async function submitIncidentDraft(draft: IncidentDraft) {
  const store = useIncidentDraftStore.getState();
  let incident = draft.serverIncident;

  if (!incident) {
    const response = await incidentsService.create({
      clientRequestId: draft.clientRequestId,
      originalMessage: draft.originalMessage,
      latitude: draft.latitude as number,
      longitude: draft.longitude as number,
      address: draft.address || undefined,
      addressReference: draft.addressReference || undefined,
    });
    incident = response.data;
    store.setServerIncident(incident);
  }

  for (const originalEvidence of draft.evidences) {
    let evidence = useIncidentDraftStore
      .getState()
      .draft.evidences.find(
        (item) => item.localId === originalEvidence.localId,
      );
    if (!evidence || evidence.status === "confirmed") continue;

    try {
      if (evidence.status === "uploaded" && evidence.uploadId) {
        await confirmEvidenceWithRecovery(incident.id, evidence.uploadId);
      } else {
        store.updateEvidence(evidence.localId, {
          status: "preparing",
          error: undefined,
        });
        const presigned = await incidentsService.requestEvidenceUpload(
          incident.id,
          {
            fileName: evidence.fileName,
            mimeType: evidence.mimeType,
            sizeBytes: evidence.sizeBytes,
            capturedAt: evidence.capturedAt,
          },
        );

        store.updateEvidence(evidence.localId, {
          status: "uploading",
          uploadId: presigned.data.uploadId,
        });
        await uploadEvidenceToMinio(presigned.data, evidence);
        store.updateEvidence(evidence.localId, { status: "uploaded" });
        await confirmEvidenceWithRecovery(incident.id, presigned.data.uploadId);
      }

      store.updateEvidence(evidence.localId, {
        status: "confirmed",
        error: undefined,
      });
    } catch (error) {
      evidence = useIncidentDraftStore
        .getState()
        .draft.evidences.find((item) => item.localId === evidence?.localId);
      store.updateEvidence(originalEvidence.localId, {
        status: evidence?.status === "uploaded" ? "uploaded" : "error",
        error: error instanceof Error ? error.message : "UPLOAD_FAILED",
      });
      throw error;
    }
  }

  try {
    await incidentsService.submit(incident.id);
  } catch (error) {
    try {
      const history = await incidentsService.history(incident.id);
      const wasSubmitted = history.data.items.some(
        (item) => item.newStatus !== "RECEIVED",
      );
      if (!wasSubmitted) throw error;
    } catch {
      throw error;
    }
  }
  const latestDraft = useIncidentDraftStore.getState().draft;
  const record: LocalIncidentRecord = {
    id: incident.id,
    trackingCode: incident.trackingCode,
    clientRequestId: incident.clientRequestId,
    originalMessage: latestDraft.originalMessage,
    address: latestDraft.address,
    addressReference: latestDraft.addressReference,
    latitude: latestDraft.latitude as number,
    longitude: latestDraft.longitude as number,
    status: "AI_ANALYSIS",
    createdAt: incident.createdAt,
    submittedAt: new Date().toISOString(),
    evidences: latestDraft.evidences,
  };
  store.completeIncident(record);
  return record;
}

export function useSubmitIncident() {
  return useMutation({
    mutationFn: submitIncidentDraft,
    onSuccess: (incident) => {
      void queryClient.invalidateQueries({
        queryKey: incidentKeys.history(incident.id),
      });
    },
  });
}

export function useIncidentHistory(id: string | null) {
  return useQuery({
    queryKey: incidentKeys.history(id ?? ""),
    queryFn: () => incidentsService.history(id as string),
    enabled: Boolean(id),
    refetchInterval: 30_000,
  });
}

export function useIncidentEvidence(id: string | null) {
  return useQuery({
    queryKey: incidentKeys.evidence(id ?? ""),
    queryFn: () => incidentsService.listEvidence(id as string),
    enabled: Boolean(id),
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
