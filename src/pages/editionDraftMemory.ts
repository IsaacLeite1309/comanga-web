export interface EditionDraft {
  brazilianPublisherId: string;
  editionTypeId: string;
  coverTypeId: string;
  formatId: string;
  chronologicalNumber: string;
  brazilPublicationStatus: string;
  coverUrl: string;
}

export const emptyEditionDraft: EditionDraft = {
  brazilianPublisherId: "",
  editionTypeId: "",
  coverTypeId: "",
  formatId: "",
  chronologicalNumber: "",
  brazilPublicationStatus: "",
  coverUrl: "",
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
