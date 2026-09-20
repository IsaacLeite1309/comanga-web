import { AlertCircle, ArrowDownAZ, ArrowUpAZ, Search, SlidersHorizontal, X } from "lucide-react";
import { Link } from "react-router-dom";
import { MultiSelect } from "@/components/forms/MultiSelect";
import { SearchableSelect, type SelectOption } from "@/components/forms/SearchableSelect";
import { EmptyState, LoadingState } from "@/components/shared/AsyncState";
import { CatalogCover } from "@/features/public-catalog/CatalogCover";
import { CatalogPagination } from "@/features/public-catalog/CatalogPagination";
import { PublicWorkCard } from "@/features/public-catalog/PublicWorkCard";
import { formatPublicationStatus } from "@/features/public-catalog/publicCatalogFormatters";
import type { PublicCatalogTab, PublicEditionSummary } from "@/features/public-catalog/publicCatalogTypes";
import {
  advancedFilterCount,
  type PesquisaCatalog,
  usePesquisaCatalog,
} from "@/features/public-catalog/pages/usePesquisaCatalog";

const EDITION_NUMBER_OPTIONS: SelectOption[] = Array.from({ length: 10 }, (_, index) => ({
  id: String(index + 1),
  label: `${index + 1}ª edição`,
}));
const LAST_PUBLICATION_YEAR = new Date().getFullYear() + 1;
const PUBLICATION_YEAR_OPTIONS: SelectOption[] = Array.from(
  { length: LAST_PUBLICATION_YEAR - 1899 },
  (_, index) => {
    const year = LAST_PUBLICATION_YEAR - index;
    return { id: String(year), label: String(year) };
  },
);

function resultCount(tab: PublicCatalogTab, total: number) {
  if (tab === "works") return `${total} ${total === 1 ? "obra encontrada" : "obras encontradas"}`;
  return `${total} ${total === 1 ? "edição encontrada" : "edições encontradas"}`;
}

function stringOptions(items: string[]): SelectOption[] {
  return items.map((item) => ({ id: item, label: item }));
}

function statusOptions(items: string[]): SelectOption[] {
  return items.map((item) => ({ id: item, label: formatPublicationStatus(item) }));
}

function EditionCard({ edition }: { edition: PublicEditionSummary }) {
  const editionLabel = `${edition.chronologicalNumber}ª edição`;
  const metadata = `${editionLabel} · ${edition.brazilianPublisher.label}`;
  return (
    <article className="min-w-0">
      <Link
        to={`/obras/${encodeURIComponent(edition.work.slug)}/edicao/${edition.id}`}
        aria-label={`Ver detalhes da ${editionLabel} de ${edition.work.title}`}
        className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <CatalogCover
          key={edition.coverUrl || "empty"}
          src={edition.coverUrl}
          alt={`Capa da ${editionLabel} de ${edition.work.title}`}
          className="transition-transform group-hover:-translate-y-1"
        />
        <h2 className="mt-2 truncate text-sm font-bold text-foreground group-hover:text-primary sm:text-base" title={edition.work.title}>
          {edition.work.title}
        </h2>
        <p className="mt-0.5 truncate text-xs text-muted-foreground" title={metadata}>{metadata}</p>
      </Link>
    </article>
  );
}

interface FilterFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  searchable?: boolean;
}

function FilterField({ label, value, options, onChange, disabled, searchable = false }: FilterFieldProps) {
  return (
    <div className="min-w-0">
      <span className="block truncate text-xs font-bold uppercase tracking-wide text-foreground sm:whitespace-nowrap" title={label}>
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

function TabSelector({ catalog }: { catalog: PesquisaCatalog }) {
  return (
    <div className="inline-flex h-12 min-w-0 w-full rounded-full border border-sidebar-foreground/30 bg-sidebar p-1 sm:w-auto sm:flex-none" role="tablist" aria-label="Tipo de resultado">
      {(["works", "editions"] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={catalog.tab === tab}
          onClick={() => catalog.changeTab(tab)}
          className={`inline-flex h-full flex-1 items-center justify-center rounded-full px-5 text-sm font-semibold transition-all sm:flex-none ${catalog.tab === tab ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-sidebar-accent"}`}
        >
          {tab === "works" ? "Obras" : "Edições"}
        </button>
      ))}
    </div>
  );
}

function SearchInput({ catalog }: { catalog: PesquisaCatalog }) {
  return (
    <label className="relative block min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground" aria-hidden="true" />
      <input
        type="search"
        aria-label="Pesquisar no catálogo"
        value={catalog.searchTerm}
        onChange={(event) => catalog.setSearchTerm(event.target.value)}
        placeholder="Pesquise por título ou autor"
        className="catalog-search-input h-12 w-full appearance-none rounded-xl border border-sidebar-foreground/35 bg-sidebar pl-12 pr-12 text-sm font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
      {catalog.searchTerm ? (
        <button type="button" aria-label="Limpar pesquisa" onClick={() => catalog.setSearchTerm("")} className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </label>
  );
}

function PrimaryFilter({ label, value, options, onChange, disabled, searchable = false }: FilterFieldProps) {
  return (
    <div className="min-w-0 sm:w-[13.5rem] sm:shrink-0">
      <span className="block truncate text-xs font-bold uppercase tracking-wide text-foreground" title={label}>{label}</span>
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
        tone="sidebar"
        textSize="sm"
        className="mt-2 w-full"
      />
    </div>
  );
}

function WorkPrimaryFilters({ catalog }: { catalog: PesquisaCatalog }) {
  return (
    <>
      <PrimaryFilter
        label="Tipo de Obra"
        value={catalog.typeId ? String(catalog.typeId) : ""}
        options={catalog.options.workTypes}
        onChange={(value) => catalog.updateParam("typeId", value)}
        disabled={catalog.optionsLoading}
      />
      <PrimaryFilter
        label="Status Original"
        value={catalog.originalPublicationStatus}
        options={statusOptions(catalog.options.originalPublicationStatuses)}
        onChange={(value) => catalog.updateParam("originalPublicationStatus", value)}
        disabled={catalog.optionsLoading}
      />
    </>
  );
}

function EditionPrimaryFilters({ catalog }: { catalog: PesquisaCatalog }) {
  return (
    <>
      <PrimaryFilter
        label="Editora brasileira"
        value={catalog.brazilianPublisherId ? String(catalog.brazilianPublisherId) : ""}
        options={catalog.options.brazilianPublishers}
        onChange={(value) => catalog.updateParam("brazilianPublisherId", value)}
        disabled={catalog.optionsLoading}
        searchable
      />
      <PrimaryFilter
        label="Status no Brasil"
        value={catalog.brazilPublicationStatus}
        options={statusOptions(catalog.options.brazilPublicationStatuses)}
        onChange={(value) => catalog.updateParam("brazilPublicationStatus", value)}
        disabled={catalog.optionsLoading}
      />
    </>
  );
}

function PrimaryFilters({ catalog }: { catalog: PesquisaCatalog }) {
  const count = advancedFilterCount(catalog);
  return (
    <div className="grid w-full min-w-0 grid-cols-2 items-end gap-3 sm:flex sm:w-auto sm:flex-wrap xl:flex-nowrap">
      {catalog.tab === "works" ? <WorkPrimaryFilters catalog={catalog} /> : <EditionPrimaryFilters catalog={catalog} />}
      <button
        ref={catalog.buttonRef}
        type="button"
        aria-label={count > 0 ? `Filtros avançados (${count} ativos)` : "Filtros avançados"}
        aria-expanded={catalog.showFilters}
        onClick={() => catalog.setShowFilters((visible) => !visible)}
        className={`col-span-2 inline-flex h-12 w-full shrink-0 items-center justify-center rounded-xl border bg-sidebar text-foreground transition-colors hover:border-primary sm:col-auto sm:w-12 sm:justify-self-end ${catalog.showFilters ? "border-primary" : "border-sidebar-foreground/35"}`}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function WorkAdvancedFilters({ catalog }: { catalog: PesquisaCatalog }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-[13.5rem_13.5rem] sm:gap-3">
      <FilterField
        label="País de Origem"
        value={catalog.country}
        options={stringOptions(catalog.options.countries)}
        onChange={(value) => catalog.updateParam("country", value)}
        disabled={catalog.optionsLoading}
      />
      <FilterField
        label="Editora original"
        value={catalog.originalPublisherId ? String(catalog.originalPublisherId) : ""}
        options={catalog.options.originalPublishers}
        onChange={(value) => catalog.updateParam("originalPublisherId", value)}
        disabled={catalog.optionsLoading}
        searchable
      />
      <FilterField
        label="Pré-publicação"
        value={catalog.serializationMagazineId ? String(catalog.serializationMagazineId) : ""}
        options={catalog.options.serializationMagazines}
        onChange={(value) => catalog.updateParam("serializationMagazineId", value)}
        disabled={catalog.optionsLoading}
        searchable
      />
      <MultiSelect
        label="Demografia"
        options={stringOptions(catalog.options.demographics)}
        selectedIds={catalog.demographics}
        onToggle={(value) => catalog.toggleCsvParam("demographics", catalog.demographics, String(value))}
        disabled={catalog.optionsLoading}
        placeholder="Todos"
        searchPlaceholder=""
        onClear={() => catalog.updateParam("demographics", undefined)}
        textSize="sm"
        tone="panel"
      />
      <FilterField
        label="Início da publicação original"
        value={catalog.originalPublicationStartYear ? String(catalog.originalPublicationStartYear) : ""}
        options={PUBLICATION_YEAR_OPTIONS}
        onChange={(value) => catalog.updateParam("originalPublicationStartYear", value)}
        searchable
      />
      <FilterField
        label="Fim da publicação original"
        value={catalog.originalPublicationEndYear ? String(catalog.originalPublicationEndYear) : ""}
        options={PUBLICATION_YEAR_OPTIONS}
        onChange={(value) => catalog.updateParam("originalPublicationEndYear", value)}
        searchable
      />
      <MultiSelect
        label="Gêneros"
        options={catalog.options.genres}
        selectedIds={catalog.genreIds}
        onToggle={(value) => catalog.toggleCsvParam("genreIds", catalog.genreIds, Number(value))}
        disabled={catalog.optionsLoading}
        searchable
        placeholder="Todos"
        searchPlaceholder=""
        onClear={() => catalog.updateParam("genreIds", undefined)}
        textSize="sm"
        tone="panel"
      />
    </div>
  );
}

function EditionAdvancedFilters({ catalog }: { catalog: PesquisaCatalog }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-[13.5rem_13.5rem] sm:gap-3">
      <FilterField
        label="Número da edição"
        value={catalog.chronologicalNumber ? String(catalog.chronologicalNumber) : ""}
        options={EDITION_NUMBER_OPTIONS}
        onChange={(value) => catalog.updateParam("chronologicalNumber", value)}
      />
      <FilterField
        label="Tipo de Edição"
        value={catalog.editionTypeId ? String(catalog.editionTypeId) : ""}
        options={catalog.options.editionTypes}
        onChange={(value) => catalog.updateParam("editionTypeId", value)}
        disabled={catalog.optionsLoading}
        searchable
      />
      <FilterField
        label="Acabamento"
        value={catalog.coverTypeId ? String(catalog.coverTypeId) : ""}
        options={catalog.options.coverTypes}
        onChange={(value) => catalog.updateParam("coverTypeId", value)}
        disabled={catalog.optionsLoading}
      />
      <FilterField
        label="Formato"
        value={catalog.formatId ? String(catalog.formatId) : ""}
        options={catalog.options.formats}
        onChange={(value) => catalog.updateParam("formatId", value)}
        disabled={catalog.optionsLoading}
      />
      <FilterField
        label="Início da publicação no Brasil"
        value={catalog.brazilPublicationStartYear ? String(catalog.brazilPublicationStartYear) : ""}
        options={PUBLICATION_YEAR_OPTIONS}
        onChange={(value) => catalog.updateParam("brazilPublicationStartYear", value)}
        searchable
      />
      <FilterField
        label="Fim da publicação no Brasil"
        value={catalog.brazilPublicationEndYear ? String(catalog.brazilPublicationEndYear) : ""}
        options={PUBLICATION_YEAR_OPTIONS}
        onChange={(value) => catalog.updateParam("brazilPublicationEndYear", value)}
        searchable
      />
    </div>
  );
}

function AdvancedFilters({ catalog }: { catalog: PesquisaCatalog }) {
  if (!catalog.showFilters) return null;
  return (
    <section
      ref={catalog.filtersRef}
      className="static z-50 mt-4 w-full rounded-2xl border border-sidebar-foreground/30 bg-sidebar p-4 sm:absolute sm:right-0 sm:top-full sm:w-[32.5rem]"
      aria-label="Filtros avançados"
    >
      {catalog.tab === "works" ? <WorkAdvancedFilters catalog={catalog} /> : <EditionAdvancedFilters catalog={catalog} />}
      <div className="mt-4 flex flex-col items-start justify-between gap-3 border-t border-sidebar-foreground/30 pt-4 sm:flex-row sm:items-center">
        {catalog.optionsError ? (
          <p className="text-sm font-semibold text-red-400">Não foi possível carregar as opções de filtro.</p>
        ) : (
          <p className="text-xs text-sidebar-foreground">Os filtros selecionados são combinados entre si.</p>
        )}
        <div className="flex gap-2">
          {catalog.optionsError ? (
            <button type="button" onClick={catalog.retryOptions} className="rounded-lg border border-sidebar-foreground/35 px-3 py-2 text-sm font-bold text-foreground hover:border-primary hover:text-primary">
              Recarregar opções
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Limpar todos os filtros"
            onClick={catalog.clearFilters}
            className="rounded-lg border border-sidebar-foreground/35 bg-background px-3 py-2 text-sm font-bold text-foreground hover:border-primary hover:text-primary"
          >
            Limpar filtros
          </button>
        </div>
      </div>
    </section>
  );
}

function ResultsSummary({ catalog }: { catalog: PesquisaCatalog }) {
  if (catalog.error) return null;
  const SortIcon = catalog.order === "ASC" ? ArrowDownAZ : ArrowUpAZ;
  return (
    <div className="mt-7 flex min-h-5 items-center gap-3 text-sm text-primary">
      {catalog.loading ? (
        <span data-testid="results-divider" className="h-px flex-1 bg-border" aria-hidden="true" />
      ) : (
        <>
          <span className="shrink-0">{resultCount(catalog.tab, catalog.pagination.total)}</span>
          <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />
          <button
            type="button"
            onClick={catalog.toggleTitleSort}
            aria-label={catalog.order === "ASC" ? "Ordenar por título de Z a A" : "Ordenar por título de A a Z"}
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            Título
            <SortIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <span data-testid="results-divider" className="h-px flex-1 bg-border" aria-hidden="true" />
        </>
      )}
    </div>
  );
}

function ResultCards({ catalog }: { catalog: PesquisaCatalog }) {
  return (
    <>
      <section
        className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
        aria-label={catalog.tab === "works" ? "Obras encontradas" : "Edições encontradas"}
      >
        {catalog.tab === "works"
          ? catalog.works.map((work) => <PublicWorkCard key={work.id} work={work} showAuthors={false} />)
          : catalog.editions.map((edition) => <EditionCard key={edition.id} edition={edition} />)}
      </section>
      <CatalogPagination
        pagination={catalog.pagination}
        onPageChange={(page) => catalog.changePage(page, catalog.pagination.totalPages)}
      />
    </>
  );
}

function CatalogResults({ catalog }: { catalog: PesquisaCatalog }) {
  if (catalog.loading) {
    return <LoadingState message={catalog.tab === "works" ? "Carregando Obras..." : "Carregando Edições..."} />;
  }
  if (catalog.error) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-red-500/30 bg-sidebar px-4 py-12 text-center">
        <AlertCircle className="h-8 w-8 text-red-400" aria-hidden="true" />
        <p className="mt-3 font-semibold text-red-300">{catalog.error}</p>
        <button
          type="button"
          onClick={catalog.retryResults}
          className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          Tentar novamente
        </button>
      </div>
    );
  }
  const hasResults = catalog.tab === "works" ? catalog.works.length > 0 : catalog.editions.length > 0;
  if (hasResults) return <ResultCards catalog={catalog} />;
  return (
    <div className="rounded-2xl border border-sidebar-foreground/30 bg-sidebar">
      <EmptyState
        message={catalog.tab === "works" ? "Nenhuma Obra encontrada." : "Nenhuma Edição encontrada."}
      />
      <div className="flex justify-center px-4 pb-10">
        <button
          type="button"
          onClick={catalog.clearFilters}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  );
}

const Pesquisa = () => {
  const catalog = usePesquisaCatalog();
  return (
    <div className="min-w-0 flex-1 px-4 pb-7 pt-6 sm:px-6 sm:pb-9 sm:pt-7 xl:px-10 xl:pt-3">
      <div className="mx-auto w-full max-w-[100rem]">
        <div className="relative z-30">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
            <TabSelector catalog={catalog} />
            <SearchInput catalog={catalog} />
            <PrimaryFilters catalog={catalog} />
          </div>
          <AdvancedFilters catalog={catalog} />
        </div>
        <ResultsSummary catalog={catalog} />
        <div className="mt-6">
          <CatalogResults catalog={catalog} />
        </div>
      </div>
    </div>
  );
};

export default Pesquisa;
