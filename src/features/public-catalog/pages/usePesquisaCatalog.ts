import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getApiError } from "@/lib/apiError";
import {
  getPublicCatalogOptions,
  listPublicEditions,
  listPublicWorks,
} from "@/features/public-catalog/publicCatalogService";
import type {
  CatalogOrder,
  PublicCatalogOptions,
  PublicCatalogTab,
  PublicEditionSummary,
  PublicEditionsQuery,
  PublicPagination,
  PublicWorksQuery,
  PublicWorkSummary,
} from "@/features/public-catalog/publicCatalogTypes";

const PAGE_SIZE = 24;
const EMPTY_OPTIONS: PublicCatalogOptions = {
  workTypes: [],
  countries: [],
  demographics: [],
  genres: [],
  originalPublishers: [],
  serializationMagazines: [],
  originalPublicationStatuses: [],
  brazilianPublishers: [],
  brazilPublicationStatuses: [],
  formats: [],
  coverTypes: [],
};
const EMPTY_PAGINATION: PublicPagination = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};
const WORK_FILTER_KEYS = [
  "typeId",
  "country",
  "demographics",
  "genreIds",
  "originalPublisherId",
  "serializationMagazineId",
  "originalPublicationStatus",
  "originalPublicationStartYear",
  "originalPublicationEndYear",
];
const EDITION_FILTER_KEYS = [
  "brazilianPublisherId",
  "formatId",
  "coverTypeId",
  "chronologicalNumber",
  "brazilPublicationStatus",
  "brazilPublicationStartYear",
  "brazilPublicationEndYear",
];
const ADVANCED_FILTER_KEYS = [
  "country",
  "demographics",
  "genreIds",
  "originalPublisherId",
  "serializationMagazineId",
  "originalPublicationStartYear",
  "originalPublicationEndYear",
  "formatId",
  "coverTypeId",
  "chronologicalNumber",
  "brazilPublicationStartYear",
  "brazilPublicationEndYear",
];

function positiveInteger(value: string | null, fallback = 1) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function optionalInteger(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function csvValues(value: string | null) {
  return value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];
}

function numericCsvValues(value: string | null) {
  return csvValues(value)
    .map(Number)
    .filter((item) => Number.isInteger(item) && item > 0);
}

function readCatalogParams(params: URLSearchParams) {
  const tab: PublicCatalogTab = params.get("tab") === "editions" ? "editions" : "works";
  const order: CatalogOrder = params.get("order") === "DESC" ? "DESC" : "ASC";
  return {
    tab,
    urlTerm: params.get("term") ?? "",
    order,
    page: positiveInteger(params.get("page")),
    sortBy: "title" as const,
    typeId: optionalInteger(params.get("typeId")),
    country: params.get("country") ?? "",
    demographics: csvValues(params.get("demographics")),
    genreIds: numericCsvValues(params.get("genreIds")),
    originalPublisherId: optionalInteger(params.get("originalPublisherId")),
    serializationMagazineId: optionalInteger(params.get("serializationMagazineId")),
    originalPublicationStatus: params.get("originalPublicationStatus") ?? "",
    originalPublicationStartYear: optionalInteger(params.get("originalPublicationStartYear")),
    originalPublicationEndYear: optionalInteger(params.get("originalPublicationEndYear")),
    brazilianPublisherId: optionalInteger(params.get("brazilianPublisherId")),
    formatId: optionalInteger(params.get("formatId")),
    coverTypeId: optionalInteger(params.get("coverTypeId")),
    chronologicalNumber: optionalInteger(params.get("chronologicalNumber")),
    brazilPublicationStatus: params.get("brazilPublicationStatus") ?? "",
    brazilPublicationStartYear: optionalInteger(params.get("brazilPublicationStartYear")),
    brazilPublicationEndYear: optionalInteger(params.get("brazilPublicationEndYear")),
  };
}

type CatalogParams = ReturnType<typeof readCatalogParams>;

function buildWorkQuery(params: CatalogParams): PublicWorksQuery {
  return {
    ...(params.urlTerm.trim() ? { term: params.urlTerm.trim() } : {}),
    ...(params.typeId ? { typeId: params.typeId } : {}),
    ...(params.country ? { country: params.country } : {}),
    ...(params.demographics.length ? { demographics: params.demographics } : {}),
    ...(params.genreIds.length ? { genreIds: params.genreIds } : {}),
    ...(params.originalPublisherId ? { originalPublisherId: params.originalPublisherId } : {}),
    ...(params.serializationMagazineId ? { serializationMagazineId: params.serializationMagazineId } : {}),
    ...(params.originalPublicationStatus ? { originalPublicationStatus: params.originalPublicationStatus } : {}),
    ...(params.originalPublicationStartYear ? { originalPublicationStartYear: params.originalPublicationStartYear } : {}),
    ...(params.originalPublicationEndYear ? { originalPublicationEndYear: params.originalPublicationEndYear } : {}),
    sortBy: "title",
    order: params.order,
    page: params.page,
    limit: PAGE_SIZE,
  };
}

function buildEditionQuery(params: CatalogParams): PublicEditionsQuery {
  return {
    ...(params.urlTerm.trim() ? { term: params.urlTerm.trim() } : {}),
    ...(params.brazilianPublisherId ? { brazilianPublisherId: params.brazilianPublisherId } : {}),
    ...(params.formatId ? { formatId: params.formatId } : {}),
    ...(params.coverTypeId ? { coverTypeId: params.coverTypeId } : {}),
    ...(params.chronologicalNumber ? { chronologicalNumber: params.chronologicalNumber } : {}),
    ...(params.brazilPublicationStatus ? { brazilPublicationStatus: params.brazilPublicationStatus } : {}),
    ...(params.brazilPublicationStartYear ? { brazilPublicationStartYear: params.brazilPublicationStartYear } : {}),
    ...(params.brazilPublicationEndYear ? { brazilPublicationEndYear: params.brazilPublicationEndYear } : {}),
    sortBy: "title",
    order: params.order,
    page: params.page,
    limit: PAGE_SIZE,
  };
}

function useCatalogLocation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const serializedParams = searchParams.toString();
  const params = useMemo(() => readCatalogParams(new URLSearchParams(serializedParams)), [serializedParams]);
  const [searchTerm, setSearchTerm] = useState(params.urlTerm);
  const preserveResultsRef = useRef(false);

  useEffect(() => {
    const canonical = new URLSearchParams(searchParams);
    const defaults = {
      tab: params.tab,
      sortBy: params.sortBy,
      order: params.order,
      page: String(params.page),
    };
    const changed = Object.entries(defaults).some(([key, value]) => canonical.get(key) !== value);
    Object.entries(defaults).forEach(([key, value]) => canonical.set(key, value));
    if (changed) setSearchParams(canonical, { replace: true });
  }, [params.order, params.page, params.sortBy, params.tab, searchParams, setSearchParams]);

  useEffect(() => {
    setSearchTerm(params.urlTerm);
  }, [params.urlTerm]);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextTerm = searchTerm.trim();
      if (nextTerm === params.urlTerm) return;
      const next = new URLSearchParams(searchParams);
      if (nextTerm) next.set("term", nextTerm);
      else next.delete("term");
      next.set("page", "1");
      setSearchParams(next);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [params.urlTerm, searchParams, searchTerm, setSearchParams]);

  function updateParam(key: string, value: string | number | undefined) {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === "") next.delete(key);
    else next.set(key, String(value));
    next.set("page", "1");
    setSearchParams(next);
  }

  function toggleCsvParam(key: string, values: Array<string | number>, value: string | number) {
    const nextValues = values.includes(value)
      ? values.filter((current) => current !== value)
      : [...values, value];
    updateParam(key, nextValues.length ? nextValues.join(",") : undefined);
  }

  function changeTab(nextTab: PublicCatalogTab) {
    if (nextTab === params.tab) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", nextTab);
    if (searchTerm.trim()) next.set("term", searchTerm.trim());
    else next.delete("term");
    const incompatibleKeys = nextTab === "works" ? EDITION_FILTER_KEYS : WORK_FILTER_KEYS;
    incompatibleKeys.forEach((key) => next.delete(key));
    next.set("sortBy", "title");
    next.set("order", params.order);
    next.set("page", "1");
    setSearchParams(next);
  }

  function toggleTitleSort() {
    preserveResultsRef.current = true;
    const next = new URLSearchParams(searchParams);
    next.set("sortBy", "title");
    next.set("order", params.order === "ASC" ? "DESC" : "ASC");
    next.set("page", "1");
    setSearchParams(next);
  }

  function clearFilters() {
    const next = new URLSearchParams(searchParams);
    next.delete("term");
    [...WORK_FILTER_KEYS, ...EDITION_FILTER_KEYS].forEach((key) => next.delete(key));
    next.set("page", "1");
    setSearchTerm("");
    setSearchParams(next);
  }

  function changePage(nextPage: number, totalPages: number) {
    if (nextPage < 1 || nextPage > totalPages) return;
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  }

  return {
    ...params,
    params,
    searchParams,
    searchTerm,
    setSearchTerm,
    preserveResultsRef,
    updateParam,
    toggleCsvParam,
    changeTab,
    toggleTitleSort,
    clearFilters,
    changePage,
  };
}

function useCatalogOptions() {
  const [options, setOptions] = useState<PublicCatalogOptions>(EMPTY_OPTIONS);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setOptionsLoading(true);
    setOptionsError(false);
    getPublicCatalogOptions()
      .then((result) => {
        if (active) setOptions({ ...EMPTY_OPTIONS, ...result });
      })
      .catch(() => {
        if (active) setOptionsError(true);
      })
      .finally(() => {
        if (active) setOptionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  return {
    options,
    optionsLoading,
    optionsError,
    retryOptions: () => setRetry((value) => value + 1),
  };
}

function useCatalogResults(location: ReturnType<typeof useCatalogLocation>) {
  const [works, setWorks] = useState<PublicWorkSummary[]>([]);
  const [editions, setEditions] = useState<PublicEditionSummary[]>([]);
  const [pagination, setPagination] = useState<PublicPagination>(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const hasLoadedRef = useRef(false);
  const workQueryJson = JSON.stringify(buildWorkQuery(location.params));
  const editionQueryJson = JSON.stringify(buildEditionQuery(location.params));
  const workQuery = useMemo(
    () => JSON.parse(workQueryJson) as PublicWorksQuery,
    [workQueryJson],
  );
  const editionQuery = useMemo(
    () => JSON.parse(editionQueryJson) as PublicEditionsQuery,
    [editionQueryJson],
  );

  useEffect(() => {
    let active = true;
    const preserveResults = location.preserveResultsRef.current && hasLoadedRef.current;
    location.preserveResultsRef.current = false;
    if (!preserveResults) setLoading(true);
    setError("");
    const request = location.tab === "works"
      ? listPublicWorks(workQuery)
      : listPublicEditions(editionQuery);
    request
      .then((response) => {
        if (!active) return;
        if ("works" in response) setWorks(response.works);
        else setEditions(response.editions);
        setPagination({
          ...response.pagination,
          totalPages: Math.max(response.pagination.totalPages, 1),
        });
        hasLoadedRef.current = true;
      })
      .catch((requestError) => {
        if (!active) return;
        const fallback = location.tab === "works"
          ? "Não foi possível carregar as Obras."
          : "Não foi possível carregar as Edições.";
        setError(getApiError(requestError, fallback));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [editionQuery, location.preserveResultsRef, location.tab, retry, workQuery]);

  return {
    works,
    editions,
    pagination,
    loading,
    error,
    retryResults: () => setRetry((value) => value + 1),
  };
}

function useAdvancedFilters(searchParams: URLSearchParams) {
  const [showFilters, setShowFilters] = useState(() => (
    ADVANCED_FILTER_KEYS.some((key) => searchParams.has(key))
  ));
  const filtersRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showFilters) return undefined;
    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target as Node;
      if (filtersRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setShowFilters(false);
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [showFilters]);

  return {
    showFilters,
    setShowFilters,
    filtersRef,
    buttonRef,
  };
}

export function advancedFilterCount(params: CatalogParams) {
  if (params.tab === "works") {
    return params.demographics.length + params.genreIds.length + [
      params.country,
      params.originalPublisherId,
      params.serializationMagazineId,
      params.originalPublicationStartYear,
      params.originalPublicationEndYear,
    ].filter(Boolean).length;
  }
  return [
    params.formatId,
    params.coverTypeId,
    params.chronologicalNumber,
    params.brazilPublicationStartYear,
    params.brazilPublicationEndYear,
  ].filter(Boolean).length;
}

export function usePesquisaCatalog() {
  const location = useCatalogLocation();
  const optionState = useCatalogOptions();
  const resultState = useCatalogResults(location);
  const advancedFilters = useAdvancedFilters(location.searchParams);
  return { ...location, ...optionState, ...resultState, ...advancedFilters };
}

export type PesquisaCatalog = ReturnType<typeof usePesquisaCatalog>;
