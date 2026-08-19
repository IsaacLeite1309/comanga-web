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
