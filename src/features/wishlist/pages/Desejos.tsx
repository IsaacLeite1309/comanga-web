import { useCallback, useEffect, useState } from "react";
import { LibraryBig, Plus, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState, LoadingState } from "@/components/shared/AsyncState";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { CatalogCover, CatalogPagination, getPublicCatalogOptions, publicVolumeLabel, publicVolumePath, type PublicOption } from "@/features/public-catalog";
import { addCollectionVolume, GuestLibraryNotice, listWishlist, removeWishlistVolume, useLibraryPage, WishlistToCollectionDialog } from "@/features/personal-library";

export default function Desejos({ isAuthenticated }: { isAuthenticated: boolean }) {
  return isAuthenticated ? <AuthenticatedWishlist /> : <GuestWishlist />;
}

function GuestWishlist() {
  return (
    <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-6 xl:p-10">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <h1 className="sr-only">Lista de desejos</h1>
        <GuestLibraryNotice feature="lista de desejos" />
      </div>
    </div>
  );
}

function AuthenticatedWishlist() {
  const [confirmVolumeId, setConfirmVolumeId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [term, setTerm] = useState("");
  const [publisherId, setPublisherId] = useState("");
  const [publishers, setPublishers] = useState<PublicOption[]>([]);
  const [optionsError, setOptionsError] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsAttempt, setOptionsAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setOptionsLoading(true);
    setOptionsError(false);
    getPublicCatalogOptions().then(options => {
      if (active) setPublishers(options.brazilianPublishers);
    }).catch(() => {
      if (active) setOptionsError(true);
    }).finally(() => {
      if (active) setOptionsLoading(false);
    });
    return () => { active = false; };
  }, [optionsAttempt]);
  const loadWishlist = useCallback((page: number) => listWishlist(page, {
    ...(term ? { term } : {}),
    ...(publisherId ? { brazilianPublisherId: Number(publisherId) } : {}),
  }), [term, publisherId]);
  const state = useLibraryPage(loadWishlist);
  const { setPage } = state;
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextTerm = searchTerm.trim();
      if (nextTerm !== term) { setPage(1); setTerm(nextTerm); }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchTerm, term, setPage]);
  const filtered = Boolean(term || publisherId);
  const wishlistIsEmpty = Boolean(state.data && state.data.volumes.length === 0 && !filtered);
  const controlsDisabled = state.loading || wishlistIsEmpty;
  const actionClass = "inline-flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-full border border-sidebar-foreground/30 bg-sidebar px-2 text-xs font-semibold text-white transition-colors hover:bg-sidebar-accent disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm";
  return (
    <div className="flex min-w-0 flex-1 flex-col px-4 pb-4 pt-7 sm:px-6 sm:pb-6 xl:px-10 xl:pb-10">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <h1 className="sr-only">Lista de desejos</h1>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <label className="block min-w-0 flex-1 text-xs font-bold uppercase tracking-wide">
            Pesquisar
            <span className="relative mt-2 block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground" aria-hidden="true" />
              <input type="search" aria-label="Pesquisar na lista de desejos" placeholder="Título, título original ou autor" maxLength={255} value={searchTerm} onChange={event => setSearchTerm(event.target.value)} disabled={controlsDisabled} className="catalog-search-input block h-12 w-full appearance-none rounded-lg border border-sidebar-foreground/35 bg-sidebar pl-12 pr-3 text-sm font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" />
            </span>
          </label>
          <div className="min-w-0 sm:w-64 lg:shrink-0">
            <span className="text-xs font-bold uppercase tracking-wide">Editora brasileira</span>
            <SearchableSelect ariaLabel="Editora brasileira" value={publisherId} options={publishers} onChange={value => { state.setPage(1); setPublisherId(value); }} disabled={controlsDisabled || optionsLoading || optionsError} placeholder="Todas" searchable clearable allowEmptyOption={false} tone="sidebar" textSize="sm" focusStyle="border" />
            {optionsError && <p role="alert" className="mt-2 text-sm text-red-300">Não foi possível carregar as editoras. <button type="button" className="underline" onClick={() => setOptionsAttempt(attempt => attempt + 1)}>Tentar novamente</button></p>}
          </div>
        </div>
        <div className={wishlistIsEmpty ? "mt-6 flex flex-1 flex-col justify-center border-t border-border pt-6" : "mt-6 border-t border-border pt-6"}>
          {state.loading && <LoadingState message="Carregando sua lista de desejos..." />}
          {state.error && <div role="alert" className="mt-6 text-red-300"><p>{state.error}</p><button type="button" className="mt-3 font-bold text-primary" onClick={() => void state.reload()}>Tentar novamente</button></div>}
          {state.data && <>
            {state.data.volumes.length === 0 ? filtered ? <EmptyState message="Nenhum volume da sua lista de desejos corresponde aos filtros selecionados." /> : (
              <div className="flex items-center justify-center">
                <div className="w-full max-w-xs rounded-2xl border border-sidebar-foreground/30 bg-sidebar px-4 py-6 text-center">
                  <p className="text-base text-white">Você ainda não adicionou nenhum volume à sua lista de desejos!</p>
                  <Link to="/pesquisa" className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-base font-bold text-white transition-colors hover:bg-primary/90">Explorar catálogo</Link>
                </div>
              </div>
            ) : <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-5">
              {state.data.volumes.map((volume) => {
                const label = publicVolumeLabel(volume);
                return <article key={volume.id} className="min-w-0">
                  <Link to={publicVolumePath(volume.work.slug, volume.edition.chronologicalNumber, volume.number)} state={{ catalogOrigin: "wishlist" }}>
                    <CatalogCover src={volume.coverUrl} alt={`Capa de ${label} de ${volume.work.title}`} />
                    <h2 className="mt-2 font-normal">{volume.work.title} · {label}</h2>
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">{volume.edition.chronologicalNumber}ª edição · {volume.edition.brazilianPublisher.label}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" disabled={state.busy} aria-label={`Adicionar ${label} de ${volume.work.title} à coleção`} onClick={() => setConfirmVolumeId(volume.id)} className={actionClass}>
                      <span className="relative inline-flex shrink-0" aria-hidden="true"><LibraryBig className="h-4 w-4" /><Plus className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-sidebar" /></span>
                      <span className="hidden sm:inline">Adicionar</span>
                    </button>
                    <button type="button" disabled={state.busy} aria-label={`Remover ${label} de ${volume.work.title} dos desejos`} onClick={() => void state.mutate(() => removeWishlistVolume(volume.id), "Volume removido da lista de desejos.")} className={actionClass}>
                      <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="hidden sm:inline">Remover</span>
                    </button>
                  </div>
                  {volume.affiliateLink ? <a href={volume.affiliateLink} target="_blank" rel="noreferrer noopener" className="mt-3 inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-full border border-[#ff9900]/45 bg-white px-5 py-2.5 text-base font-semibold text-black transition-colors hover:border-[#ff9900] hover:bg-[#fffaf3]">Comprar na <img src="/amazon-logo.svg" alt="Amazon" className="h-8 w-8 -translate-y-px object-contain" /></a> : <div className="relative mt-3 overflow-hidden rounded-full"><button type="button" disabled className="inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 border border-[#ff9900]/25 bg-white/45 px-5 py-2.5 text-base font-semibold text-background/70">Comprar na <img src="/amazon-logo.svg" alt="Amazon" className="h-8 w-8 -translate-y-px object-contain opacity-55" /></button><div className="pointer-events-none absolute left-[19%] top-1/2 flex h-8 w-[62%] -translate-y-1/2 rotate-[4deg] items-center justify-center bg-red-500 px-3 text-xs font-bold uppercase tracking-wide text-white shadow-sm shadow-black/30">Indisponível</div></div>}
                </article>;
              })}
            </div>}
            <CatalogPagination pagination={state.data.pagination} onPageChange={state.setPage} ariaLabel="Paginação dos desejos" />
          </>}
        </div>
      </div>
      {confirmVolumeId !== null && <WishlistToCollectionDialog count={1} onCancel={() => setConfirmVolumeId(null)} onConfirm={() => {
        const volumeId = confirmVolumeId;
        setConfirmVolumeId(null);
        void state.mutate(() => addCollectionVolume(volumeId), "Volume adicionado à coleção.");
      }} />}
    </div>
  );
}
