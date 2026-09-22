import type { EditionDraft } from "./editionDraftMemory";

export interface EditionOption {
  id: number | string;
  label: string;
}

export interface EditionFormOptions {
  brazilianPublishers: EditionOption[];
  coverTypes: EditionOption[];
  formats: EditionOption[];
  papers: EditionOption[];
}

export interface Edition {
  id: number;
  workId: number;
  chronologicalNumber: number;
  // Somente leitura: derivada do Volume 1 da mesma Edição.
  coverAssetId?: string | null;
  coverUrl?: string | null;
  brazilianPublisher: EditionOption | null;
  coverType: EditionOption | null;
  format: EditionOption | null;
  paper: EditionOption | null;
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

export function editionNumberOptions(currentValue: string): EditionOption[] {
  const number = Number(currentValue);
  if (!Number.isSafeInteger(number) || number <= 10) return EDITION_NUMBER_OPTIONS;
  return [...EDITION_NUMBER_OPTIONS, { id: currentValue, label: `${number}ª edição` }];
}

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
    coverTypeId: optionId(edition.coverType),
    formatId: optionId(edition.format),
    paperId: optionId(edition.paper),
    chronologicalNumber: String(edition.chronologicalNumber),
    brazilPublicationStatus: typeof edition.brazilPublicationStatus === "string"
      ? edition.brazilPublicationStatus
      : edition.brazilPublicationStatus?.label || "",
  };
}

export function buildEditionPayload(draft: EditionDraft) {
  return {
    brazilianPublisherId: Number(draft.brazilianPublisherId),
    coverTypeId: draft.coverTypeId ? Number(draft.coverTypeId) : null,
    formatId: draft.formatId ? Number(draft.formatId) : null,
    paperId: draft.paperId ? Number(draft.paperId) : null,
    chronologicalNumber: Number(draft.chronologicalNumber),
    brazilPublicationStatus: draft.brazilPublicationStatus,
  };
}

export function isEditionDraftIncomplete(draft: EditionDraft) {
  const requiredValues = [
    draft.brazilianPublisherId,
    draft.chronologicalNumber,
    draft.brazilPublicationStatus,
  ];
  return requiredValues.some((value) => !value) || Number(draft.chronologicalNumber) <= 0;
}
