import { useEffect, useState } from "react";

export type CatalogViewMode = "list" | "grid";

export function useCatalogDetailView(itemCount = 0) {
  const [viewMode, setViewMode] = useState<CatalogViewMode>("grid");
  const [isMobileGrid, setIsMobileGrid] = useState(() => window.matchMedia("(max-width: 767px)").matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncMobileView = () => setIsMobileGrid(mediaQuery.matches);

    syncMobileView();
    mediaQuery.addEventListener("change", syncMobileView);
    return () => mediaQuery.removeEventListener("change", syncMobileView);
  }, []);

  const isGridView = isMobileGrid || viewMode === "grid";
  return {
    viewMode,
    setViewMode,
    isGridView,
    showGridView: itemCount > 0 && isGridView,
  };
}
