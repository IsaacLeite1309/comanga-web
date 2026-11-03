import type { AuthorField } from "./NewManga";
import { readAdminDraft, removeAdminDraft, writeAdminDraft } from "@/lib/adminDraftStorage";

const STORAGE_KEY = "work:new";

export type RememberedNewMangaDraft = {
  currentStep: "identification" | "authors" | "publication" | "media";
  title: string;
  originalTitle: string;
  romanizedTitle: string;
  synopsis: string;
  originalPublicationStartYear: string;
  originalPublicationEndYear: string;
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
  romanizedTitle: "",
  synopsis: "",
  originalPublicationStartYear: "",
  originalPublicationEndYear: "",
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

export function getRememberedNewMangaDraft() {
  return structuredClone(readAdminDraft<RememberedNewMangaDraft>(STORAGE_KEY) || emptyNewMangaDraft);
}

export function rememberNewMangaDraft(draft: RememberedNewMangaDraft) {
  writeAdminDraft(STORAGE_KEY, draft);
}

export function resetNewMangaDraftMemory() {
  removeAdminDraft(STORAGE_KEY);
}
