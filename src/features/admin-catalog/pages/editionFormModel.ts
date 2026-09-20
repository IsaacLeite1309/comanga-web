import type { EditionDraft } from "./editionDraftMemory";

export interface EditionOption {
  id: number | string;
  label: string;
}

export interface EditionFormOptions {
  brazilianPublishers: EditionOption[];
  editionTypes: EditionOption[];
  coverTypes: EditionOption[];
  formats: EditionOption[];
}

export interface Edition {
  id: number;
  workId: number;
  chronologicalNumber: number;
  coverAssetId?: string | null;
  coverUrl?: string | null;
  brazilianPublisher: EditionOption | null;
  editionType: EditionOption | null;
  coverType: EditionOption | null;
  format: EditionOption | null;
  brazilPublicationStatus: string | EditionOption | null;
}

export interface EditionResponse {
  edition: Edition;
}

export interface EditionFormOptionsResponse {
  options: EditionFormOptions;
}

export interface WorkResponse {
  work: { id: number; slug: string; title: string };
}

export const EDITION_NUMBER_OPTIONS: EditionOption[] = Array.from({ length: 10 }, (_, index) => ({
  id: String(index + 1),
  label: `${index + 1}ª edição`,
}));

export const EDITION_PUBLICATION_STATUS_OPTIONS: EditionOption[] = [
  { id: "Completa", label: "Completa" },
  { id: "Em andamento", label: "Em andamento" },
  { id: "Em hiato", label: "Em hiato" },
  { id: "Cancelada", label: "Cancelada" },
];

function optionId(option: EditionOption | null) {
  return option?.id ? String(option.id) : "";
}

export function editionToDraft(edition: Edition): EditionDraft {
  return {
    brazilianPublisherId: optionId(edition.brazilianPublisher),
    editionTypeId: optionId(edition.editionType),
    coverTypeId: optionId(edition.coverType),
    formatId: optionId(edition.format),
    chronologicalNumber: String(edition.chronologicalNumber),
    brazilPublicationStatus: typeof edition.brazilPublicationStatus === "string"
      ? edition.brazilPublicationStatus
      : edition.brazilPublicationStatus?.label || "",
    coverAssetId: edition.coverAssetId || "",
    coverUrl: edition.coverUrl || "",
    coverPending: false,
  };
}

export function buildEditionPayload(draft: EditionDraft) {
  return {
    brazilianPublisherId: Number(draft.brazilianPublisherId),
    editionTypeId: Number(draft.editionTypeId),
    coverTypeId: Number(draft.coverTypeId),
    formatId: Number(draft.formatId),
    chronologicalNumber: Number(draft.chronologicalNumber),
    brazilPublicationStatus: draft.brazilPublicationStatus,
    coverAssetId: draft.coverAssetId,
  };
}

export function isEditionDraftIncomplete(draft: EditionDraft) {
  const requiredValues = [
    draft.coverAssetId,
    draft.brazilianPublisherId,
    draft.editionTypeId,
    draft.coverTypeId,
    draft.formatId,
    draft.chronologicalNumber,
    draft.brazilPublicationStatus,
  ];
  return requiredValues.some((value) => !value) || Number(draft.chronologicalNumber) <= 0;
}
