import { useLayoutEffect } from "react";

export function useLoadingScrollReset(loading: boolean) {
  useLayoutEffect(() => {
    if (loading) window.scrollTo({ top: 0, behavior: "instant" });
  }, [loading]);
}
