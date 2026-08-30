import {
  IncidentDraft,
  LocalIncidentEvidence,
  LocalIncidentRecord,
} from "@/core/entities/incidents.entity";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const createDraft = (): IncidentDraft => ({
  clientRequestId: Crypto.randomUUID(),
  originalMessage: "",
  address: "",
  addressReference: "",
  latitude: null,
  longitude: null,
  evidences: [],
  serverIncident: null,
});

interface IncidentDraftStore {
  draft: IncidentDraft;
  incidents: LocalIncidentRecord[];
  updateDetails: (
    details: Pick<
      IncidentDraft,
      "originalMessage" | "address" | "addressReference"
    >,
  ) => void;
  setCoordinates: (latitude: number, longitude: number) => void;
  addEvidences: (evidences: LocalIncidentEvidence[]) => void;
  removeEvidence: (localId: string) => void;
  updateEvidence: (
    localId: string,
    patch: Partial<LocalIncidentEvidence>,
  ) => void;
  setServerIncident: (incident: IncidentDraft["serverIncident"]) => void;
  completeIncident: (incident: LocalIncidentRecord) => void;
  resetDraft: () => void;
  removeIncident: (id: string) => void;
  updateIncidentStatus: (
    id: string,
    status: LocalIncidentRecord["status"],
  ) => void;
}

export const useIncidentDraftStore = create<IncidentDraftStore>()(
  persist(
    (set) => ({
      draft: createDraft(),
      incidents: [],
      updateDetails: (details) =>
        set((state) => ({ draft: { ...state.draft, ...details } })),
      setCoordinates: (latitude, longitude) =>
        set((state) => ({
          draft: { ...state.draft, latitude, longitude },
        })),
      addEvidences: (evidences) =>
        set((state) => ({
          draft: {
            ...state.draft,
            evidences: [...state.draft.evidences, ...evidences],
          },
        })),
      removeEvidence: (localId) =>
        set((state) => ({
          draft: {
            ...state.draft,
            evidences: state.draft.evidences.filter(
              (evidence) => evidence.localId !== localId,
            ),
          },
        })),
      updateEvidence: (localId, patch) =>
        set((state) => ({
          draft: {
            ...state.draft,
            evidences: state.draft.evidences.map((evidence) =>
              evidence.localId === localId
                ? { ...evidence, ...patch }
                : evidence,
            ),
          },
        })),
      setServerIncident: (serverIncident) =>
        set((state) => ({ draft: { ...state.draft, serverIncident } })),
      completeIncident: (incident) =>
        set((state) => ({
          incidents: [
            incident,
            ...state.incidents.filter((item) => item.id !== incident.id),
          ],
          draft: createDraft(),
        })),
      resetDraft: () => set({ draft: createDraft() }),
      removeIncident: (id) =>
        set((state) => ({
          incidents: state.incidents.filter((incident) => incident.id !== id),
        })),
      updateIncidentStatus: (id, status) =>
        set((state) => ({
          incidents: state.incidents.map((incident) =>
            incident.id === id ? { ...incident, status } : incident,
          ),
        })),
    }),
    {
      name: "willariq-incidents",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
