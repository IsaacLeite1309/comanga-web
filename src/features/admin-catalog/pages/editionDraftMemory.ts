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
