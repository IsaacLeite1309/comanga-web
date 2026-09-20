export type WorkVisibility = "Privado" | "Público";
export type WorkFilterVisibility = "Todos" | WorkVisibility;
export type WorkSortOrder = "ASC" | "DESC";

export interface OptionValue {
  id: number;
  label: string;
  depends_on?: Array<{
    id: number;
    label: string;
    category: { slug: string; name: string };
  }>;
}

export interface WorkSummary {
  id: number;
  slug: string;
  title: string;
  originalTitle?: string | null;
  coverUrl?: string | null;
  visibility: WorkVisibility;
  type?: OptionValue | null;
  country?: string | null;
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

export const COUNTRY_OPTIONS: FilterOption[] = [
  { value: "Japão", label: "Japão" },
  { value: "Coreia do Sul", label: "Coreia do Sul" },
  { value: "China", label: "China" },
  { value: "Taiwan", label: "Taiwan" },
];

export function formatEditionsCount(count?: number) {
  const total = count ?? 0;
  return `${total} ${total === 1 ? "edição" : "edições"}`;
}
