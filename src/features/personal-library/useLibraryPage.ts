import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PersonalPagination } from "./personalLibraryTypes";
import { getApiError } from "@/lib/apiError";
import { toast } from "sonner";
import { useMinimumQueryLoading } from "@/hooks/useMinimumQueryLoading";

export function useLibraryPage<T extends { pagination: PersonalPagination }>(
  loader: (page: number) => Promise<T>,
  queryKeyPrefix: readonly unknown[],
) {
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [...queryKeyPrefix, page],
    queryFn: () => loader(page),
  });
  const data = query.data ?? null;
  const loading = useMinimumQueryLoading(JSON.stringify(queryKeyPrefix), query.isPending && !data);
  const error = query.isError && !data ? getApiError(query.error, "Não foi possível carregar seu acervo.") : "";
  const { refetch } = query;
  const reload = useCallback(async () => { await refetch(); }, [refetch]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (data && page > Math.max(1, data.pagination.totalPages)) setPage(Math.max(1, data.pagination.totalPages));
  }, [data, page]);
  useEffect(() => {
    if (!error) return;
    toast.error(`${error} Tente novamente em instantes.`, { id: "personal-library-load-error" });
  }, [error]);
  async function mutate(operation: () => Promise<unknown>, success: string) {
    setBusy(true);
    let result = success;
    let succeeded = true;
    try { await operation(); }
    catch (failure) {
      succeeded = false;
      result = getApiError(failure, "Não foi possível salvar a alteração. Confira o estado atualizado abaixo.");
    }
    await queryClient.invalidateQueries({ queryKey: queryKeyPrefix });
    if (alive.current) {
      if (succeeded) toast.success(result); else toast.error(result);
      setBusy(false);
    }
  }
  return { page, setPage, data, loading, busy, error, reload, mutate };
}
