import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getPublicCatalogOptions, listPublicCalendar } from "@/features/public-catalog/publicCatalogService";
import type { PublicCalendarQuery, PublicOption } from "@/features/public-catalog/publicCatalogTypes";
import { getApiError } from "@/lib/apiError";
import { PUBLIC_CATALOG_QUERY_ROOT } from "@/lib/queryClient";
import { useMinimumQueryLoading } from "@/hooks/useMinimumQueryLoading";
import { usePublicCatalogScope } from "@/features/public-catalog/usePublicCatalogScope";
import { sameQueryExceptOrder } from "@/features/public-catalog/sameQueryExceptOrder";

const PAGE_SIZE = 24;

function queryInteger(params: URLSearchParams, key: string, min: number, max: number) {
  const value = params.get(key);
  if (value === null) return undefined;
  const parsed = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error("Parâmetros inválidos. Escolha um mês entre 1900 e 2200 e filtros válidos.");
  }
  return parsed;
}

function readCalendarQuery(params: URLSearchParams): { query: PublicCalendarQuery; validationError: string } {
  try {
    const term = params.get("term")?.trim();
    if (term && term.length > 255) throw new Error("A pesquisa deve ter no máximo 255 caracteres.");
    const order = params.get("order") ?? "ASC";
    if (order !== "ASC" && order !== "DESC") throw new Error("Ordenação inválida.");
    return {
      query: {
        year: queryInteger(params, "year", 1900, 2200),
        month: queryInteger(params, "month", 1, 12),
        brazilianPublisherId: queryInteger(params, "brazilianPublisherId", 1, 2147483647),
        term: term || undefined,
        order,
        page: queryInteger(params, "page", 1, Math.floor(2147483647 / PAGE_SIZE) + 1) ?? 1,
        limit: PAGE_SIZE,
      },
      validationError: "",
    };
  } catch (error) {
    return { query: { page: 1, limit: PAGE_SIZE }, validationError: (error as Error).message };
  }
}

function useCalendarResults(query: PublicCalendarQuery, validationError: string) {
  const scope = usePublicCatalogScope();
  const result = useQuery({
    queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "calendar", query, validationError],
    queryFn: () => listPublicCalendar(query),
    enabled: !validationError,
    placeholderData: (previousData, previousQuery) => !validationError
      && previousQuery?.queryKey[2] === "calendar"
      && sameQueryExceptOrder(previousQuery.queryKey[3], query) ? previousData : undefined,
  });
  const loading = useMinimumQueryLoading(JSON.stringify([{ ...query, page: undefined }, validationError]), !validationError && result.isPending);
  return {
    data: validationError ? null : result.data ?? null,
    loading,
    error: validationError || (result.isError && !result.data
      ? getApiError(result.error, "Não foi possível carregar os lançamentos.") : ""),
    refreshError: result.isError && result.data ? "Não foi possível atualizar os lançamentos." : "",
    retryResults: () => { void result.refetch(); },
  };
}

function useCalendarPublishers() {
  const scope = usePublicCatalogScope();
  const result = useQuery({
    queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "options"],
    queryFn: getPublicCatalogOptions,
  });
  return {
    publishers: result.data?.brazilianPublishers ?? [] as PublicOption[],
    optionsLoading: result.isPending,
    optionsError: result.isError && !result.data,
    retryOptions: () => { void result.refetch(); },
  };
}

export function usePublicCalendar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const serializedParams = searchParams.toString();
  const { query, validationError } = useMemo(() => readCalendarQuery(new URLSearchParams(serializedParams)), [serializedParams]);
  const [searchTerm, setSearchTerm] = useState(query.term ?? "");
  const results = useCalendarResults(query, validationError);
  const options = useCalendarPublishers();
  const period = query.year && query.month ? { year: query.year, month: query.month } : results.data ? {
    year: query.year ?? results.data.year,
    month: query.month ?? results.data.month,
  } : null;
  const periodValue = period ? `${period.year}-${String(period.month).padStart(2, "0")}` : "";

  useEffect(() => { setSearchTerm(query.term ?? ""); }, [query.term]);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextTerm = searchTerm.trim();
      if (nextTerm === (query.term ?? "")) return;
      const next = new URLSearchParams(searchParams);
      if (nextTerm) next.set("term", nextTerm);
      else next.delete("term");
      next.delete("page");
      setSearchParams(next);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [query.term, searchParams, searchTerm, setSearchParams]);

  function updateFilters(values: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(values).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    next.delete("page");
    setSearchParams(next);
  }

  function changeMonth(value: string) {
    if (!/^\d{4}-\d{2}$/.test(value)) return;
    const [year, month] = value.split("-");
    updateFilters({ year, month });
  }

  function moveMonth(direction: number) {
    if (!period) return;
    const offset = period.year * 12 + period.month - 1 + direction;
    updateFilters({ year: String(Math.floor(offset / 12)), month: String(offset % 12 + 1) });
  }

  function changePage(page: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page));
    setSearchParams(next);
  }

  function toggleTitleSort() {
    updateFilters({ order: query.order === "DESC" ? undefined : "DESC" });
  }

  return {
    ...results, ...options, query, validationError, period, periodValue, searchTerm, setSearchTerm,
    updateFilters, changeMonth, moveMonth, changePage, toggleTitleSort,
    currentMonth: () => updateFilters({ year: undefined, month: undefined }),
    resetCalendar: () => setSearchParams({}),
  };
}

export type CalendarState = ReturnType<typeof usePublicCalendar>;
