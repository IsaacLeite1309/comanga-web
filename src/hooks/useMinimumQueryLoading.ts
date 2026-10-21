import { useEffect, useState } from "react";

const FILTER_LOADING_MS = 2000;

/** Mantém a transição visível quando a consulta muda, inclusive se já houver cache. */
export function useMinimumQueryLoading(queryKey: string, pending: boolean) {
  const [transition, setTransition] = useState({ key: queryKey, active: false });

  useEffect(() => {
    if (transition.key === queryKey) return;
    setTransition({ key: queryKey, active: true });
    const timer = window.setTimeout(() => {
      setTransition((current) => current.key === queryKey ? { key: queryKey, active: false } : current);
    }, FILTER_LOADING_MS);
    return () => window.clearTimeout(timer);
    // Cada mudança de consulta reinicia o intervalo; alterações do estado interno não o reiniciam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  return pending || transition.key !== queryKey || transition.active;
}
