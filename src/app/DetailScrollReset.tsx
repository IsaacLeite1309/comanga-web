import { useLayoutEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";

const DETAIL_PATHS = [
  "/obra/:slug",
  "/obra/:slug/edicao/:editionNumber",
  "/obra/:slug/edicao/:editionNumber/volume/:volumeNumber",
  "/colecao/:slug/edicao/:editionNumber",
];

export function DetailScrollReset() {
  const { pathname, key } = useLocation();

  useLayoutEffect(() => {
    if (DETAIL_PATHS.some((path) => matchPath({ path, end: true }, pathname))) {
      window.scrollTo(0, 0);
      const frame = window.requestAnimationFrame(() => window.scrollTo(0, 0));
      return () => window.cancelAnimationFrame(frame);
    }
  }, [key, pathname]);

  return null;
}
