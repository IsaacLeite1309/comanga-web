export type CatalogOrigin = "search" | "collection" | "checklist" | "wishlist";

export interface CatalogNavigationState {
  catalogOrigin: CatalogOrigin;
  fromWork?: { slug: string; title: string };
}

export function catalogNavigationState(value: unknown): CatalogNavigationState {
  if (!value || typeof value !== "object") return { catalogOrigin: "search" };
  const state = value as Partial<CatalogNavigationState>;
  const origin = state.catalogOrigin;
  const catalogOrigin: CatalogOrigin = origin === "collection" || origin === "checklist" || origin === "wishlist" ? origin : "search";
  const fromWork = state.fromWork && typeof state.fromWork.slug === "string" && typeof state.fromWork.title === "string"
    ? state.fromWork : undefined;
  return { catalogOrigin, ...(fromWork ? { fromWork } : {}) };
}

export function catalogRoot(origin: CatalogOrigin) {
  switch (origin) {
    case "collection": return { path: "/colecao", label: "Coleção" };
    case "checklist": return { path: "/lancamentos", label: "Lançamentos" };
    case "wishlist": return { path: "/desejos", label: "Lista de desejos" };
    default: return { path: "/pesquisa?tab=works&sortBy=title&order=ASC&page=1", label: "Pesquisar" };
  }
}
