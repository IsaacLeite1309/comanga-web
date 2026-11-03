import { useCallback, useEffect, useRef, useState } from "react";
import { getApiError } from "@/lib/apiError";
import { ADMIN_QUERY_ROOT, queryClient } from "@/lib/queryClient";
import {
  emptyCatalogPagination,
  navigablePages,
  pageAfterRemoval,
  readCatalogPage,
  rememberCatalogPage,
  type CatalogPagination,
} from "../domain/catalogPagination";

export interface CatalogPageResult<TItem> {
  items: TItem[];
  pagination: CatalogPagination;
}

interface CatalogPagedListOptions<TItem> {
  enabled: boolean;
  listKey: string;
  pageSize: number;
  errorMessage: string;
  loadPage: (page: number, limit: number) => Promise<CatalogPageResult<TItem>>;
}

// Dados que a interface precisa para desenhar os controles Anterior/Próxima.
export interface CatalogPaginationView {
  visible: boolean;
  page: number;
  totalPages: number;
  total: number;
  shown: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  goToPage: (page: number) => void;
  goToPrevious: () => void;
  goToNext: () => void;
}

/**
 * Consome a paginação real da API em listas administrativas hierárquicas.
 * Cada requisição recebe um número de sequência: respostas antigas são descartadas
 * quando a navegação já avançou ou o componente saiu de cena.
 */
export function useCatalogPagedList<TItem>({
  enabled,
  listKey,
  pageSize,
  errorMessage,
  loadPage,
}: CatalogPagedListOptions<TItem>) {
  const initialPage = readCatalogPage(listKey);
  const initialResult = queryClient.getQueryData<CatalogPageResult<TItem>>([...ADMIN_QUERY_ROOT, "paged", listKey, initialPage]);
  const [items, setItems] = useState<TItem[]>(initialResult?.items ?? []);
  const [pagination, setPagination] = useState<CatalogPagination>(() => initialResult?.pagination ?? emptyCatalogPagination(pageSize));
  const [page, setPage] = useRememberedPage(listKey);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(!initialResult);
  const [loaded, setLoaded] = useState(Boolean(initialResult));
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const cacheKey = [...ADMIN_QUERY_ROOT, "paged", listKey, page];
    const cached = queryClient.getQueryData<CatalogPageResult<TItem>>(cacheKey);
    if (cached) {
      setItems(cached.items);
      setPagination(cached.pagination);
      setLoaded(true);
      setLoading(false);
      return;
    }

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    setLoading(true);
    setError("");

    loadPage(page, pageSize)
      .then((result) => {
        if (requestIdRef.current !== requestId) return;
        const lastPage = navigablePages(result.pagination.totalPages);
        if (page > lastPage) { setPage(lastPage); return; }
        setItems(result.items);
        queryClient.setQueryData(cacheKey, result);
        setPagination(result.pagination);
        setLoaded(true);
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (requestIdRef.current !== requestId) return;
        setItems([]);
        setError(getApiError(loadError, errorMessage));
        setLoading(false);
      });

    return () => {
      requestIdRef.current += 1;
    };
  }, [enabled, errorMessage, listKey, loadPage, page, pageSize, reloadToken, setPage]);

  function goToPage(nextPage: number) {
    const target = Math.min(Math.max(nextPage, 1), navigablePages(pagination.totalPages));
    if (target !== page) setPage(target);
  }

  // Depois de excluir um registro, recarrega a página atual ou recua para a última ainda válida.
  function refreshAfterRemoval() {
    queryClient.removeQueries({ queryKey: [...ADMIN_QUERY_ROOT, "paged", listKey] });
    const nextPage = pageAfterRemoval(page, pagination.total, pageSize);
    if (nextPage === page) setReloadToken((current) => current + 1);
    else setPage(nextPage);
  }

  const paginationView: CatalogPaginationView = {
    visible: loaded,
    page,
    totalPages: navigablePages(pagination.totalPages),
    total: pagination.total,
    shown: items.length,
    canGoPrevious: !error && page > 1,
    canGoNext: !error && page < pagination.totalPages,
    goToPage,
    goToPrevious: () => goToPage(page - 1),
    goToNext: () => goToPage(page + 1),
  };

  return {
    items,
    setItems,
    loading,
    error,
    pagination: paginationView,
    refresh: () => {
      queryClient.removeQueries({ queryKey: [...ADMIN_QUERY_ROOT, "paged", listKey] });
      setReloadToken((current) => current + 1);
    },
    refreshAfterRemoval,
  };
}

function useRememberedPage(key: string) {
  const [state, setState] = useState(() => ({ key, page: readCatalogPage(key) }));
  const page = state.key === key ? state.page : readCatalogPage(key);
  const setPage = useCallback((nextPage: number) => {
    rememberCatalogPage(key, nextPage);
    setState({ key, page: nextPage });
  }, [key]);
  return [page, setPage] as const;
}
