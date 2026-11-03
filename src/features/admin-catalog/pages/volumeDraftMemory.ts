import { clearAdminDraftStorage, readAdminDraft, removeAdminDraft, writeAdminDraft } from "@/lib/adminDraftStorage";

export type RememberedVolumeStep = "details" | "media";

export interface VolumeDraft {
  number: string;
  singleVolume: boolean;
  coverAssetId: string;
  coverUrl: string;
  coverPending: boolean;
  pages: string;
  price: string;
  priceCurrency: string;
  releaseDatePrecision: "Completa" | "Mes e ano" | "Ano";
  releaseYear: string;
  releaseMonth: string;
  releaseDay: string;
  isbn10: string;
  isbn13: string;
  affiliateLink: string;
  synopsis: string;
}

export const emptyVolumeDraft: VolumeDraft = {
  number: "",
  singleVolume: false,
  coverAssetId: "",
  coverUrl: "",
  coverPending: false,
  pages: "",
  price: "",
  priceCurrency: "R$",
  releaseDatePrecision: "Completa",
  releaseYear: "",
  releaseMonth: "",
  releaseDay: "",
  isbn10: "",
  isbn13: "",
  affiliateLink: "",
  synopsis: "",
};

interface RememberedVolumeDraft {
  form: VolumeDraft;
  currentStep: RememberedVolumeStep;
}

const storageKey = (key: string) => `volume:new:${key}`;

export function getRememberedVolumeDraft(key: string): RememberedVolumeDraft {
  return structuredClone(readAdminDraft<RememberedVolumeDraft>(storageKey(key)) || {
    form: emptyVolumeDraft,
    currentStep: "details",
  });
}

export function rememberVolumeDraft(key: string, draft: RememberedVolumeDraft) {
  writeAdminDraft(storageKey(key), draft);
}

export function resetVolumeDraftMemory(key: string) {
  removeAdminDraft(storageKey(key));
}

export function resetVolumeDraftMemoryForTests() {
  clearAdminDraftStorage("volume:new:");
}
