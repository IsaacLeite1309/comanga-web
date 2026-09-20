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
  category: OptionCategory;
  depends_on?: DomainOptionValueDependency[];
}

interface DomainOptionValueDependency {
  id: number;
  label: string;
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
export const COUNTRY_CATEGORY_SLUG = "paises-origem";

export const FORM_OPTIONS: OptionCategory[] = [
  { slug: "obra", name: "Obra" },
  { slug: "edicao", name: "Edição" },
];

export const CATEGORIES: OptionCategory[] = [
  { slug: "autores", name: "Autor", form: "obra" },
  { slug: "tipos-obra", name: "Tipo de obra", form: "obra" },
  { slug: "generos", name: "Gêneros", form: "obra" },
  { slug: "revistas-serializacao", name: "Pré-publicação", form: "obra" },
  { slug: "editoras-originais", name: "Editora original", form: "obra" },
  { slug: "editoras-brasileiras", name: "Editora brasileira", form: "edicao" },
  { slug: "tipos-edicao", name: "Tipo de edição", form: "edicao" },
  { slug: "tipos-capa", name: "Acabamento", form: "edicao" },
  { slug: "formatos-fisicos", name: "Formato", form: "edicao" },
];

const COUNTRY_DEPENDENT_CATEGORY_SLUGS = new Set([
  "autores",
  "tipos-obra",
  "revistas-serializacao",
  "editoras-originais",
]);
const COMMA_LITERAL_CATEGORY_SLUGS = new Set(["formatos-fisicos"]);

export function getPageSizeForCategory(categorySlug: string) {
  return COUNTRY_DEPENDENT_CATEGORY_SLUGS.has(categorySlug) ? 5 : DEFAULT_PAGE_SIZE;
}

export function getCategoryForm(categorySlug: string): OptionForm | undefined {
  return CATEGORIES.find((category) => category.slug === categorySlug)?.form;
}

export function isCountryDependent(categorySlug: string) {
  return COUNTRY_DEPENDENT_CATEGORY_SLUGS.has(categorySlug);
}

export function parseNewValueLabels(label: string, categorySlug: string) {
  if (COMMA_LITERAL_CATEGORY_SLUGS.has(categorySlug)) {
    return [label.trim()].filter(Boolean);
  }

  return label.split(",").map((item) => item.trim()).filter(Boolean);
}
