import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getPublicCatalogOptions, listPublicCalendar } from "@/features/public-catalog/publicCatalogService";
import type { PublicCalendarQuery, PublicCalendarResponse, PublicOption } from "@/features/public-catalog/publicCatalogTypes";
import { getApiError } from "@/lib/apiError";

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
    return {
      query: {
        year: queryInteger(params, "year", 1900, 2200),
        month: queryInteger(params, "month", 1, 12),
        brazilianPublisherId: queryInteger(params, "brazilianPublisherId", 1, 2147483647),
        term: term || undefined,
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
  const [data, setData] = useState<PublicCalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    if (validationError) setData(null);
    setError(validationError);
    setLoading(!validationError);
    if (validationError) return;
    listPublicCalendar(query)
      .then((result) => { if (active) setData(result); })
      .catch((requestError) => {
        if (active) setError(getApiError(requestError, "Não foi possível carregar o calendário."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, retry, validationError]);

  return { data, loading, error, retryResults: () => setRetry(value => value + 1) };
}

function useCalendarPublishers() {
  const [publishers, setPublishers] = useState<PublicOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setOptionsLoading(true);
    setOptionsError(false);
    getPublicCatalogOptions()
      .then((options) => { if (active) setPublishers(options.brazilianPublishers); })
      .catch(() => { if (active) setOptionsError(true); })
      .finally(() => { if (active) setOptionsLoading(false); });
    return () => { active = false; };
  }, [retry]);
  return { publishers, optionsLoading, optionsError, retryOptions: () => setRetry(value => value + 1) };
}

export function usePublicCalendar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const serializedParams = searchParams.toString();
  const { query, validationError } = useMemo(() => readCalendarQuery(new URLSearchParams(serializedParams)), [serializedParams]);
  const results = useCalendarResults(query, validationError);
  const options = useCalendarPublishers();
  const period = query.year && query.month ? { year: query.year, month: query.month } : results.data ? {
    year: query.year ?? results.data.year,
    month: query.month ?? results.data.month,
  } : null;
  const periodValue = period ? `${period.year}-${String(period.month).padStart(2, "0")}` : "";

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

  function clearFilters() {
    updateFilters({ term: undefined, brazilianPublisherId: undefined });
  }

  return {
    ...results, ...options, query, validationError, period, periodValue,
    updateFilters, changeMonth, moveMonth, changePage, clearFilters,
    currentMonth: () => updateFilters({ year: undefined, month: undefined }),
    resetCalendar: () => setSearchParams({}),
  };
}

export type CalendarState = ReturnType<typeof usePublicCalendar>;
