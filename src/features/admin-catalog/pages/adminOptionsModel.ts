export interface OptionCategory {
  slug: string;
  name: string;
  form?: OptionForm;
}

export type OptionForm = "obra" | "edicao";
export type SortOrder = "ASC" | "DESC";

export interface DomainOptionValue {
  id: number;
  label: string;
  code?: string | null;
  systemManaged?: boolean;
  position?: number;
  active?: boolean;
  category: OptionCategory;
}

export interface OptionsResponse {
  category: OptionCategory;
  values: DomainOptionValue[];
  pagination: OptionsPagination;
}

export interface OptionsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const DEFAULT_PAGE_SIZE = 6;

export const FORM_OPTIONS: OptionCategory[] = [
  { slug: "obra", name: "Obra" },
  { slug: "edicao", name: "Edição" },
];

export const CATEGORIES: OptionCategory[] = [
  { slug: "autores", name: "Autor", form: "obra" },
  { slug: "revistas-serializacao", name: "Pré-publicação", form: "obra" },
  { slug: "editoras-originais", name: "Editora original", form: "obra" },
  { slug: "editoras-brasileiras", name: "Editora brasileira", form: "edicao" },
  { slug: "tipos-capa", name: "Acabamento", form: "edicao" },
  { slug: "formatos-fisicos", name: "Formato", form: "edicao" },
  { slug: "miolos", name: "Miolo", form: "edicao" },
];

const COMMA_LITERAL_CATEGORY_SLUGS = new Set(["formatos-fisicos", "miolos"]);
const SYSTEM_MANAGED_CATEGORY_SLUGS = new Set(["tipos-obra", "generos"]);

export function getPageSizeForCategory() {
  return DEFAULT_PAGE_SIZE;
}

export function isSystemManagedCategory(categorySlug: string) {
  return SYSTEM_MANAGED_CATEGORY_SLUGS.has(categorySlug);
}


export function getCategoryForm(categorySlug: string): OptionForm | undefined {
  return CATEGORIES.find((category) => category.slug === categorySlug)?.form;
}


export function parseNewValueLabels(label: string, categorySlug: string) {
  if (COMMA_LITERAL_CATEGORY_SLUGS.has(categorySlug)) {
    return [label.trim()].filter(Boolean);
  }

  return label.split(",").map((item) => item.trim()).filter(Boolean);
}
