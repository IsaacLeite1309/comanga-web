import { useCallback, useEffect, useRef, useState } from "react";
import type { PersonalPagination } from "./personalLibraryTypes";
import { getApiError } from "@/lib/apiError";

export function useLibraryPage<T extends { pagination: PersonalPagination }>(loader: (page: number) => Promise<T>) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const request = useRef(0);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const reload = useCallback(async () => {
    const version = ++request.current;
    setLoading(true); setData(null); setError("");
    try {
      const result = await loader(page);
      if (alive.current && version === request.current) {
        if (page > Math.max(1, result.pagination.totalPages)) setPage(Math.max(1, result.pagination.totalPages));
        else setData(result);
      }
    } catch (failure) {
      if (alive.current && version === request.current) setError(getApiError(failure, "Não foi possível carregar seu acervo."));
    } finally {
      if (alive.current && version === request.current) setLoading(false);
    }
  }, [loader, page]);
  useEffect(() => { void reload(); }, [reload]);
  async function mutate(operation: () => Promise<unknown>, success: string) {
    setBusy(true); setMessage("");
    let result = success;
    try { await operation(); }
    catch (failure) { result = getApiError(failure, "Não foi possível salvar a alteração. Confira o estado atualizado abaixo."); }
    if (!alive.current) return;
    await reload();
    if (alive.current) { setMessage(result); setBusy(false); }
  }
  return { page, setPage, data, loading, busy, error, message, reload, mutate };
}
