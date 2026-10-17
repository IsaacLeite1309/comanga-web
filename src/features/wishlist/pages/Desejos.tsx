import { Link } from "react-router-dom";
import { EmptyState, LoadingState } from "@/components/shared/AsyncState";
import { CatalogCover, CatalogPagination, publicVolumeLabel, publicVolumePath } from "@/features/public-catalog";
import { listWishlist, removeWishlistVolume, useLibraryPage } from "@/features/personal-library";

export default function Desejos() {
  const state = useLibraryPage(listWishlist);
  return (
    <div className="min-w-0 flex-1 p-4 sm:p-6 xl:p-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-foreground">Lista de Desejos</h1>
        {state.message && <p role="status" className="mt-4 text-sm text-primary">{state.message}</p>}
        {state.loading && <LoadingState message="Carregando sua Lista de Desejos..." />}
        {state.error && <div role="alert" className="mt-6 text-red-300"><p>{state.error}</p><button type="button" className="mt-3 font-bold text-primary" onClick={() => void state.reload()}>Tentar novamente</button></div>}
        {state.data && <>
          {state.data.volumes.length === 0 ? <><EmptyState message="Sua Lista de Desejos ainda não tem Volumes públicos." /><Link to="/pesquisa" className="text-primary">Explorar o catálogo</Link></> : <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-5">
            {state.data.volumes.map((volume) => {
              const label = publicVolumeLabel(volume);
              return <article key={volume.id} className="min-w-0">
                <Link to={publicVolumePath(volume.work.slug, volume.edition.chronologicalNumber, volume.number)}>
                  <CatalogCover src={volume.coverUrl} alt={`Capa de ${label} de ${volume.work.title}`} />
                  <h2 className="mt-2 font-bold">{volume.work.title} · {label}</h2>
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{volume.edition.chronologicalNumber}ª edição · {volume.edition.brazilianPublisher.label}</p>
                <button type="button" disabled={state.busy} aria-label={`Remover ${label} de ${volume.work.title} dos desejos`} onClick={() => void state.mutate(() => removeWishlistVolume(volume.id), "Volume removido da Lista de Desejos.")} className="mt-3 text-sm font-bold text-primary disabled:opacity-50">Remover dos desejos</button>
              </article>;
            })}
          </div>}
          <CatalogPagination pagination={state.data.pagination} onPageChange={state.setPage} ariaLabel="Paginação dos desejos" />
        </>}
      </div>
    </div>
  );
}
