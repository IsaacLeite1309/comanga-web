export interface EditionDraft {
  brazilianPublisherId: string;
  editionTypeId: string;
  coverTypeId: string;
  formatId: string;
  chronologicalNumber: string;
  brazilPublicationStatus: string;
  coverAssetId: string;
  coverUrl: string;
  coverPending: boolean;
}

export const emptyEditionDraft: EditionDraft = {
  brazilianPublisherId: "",
  editionTypeId: "",
  coverTypeId: "",
  formatId: "",
  chronologicalNumber: "",
  brazilPublicationStatus: "",
  coverAssetId: "",
  coverUrl: "",
  coverPending: false,
};

const rememberedDrafts = new Map<string, EditionDraft>();

export function getRememberedEditionDraft(key: string) {
  return structuredClone(rememberedDrafts.get(key) || emptyEditionDraft);
}

export function rememberEditionDraft(key: string, draft: EditionDraft) {
  rememberedDrafts.set(key, structuredClone(draft));
}

export function resetEditionDraftMemory(key: string) {
  rememberedDrafts.delete(key);
}

export function resetEditionDraftMemoryForTests() {
  rememberedDrafts.clear();
}
