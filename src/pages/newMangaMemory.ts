import type { AuthorField } from "./NewManga";

export type RememberedNewMangaDraft = {
  currentStep: "identification" | "authors" | "publication";
  title: string;
  originalTitle: string;
  originalPublicationStartYear: string;
  originalPublicationEndYear: string;
  originalVolumeCount: string;
  coverAssetId: string;
  coverUrl: string;
  coverPending: boolean;
  typeId: string;
  country: string;
  originalPublisherIds: number[];
  originalPublicationStatus: string;
  adultContent: boolean;
  directRelease: boolean;
  authors: AuthorField[];
  genreIds: number[];
  demographies: string[];
  magazineIds: number[];
};

export const emptyNewMangaDraft: RememberedNewMangaDraft = {
  currentStep: "identification",
  title: "",
  originalTitle: "",
  originalPublicationStartYear: "",
  originalPublicationEndYear: "",
  originalVolumeCount: "",
  coverAssetId: "",
  coverUrl: "",
  coverPending: false,
  typeId: "",
  country: "",
  originalPublisherIds: [],
  originalPublicationStatus: "",
  adultContent: false,
  directRelease: false,
  authors: [{ authorId: "", roles: [] }],
  genreIds: [],
  demographies: [],
  magazineIds: [],
};

let rememberedDraft: RememberedNewMangaDraft = structuredClone(emptyNewMangaDraft);

export function getRememberedNewMangaDraft() {
  return structuredClone(rememberedDraft);
}

export function rememberNewMangaDraft(draft: RememberedNewMangaDraft) {
  rememberedDraft = structuredClone(draft);
}

export function resetNewMangaDraftMemory() {
  rememberedDraft = structuredClone(emptyNewMangaDraft);
}
