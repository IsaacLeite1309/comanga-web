import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { ArrowDownAZ, ArrowUpAZ, Heart, LibraryBig, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { FilteredEmptyState } from "@/components/shared/AsyncState";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { CatalogCover, CatalogPagination, CatalogResultsLoading, getPublicCatalogOptions, publicVolumeLabel, publicVolumePath, updatePersonalVolumeCache, usePublicCatalogScope, type PublicOption, type PublicPersonalVolumeState } from "@/features/public-catalog";
import { addCollectionVolume, CollectionChangeDialog, GuestLibraryNotice, listWishlist, removeWishlistVolume, useCachedLibraryFilters, useLibraryPage, wishlistQueryPrefix, type WishlistResponse, type WishlistVolume } from "@/features/personal-library";
import { PUBLIC_CATALOG_QUERY_ROOT } from "@/lib/queryClient";
import { usePageScrollLock } from "@/hooks/usePageScrollLock";

const DEFAULT_WISHLIST_FILTERS = { searchTerm: "", term: "", publisherId: "", order: "ASC" as "ASC" | "DESC" };

function updateWishlistCache(queryClient: QueryClient, scope: readonly [string, boolean, string], volume: WishlistVolume, next: PublicPersonalVolumeState) {
  updatePersonalVolumeCache(queryClient, scope, {
    workSlug: volume.work.slug,
    editionId: volume.edition.id,
    editionNumber: volume.edition.chronologicalNumber,
    volumeId: volume.id,
    volumeNumber: volume.number,
    previous: { owned: false, read: null, wished: true },
    next,
  });
}

function findConfirmVolume(data: WishlistResponse | null, volumeId: number | null) {
  return data?.volumes.find((volume) => volume.id === volumeId);
}

function visibleWishlistResponse(data: WishlistResponse | null, loading: boolean) {
  return loading ? null : data;
}

function wishlistTotal(data: WishlistResponse | null) {
  return data?.totals.volumes;
}

function WishlistTotal({ total }: { total: number | undefined }) {
  return (
    <div className="w-full shrink-0 sm:w-auto sm:min-w-52 lg:w-52">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">Total de volumes desejados</h2>
      <section aria-label="Total da lista de desejos" className="flex h-12 items-center justify-center rounded-lg border border-sidebar-foreground/30 bg-sidebar px-2 text-sm font-semibold text-muted-foreground">
        <p><strong className="mr-1 text-sm text-foreground">{total ?? "—"}</strong>{total === 1 ? "volume" : "volumes"}</p>
      </section>
    </div>
  );
}

function WishlistSummary({ total, filtered, order, disabled, onToggle }: {
  total: number;
  filtered: boolean;
  order: "ASC" | "DESC";
  disabled: boolean;
  onToggle: () => void;
}) {
  if (total === 0 && !filtered) {
    return <div className="catalog-menu-summary-space flex min-h-5 items-center" aria-hidden="true"><span className="h-px flex-1 bg-border" /></div>;
  }
  const SortIcon = order === "DESC" ? ArrowUpAZ : ArrowDownAZ;
  return (
    <div className="catalog-menu-summary-space flex min-h-5 items-center gap-3 text-sm text-primary" role="status">
      {filtered && <>
        <span className="shrink-0">{total} {total === 1 ? "volume encontrado" : "volumes encontrados"}</span>
        <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />
      </>}
      <button type="button" disabled={disabled || total === 0} onClick={onToggle} aria-label={order === "ASC" ? "Ordenar por título de Z a A" : "Ordenar por título de A a Z"} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50">
        Título <SortIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
    </div>
  );
}

function EmptyWishlist({ filtered, onClearFilters }: { filtered: boolean; onClearFilters: () => void }) {
  if (filtered) return <FilteredEmptyState message="Nenhum volume da sua lista de desejos corresponde aos filtros selecionados." onClear={onClearFilters} />;
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-xs rounded-2xl border border-sidebar-foreground/30 bg-sidebar px-4 py-6 text-center">
        <p className="text-base text-white">Você ainda não adicionou nenhum volume à sua lista de desejos!</p>
        <Link to="/pesquisa" className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-base font-bold text-white transition-colors hover:bg-primary/90">Explorar catálogo</Link>
      </div>
    </div>
  );
}

export default function Desejos({ isAuthenticated }: { isAuthenticated: boolean }) {
  return isAuthenticated ? <AuthenticatedWishlist /> : <GuestWishlist />;
}

function GuestWishlist() {
  return (
    <div className="page-gutter flex min-w-0 flex-1 flex-col py-4 sm:py-6 xl:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <h1 className="sr-only">Lista de desejos</h1>
        <GuestLibraryNotice feature="lista de desejos" />
      </div>
    </div>
  );
}

function AuthenticatedWishlist() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const scope = usePublicCatalogScope();
  const [confirmVolumeId, setConfirmVolumeId] = useState<number | null>(null);
  const [filters, setFilters] = useCachedLibraryFilters(scope[0], "wishlist", DEFAULT_WISHLIST_FILTERS);
  const { searchTerm, term, publisherId, order } = filters;
  const optionsQuery = useQuery({
    queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "options"],
    queryFn: getPublicCatalogOptions,
  });
  const publishers: PublicOption[] = optionsQuery.data?.brazilianPublishers ?? [];
  const optionsError = optionsQuery.isError && !optionsQuery.data;
  const optionsLoading = optionsQuery.isPending;
  useEffect(() => {
    if (optionsError) toast.error("Não foi possível carregar as editoras. Tente novamente em instantes.", { id: "wishlist-publishers-error" });
  }, [optionsError]);
  const loadWishlist = useCallback((page: number) => listWishlist(page, {
    ...(term ? { term } : {}),
    ...(publisherId ? { brazilianPublisherId: Number(publisherId) } : {}),
    order,
  }), [term, publisherId, order]);
  const state = useLibraryPage(loadWishlist, wishlistQueryPrefix(scope[0], term, publisherId, order));
  usePageScrollLock(state.loading);
  const visibleData = visibleWishlistResponse(state.data, state.loading);
  const confirmVolume = findConfirmVolume(state.data, confirmVolumeId);
  const { setPage } = state;
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextTerm = searchTerm.trim();
      if (nextTerm !== term) { setPage(1); setFilters({ term: nextTerm }); }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchTerm, term, setPage, setFilters]);
  const filtered = Boolean(term || publisherId);
  const clearFilters = () => {
    setFilters(DEFAULT_WISHLIST_FILTERS);
    state.setPage(1);
  };
  const wishlistIsEmpty = Boolean(state.data && state.data.volumes.length === 0 && !filtered);
  const controlsDisabled = state.loading || wishlistIsEmpty;
  const actionClass = "inline-flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-lg border px-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm";
  const inactiveActionClass = "border-sidebar-foreground/30 bg-sidebar text-white hover:bg-sidebar-accent";
  const activeActionClass = "border-primary bg-primary text-primary-foreground hover:bg-primary/90";
  return (
    <div className="page-gutter catalog-menu-top-space flex min-w-0 flex-1 flex-col pb-4 sm:pb-6 xl:pb-10">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <h1 className="sr-only">Lista de desejos</h1>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <WishlistTotal total={wishlistTotal(state.data)} />
          <label className="block min-w-0 flex-1 text-xs font-bold uppercase tracking-wide">
            Pesquisar na lista de desejos
            <span className="relative mt-2 block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground" aria-hidden="true" />
              <input type="search" aria-label="Pesquisar na lista de desejos" placeholder="Título, título original ou autor" maxLength={255} value={searchTerm} onChange={event => setFilters({ searchTerm: event.target.value })} disabled={controlsDisabled} className="catalog-search-input block h-12 w-full appearance-none rounded-lg border border-sidebar-foreground/35 bg-sidebar pl-12 pr-3 text-sm font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" />
            </span>
          </label>
          <div className="min-w-0 sm:w-64 lg:shrink-0">
            <span className="text-xs font-bold uppercase tracking-wide">Editora brasileira</span>
            <SearchableSelect ariaLabel="Editora brasileira" value={publisherId} options={publishers} onChange={value => { state.setPage(1); setFilters({ publisherId: value }); }} disabled={controlsDisabled || optionsLoading || optionsError} placeholder="Todas" searchable clearable allowEmptyOption={false} tone="sidebar" textSize="sm" focusStyle="border" />
          </div>
        </div>
        <div className={`catalog-menu-divider-space ${wishlistIsEmpty ? "flex flex-1 flex-col" : ""}`}>
          {state.loading && <>
            <div className="flex min-h-5 items-center" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
            </div>
            <CatalogResultsLoading label="Carregando sua lista de desejos..." className="catalog-menu-covers-space" cardActions="wishlist" />
          </>}
          {visibleData && <>
            <WishlistSummary total={visibleData.pagination.total} filtered={filtered} order={order} disabled={state.loading} onToggle={() => { state.setPage(1); setFilters(current => ({ order: current.order === "ASC" ? "DESC" : "ASC" })); }} />
            {visibleData.volumes.length === 0 ? <EmptyWishlist filtered={filtered} onClearFilters={clearFilters} /> : <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {visibleData.volumes.map((volume) => {
                const label = publicVolumeLabel(volume);
                return <article key={volume.id} className="min-w-0">
                  <Link to={publicVolumePath(volume.work.slug, volume.edition.chronologicalNumber, volume.number)} state={{ catalogOrigin: "wishlist", returnTo: `${location.pathname}${location.search}` }} className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <CatalogCover src={volume.coverUrl} alt={`Capa de ${label} de ${volume.work.title}`} className="transition-transform group-hover:-translate-y-1" />
                    <h3 className="mt-2 truncate text-sm font-normal text-foreground group-hover:text-primary sm:text-base" title={volume.work.title}>{volume.work.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{label} da {volume.edition.chronologicalNumber}ª edição</p>
                  </Link>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" disabled={state.busy} aria-label={`Adicionar ${label} de ${volume.work.title} à coleção`} onClick={() => setConfirmVolumeId(volume.id)} className={`${actionClass} ${inactiveActionClass}`}>
                      <LibraryBig className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </button>
                    <button type="button" disabled={state.busy} aria-label={`Remover ${label} de ${volume.work.title} dos desejos`} onClick={() => void state.mutate(async () => {
                      await removeWishlistVolume(volume.id);
                      updateWishlistCache(queryClient, scope, volume, { owned: false, read: null, wished: false });
                    }, "Volume removido da lista de desejos.")} className={`${actionClass} ${activeActionClass}`}>
                      <Heart className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true" />
                    </button>
                  </div>
                  {volume.affiliateLink ? <a href={volume.affiliateLink} target="_blank" rel="noreferrer noopener" className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#ff9900]/45 bg-white px-4 text-sm font-semibold leading-none text-black transition-colors hover:border-[#ff9900] hover:bg-[#fffaf3]">Comprar na <img src="/amazon-logo.svg" alt="Amazon" className="h-6 w-6 object-contain" /></a> : <div className="relative mt-3 overflow-hidden rounded-lg"><button type="button" disabled className="inline-flex h-10 w-full items-center justify-center gap-2 border border-[#ff9900]/25 bg-white/45 px-4 text-sm font-semibold leading-none text-background/70">Comprar na <img src="/amazon-logo.svg" alt="Amazon" className="h-6 w-6 object-contain opacity-55" /></button><div className="pointer-events-none absolute left-[5%] top-1/2 flex h-8 w-[90%] -translate-y-1/2 rotate-[4deg] items-center justify-center gap-1 whitespace-nowrap bg-red-500 px-1 text-sm font-bold leading-none tracking-wide text-white shadow-sm shadow-black/30">Indisponível na <img src="/amazon-logo.svg" alt="" className="h-6 w-6 shrink-0 object-contain brightness-0 invert" /></div></div>}
                </article>;
              })}
            </div>}
            <CatalogPagination pagination={visibleData.pagination} onPageChange={state.setPage} ariaLabel="Paginação dos desejos" />
          </>}
        </div>
      </div>
      {confirmVolume && <CollectionChangeDialog wishlistVolumes={[publicVolumeLabel(confirmVolume)]} readVolumes={[]} confirmLabel="Adicionar" wishlistCopy onCancel={() => setConfirmVolumeId(null)} onConfirm={() => {
        setConfirmVolumeId(null);
        void state.mutate(async () => {
          const result = await addCollectionVolume(confirmVolume.id);
          updateWishlistCache(queryClient, scope, confirmVolume, { owned: result.owned, read: result.read, wished: result.wished });
        }, "Volume adicionado à coleção.");
      }} />}
    </div>
  );
}
