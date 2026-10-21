export type CatalogOrigin = "search" | "collection" | "checklist" | "wishlist";
import { lastCatalogPath } from "@/lib/catalogNavigationMemory";

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

export function directReturnPath(value: unknown, allowedPaths: string[]) {
  if (!value || typeof value !== "object") return null;
  const path = (value as { returnTo?: unknown }).returnTo;
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) return null;
  return allowedPaths.includes(path.split(/[?#]/, 1)[0]) ? path : null;
}

export function catalogRoot(origin: CatalogOrigin) {
  switch (origin) {
    case "collection": return { path: "/colecao", label: "Coleção" };
    case "checklist": return { path: lastCatalogPath("/lancamentos"), label: "Lançamentos" };
    case "wishlist": return { path: "/desejos", label: "Lista de desejos" };
    default: return { path: lastCatalogPath("/pesquisa"), label: "Pesquisar" };
  }
}
