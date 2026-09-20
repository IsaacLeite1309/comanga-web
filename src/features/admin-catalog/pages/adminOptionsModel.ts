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
// Listas semeadas pelo sistema: só é possível ativar ou desativar seus valores.
const SYSTEM_MANAGED_CATEGORY_SLUGS = new Set(["tipos-obra", "generos"]);
// Lista com ordem de exibição definida manualmente pelo administrador.
const REORDERABLE_CATEGORY_SLUGS = new Set(["tipos-edicao"]);
// A reordenação envia a lista inteira, por isso a categoria é carregada em uma página só.
const REORDERABLE_PAGE_SIZE = 50;

export function getPageSizeForCategory(categorySlug: string) {
  if (REORDERABLE_CATEGORY_SLUGS.has(categorySlug)) return REORDERABLE_PAGE_SIZE;
  return COUNTRY_DEPENDENT_CATEGORY_SLUGS.has(categorySlug) ? 5 : DEFAULT_PAGE_SIZE;
}

export function isSystemManagedCategory(categorySlug: string) {
  return SYSTEM_MANAGED_CATEGORY_SLUGS.has(categorySlug);
}

export function isReorderableCategory(categorySlug: string) {
  return REORDERABLE_CATEGORY_SLUGS.has(categorySlug);
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
