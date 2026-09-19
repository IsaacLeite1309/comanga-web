import type { CatalogVisibility } from "@/types/catalog";

export function visibilityActionClassName(visibility: CatalogVisibility) {
  return visibility === "Público"
    ? "border-green-500/40 bg-green-500/15 text-green-300 hover:border-green-400 hover:bg-green-500/25"
    : "border-yellow-500/40 bg-yellow-500/15 text-yellow-300 hover:border-yellow-400 hover:bg-yellow-500/25";
}
