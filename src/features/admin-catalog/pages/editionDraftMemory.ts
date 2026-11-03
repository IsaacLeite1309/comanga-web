import { clearAdminDraftStorage, readAdminDraft, removeAdminDraft, writeAdminDraft } from "@/lib/adminDraftStorage";

export interface EditionDraft {
  brazilianPublisherId: string;
  coverTypeId: string;
  formatId: string;
  paperIds: string[];
  chronologicalNumber: string;
  brazilPublicationStatus: string;
}

export const emptyEditionDraft: EditionDraft = {
  brazilianPublisherId: "",
  coverTypeId: "",
  formatId: "",
  paperIds: [],
  chronologicalNumber: "",
  brazilPublicationStatus: "",
};

const storageKey = (key: string) => `edition:new:${key}`;

export function getRememberedEditionDraft(key: string) {
  return structuredClone(readAdminDraft<EditionDraft>(storageKey(key)) || emptyEditionDraft);
}

export function rememberEditionDraft(key: string, draft: EditionDraft) {
  writeAdminDraft(storageKey(key), draft);
}

export function resetEditionDraftMemory(key: string) {
  removeAdminDraft(storageKey(key));
}

export function resetEditionDraftMemoryForTests() {
  clearAdminDraftStorage("edition:new:");
}
