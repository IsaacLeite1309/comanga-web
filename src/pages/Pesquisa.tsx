import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Box,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  SlidersHorizontal,
} from "lucide-react";
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

const PAGE_SIZE = 24;
const EMPTY_OPTIONS: PublicCatalogOptions = {
  workTypes: [],
  countries: [],
  demographics: [],
  genres: [],
  brazilianPublishers: [],
  formats: [],
  coverTypes: [],
};
const EMPTY_PAGINATION: PublicPagination = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};
const WORK_FILTER_KEYS = ["typeId", "country", "demographics", "genreIds"];
const EDITION_FILTER_KEYS = ["brazilianPublisherId", "formatId", "coverTypeId"];
const WORK_SORTS: WorkSort[] = ["title", "originalTitle", "createdAt"];
const EDITION_SORTS: EditionSort[] = ["title", "chronologicalNumber", "createdAt"];

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

function joinAuthors(authors: Array<{ label: string }>) {
  return authors.length > 0 ? authors.map((author) => author.label).join(", ") : "Autor não informado";
}

function resultCount(tab: PublicCatalogTab, total: number) {
  if (tab === "works") {
    return `${total} ${total === 1 ? "obra encontrada" : "obras encontradas"}`;
  }

  return `${total} ${total === 1 ? "edição encontrada" : "edições encontradas"}`;
}

function volumesCount(total: number) {
  return `${total} ${total === 1 ? "Volume" : "Volumes"}`;
}

function CatalogCover({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="aspect-[2/3] overflow-hidden rounded-lg border border-border bg-input shadow-sm">
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center text-sm font-semibold text-muted-foreground">
          <BookOpen className="h-8 w-8" aria-hidden="true" />
          <span>Sem capa</span>
        </div>
      )}
    </div>
  );
}

function WorkCard({ work }: { work: PublicWorkSummary }) {
  const metadata = [work.type?.label, work.country].filter(Boolean).join(" · ");

  return (
    <article className="min-w-0">
      <CatalogCover key={work.coverUrl || "empty"} src={work.coverUrl} alt={`Capa de ${work.title}`} />
      <h2 className="mt-2 truncate text-sm font-bold text-foreground sm:text-base" title={work.title}>
        {work.title}
      </h2>
      <p className="truncate text-xs font-medium text-muted-foreground" title={joinAuthors(work.authors)}>
        {joinAuthors(work.authors)}
      </p>
      {metadata ? (
        <p className="mt-0.5 truncate text-xs text-muted-foreground" title={metadata}>{metadata}</p>
      ) : null}
    </article>
  );
}

function EditionCard({ edition }: { edition: PublicEditionSummary }) {
  const editionLabel = `${edition.chronologicalNumber}ª Edição`;

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
      <p className="text-xs font-semibold text-primary">{editionLabel}</p>
      <p className="truncate text-xs font-medium text-muted-foreground" title={edition.brazilianPublisher.label}>
        {edition.brazilianPublisher.label}
      </p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{volumesCount(edition.volumesCount)}</p>
      <p className="truncate text-xs text-muted-foreground">
        {edition.format.label} · {edition.coverType.label}
      </p>
    </article>
  );
}

function FilterField({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="min-w-0">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      <SearchableSelect
        ariaLabel={label}
        value={value}
        options={options}
        onChange={onChange}
        disabled={disabled}
        searchable={options.length > 8}
        placeholder="Todos"
      />
    </div>
  );
}

function Pagination({
  pagination,
  onPageChange,
}: {
  pagination: PublicPagination;
  onPageChange: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;

  return (
    <nav className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row" aria-label="Paginação do catálogo">
      <button
        type="button"
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={pagination.page <= 1}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-input px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Anterior
      </button>
      <span className="min-w-28 text-center text-sm font-semibold text-muted-foreground">
        Página {pagination.page} de {pagination.totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={pagination.page >= pagination.totalPages}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-input px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        Próxima
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
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
  const brazilianPublisherId = optionalInteger(searchParams.get("brazilianPublisherId"));
  const formatId = optionalInteger(searchParams.get("formatId"));
  const coverTypeId = optionalInteger(searchParams.get("coverTypeId"));

  const [searchTerm, setSearchTerm] = useState(urlTerm);
  const [showFilters, setShowFilters] = useState(() => (
    [...WORK_FILTER_KEYS, ...EDITION_FILTER_KEYS].some((key) => searchParams.has(key))
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

  const workQuery = useMemo(() => ({
    ...(urlTerm.trim() ? { term: urlTerm.trim() } : {}),
    ...(typeId ? { typeId } : {}),
    ...(country ? { country } : {}),
    ...(demographics.length ? { demographics } : {}),
    ...(genreIds.length ? { genreIds } : {}),
    sortBy: sortBy as WorkSort,
    order,
    page,
    limit: PAGE_SIZE,
  }), [country, demographics, genreIds, order, page, sortBy, typeId, urlTerm]);
  const editionQuery = useMemo(() => ({
    ...(urlTerm.trim() ? { term: urlTerm.trim() } : {}),
    ...(brazilianPublisherId ? { brazilianPublisherId } : {}),
    ...(formatId ? { formatId } : {}),
    ...(coverTypeId ? { coverTypeId } : {}),
    sortBy: sortBy as EditionSort,
    order,
    page,
    limit: PAGE_SIZE,
  }), [brazilianPublisherId, coverTypeId, formatId, order, page, sortBy, urlTerm]);

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
    let active = true;
    setLoading(true);
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

  function changeSort(value: string) {
    const [nextSort, nextOrder] = value.split(":") as [WorkSort | EditionSort, CatalogOrder];
    const next = new URLSearchParams(searchParams);
    next.set("sortBy", nextSort);
    next.set("order", nextOrder);
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
  const publisherOptions: SelectOption[] = options.brazilianPublishers;
  const formatOptions: SelectOption[] = options.formats;
  const coverTypeOptions: SelectOption[] = options.coverTypes;
  const activeFilterCount = tab === "works"
    ? Number(Boolean(typeId)) + Number(Boolean(country)) + demographics.length + genreIds.length
    : Number(Boolean(brazilianPublisherId)) + Number(Boolean(formatId)) + Number(Boolean(coverTypeId));
  const currentItems = tab === "works" ? works : editions;
  const hasResults = currentItems.length > 0;
  const sortOptions = tab === "works"
    ? [
        { value: "title:ASC", label: "Título: A–Z" },
        { value: "title:DESC", label: "Título: Z–A" },
        { value: "originalTitle:ASC", label: "Título original: A–Z" },
        { value: "originalTitle:DESC", label: "Título original: Z–A" },
        { value: "createdAt:DESC", label: "Mais recentes" },
        { value: "createdAt:ASC", label: "Mais antigas" },
      ]
    : [
        { value: "title:ASC", label: "Título: A–Z" },
        { value: "title:DESC", label: "Título: Z–A" },
        { value: "chronologicalNumber:ASC", label: "Número da edição: crescente" },
        { value: "chronologicalNumber:DESC", label: "Número da edição: decrescente" },
        { value: "createdAt:DESC", label: "Mais recentes" },
        { value: "createdAt:ASC", label: "Mais antigas" },
      ];

  return (
    <div className="min-w-0 flex-1 px-4 py-7 sm:px-6 sm:py-9 xl:px-10">
      <div className="mx-auto w-full max-w-[100rem]">
        <header>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Pesquisar</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Explore o catálogo completo de obras e edições
          </p>
        </header>

        <label className="relative mt-8 block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            aria-label="Pesquisar no catálogo"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Pesquisar mangás, autores, editoras..."
            className="h-14 w-full rounded-2xl border border-border bg-input pl-12 pr-4 text-base font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </label>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex w-full rounded-xl border border-border bg-card p-1 md:w-auto" role="tablist" aria-label="Tipo de resultado">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "works"}
              onClick={() => changeTab("works")}
              className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold transition-colors md:flex-none ${tab === "works" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Obras
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "editions"}
              onClick={() => changeTab("editions")}
              className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold transition-colors md:flex-none ${tab === "editions" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Box className="h-4 w-4" aria-hidden="true" />
              Edições
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:flex">
            <label className="relative">
              <span className="sr-only">Ordenar resultados</span>
              <select
                aria-label="Ordenar resultados"
                value={`${sortBy}:${order}`}
                onChange={(event) => changeSort(event.target.value)}
                className="h-12 w-full appearance-none rounded-xl border border-border bg-input py-2 pl-4 pr-10 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30 md:w-60"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            </label>
            <button
              type="button"
              aria-expanded={showFilters}
              onClick={() => setShowFilters((visible) => !visible)}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors ${showFilters ? "border-primary bg-primary/10 text-primary" : "border-border bg-input text-foreground hover:border-primary hover:text-primary"}`}
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
              Filtros Avançados
              {activeFilterCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {showFilters ? (
          <section className="mt-4 rounded-2xl border border-border bg-card p-4" aria-label="Filtros avançados">
            {tab === "works" ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <FilterField
                  label="Tipo"
                  value={typeId ? String(typeId) : ""}
                  options={typeOptions}
                  onChange={(value) => updateParam("typeId", value)}
                  disabled={optionsLoading}
                />
                <FilterField
                  label="País"
                  value={country}
                  options={countryOptions}
                  onChange={(value) => updateParam("country", value)}
                  disabled={optionsLoading}
                />
                <MultiSelect
                  label="Demografias"
                  options={demographicOptions}
                  selectedIds={demographics}
                  onToggle={(value) => toggleCsvParam("demographics", demographics, String(value))}
                  disabled={optionsLoading}
                  searchable={demographicOptions.length > 8}
                />
                <MultiSelect
                  label="Gêneros"
                  options={genreOptions}
                  selectedIds={genreIds}
                  onToggle={(value) => toggleCsvParam("genreIds", genreIds, Number(value))}
                  disabled={optionsLoading}
                  searchable
                />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <FilterField
                  label="Editora brasileira"
                  value={brazilianPublisherId ? String(brazilianPublisherId) : ""}
                  options={publisherOptions}
                  onChange={(value) => updateParam("brazilianPublisherId", value)}
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
                  label="Acabamento"
                  value={coverTypeId ? String(coverTypeId) : ""}
                  options={coverTypeOptions}
                  onChange={(value) => updateParam("coverTypeId", value)}
                  disabled={optionsLoading}
                />
              </div>
            )}

            <div className="mt-4 flex flex-col items-start justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
              {optionsError ? (
                <p className="text-sm font-semibold text-red-400">Não foi possível carregar as opções de filtro.</p>
              ) : (
                <p className="text-xs text-muted-foreground">Os filtros selecionados são combinados entre si.</p>
              )}
              <div className="flex gap-2">
                {optionsError ? (
                  <button
                    type="button"
                    onClick={() => setOptionsRetry((current) => current + 1)}
                    className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-foreground hover:border-primary hover:text-primary"
                  >
                    Recarregar opções
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label="Limpar todos os filtros"
                  onClick={clearFilters}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-foreground hover:border-primary hover:text-primary"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {!loading && !error ? (
          <div className="mt-7 flex items-center gap-3 text-sm text-primary">
            <span className="shrink-0">{resultCount(tab, pagination.total)}</span>
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
          </div>
        ) : null}

        <div className="mt-6">
          {loading ? (
            <LoadingState message={tab === "works" ? "Carregando Obras..." : "Carregando Edições..."} />
          ) : error ? (
            <div className="flex flex-col items-center rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-12 text-center">
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
            <div className="rounded-2xl border border-border bg-card">
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
                  ? works.map((work) => <WorkCard key={work.id} work={work} />)
                  : editions.map((edition) => <EditionCard key={edition.id} edition={edition} />)}
              </section>
              <Pagination pagination={pagination} onPageChange={changePage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pesquisa;
