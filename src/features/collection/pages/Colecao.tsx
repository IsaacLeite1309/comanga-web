import { Link } from "react-router-dom";
import { EmptyState, LoadingState } from "@/components/shared/AsyncState";
import { CatalogPagination, publicWorkPath } from "@/features/public-catalog";
import { listCollection, useLibraryPage } from "@/features/personal-library";
import { CollectionEdition } from "../CollectionEdition";

export default function Colecao() {
  const state = useLibraryPage(listCollection);
  return (
    <div className="min-w-0 flex-1 p-4 sm:p-6 xl:p-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-foreground">Sua Coleção</h1>
        {state.message && <p role="status" className="mt-4 text-sm text-primary">{state.message}</p>}
        {state.loading && <LoadingState message="Carregando sua coleção..." />}
        {state.error && <div role="alert" className="mt-6 text-red-300"><p>{state.error}</p><button type="button" className="mt-3 font-bold text-primary" onClick={() => void state.reload()}>Tentar novamente</button></div>}
        {state.data && <>
          {state.data.works.length === 0 ? <><EmptyState message="Sua coleção ainda não tem Volumes públicos." /><Link to="/pesquisa" className="text-primary">Explorar o catálogo</Link></> : state.data.works.map(({ work, editions }) => (
            <section key={work.id} className="mt-8" aria-label={`Coleção de ${work.title}`}>
              <h2 className="text-2xl font-bold"><Link to={publicWorkPath(work.slug)}>{work.title}</Link></h2>
              {editions.map((item) => <CollectionEdition key={item.edition.id} item={item} work={work} busy={state.busy} onMutate={state.mutate} />)}
            </section>
          ))}
          <CatalogPagination pagination={state.data.pagination} onPageChange={state.setPage} ariaLabel="Paginação da coleção" />
        </>}
      </div>
    </div>
  );
}
