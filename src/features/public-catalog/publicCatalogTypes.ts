export type CatalogOrder = "ASC" | "DESC";
export type PublicCatalogTab = "works" | "editions";
export type WorkSort = "title" | "originalTitle" | "createdAt";
export type EditionSort = "title" | "chronologicalNumber" | "createdAt";

export interface PublicOption {
  id: number;
  label: string;
}

export interface PublicCatalogOptions {
  workTypes: PublicOption[];
  countries: string[];
  demographics: string[];
  genres: PublicOption[];
  brazilianPublishers: PublicOption[];
  formats: PublicOption[];
  coverTypes: PublicOption[];
}

export interface PublicWorkSummary {
  id: number;
  slug: string;
  title: string;
  originalTitle?: string | null;
  coverUrl?: string | null;
  type?: PublicOption | null;
  country?: string | null;
  authors: PublicOption[];
}

export interface PublicAuthorDetails extends PublicOption {
  roles: string[];
}

export interface PublicVolumePreview {
  id: number;
  number: number;
  singleVolume: boolean;
  coverUrl?: string | null;
  releaseDatePrecision: string;
  releaseYear?: number | null;
  releaseMonth?: number | null;
  releaseDay?: number | null;
}

export interface PublicEditionVolumeSummary extends PublicVolumePreview {
  pages?: number | null;
}

export interface PublicEditionDetails {
  id: number;
  chronologicalNumber: number;
  coverUrl?: string | null;
  brazilianPublisher: PublicOption;
  editionType: PublicOption;
  format: PublicOption;
  coverType: PublicOption;
  brazilPublicationStatus: string;
  volumesCount: number;
  volumes: PublicVolumePreview[];
}

export interface PublicEditionPageDetails {
  id: number;
  chronologicalNumber: number;
  coverUrl?: string | null;
  brazilianPublisher: PublicOption;
  editionType: PublicOption;
  format: PublicOption;
  coverType: PublicOption;
  brazilPublicationStatus: string;
  volumesCount: number;
  work: {
    id: number;
    slug: string;
    title: string;
    originalTitle?: string | null;
    authors: PublicOption[];
  };
}

export interface PublicWorkDetails {
  id: number;
  slug: string;
  title: string;
  originalTitle?: string | null;
  coverUrl?: string | null;
  type: PublicOption;
  country: string;
  originalPublicationStartYear?: number | null;
  originalPublicationEndYear?: number | null;
  originalVolumeCount?: number | null;
  directRelease: boolean;
  originalPublicationStatus: string;
  authors: PublicAuthorDetails[];
  genres: PublicOption[];
  demographics: string[];
  serializationMagazines: PublicOption[];
  originalPublishers: PublicOption[];
  editions: PublicEditionDetails[];
}

export interface PublicEditionSummary {
  id: number;
  chronologicalNumber: number;
  coverUrl?: string | null;
  work: {
    id: number;
    slug: string;
    title: string;
    originalTitle?: string | null;
    authors: PublicOption[];
  };
  brazilianPublisher: PublicOption;
  format: PublicOption;
  coverType: PublicOption;
  volumesCount: number;
}

export interface PublicPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PublicWorksResponse {
  works: PublicWorkSummary[];
  pagination: PublicPagination;
}

export interface PublicEditionsResponse {
  editions: PublicEditionSummary[];
  pagination: PublicPagination;
}

export interface PublicWorkDetailsResponse {
  work: PublicWorkDetails;
}

export interface PublicEditionDetailsResponse {
  edition: PublicEditionPageDetails;
  volumes: PublicEditionVolumeSummary[];
  pagination: PublicPagination;
}

export interface PublicVolumeDetails extends PublicVolumePreview {
  pages?: number | null;
  price?: number | null;
  priceCurrency: string;
  isbn10?: string | null;
  isbn13?: string | null;
  affiliateLink?: string | null;
  synopsis?: string | null;
  edition: {
    id: number;
    chronologicalNumber: number;
    work: {
      id: number;
      slug: string;
      title: string;
      originalTitle?: string | null;
    };
  };
}

export interface PublicVolumeDetailsResponse {
  volume: PublicVolumeDetails;
}

export interface PublicWorksQuery {
  term?: string;
  typeId?: number;
  country?: string;
  demographics?: string[];
  genreIds?: number[];
  sortBy: WorkSort;
  order: CatalogOrder;
  page: number;
  limit: number;
}

export interface PublicEditionsQuery {
  term?: string;
  brazilianPublisherId?: number;
  formatId?: number;
  coverTypeId?: number;
  sortBy: EditionSort;
  order: CatalogOrder;
  page: number;
  limit: number;
}
