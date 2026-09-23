import type { CatalogVisibility } from "./catalogTypes";

export interface AdminCatalogLocationState {
  workId?: number;
  editionId?: number;
  volumeId?: number;
}

export interface OptionValue {
  id: number | string;
  label: string;
}

export interface WorkDetail {
  id: number;
  slug: string;
  title: string;
  originalTitle?: string | null;
  coverUrl?: string | null;
  country?: string | null;
  type?: OptionValue | null;
  visibility: CatalogVisibility;
  authors: Array<{
    author: OptionValue | null;
    roles: string[];
  }>;
}

export interface EditionDetail {
  id: number;
  workId: number;
  work?: {
    id: number;
    slug: string;
    title: string;
  };
  chronologicalNumber: number;
  coverUrl?: string | null;
  visibility: CatalogVisibility;
  brazilianPublisher: OptionValue | null;
  coverType?: OptionValue | null;
  format?: OptionValue | null;
  papers?: OptionValue[];
  brazilPublicationStatus: string | OptionValue | null;
  volumesCount?: number;
}

export interface VolumeDetail {
  id: number;
  editionId: number;
  number: number;
  singleVolume?: boolean | null;
  coverUrl?: string | null;
  pages?: number | null;
  price?: number | null;
  priceCurrency?: string | null;
  releaseDatePrecision?: string | null;
  releaseYear?: number | null;
  releaseMonth?: number | null;
  releaseDay?: number | null;
  isbn10?: string | null;
  isbn13?: string | null;
  affiliateLink?: string | null;
  synopsis?: string | null;
  visibility: CatalogVisibility;
}

export function formatEditionNumber(chronologicalNumber: number) {
  return `${chronologicalNumber}ª edição`;
}

export function formatVolumesCount(count?: number) {
  const total = count ?? 0;
  return `${total} ${total === 1 ? "volume" : "volumes"}`;
}

export function formatVolumeNumber(number: number, singleVolume?: boolean | null) {
  if (singleVolume) return "Volume único";
  return `Volume ${number}`;
}

export function formatPrice(price?: number | null, currency = "R$") {
  if (price === null || price === undefined) return "-";

  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

  return `${currency} ${formatted}`;
}

export function formatReleaseDate(volume: VolumeDetail) {
  if (
    volume.releaseDatePrecision === "Completa"
    && volume.releaseYear
    && volume.releaseMonth
    && volume.releaseDay
  ) {
    return `${String(volume.releaseDay).padStart(2, "0")}/${String(volume.releaseMonth).padStart(2, "0")}/${volume.releaseYear}`;
  }

  if (volume.releaseDatePrecision === "Mes e ano" && volume.releaseYear && volume.releaseMonth) {
    return `${String(volume.releaseMonth).padStart(2, "0")}/${volume.releaseYear}`;
  }

  if (volume.releaseDatePrecision === "Ano" && volume.releaseYear) return String(volume.releaseYear);
  return "-";
}

export function getPublicationStatusLabel(status: EditionDetail["brazilPublicationStatus"]) {
  return typeof status === "string" ? status : status?.label || "-";
}
