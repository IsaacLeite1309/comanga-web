import { Search, SlidersHorizontal } from 'lucide-react';
import { MultiSelect } from '@/components/forms/MultiSelect';
import { SearchableSelect, type SelectOption } from '@/components/forms/SearchableSelect';
import { formatPublicationStatus } from '@/features/public-catalog/publicCatalogFormatters';
import { advancedFilterCount, type PesquisaCatalog } from '../hooks/usePesquisaCatalog';

export { TabSelector, SearchInput, PrimaryFilters, AdvancedFilters };

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

function stringOptions(items: string[]): SelectOption[] {
  return items.map((item) => ({ id: item, label: item }));
}

function statusOptions(items: string[]): SelectOption[] {
  return items.map((item) => ({ id: item, label: formatPublicationStatus(item) }));
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
        placeholder="Todos"
        allowEmptyOption={false}
        clearable
        textSize="sm"
        tone="panel"
        focusStyle="border"
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
          className={`inline-flex h-full flex-1 items-center justify-center rounded-full px-5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none ${catalog.tab === tab ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-sidebar-accent"}`}
        >
          {tab === "works" ? "Obras" : "Edições"}
        </button>
      ))}
    </div>
  );
}

function SearchInput({ catalog }: { catalog: PesquisaCatalog }) {
  return (
    <label className="block min-w-0 flex-1 text-xs font-bold uppercase tracking-wide">
      Pesquisar
      <span className="relative mt-2 block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground" aria-hidden="true" />
        <input
          type="search"
          aria-label="Pesquisar no catálogo"
          value={catalog.searchTerm}
          onChange={(event) => catalog.setSearchTerm(event.target.value)}
          placeholder="Título, título original ou autor"
          className="catalog-search-input block h-12 w-full appearance-none rounded-lg border border-sidebar-foreground/35 bg-sidebar pl-12 pr-3 text-sm font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
        />
      </span>
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
        placeholder="Todos"
        allowEmptyOption={false}
        clearable
        tone="sidebar"
        textSize="sm"
        focusStyle="border"
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
        options={catalog.workTypeOptions}
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
        className={`col-span-2 inline-flex h-12 w-full shrink-0 items-center justify-center rounded-lg border bg-sidebar text-foreground transition-colors hover:border-primary focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:col-auto sm:w-12 sm:justify-self-end ${catalog.showFilters ? "border-primary" : "border-sidebar-foreground/35"}`}
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
        onClear={() => catalog.updateParam("demographics", undefined)}
        textSize="sm"
        tone="panel"
        focusStyle="border"
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
        onClear={() => catalog.updateParam("genreIds", undefined)}
        textSize="sm"
        tone="panel"
        focusStyle="border"
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
