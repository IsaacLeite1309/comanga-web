import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowDownAZ, ArrowUpAZ, Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { MultiSelect } from "@/components/forms/MultiSelect";
import { SearchableSelect, type SelectOption } from "@/components/forms/SearchableSelect";
import { EmptyState, LoadingState } from "@/components/shared/AsyncState";
import { getApiError } from "@/lib/apiError";
import {
  getPublicCatalogOptions,
  listPublicEditions,
  listPublicWorks,
} from "@/features/public-catalog/publicCatalogService";
import type {
  CatalogOrder,
  EditionSort,
  PublicCatalogOptions,
  PublicCatalogTab,
  PublicEditionSummary,
  PublicPagination,
  PublicWorkSummary,
  WorkSort,
} from "@/features/public-catalog/publicCatalogTypes";
import { CatalogCover } from "@/features/public-catalog/CatalogCover";
import { CatalogPagination } from "@/features/public-catalog/CatalogPagination";
import { PublicWorkCard } from "@/features/public-catalog/PublicWorkCard";
import { formatPublicationStatus } from "@/features/public-catalog/publicCatalogFormatters";

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
  editionTypes: [],
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
  "editionTypeId",
  "formatId",
  "coverTypeId",
  "chronologicalNumber",
  "brazilPublicationStatus",
  "brazilPublicationStartYear",
  "brazilPublicationEndYear",
];
const WORK_ADVANCED_FILTER_KEYS = [
  "country",
  "demographics",
  "genreIds",
  "originalPublisherId",
  "serializationMagazineId",
  "originalPublicationStartYear",
  "originalPublicationEndYear",
];
const EDITION_ADVANCED_FILTER_KEYS = [
  "editionTypeId",
  "formatId",
  "coverTypeId",
  "chronologicalNumber",
  "brazilPublicationStartYear",
  "brazilPublicationEndYear",
];
const WORK_SORTS: WorkSort[] = ["title"];
const EDITION_SORTS: EditionSort[] = ["title"];

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
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
}

function numericCsvValues(value: string | null) {
  return csvValues(value).map(Number).filter((item) => Number.isInteger(item) && item > 0);
}

function resultCount(tab: PublicCatalogTab, total: number) {
  if (tab === "works") {
    return `${total} ${total === 1 ? "obra encontrada" : "obras encontradas"}`;
  }

  return `${total} ${total === 1 ? "edição encontrada" : "edições encontradas"}`;
}

function EditionCard({ edition }: { edition: PublicEditionSummary }) {
  const editionLabel = `${edition.chronologicalNumber}ª edição`;
  const metadata = `${editionLabel} · ${edition.brazilianPublisher.label}`;

  return (
    <article className="min-w-0">
      <CatalogCover
        key={edition.coverUrl || "empty"}
        src={edition.coverUrl}
        alt={`Capa da ${editionLabel} de ${edition.work.title}`}
      />
      <h2 className="mt-2 truncate text-sm font-bold text-foreground sm:text-base" title={edition.work.title}>
        {edition.work.title}
      </h2>
      <p className="mt-0.5 truncate text-xs text-muted-foreground" title={metadata}>{metadata}</p>
    </article>
  );
}

function FilterField({
  label,
  value,
  options,
  onChange,
  disabled,
  searchable = false,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  searchable?: boolean;
}) {
  return (
    <div className="min-w-0">
      <span
        className="block truncate text-xs font-bold uppercase tracking-wide text-foreground sm:whitespace-nowrap"
        title={label}
      >
        {label}
      </span>
      <SearchableSelect
        ariaLabel={label}
        value={value}
        options={options}
        onChange={onChange}
        disabled={disabled}
        searchable={searchable}
        searchPlaceholder=""
        placeholder="Todos"
        allowEmptyOption={false}
        clearable
        textSize="sm"
        tone="panel"
      />
    </div>
  );
}

const Pesquisa = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: PublicCatalogTab = searchParams.get("tab") === "editions" ? "editions" : "works";
  const urlTerm = searchParams.get("term") ?? "";
  const order: CatalogOrder = searchParams.get("order") === "DESC" ? "DESC" : "ASC";
  const page = positiveInteger(searchParams.get("page"));
  const requestedSort = searchParams.get("sortBy") ?? "title";
  const sortBy = tab === "works"
    ? (WORK_SORTS.includes(requestedSort as WorkSort) ? requestedSort as WorkSort : "title")
    : (EDITION_SORTS.includes(requestedSort as EditionSort) ? requestedSort as EditionSort : "title");
  const typeId = optionalInteger(searchParams.get("typeId"));
  const country = searchParams.get("country") ?? "";
  const demographicsParam = searchParams.get("demographics");
  const genreIdsParam = searchParams.get("genreIds");
  const demographics = useMemo(() => csvValues(demographicsParam), [demographicsParam]);
  const genreIds = useMemo(() => numericCsvValues(genreIdsParam), [genreIdsParam]);
  const originalPublisherId = optionalInteger(searchParams.get("originalPublisherId"));
  const serializationMagazineId = optionalInteger(searchParams.get("serializationMagazineId"));
  const originalPublicationStatus = searchParams.get("originalPublicationStatus") ?? "";
  const originalPublicationStartYear = optionalInteger(searchParams.get("originalPublicationStartYear"));
  const originalPublicationEndYear = optionalInteger(searchParams.get("originalPublicationEndYear"));
  const brazilianPublisherId = optionalInteger(searchParams.get("brazilianPublisherId"));
  const editionTypeId = optionalInteger(searchParams.get("editionTypeId"));
  const formatId = optionalInteger(searchParams.get("formatId"));
  const coverTypeId = optionalInteger(searchParams.get("coverTypeId"));
  const chronologicalNumber = optionalInteger(searchParams.get("chronologicalNumber"));
  const brazilPublicationStatus = searchParams.get("brazilPublicationStatus") ?? "";
  const brazilPublicationStartYear = optionalInteger(searchParams.get("brazilPublicationStartYear"));
  const brazilPublicationEndYear = optionalInteger(searchParams.get("brazilPublicationEndYear"));

  const [searchTerm, setSearchTerm] = useState(urlTerm);
  const [showFilters, setShowFilters] = useState(() => (
    [...WORK_ADVANCED_FILTER_KEYS, ...EDITION_ADVANCED_FILTER_KEYS]
      .some((key) => searchParams.has(key))
  ));
  const [options, setOptions] = useState<PublicCatalogOptions>(EMPTY_OPTIONS);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState(false);
  const [optionsRetry, setOptionsRetry] = useState(0);
  const [works, setWorks] = useState<PublicWorkSummary[]>([]);
  const [editions, setEditions] = useState<PublicEditionSummary[]>([]);
  const [pagination, setPagination] = useState<PublicPagination>(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const preserveResultsOnNextRequestRef = useRef(false);
  const hasLoadedResultsRef = useRef(false);
  const advancedFiltersRef = useRef<HTMLElement>(null);
  const advancedFiltersButtonRef = useRef<HTMLButtonElement>(null);

  const workQuery = useMemo(() => ({
    ...(urlTerm.trim() ? { term: urlTerm.trim() } : {}),
    ...(typeId ? { typeId } : {}),
    ...(country ? { country } : {}),
    ...(demographics.length ? { demographics } : {}),
    ...(genreIds.length ? { genreIds } : {}),
    ...(originalPublisherId ? { originalPublisherId } : {}),
    ...(serializationMagazineId ? { serializationMagazineId } : {}),
    ...(originalPublicationStatus ? { originalPublicationStatus } : {}),
    ...(originalPublicationStartYear ? { originalPublicationStartYear } : {}),
    ...(originalPublicationEndYear ? { originalPublicationEndYear } : {}),
    sortBy: sortBy as WorkSort,
    order,
    page,
    limit: PAGE_SIZE,
  }), [
    country,
    demographics,
    genreIds,
    order,
    originalPublicationEndYear,
    originalPublicationStartYear,
    originalPublicationStatus,
    originalPublisherId,
    page,
    serializationMagazineId,
    sortBy,
    typeId,
    urlTerm,
  ]);
  const editionQuery = useMemo(() => ({
    ...(urlTerm.trim() ? { term: urlTerm.trim() } : {}),
    ...(brazilianPublisherId ? { brazilianPublisherId } : {}),
    ...(editionTypeId ? { editionTypeId } : {}),
    ...(formatId ? { formatId } : {}),
    ...(coverTypeId ? { coverTypeId } : {}),
    ...(chronologicalNumber ? { chronologicalNumber } : {}),
    ...(brazilPublicationStatus ? { brazilPublicationStatus } : {}),
    ...(brazilPublicationStartYear ? { brazilPublicationStartYear } : {}),
    ...(brazilPublicationEndYear ? { brazilPublicationEndYear } : {}),
    sortBy: sortBy as EditionSort,
    order,
    page,
    limit: PAGE_SIZE,
  }), [
    brazilPublicationStatus,
    brazilPublicationEndYear,
    brazilPublicationStartYear,
    brazilianPublisherId,
    chronologicalNumber,
    coverTypeId,
    editionTypeId,
    formatId,
    order,
    page,
    sortBy,
    urlTerm,
  ]);

  useEffect(() => {
    const canonical = new URLSearchParams(searchParams);
    let changed = false;

    const defaults: Record<string, string> = {
      tab,
      sortBy,
      order,
      page: String(page),
    };

    Object.entries(defaults).forEach(([key, value]) => {
      if (canonical.get(key) === value) return;
      canonical.set(key, value);
      changed = true;
    });

    if (changed) setSearchParams(canonical, { replace: true });
  }, [order, page, searchParams, setSearchParams, sortBy, tab]);

  useEffect(() => {
    setSearchTerm(urlTerm);
  }, [urlTerm]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextTerm = searchTerm.trim();
      if (nextTerm === urlTerm) return;

      const next = new URLSearchParams(searchParams);
      if (nextTerm) next.set("term", nextTerm);
      else next.delete("term");
      next.set("page", "1");
      setSearchParams(next);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchParams, searchTerm, setSearchParams, urlTerm]);

  useEffect(() => {
    let active = true;
    setOptionsLoading(true);
    setOptionsError(false);

    getPublicCatalogOptions()
      .then((catalogOptions) => {
        if (active) setOptions({ ...EMPTY_OPTIONS, ...catalogOptions });
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
  }, [optionsRetry]);

  useEffect(() => {
    if (!showFilters) return undefined;

    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target as Node;
      if (advancedFiltersRef.current?.contains(target)) return;
      if (advancedFiltersButtonRef.current?.contains(target)) return;
      setShowFilters(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [showFilters]);

  useEffect(() => {
    let active = true;
    const preserveResults = preserveResultsOnNextRequestRef.current && hasLoadedResultsRef.current;
    preserveResultsOnNextRequestRef.current = false;
    if (!preserveResults) setLoading(true);
    setError("");

    const request = tab === "works" ? listPublicWorks(workQuery) : listPublicEditions(editionQuery);

    request
      .then((response) => {
        if (!active) return;

        if ("works" in response) {
          setWorks(response.works);
        } else {
          setEditions(response.editions);
        }
        setPagination({ ...response.pagination, totalPages: Math.max(response.pagination.totalPages, 1) });
        hasLoadedResultsRef.current = true;
      })
      .catch((requestError) => {
        if (!active) return;
        const fallback = tab === "works"
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
  }, [editionQuery, retry, tab, workQuery]);

  function updateParam(key: string, value: string | number | undefined) {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === "") next.delete(key);
    else next.set(key, String(value));
    next.set("page", "1");
    setSearchParams(next);
  }

  function toggleCsvParam(key: string, currentValues: Array<string | number>, value: string | number) {
    const selected = currentValues.includes(value);
    const nextValues = selected
      ? currentValues.filter((current) => current !== value)
      : [...currentValues, value];
    updateParam(key, nextValues.length ? nextValues.join(",") : undefined);
  }

  function changeTab(nextTab: PublicCatalogTab) {
    if (nextTab === tab) return;

    const next = new URLSearchParams(searchParams);
    next.set("tab", nextTab);
    const visibleTerm = searchTerm.trim();
    if (visibleTerm) next.set("term", visibleTerm);
    else next.delete("term");

    const incompatibleKeys = nextTab === "works" ? EDITION_FILTER_KEYS : WORK_FILTER_KEYS;
    incompatibleKeys.forEach((key) => next.delete(key));

    const nextSort = sortBy === "title" || sortBy === "createdAt" ? sortBy : "title";
    next.set("sortBy", nextSort);
    next.set("order", order);
    next.set("page", "1");
    setSearchParams(next);
  }

  function toggleTitleSort() {
    preserveResultsOnNextRequestRef.current = true;
    const next = new URLSearchParams(searchParams);
    next.set("sortBy", "title");
    next.set("order", order === "ASC" ? "DESC" : "ASC");
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

  function changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  }

  const typeOptions: SelectOption[] = options.workTypes;
  const countryOptions: SelectOption[] = options.countries.map((item) => ({ id: item, label: item }));
  const demographicOptions: SelectOption[] = options.demographics.map((item) => ({ id: item, label: item }));
  const genreOptions: SelectOption[] = options.genres;
  const originalPublisherOptions: SelectOption[] = options.originalPublishers;
  const serializationMagazineOptions: SelectOption[] = options.serializationMagazines;
  const originalPublicationStatusOptions: SelectOption[] = options.originalPublicationStatuses.map((item) => ({
    id: item,
    label: formatPublicationStatus(item),
  }));
  const publisherOptions: SelectOption[] = options.brazilianPublishers;
  const brazilPublicationStatusOptions: SelectOption[] = options.brazilPublicationStatuses.map((item) => ({
    id: item,
    label: formatPublicationStatus(item),
  }));
  const editionTypeOptions: SelectOption[] = options.editionTypes;
  const formatOptions: SelectOption[] = options.formats;
  const coverTypeOptions: SelectOption[] = options.coverTypes;
  const editionNumberOptions: SelectOption[] = Array.from({ length: 10 }, (_, index) => ({
    id: String(index + 1),
    label: `${index + 1}ª edição`,
  }));
  const lastPublicationYear = new Date().getFullYear() + 1;
  const publicationYearOptions: SelectOption[] = Array.from({ length: lastPublicationYear - 1899 }, (_, index) => {
    const year = lastPublicationYear - index;
    return { id: String(year), label: String(year) };
  });
  const advancedFilterCount = tab === "works"
    ? demographics.length
      + genreIds.length
      + Number(Boolean(country))
      + Number(Boolean(originalPublisherId))
      + Number(Boolean(serializationMagazineId))
      + Number(Boolean(originalPublicationStartYear))
      + Number(Boolean(originalPublicationEndYear))
    : Number(Boolean(editionTypeId))
      + Number(Boolean(formatId))
      + Number(Boolean(coverTypeId))
      + Number(Boolean(chronologicalNumber))
      + Number(Boolean(brazilPublicationStartYear))
      + Number(Boolean(brazilPublicationEndYear));
  const currentItems = tab === "works" ? works : editions;
  const hasResults = currentItems.length > 0;
  const SortIcon = order === "ASC" ? ArrowDownAZ : ArrowUpAZ;

  return (
    <div className="min-w-0 flex-1 px-4 pb-7 pt-6 sm:px-6 sm:pb-9 sm:pt-7 xl:px-10 xl:pt-3">
      <div className="mx-auto w-full max-w-[100rem]">
        <div className="relative z-30">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <div className="inline-flex h-12 min-w-0 w-full rounded-xl border border-sidebar-foreground/30 bg-sidebar p-1 sm:w-auto sm:flex-none" role="tablist" aria-label="Tipo de resultado">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "works"}
              onClick={() => changeTab("works")}
              className={`inline-flex h-10 flex-1 items-center justify-center rounded-lg px-5 text-sm font-bold transition-colors sm:flex-none ${tab === "works" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-sidebar-accent"}`}
            >
              Obras
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "editions"}
              onClick={() => changeTab("editions")}
              className={`inline-flex h-10 flex-1 items-center justify-center rounded-lg px-5 text-sm font-bold transition-colors sm:flex-none ${tab === "editions" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-sidebar-accent"}`}
            >
              Edições
            </button>
          </div>

          <label className="relative block min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground" aria-hidden="true" />
            <input
              type="search"
              aria-label="Pesquisar no catálogo"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Pesquise por título ou autor"
              className="catalog-search-input h-12 w-full appearance-none rounded-xl border border-sidebar-foreground/35 bg-sidebar pl-12 pr-12 text-sm font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            {searchTerm ? (
              <button
                type="button"
                aria-label="Limpar pesquisa"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </label>

          <div className="grid w-full min-w-0 grid-cols-2 items-end gap-3 sm:flex sm:w-auto sm:flex-wrap xl:flex-nowrap">
              {tab === "works" ? (
                <>
                  <div className="min-w-0 sm:w-[13.5rem] sm:shrink-0">
                    <span className="block truncate text-xs font-bold uppercase tracking-wide text-foreground" title="Tipo de Obra">Tipo de Obra</span>
                    <SearchableSelect
                      ariaLabel="Tipo de Obra"
                      value={typeId ? String(typeId) : ""}
                      options={typeOptions}
                      onChange={(value) => updateParam("typeId", value)}
                      disabled={optionsLoading}
                      searchPlaceholder=""
                      placeholder="Todos"
                      allowEmptyOption={false}
                      clearable
                      tone="sidebar"
                      textSize="sm"
                      className="mt-2 w-full"
                    />
                  </div>
                  <div className="min-w-0 sm:w-[13.5rem] sm:shrink-0">
                    <span className="block truncate text-xs font-bold uppercase tracking-wide text-foreground" title="Status Original">Status Original</span>
                    <SearchableSelect
                      ariaLabel="Status Original"
                      value={originalPublicationStatus}
                      options={originalPublicationStatusOptions}
                      onChange={(value) => updateParam("originalPublicationStatus", value)}
                      disabled={optionsLoading}
                      searchPlaceholder=""
                      placeholder="Todos"
                      allowEmptyOption={false}
                      clearable
                      tone="sidebar"
                      textSize="sm"
                      className="mt-2 w-full"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="min-w-0 sm:w-[13.5rem] sm:shrink-0">
                    <span className="block truncate text-xs font-bold uppercase tracking-wide text-foreground" title="Editora brasileira">Editora brasileira</span>
                    <SearchableSelect
                      ariaLabel="Editora brasileira"
                      value={brazilianPublisherId ? String(brazilianPublisherId) : ""}
                      options={publisherOptions}
                      onChange={(value) => updateParam("brazilianPublisherId", value)}
                      disabled={optionsLoading}
                      searchable
                      searchPlaceholder=""
                      placeholder="Todos"
                      allowEmptyOption={false}
                      clearable
                      tone="sidebar"
                      textSize="sm"
                      className="mt-2 w-full"
                    />
                  </div>
                  <div className="min-w-0 sm:w-[13.5rem] sm:shrink-0">
                    <span className="block truncate text-xs font-bold uppercase tracking-wide text-foreground" title="Status no Brasil">Status no Brasil</span>
                    <SearchableSelect
                      ariaLabel="Status no Brasil"
                      value={brazilPublicationStatus}
                      options={brazilPublicationStatusOptions}
                      onChange={(value) => updateParam("brazilPublicationStatus", value)}
                      disabled={optionsLoading}
                      searchPlaceholder=""
                      placeholder="Todos"
                      allowEmptyOption={false}
                      clearable
                      tone="sidebar"
                      textSize="sm"
                      className="mt-2 w-full"
                    />
                  </div>
                </>
              )}
              <button
                ref={advancedFiltersButtonRef}
                type="button"
                aria-label={advancedFilterCount > 0 ? `Filtros avançados (${advancedFilterCount} ativos)` : "Filtros avançados"}
                aria-expanded={showFilters}
                onClick={() => setShowFilters((visible) => !visible)}
                className={`col-span-2 inline-flex h-12 w-full shrink-0 items-center justify-center rounded-xl border bg-sidebar text-foreground transition-colors hover:border-primary sm:col-auto sm:w-12 sm:justify-self-end ${showFilters ? "border-primary" : "border-sidebar-foreground/35"}`}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              </button>
          </div>
          </div>

          {showFilters ? (
            <section
              ref={advancedFiltersRef}
              className="static z-50 mt-4 w-full rounded-2xl border border-sidebar-foreground/30 bg-sidebar p-4 sm:absolute sm:right-0 sm:top-full sm:w-[32.5rem]"
              aria-label="Filtros avançados"
            >
            {tab === "works" ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-[13.5rem_13.5rem] sm:gap-3">
                <FilterField
                  label="País de Origem"
                  value={country}
                  options={countryOptions}
                  onChange={(value) => updateParam("country", value)}
                  disabled={optionsLoading}
                />
                <FilterField
                  label="Editora original"
                  value={originalPublisherId ? String(originalPublisherId) : ""}
                  options={originalPublisherOptions}
                  onChange={(value) => updateParam("originalPublisherId", value)}
                  disabled={optionsLoading}
                  searchable
                />
                <FilterField
                  label="Pré-publicação"
                  value={serializationMagazineId ? String(serializationMagazineId) : ""}
                  options={serializationMagazineOptions}
                  onChange={(value) => updateParam("serializationMagazineId", value)}
                  disabled={optionsLoading}
                  searchable
                />
                <MultiSelect
                  label="Demografia"
                  options={demographicOptions}
                  selectedIds={demographics}
                  onToggle={(value) => toggleCsvParam("demographics", demographics, String(value))}
                  disabled={optionsLoading}
                  placeholder="Todos"
                  searchPlaceholder=""
                  onClear={() => updateParam("demographics", undefined)}
                  textSize="sm"
                  tone="panel"
                />
                <FilterField
                  label="Início da publicação original"
                  value={originalPublicationStartYear ? String(originalPublicationStartYear) : ""}
                  options={publicationYearOptions}
                  onChange={(value) => updateParam("originalPublicationStartYear", value)}
                  searchable
                />
                <FilterField
                  label="Fim da publicação original"
                  value={originalPublicationEndYear ? String(originalPublicationEndYear) : ""}
                  options={publicationYearOptions}
                  onChange={(value) => updateParam("originalPublicationEndYear", value)}
                  searchable
                />
                <MultiSelect
                  label="Gêneros"
                  options={genreOptions}
                  selectedIds={genreIds}
                  onToggle={(value) => toggleCsvParam("genreIds", genreIds, Number(value))}
                  disabled={optionsLoading}
                  searchable
                  placeholder="Todos"
                  searchPlaceholder=""
                  onClear={() => updateParam("genreIds", undefined)}
                  textSize="sm"
                  tone="panel"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-[13.5rem_13.5rem] sm:gap-3">
                <FilterField
                  label="Número da edição"
                  value={chronologicalNumber ? String(chronologicalNumber) : ""}
                  options={editionNumberOptions}
                  onChange={(value) => updateParam("chronologicalNumber", value)}
                />
                <FilterField
                  label="Tipo de Edição"
                  value={editionTypeId ? String(editionTypeId) : ""}
                  options={editionTypeOptions}
                  onChange={(value) => updateParam("editionTypeId", value)}
                  disabled={optionsLoading}
                  searchable
                />
                <FilterField
                  label="Acabamento"
                  value={coverTypeId ? String(coverTypeId) : ""}
                  options={coverTypeOptions}
                  onChange={(value) => updateParam("coverTypeId", value)}
                  disabled={optionsLoading}
                />
                <FilterField
                  label="Formato"
                  value={formatId ? String(formatId) : ""}
                  options={formatOptions}
                  onChange={(value) => updateParam("formatId", value)}
                  disabled={optionsLoading}
                />
                <FilterField
                  label="Início da publicação no Brasil"
                  value={brazilPublicationStartYear ? String(brazilPublicationStartYear) : ""}
                  options={publicationYearOptions}
                  onChange={(value) => updateParam("brazilPublicationStartYear", value)}
                  searchable
                />
                <FilterField
                  label="Fim da publicação no Brasil"
                  value={brazilPublicationEndYear ? String(brazilPublicationEndYear) : ""}
                  options={publicationYearOptions}
                  onChange={(value) => updateParam("brazilPublicationEndYear", value)}
                  searchable
                />
              </div>
            )}

            <div className="mt-4 flex flex-col items-start justify-between gap-3 border-t border-sidebar-foreground/30 pt-4 sm:flex-row sm:items-center">
              {optionsError ? (
                <p className="text-sm font-semibold text-red-400">Não foi possível carregar as opções de filtro.</p>
              ) : (
                <p className="text-xs text-sidebar-foreground">Os filtros selecionados são combinados entre si.</p>
              )}
              <div className="flex gap-2">
                {optionsError ? (
                  <button
                    type="button"
                    onClick={() => setOptionsRetry((current) => current + 1)}
                    className="rounded-lg border border-sidebar-foreground/35 px-3 py-2 text-sm font-bold text-foreground hover:border-primary hover:text-primary"
                  >
                    Recarregar opções
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label="Limpar todos os filtros"
                  onClick={clearFilters}
                  className="rounded-lg border border-sidebar-foreground/35 bg-background px-3 py-2 text-sm font-bold text-foreground hover:border-primary hover:text-primary"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
            </section>
          ) : null}
        </div>

        {!error ? (
          <div className="mt-7 flex min-h-5 items-center gap-3 text-sm text-primary">
            {loading ? (
              <span data-testid="results-divider" className="h-px flex-1 bg-border" aria-hidden="true" />
            ) : (
              <>
                <span className="shrink-0">{resultCount(tab, pagination.total)}</span>
                <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />
                <button
                  type="button"
                  onClick={toggleTitleSort}
                  aria-label={order === "ASC" ? "Ordenar por título de Z a A" : "Ordenar por título de A a Z"}
                  className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  Título
                  <SortIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <span data-testid="results-divider" className="h-px flex-1 bg-border" aria-hidden="true" />
              </>
            )}
          </div>
        ) : null}

        <div className="mt-6">
          {loading ? (
            <LoadingState message={tab === "works" ? "Carregando Obras..." : "Carregando Edições..."} />
          ) : error ? (
            <div className="flex flex-col items-center rounded-2xl border border-red-500/30 bg-sidebar px-4 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-red-400" aria-hidden="true" />
              <p className="mt-3 font-semibold text-red-300">{error}</p>
              <button
                type="button"
                onClick={() => setRetry((current) => current + 1)}
                className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                Tentar novamente
              </button>
            </div>
          ) : !hasResults ? (
            <div className="rounded-2xl border border-sidebar-foreground/30 bg-sidebar">
              <EmptyState message={tab === "works" ? "Nenhuma Obra encontrada." : "Nenhuma Edição encontrada."} />
              <div className="flex justify-center px-4 pb-10">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          ) : (
            <>
              <section className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" aria-label={tab === "works" ? "Obras encontradas" : "Edições encontradas"}>
                {tab === "works"
                  ? works.map((work) => <PublicWorkCard key={work.id} work={work} showAuthors={false} />)
                  : editions.map((edition) => <EditionCard key={edition.id} edition={edition} />)}
              </section>
              <CatalogPagination pagination={pagination} onPageChange={changePage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pesquisa;
