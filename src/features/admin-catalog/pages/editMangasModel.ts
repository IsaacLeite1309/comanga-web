export type WorkVisibility = "Privado" | "Público";
export type WorkFilterVisibility = "Todos" | WorkVisibility;
export type WorkSortOrder = "ASC" | "DESC";

export interface OptionValue {
  id: number;
  label: string;
}

export interface WorkSummary {
  id: number;
  slug: string;
  title: string;
  originalTitle?: string | null;
  coverUrl?: string | null;
  visibility: WorkVisibility;
  type?: OptionValue | null;
  authors?: OptionValue[];
  editionsCount?: number;
}

export interface WorksPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WorksResponse {
  works: WorkSummary[];
  pagination: WorksPagination;
}

export interface WorkTypeOptionsResponse {
  values: OptionValue[];
}

export interface FilterOption {
  value: string;
  label: string;
}

export const WORKS_PAGE_SIZE = 8;

export function formatEditionsCount(count?: number) {
  const total = count ?? 0;
  return `${total} ${total === 1 ? "edição" : "edições"}`;
}
