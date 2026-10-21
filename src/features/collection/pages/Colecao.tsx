import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownAZ, ArrowUpAZ, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { FilteredEmptyState } from "@/components/shared/AsyncState";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { CatalogPagination, getPublicCatalogOptions, prefetchListedEditions, type PublicOption } from "@/features/public-catalog";
import { GuestLibraryNotice, collectionQueryPrefix, listCollection, useCachedLibraryFilters, useLibraryPage, type CollectionResponse } from "@/features/personal-library";
import { usePublicCatalogScope } from "@/features/public-catalog";
import { PUBLIC_CATALOG_QUERY_ROOT } from "@/lib/queryClient";
import { CollectionEdition } from "../CollectionEdition";
import { usePageScrollLock } from "@/hooks/usePageScrollLock";

const DEFAULT_COLLECTION_FILTERS = { searchTerm: "", term: "", status: "" as "complete" | "incomplete" | "", publisherId: "", order: "ASC" as "ASC" | "DESC" };

export default function Colecao({ isAuthenticated }: { isAuthenticated: boolean }) {
  return isAuthenticated ? <AuthenticatedCollection /> : <GuestCollection />;
}

function GuestCollection() {
  return (
    <div className="page-gutter flex min-w-0 flex-1 flex-col py-4 sm:py-6 xl:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <h1 className="sr-only">Sua coleção</h1>
        <GuestLibraryNotice feature="coleção" />
      </div>
    </div>
  );
}

function shouldDisableCollectionControls(filtered: boolean, loading: boolean, collectionIsEmpty: boolean) {
  return loading || (!filtered && collectionIsEmpty);
}

function hasCollectionFilters(term: string, status: string, publisherId: string) {
  return Boolean(term || status || publisherId);
}

function isCollectionEmpty(data: CollectionResponse | null, filtered: boolean) {
  return Boolean(data && data.works.length === 0 && !filtered);
}

function shouldDisablePublisherFilter(controlsDisabled: boolean, optionsLoading: boolean, optionsError: boolean) {
  return controlsDisabled || optionsLoading || optionsError;
}

function collectionResultsSpaceClass(data: CollectionResponse | null, filtered: boolean) {
  return data?.works.length === 0 && filtered ? "catalog-menu-covers-space" : "catalog-menu-collection-covers-space";
}

function nextCollectionOrder(order: "ASC" | "DESC") {
  return order === "ASC" ? "DESC" : "ASC";
}

function CollectionSummary({ total, showCount, order, onToggle }: { total?: number; showCount: boolean; order: "ASC" | "DESC"; onToggle: () => void }) {
  const SortIcon = order === "ASC" ? ArrowDownAZ : ArrowUpAZ;
  return (
    <div className="flex min-h-5 items-center gap-3 text-sm text-primary" role="status">
      {showCount && total !== undefined && <>
        <span className="shrink-0">{total} {total === 1 ? "coleção encontrada" : "coleções encontradas"}</span>
        <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />
      </>}
      <button
        type="button"
        onClick={onToggle}
        aria-label={order === "ASC" ? "Ordenar por título de Z a A" : "Ordenar por título de A a Z"}
        className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Título <SortIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
    </div>
  );
}

function CollectionDivider({ filtered, data, loading, order, onToggle }: {
  filtered: boolean;
  data: CollectionResponse | null;
  loading: boolean;
  order: "ASC" | "DESC";
  onToggle: () => void;
}) {
  if (data && !loading && (filtered || data.works.length > 0)) {
    return <CollectionSummary total={data.pagination.total} showCount={filtered} order={order} onToggle={onToggle} />;
  }
  return <div className="flex min-h-5 items-center" aria-hidden="true"><span className="h-px flex-1 bg-border" /></div>;
}

function CollectionLoading() {
  return (
    <div role="status" aria-label="Carregando sua coleção">
      <span className="sr-only">Carregando sua coleção...</span>
      {Array.from({ length: 3 }, (_, editionIndex) => (
        <section key={editionIndex} className="border-b border-border pb-3 pt-6 first:pt-0" aria-hidden="true">
          <div
            className="catalog-skeleton-card catalog-skeleton-shape h-56 rounded-2xl border border-sidebar-foreground/15"
            style={{ animationDelay: `${editionIndex * 220}ms` }}
          />
        </section>
      ))}
    </div>
  );
}

function CollectionResults({ data, loading, filtered, onPageChange, onClearFilters }: {
  data: CollectionResponse | null;
  loading: boolean;
  filtered: boolean;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
}) {
  if (loading) return <CollectionLoading />;
  if (!data) return null;
  return <>
    {data.works.length === 0 ? filtered ? <>
      <FilteredEmptyState message="Nenhuma edição da sua coleção corresponde aos filtros selecionados." onClear={onClearFilters} />
    </> : (
      <div className="flex items-center justify-center">
        <div className="w-full max-w-xs rounded-2xl border border-sidebar-foreground/30 bg-sidebar px-4 py-6 text-center">
          <p className="text-base text-white">Você ainda não adicionou nenhum volume à sua coleção!</p>
          <Link to="/pesquisa" className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-base font-bold text-white transition-colors hover:bg-primary/90">Explorar catálogo</Link>
        </div>
      </div>
    ) : data.works.map(({ work, editions }) => (
      <section key={work.id} aria-label={`Coleção de ${work.title}`}>
        {editions.map((item) => <CollectionEdition key={item.edition.id} item={item} work={work} />)}
      </section>
    ))}
    <CatalogPagination pagination={data.pagination} onPageChange={onPageChange} ariaLabel="Paginação da coleção" />
  </>;
}

function AuthenticatedCollection() {
  const queryClient = useQueryClient();
  const scope = usePublicCatalogScope();
  const [filters, setFilters] = useCachedLibraryFilters(scope[0], "collection", DEFAULT_COLLECTION_FILTERS);
  const { searchTerm, term, status, publisherId, order } = filters;
  const optionsQuery = useQuery({
    queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "options"],
    queryFn: getPublicCatalogOptions,
  });
  const publishers: PublicOption[] = optionsQuery.data?.brazilianPublishers ?? [];
  const optionsError = optionsQuery.isError && !optionsQuery.data;
  const optionsLoading = optionsQuery.isPending;
  const { refetch: refetchOptions } = optionsQuery;
  useEffect(() => {
    if (optionsError) toast.error("Não foi possível carregar as editoras.", { id: "collection-publishers-error", action: { label: "Tentar novamente", onClick: () => { void refetchOptions(); } } });
  }, [optionsError, refetchOptions]);
  const loadCollection = useCallback((page: number) => listCollection(page, {
    ...(term ? { term } : {}),
    ...(status ? { status } : {}),
    ...(publisherId ? { brazilianPublisherId: Number(publisherId) } : {}),
    ...(order === "DESC" ? { order } : {}),
  }), [term, status, publisherId, order]);
  const state = useLibraryPage(loadCollection, collectionQueryPrefix(scope[0], term, status, publisherId, order));
  usePageScrollLock(state.loading);
  const collectionData = state.data;
  useEffect(() => {
    if (!collectionData) return;
    const editions = collectionData.works.flatMap(({ work, editions: items }) => items.map(({ edition }) => ({
      workSlug: work.slug,
      editionNumber: edition.chronologicalNumber,
    })));
    const ownedVolumes = collectionData.works.flatMap(({ work, editions: items }) => items.flatMap(({ edition, volumes }) =>
      volumes.map((volume) => ({
        workSlug: work.slug,
        editionNumber: edition.chronologicalNumber,
        volumeNumber: volume.number,
      }))));
    void prefetchListedEditions(queryClient, scope, editions, 48, ownedVolumes);
  }, [collectionData, queryClient, scope]);
  const { setPage } = state;
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextTerm = searchTerm.trim();
      if (nextTerm !== term) {
        setPage(1);
        setFilters({ term: nextTerm });
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchTerm, term, setPage, setFilters]);
  const filtered = hasCollectionFilters(term, status, publisherId);
  const clearFilters = () => {
    setFilters(DEFAULT_COLLECTION_FILTERS);
    state.setPage(1);
  };
  const collectionIsEmpty = isCollectionEmpty(state.data, filtered);
  const controlsDisabled = shouldDisableCollectionControls(filtered, state.loading, collectionIsEmpty);
  return (
    <div className="page-gutter catalog-menu-top-space flex min-w-0 flex-1 flex-col pb-4 sm:pb-6 xl:pb-10">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <h1 className="sr-only">Sua coleção</h1>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="w-full shrink-0 sm:w-auto sm:min-w-52 lg:w-52">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">Total de edições e volumes</h2>
            <section aria-label="Total da coleção" className="flex h-12 items-center justify-center gap-1 rounded-lg border border-sidebar-foreground/30 bg-sidebar px-2 text-sm font-semibold text-muted-foreground">
              <p><strong className="mr-1 text-sm text-foreground">{state.data?.totals.editions ?? "—"}</strong>{state.data?.totals.editions === 1 ? "edição" : "edições"}</p>
              <span className="h-6 w-px bg-border" aria-hidden="true" />
              <p><strong className="mr-1 text-sm text-foreground">{state.data?.totals.volumes ?? "—"}</strong>{state.data?.totals.volumes === 1 ? "volume" : "volumes"}</p>
            </section>
          </div>
          <label className="block min-w-0 flex-1 text-xs font-bold uppercase tracking-wide">
              Pesquisar na coleção
            <span className="relative mt-2 block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground" aria-hidden="true" />
              <input type="search" aria-label="Pesquisar na coleção" placeholder="Título, título original ou autor" maxLength={255} value={searchTerm} onChange={event => setFilters({ searchTerm: event.target.value })} disabled={controlsDisabled} className="catalog-search-input block h-12 w-full appearance-none rounded-lg border border-sidebar-foreground/35 bg-sidebar pl-12 pr-3 text-sm font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" />
            </span>
          </label>
          <div className="min-w-0 sm:w-[13.5rem] sm:shrink-0">
            <span className="text-xs font-bold uppercase tracking-wide">Status da coleção</span>
            <SearchableSelect ariaLabel="Status da coleção" value={status} options={[{ value: "complete", label: "Completa" }, { value: "incomplete", label: "Incompleta" }]} onChange={value => { state.setPage(1); setFilters({ status: value as "complete" | "incomplete" | "" }); }} disabled={controlsDisabled} placeholder="Todos" clearable allowEmptyOption={false} tone="sidebar" textSize="sm" focusStyle="border" />
          </div>
          <div className="min-w-0 sm:w-[13.5rem] sm:shrink-0">
            <span className="text-xs font-bold uppercase tracking-wide">Editora brasileira</span>
            <SearchableSelect ariaLabel="Editora brasileira" value={publisherId} options={publishers} onChange={value => { state.setPage(1); setFilters({ publisherId: value }); }} disabled={shouldDisablePublisherFilter(controlsDisabled, optionsLoading, optionsError)} placeholder="Todas" searchable clearable allowEmptyOption={false} tone="sidebar" textSize="sm" focusStyle="border" />
          </div>
        </div>
        <div className={`catalog-menu-divider-space ${collectionIsEmpty ? "flex flex-1 flex-col" : ""}`}>
          <CollectionDivider
            filtered={filtered}
            data={state.data}
            loading={state.loading}
            order={order}
            onToggle={() => { state.setPage(1); setFilters({ order: nextCollectionOrder(order) }); }}
          />
          <div className={`${collectionResultsSpaceClass(state.data, filtered)} ${collectionIsEmpty ? "flex flex-1 flex-col justify-center" : ""}`}>
            <CollectionResults data={state.data} loading={state.loading} filtered={filtered} onPageChange={state.setPage} onClearFilters={clearFilters} />
          </div>
        </div>
      </div>
    </div>
  );
}
