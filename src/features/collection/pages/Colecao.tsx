import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState, LoadingState } from "@/components/shared/AsyncState";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { CatalogPagination, getPublicCatalogOptions, type PublicOption } from "@/features/public-catalog";
import { GuestLibraryNotice, listCollection, useLibraryPage } from "@/features/personal-library";
import { CollectionEdition } from "../CollectionEdition";

export default function Colecao({ isAuthenticated }: { isAuthenticated: boolean }) {
  return isAuthenticated ? <AuthenticatedCollection /> : <GuestCollection />;
}

function GuestCollection() {
  return (
    <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-6 xl:p-10">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <h1 className="sr-only">Sua coleção</h1>
        <GuestLibraryNotice feature="coleção" />
      </div>
    </div>
  );
}

function shouldDisableCollectionControls(filtered: boolean, loading: boolean, collectionIsEmpty: boolean) {
  return !filtered && (loading || collectionIsEmpty);
}

function AuthenticatedCollection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState<"complete" | "incomplete" | "">("");
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
  const loadCollection = useCallback((page: number) => listCollection(page, {
    ...(term ? { term } : {}),
    ...(status ? { status } : {}),
    ...(publisherId ? { brazilianPublisherId: Number(publisherId) } : {}),
  }), [term, status, publisherId]);
  const state = useLibraryPage(loadCollection);
  const { setPage } = state;
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextTerm = searchTerm.trim();
      if (nextTerm !== term) {
        setPage(1);
        setTerm(nextTerm);
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchTerm, term, setPage]);
  const filtered = Boolean(term || status || publisherId);
  const collectionIsEmpty = Boolean(state.data && state.data.works.length === 0 && !filtered);
  const controlsDisabled = shouldDisableCollectionControls(filtered, state.loading, collectionIsEmpty);
  return (
    <div className="flex min-w-0 flex-1 flex-col px-4 pb-4 pt-7 sm:px-6 sm:pb-6 xl:px-10 xl:pb-10">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <h1 className="sr-only">Sua coleção</h1>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <label className="block min-w-0 flex-1 text-xs font-bold uppercase tracking-wide">
            Pesquisar
            <span className="relative mt-2 block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground" aria-hidden="true" />
              <input type="search" aria-label="Pesquisar na coleção" placeholder="Título, título original ou autor" maxLength={255} value={searchTerm} onChange={event => setSearchTerm(event.target.value)} disabled={controlsDisabled} className="catalog-search-input block h-12 w-full appearance-none rounded-lg border border-sidebar-foreground/35 bg-sidebar pl-12 pr-3 text-sm font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" />
            </span>
          </label>
          <div className="min-w-0 sm:w-64 lg:shrink-0">
            <span className="text-xs font-bold uppercase tracking-wide">Status da coleção</span>
            <SearchableSelect ariaLabel="Status da coleção" value={status} options={[{ value: "complete", label: "Completa" }, { value: "incomplete", label: "Incompleta" }]} onChange={value => { state.setPage(1); setStatus(value as "complete" | "incomplete" | ""); }} disabled={controlsDisabled} placeholder="Todos" clearable allowEmptyOption={false} tone="sidebar" textSize="sm" focusStyle="border" />
          </div>
          <div className="min-w-0 sm:w-64 lg:shrink-0">
            <span className="text-xs font-bold uppercase tracking-wide">Editora brasileira</span>
            <SearchableSelect ariaLabel="Editora brasileira" value={publisherId} options={publishers} onChange={value => { state.setPage(1); setPublisherId(value); }} disabled={controlsDisabled || optionsLoading || optionsError} placeholder="Todas" searchable clearable allowEmptyOption={false} tone="sidebar" textSize="sm" focusStyle="border" />
            {optionsError && <p role="alert" className="mt-2 text-sm text-red-300">Não foi possível carregar as editoras. <button type="button" className="underline" onClick={() => setOptionsAttempt(attempt => attempt + 1)}>Tentar novamente</button></p>}
          </div>
        </div>
        <div className={collectionIsEmpty ? "mt-6 flex flex-1 flex-col justify-center border-t border-border pt-6" : "mt-6 border-t border-border pt-6"}>
        {state.loading && <LoadingState message="Carregando sua coleção..." />}
        {state.error && <div role="alert" className="mt-6 text-red-300"><p>{state.error}</p><button type="button" className="mt-3 font-bold text-primary" onClick={() => void state.reload()}>Tentar novamente</button></div>}
        {state.data && <>
          {state.data.works.length === 0 ? filtered ? <EmptyState message="Nenhuma edição da sua coleção corresponde aos filtros selecionados." /> : (
            <div className="flex items-center justify-center">
              <div className="w-full max-w-xs rounded-2xl border border-sidebar-foreground/30 bg-sidebar px-4 py-6 text-center">
                <p className="text-base text-white">Você ainda não adicionou nenhum volume à sua coleção!</p>
                <Link to="/pesquisa" className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-base font-bold text-white transition-colors hover:bg-primary/90">Explorar catálogo</Link>
              </div>
            </div>
          ) : state.data.works.map(({ work, editions }) => (
            <section key={work.id} aria-label={`Coleção de ${work.title}`}>
              {editions.map((item) => <CollectionEdition key={item.edition.id} item={item} work={work} />)}
            </section>
          ))}
          <CatalogPagination pagination={state.data.pagination} onPageChange={state.setPage} ariaLabel="Paginação da coleção" />
        </>}
        </div>
      </div>
    </div>
  );
}
