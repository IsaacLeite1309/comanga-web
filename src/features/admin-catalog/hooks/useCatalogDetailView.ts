import { useEffect, useState } from "react";

export type CatalogViewMode = "list" | "grid";

export function useCatalogDetailView(itemCount: number) {
  const [viewMode, setViewMode] = useState<CatalogViewMode>("list");
  const [isMobileGrid, setIsMobileGrid] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncMobileView = () => setIsMobileGrid(mediaQuery.matches);

    syncMobileView();
    mediaQuery.addEventListener("change", syncMobileView);
    return () => mediaQuery.removeEventListener("change", syncMobileView);
  }, []);

  return {
    viewMode,
    setViewMode,
    showGridView: itemCount > 0 && (isMobileGrid || viewMode === "grid"),
  };
}
