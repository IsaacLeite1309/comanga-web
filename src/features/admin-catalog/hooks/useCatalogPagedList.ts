import { useCallback, useEffect, useRef, useState } from "react";
import { getApiError } from "@/lib/apiError";
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
  const [items, setItems] = useState<TItem[]>([]);
  const [pagination, setPagination] = useState<CatalogPagination>(() => emptyCatalogPagination(pageSize));
  const [page, setPage] = useRememberedPage(listKey);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
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
  }, [enabled, errorMessage, loadPage, page, pageSize, reloadToken, setPage]);

  function goToPage(nextPage: number) {
    const target = Math.min(Math.max(nextPage, 1), navigablePages(pagination.totalPages));
    if (target !== page) setPage(target);
  }

  // Depois de excluir um registro, recarrega a página atual ou recua para a última ainda válida.
  function refreshAfterRemoval() {
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
    goToPrevious: () => goToPage(page - 1),
    goToNext: () => goToPage(page + 1),
  };

  return {
    items,
    setItems,
    loading,
    error,
    pagination: paginationView,
    refresh: () => setReloadToken((current) => current + 1),
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
