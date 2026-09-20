import { NATIVE_COUNTRY_OPTIONS } from "../domain/workOptions";
import type {
  NewMangaDraft,
  OptionValue,
  WorkDetail,
  WorkFormOptions,
} from "./newMangaTypes";

export const emptyOptions: WorkFormOptions = {
  authors: [],
  workTypes: [],
  genres: [],
  magazines: [],
  originalPublishers: [],
};

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function findOptionByLabels(options: OptionValue[], labels: string[]) {
  const normalizedLabels = labels.map(normalizeSearchText);
  return options.find((option) => normalizedLabels.includes(normalizeSearchText(option.label)));
}

export function getOptionValue(option: OptionValue) {
  return option.value ?? String(option.id);
}

export function filterOptionsByDependency(options: OptionValue[], dependencyLabel: string) {
  if (!dependencyLabel) return [];
  const hasDependencies = options.some((option) => option.depends_on && option.depends_on.length > 0);
  if (!hasDependencies) return options;
  const normalizedLabel = normalizeSearchText(dependencyLabel);
  return options.filter((option) => option.depends_on?.some(
    (dependency) => normalizeSearchText(dependency.label) === normalizedLabel
  ));
}

export function getDefaultWorkTypeLabels(countryName = "") {
  const country = normalizeSearchText(countryName);
  if (country.includes("coreia")) return ["manhwa"];
  if (country.includes("china") || country.includes("taiwan")) return ["manhua"];
  return ["manga", "mangá"];
}

export function getDefaultCountryAndType(options: WorkFormOptions) {
  const japan = NATIVE_COUNTRY_OPTIONS.find((option) => option.value === "Japão");
  const relatedTypes = japan
    ? filterOptionsByDependency(options.workTypes, getOptionValue(japan))
    : [];
  const workTypes = relatedTypes.length > 0 ? relatedTypes : options.workTypes;
  const type = findOptionByLabels(workTypes, getDefaultWorkTypeLabels(japan?.label));
  return {
    country: japan ? getOptionValue(japan) : "",
    typeId: type ? String(type.id) : "",
  };
}

export function draftFromWork(work: WorkDetail): NewMangaDraft {
  return {
    title: work.title || "",
    originalTitle: work.originalTitle || "",
    romanizedTitle: work.romanizedTitle || "",
    synopsis: work.synopsis || "",
    originalPublicationStartYear: work.originalPublicationStartYear ? String(work.originalPublicationStartYear) : "",
    originalPublicationEndYear: work.originalPublicationEndYear ? String(work.originalPublicationEndYear) : "",
    originalVolumeCount: work.originalVolumeCount ? String(work.originalVolumeCount) : "",
    coverAssetId: work.coverAssetId || "",
    coverUrl: work.coverUrl || "",
    coverPending: false,
    typeId: work.type?.id ? String(work.type.id) : "",
    country: work.country || "",
    originalPublisherIds: work.originalPublishers.map((publisher) => Number(publisher.id)),
    originalPublicationStatus: work.originalPublicationStatus || "",
    adultContent: work.adultContent,
    directRelease: work.directRelease,
    authors: work.authors.length > 0
      ? work.authors.map((author) => ({
          authorId: author.author?.id ? String(author.author.id) : "",
          roles: author.roles,
        }))
      : [{ authorId: "", roles: [] }],
    genreIds: work.genres.map((genre) => Number(genre.id)),
    demographies: work.demographics,
    magazineIds: work.serializationMagazines.map((magazine) => Number(magazine.id)),
  };
}

export function draftSignature(draft: NewMangaDraft, effectiveDirectRelease: boolean) {
  return JSON.stringify({ ...draft, directRelease: effectiveDirectRelease });
}

export function getInvalidIdentificationFields(draft: NewMangaDraft) {
  const fields: string[] = [];
  if (!draft.title.trim()) fields.push("title");
  if (!draft.originalTitle.trim()) fields.push("originalTitle");
  if (!draft.romanizedTitle.trim()) fields.push("romanizedTitle");
  if (!draft.synopsis.trim()) fields.push("synopsis");
  if (!draft.country) fields.push("country");
  if (!draft.typeId) fields.push("typeId");
  if (!draft.coverAssetId) fields.push("coverAssetId");
  return fields;
}

export function getInvalidAuthorFields(draft: NewMangaDraft) {
  return draft.authors.flatMap((author, index) => {
    const fields: string[] = [];
    if (!author.authorId) fields.push(`authors.${index}.authorId`);
    if (author.roles.length === 0) fields.push(`authors.${index}.roles`);
    return fields;
  });
}

type PublicationRules = {
  demographyDisabled: boolean;
  effectiveDirectRelease: boolean;
  isOpenOriginalPublication: boolean;
};

export function getInvalidPublicationFields(draft: NewMangaDraft, rules: PublicationRules) {
  const fields: string[] = [];
  if (draft.originalPublisherIds.length === 0) fields.push("originalPublisherIds");
  if (!draft.originalPublicationStatus) fields.push("originalPublicationStatus");
  if (!draft.originalPublicationStartYear) fields.push("originalPublicationStartYear");
  if (!rules.isOpenOriginalPublication && !draft.originalPublicationEndYear) fields.push("originalPublicationEndYear");
  if (!rules.isOpenOriginalPublication && Number(draft.originalVolumeCount) <= 0) fields.push("originalVolumeCount");
  if (draft.genreIds.length === 0) fields.push("genreIds");
  if (!rules.demographyDisabled && draft.demographies.length === 0) fields.push("demographies");
  if (!rules.effectiveDirectRelease && draft.magazineIds.length === 0) fields.push("magazineIds");
  return fields;
}

export function hasDuplicateAuthors(draft: NewMangaDraft) {
  const ids = draft.authors.map((author) => author.authorId);
  return new Set(ids).size !== ids.length;
}

export function validateCompleteForm(draft: NewMangaDraft, rules: PublicationRules) {
  const missingFields = [
    ...getInvalidIdentificationFields(draft),
    ...getInvalidAuthorFields(draft),
    ...getInvalidPublicationFields(draft, rules),
  ];
  if (missingFields.length > 0) return "Preencha os campos obrigatórios da Obra.";
  if (hasDuplicateAuthors(draft)) return "Autor duplicado!";
  const startYear = Number(draft.originalPublicationStartYear);
  const endYear = Number(draft.originalPublicationEndYear);
  if (draft.originalPublicationEndYear && endYear < startYear) {
    return "O fim da publicação original não pode ser anterior ao início.";
  }
  return "";
}

function buildOrderedPayload(ids: number[]) {
  return ids.map((id, position) => ({ id, position }));
}

export function buildWorkPayload(draft: NewMangaDraft, rules: PublicationRules) {
  return {
    title: draft.title.trim(),
    originalTitle: draft.originalTitle.trim() || null,
    romanizedTitle: draft.romanizedTitle.trim(),
    synopsis: draft.synopsis.trim(),
    originalPublicationStartYear: draft.originalPublicationStartYear ? Number(draft.originalPublicationStartYear) : null,
    originalPublicationEndYear: !rules.isOpenOriginalPublication && draft.originalPublicationEndYear
      ? Number(draft.originalPublicationEndYear)
      : null,
    originalVolumeCount: !rules.isOpenOriginalPublication && draft.originalVolumeCount
      ? Number(draft.originalVolumeCount)
      : null,
    coverAssetId: draft.coverAssetId || null,
    typeId: Number(draft.typeId),
    country: draft.country,
    originalPublisherIds: buildOrderedPayload(draft.originalPublisherIds),
    originalPublicationStatus: draft.originalPublicationStatus,
    adultContent: draft.adultContent,
    directRelease: rules.effectiveDirectRelease,
    authors: draft.authors.map((author) => ({ authorId: Number(author.authorId), roles: author.roles })),
    genreIds: draft.genreIds,
    demographies: rules.demographyDisabled ? [] : draft.demographies,
    magazineIds: rules.effectiveDirectRelease ? [] : buildOrderedPayload(draft.magazineIds),
  };
}

export function toggleValue<T>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function moveValue<T>(values: T[], fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= values.length) return values;
  const nextValues = [...values];
  const [movedValue] = nextValues.splice(fromIndex, 1);
  nextValues.splice(toIndex, 0, movedValue);
  return nextValues;
}
