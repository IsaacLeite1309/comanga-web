import type { VolumeDraft } from "./volumeDraftMemory";

export type ReleaseDatePrecision = "Completa" | "Mes e ano" | "Ano";

export interface Volume {
  id: number;
  editionId: number;
  number: number;
  singleVolume?: boolean | null;
  coverAssetId?: string | null;
  coverUrl?: string | null;
  pages?: number | null;
  price?: number | null;
  priceCurrency?: string | null;
  releaseDatePrecision?: ReleaseDatePrecision | null;
  releaseYear?: number | null;
  releaseMonth?: number | null;
  releaseDay?: number | null;
  isbn10?: string | null;
  isbn13?: string | null;
  affiliateLink?: string | null;
  synopsis?: string | null;
}

export interface VolumeResponse {
  volume: Volume;
}

export const PRICE_CURRENCY_OPTIONS = ["R$", "CR$", "Cr$", "NCz$", "Cz$"];

export const RELEASE_PRECISION_OPTIONS: Array<{ value: ReleaseDatePrecision; label: string }> = [
  { value: "Completa", label: "Data completa" },
  { value: "Mes e ano", label: "Mês e ano" },
  { value: "Ano", label: "Apenas ano" },
];

function stringOrEmpty(value: number | string | null | undefined) {
  return value ? String(value) : "";
}

function nullishNumberString(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function valueOrDefault<T>(value: T | null | undefined, fallback: T) {
  return value || fallback;
}

export function volumeToDraft(volume: Volume): VolumeDraft {
  return {
    number: volume.singleVolume ? "1" : nullishNumberString(volume.number),
    singleVolume: Boolean(volume.singleVolume),
    coverAssetId: valueOrDefault(volume.coverAssetId, ""),
    coverUrl: valueOrDefault(volume.coverUrl, ""),
    coverPending: false,
    pages: stringOrEmpty(volume.pages),
    price: nullishNumberString(volume.price),
    priceCurrency: valueOrDefault(volume.priceCurrency, "R$"),
    releaseDatePrecision: valueOrDefault(volume.releaseDatePrecision, "Completa"),
    releaseYear: stringOrEmpty(volume.releaseYear),
    releaseMonth: stringOrEmpty(volume.releaseMonth),
    releaseDay: stringOrEmpty(volume.releaseDay),
    isbn10: valueOrDefault(volume.isbn10, ""),
    isbn13: valueOrDefault(volume.isbn13, ""),
    affiliateLink: valueOrDefault(volume.affiliateLink, ""),
    synopsis: valueOrDefault(volume.synopsis, ""),
  };
}

function isAbsoluteUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isReleaseDateInvalid(form: VolumeDraft) {
  if (form.releaseDatePrecision === "Completa") {
    return !form.releaseYear || !form.releaseMonth || !form.releaseDay;
  }
  if (form.releaseDatePrecision === "Mes e ano") return !form.releaseYear || !form.releaseMonth;
  return !form.releaseYear;
}

export function getVolumeInvalidFields(form: VolumeDraft) {
  const invalid: string[] = [];
  if (form.number === "" || Number(form.number) < 0) invalid.push("number");
  if (!form.coverAssetId) invalid.push("coverAssetId");
  if (form.affiliateLink && !isAbsoluteUrl(form.affiliateLink)) invalid.push("affiliateLink");
  if (form.pages && Number(form.pages) <= 0) invalid.push("pages");
  if (form.price && Number(form.price) < 0) invalid.push("price");
  if (isReleaseDateInvalid(form)) invalid.push("releaseDate");
  return invalid;
}

export function getDetailsInvalidFields(form: VolumeDraft) {
  const invalid: string[] = [];
  if (form.number === "" || Number(form.number) < 0) invalid.push("number");
  if (isReleaseDateInvalid(form)) invalid.push("releaseDate");
  return invalid;
}

export function updateReleaseDateParts(form: VolumeDraft, value: string): VolumeDraft {
  if (form.releaseDatePrecision === "Completa") {
    const [releaseYear = "", releaseMonth = "", releaseDay = ""] = value.split("-");
    return { ...form, releaseYear, releaseMonth, releaseDay };
  }
  if (form.releaseDatePrecision === "Mes e ano") {
    const [releaseYear = "", releaseMonth = ""] = value.split("-");
    return { ...form, releaseYear, releaseMonth, releaseDay: "" };
  }
  return { ...form, releaseYear: value, releaseMonth: "", releaseDay: "" };
}

function padDatePart(value?: number | string | null) {
  return value ? String(value).padStart(2, "0") : "";
}

export function getDateInputValue(form: VolumeDraft) {
  if (form.releaseDatePrecision === "Completa" && form.releaseYear && form.releaseMonth && form.releaseDay) {
    return `${form.releaseYear}-${padDatePart(form.releaseMonth)}-${padDatePart(form.releaseDay)}`;
  }
  if (form.releaseDatePrecision === "Mes e ano" && form.releaseYear && form.releaseMonth) {
    return `${form.releaseYear}-${padDatePart(form.releaseMonth)}`;
  }
  return form.releaseDatePrecision === "Ano" ? form.releaseYear : "";
}

export function buildVolumePayload(form: VolumeDraft) {
  return {
    number: Number(form.number),
    singleVolume: form.singleVolume,
    coverAssetId: form.coverAssetId || null,
    pages: form.pages ? Number(form.pages) : null,
    price: form.price ? Number(form.price) : null,
    priceCurrency: form.priceCurrency,
    releaseDatePrecision: form.releaseDatePrecision,
    releaseYear: Number(form.releaseYear),
    releaseMonth: ["Completa", "Mes e ano"].includes(form.releaseDatePrecision) ? Number(form.releaseMonth) : null,
    releaseDay: form.releaseDatePrecision === "Completa" ? Number(form.releaseDay) : null,
    isbn10: form.isbn10 || null,
    isbn13: form.isbn13 || null,
    affiliateLink: form.affiliateLink || null,
    synopsis: form.synopsis || null,
  };
}
