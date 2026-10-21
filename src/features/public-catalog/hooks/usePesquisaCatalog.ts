import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getApiError } from "@/lib/apiError";
import { PUBLIC_CATALOG_QUERY_ROOT } from "@/lib/queryClient";
import { useMinimumQueryLoading } from "@/hooks/useMinimumQueryLoading";
import { usePublicCatalogScope } from "@/features/public-catalog/usePublicCatalogScope";
import { sameQueryExceptOrder } from "@/features/public-catalog/sameQueryExceptOrder";
import {
  getPublicCatalogOptions,
  getPublicEditionDetails,
  getPublicVolumeDetails,
  getPublicWorkDetails,
  listPublicEditions,
  listPublicWorks,
} from "@/features/public-catalog/publicCatalogService";
import type {
  CatalogOrder,
  PublicCatalogOptions,
  PublicCatalogTab,
  PublicEditionSummary,
  PublicEditionsQuery,
  PublicEditionsResponse,
  PublicPagination,
  PublicWorksQuery,
  PublicWorksResponse,
  PublicWorkSummary,
} from "@/features/public-catalog/publicCatalogTypes";

const PAGE_SIZE = 24;
const PREFETCH_CONCURRENCY = 3;
const PREFETCH_VOLUME_LIMIT = 48;
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
type PrefetchVolumeRoute = { workSlug: string; editionNumber: number; volumeNumber: number };

async function runWithConcurrency<T, R>(items: T[], concurrency: number, task: (item: T) => Promise<R>) {
  const results: Array<R | undefined> = Array(items.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      try {
        results[index] = await task(items[index]);
      } catch {
        // Falhas no pré-carregamento não interrompem a navegação nem as outras consultas.
      }
    }
  }));
  return results;
}

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

function useCatalogLocation(workTypes: PublicCatalogOptions["workTypes"]) {
  const [searchParams, setSearchParams] = useSearchParams();
  const serializedParams = searchParams.toString();
  const params = useMemo(() => readCatalogParams(new URLSearchParams(serializedParams)), [serializedParams]);
  const [searchTerm, setSearchTerm] = useState(params.urlTerm);

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
    if (key === "country" && value && params.typeId
      && !filterWorkTypesByCountry(workTypes, String(value)).some(type => type.id === params.typeId)) {
      next.delete("typeId");
    }
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
    updateParam,
    toggleCsvParam,
    changeTab,
    toggleTitleSort,
    clearFilters,
    changePage,
  };
}

function useCatalogOptions() {
  const scope = usePublicCatalogScope();
  const result = useQuery({
    queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "options"],
    queryFn: getPublicCatalogOptions,
  });

  return {
    options: result.data ?? EMPTY_OPTIONS,
    optionsLoading: result.isPending,
    optionsError: result.isError && !result.data,
    retryOptions: () => { void result.refetch(); },
  };
}

// Com um país escolhido, só os Tipos de Obra declarados pela API para ele continuam
// disponíveis; sem país, a lista completa é oferecida.
export function filterWorkTypesByCountry(
  workTypes: PublicCatalogOptions["workTypes"],
  country: string
) {
  if (!country) return workTypes;
  return workTypes.filter((workType) => (
    !workType.countries || workType.countries.length === 0 || workType.countries.includes(country)
  ));
}

function useCatalogResults(location: ReturnType<typeof useCatalogLocation>) {
  const scope = usePublicCatalogScope();
  const queryClient = useQueryClient();
  const workQuery = buildWorkQuery(location.params);
  const editionQuery = buildEditionQuery(location.params);

  const activeQuery = location.tab === "works" ? workQuery : editionQuery;
  const result = useQuery<PublicWorksResponse | PublicEditionsResponse>({
    queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, location.tab, activeQuery],
    queryFn: async () => location.tab === "works" ? listPublicWorks(workQuery) : listPublicEditions(editionQuery),
    placeholderData: (previousData, previousQuery) => previousQuery?.queryKey[2] === location.tab
      && sameQueryExceptOrder(previousQuery.queryKey[3], activeQuery) ? previousData : undefined,
  });
  const loading = useMinimumQueryLoading(JSON.stringify([location.tab, { ...activeQuery, page: undefined }]), result.isPending);

  useEffect(() => {
    const response = result.data;
    if (!response || result.isPlaceholderData) return undefined;

    // A busca permanece responsiva; os detalhes das páginas correspondentes e
    // parte dos volumes relacionados são preenchidos em segundo plano.
    const tasks = location.tab === "works" && "works" in response
      ? response.works.map((work) => async (): Promise<PrefetchVolumeRoute[]> => {
        const details = await queryClient.fetchQuery({
          queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "work", work.slug],
          queryFn: () => getPublicWorkDetails(work.slug),
        });
        return details.editions.flatMap((edition) => edition.volumes.map((volume) => ({
          workSlug: work.slug,
          editionNumber: edition.chronologicalNumber,
          volumeNumber: volume.number,
        })));
      })
      : "editions" in response
        ? response.editions.map((edition) => async (): Promise<PrefetchVolumeRoute[]> => {
          const workSlug = edition.work.slug;
          const editionNumber = edition.chronologicalNumber;
          const details = await queryClient.fetchQuery({
            queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "edition", workSlug, editionNumber],
            queryFn: async () => {
              const details = await getPublicEditionDetails(workSlug, editionNumber, { all: true });
              if (details.edition.work.slug !== workSlug || details.edition.chronologicalNumber !== editionNumber) {
                throw new Error("Edição não encontrada.");
              }
              return details;
            },
          });
          return details.volumes.map((volume) => ({ workSlug, editionNumber, volumeNumber: volume.number }));
        })
        : [];

    void (async () => {
      const volumeGroups = await runWithConcurrency(tasks, PREFETCH_CONCURRENCY, (task) => task());
      const uniqueVolumes = new Map<string, PrefetchVolumeRoute>();
      volumeGroups.forEach((group) => group?.forEach((volume) => {
        uniqueVolumes.set(`${volume.workSlug}/${volume.editionNumber}/${volume.volumeNumber}`, volume);
      }));
      // Limita o número de páginas de volume por busca para manter a carga em segundo plano previsível.
      const volumeRoutes = [...uniqueVolumes.values()].slice(0, PREFETCH_VOLUME_LIMIT);
      await runWithConcurrency(volumeRoutes, PREFETCH_CONCURRENCY, (volume) => queryClient.prefetchQuery({
        queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "volume", volume.workSlug, volume.editionNumber, volume.volumeNumber],
        queryFn: () => getPublicVolumeDetails(volume.workSlug, volume.editionNumber, volume.volumeNumber),
      }));
    })();
  }, [location.tab, queryClient, result.data, result.isPlaceholderData, scope]);

  const response = result.data;
  const fallback = location.tab === "works"
    ? "Não foi possível carregar as Obras."
    : "Não foi possível carregar as Edições.";

  return {
    works: response && "works" in response ? response.works : [] as PublicWorkSummary[],
    editions: response && "editions" in response ? response.editions : [] as PublicEditionSummary[],
    pagination: response ? { ...response.pagination, totalPages: Math.max(response.pagination.totalPages, 1) } : EMPTY_PAGINATION,
    loading,
    error: result.isError && !response ? getApiError(result.error, fallback) : "",
    refreshError: result.isError && response ? "Não foi possível atualizar o catálogo." : "",
    retryResults: () => { void result.refetch(); },
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
  const optionState = useCatalogOptions();
  const location = useCatalogLocation(optionState.options.workTypes);
  const resultState = useCatalogResults(location);
  const advancedFilters = useAdvancedFilters(location.searchParams);
  const workTypeOptions = useMemo(
    () => filterWorkTypesByCountry(optionState.options.workTypes, location.params.country),
    [location.params.country, optionState.options.workTypes]
  );
  return { ...location, ...optionState, ...resultState, ...advancedFilters, workTypeOptions };
}

export type PesquisaCatalog = ReturnType<typeof usePesquisaCatalog>;
