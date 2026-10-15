import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CatalogCover, publicEditionPath, publicVolumeLabel, publicVolumePath } from "@/features/public-catalog";
import { getCompleteCollectionEdition, removeCollectionVolume, updateVolumeReading, type CollectedEdition, type PersonalWork } from "@/features/personal-library";
import { getApiError } from "@/lib/apiError";

export function CollectionEdition({ item, work, busy, onMutate }: {
  item: CollectedEdition; work: PersonalWork; busy: boolean;
  onMutate: (operation: () => Promise<unknown>, message: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState<CollectedEdition["volumes"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const expansion = useRef(0);
  async function expand() {
    const version = ++expansion.current;
    setLoading(true); setError("");
    try {
      const result = await getCompleteCollectionEdition(item.edition.id);
      if (version === expansion.current) setExpanded(result.volumes.filter((volume) => volume.owned).map((volume) => ({ ...volume, read: Boolean(volume.read) })));
    } catch (failure) { setError(getApiError(failure, "Não foi possível carregar os demais Volumes.")); }
    finally { setLoading(false); }
  }
  const path = publicEditionPath(work.slug, item.edition.chronologicalNumber);
  return (
    <section className="mt-5 rounded-xl border border-border p-4" aria-label={`${item.edition.chronologicalNumber}ª edição de ${work.title}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold"><Link className="text-primary" to={path}>{item.edition.chronologicalNumber}ª edição · {item.edition.brazilianPublisher.label}</Link></h3>
          <p className="mt-1 text-sm text-muted-foreground">{item.progress.owned} de {item.progress.total} Volumes na coleção · {item.progress.read} lidos</p>
          <progress className="mt-2 w-full accent-primary" value={item.progress.owned} max={item.progress.total || 1} aria-label={`Progresso da ${item.edition.chronologicalNumber}ª edição de ${work.title}`} />
        </div>
        <Link to={`${path}/selecionar/estante`} className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-primary">Gerenciar Volumes</Link>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {(expanded || item.volumes).map((volume) => {
          const label = publicVolumeLabel(volume);
          return (
            <article key={volume.id} className="min-w-0">
              <Link to={publicVolumePath(work.slug, item.edition.chronologicalNumber, volume.number)} aria-label={`Ver ${label} de ${work.title}`}>
                <CatalogCover src={volume.coverUrl} alt={`Capa de ${label} de ${work.title}`} />
                <h4 className="mt-2 font-bold">{label}</h4>
              </Link>
              <p className="text-sm text-muted-foreground">{volume.read ? "Lido" : "Não lido"}</p>
              <button type="button" disabled={busy} aria-label={`Marcar ${label} de ${work.title} como ${volume.read ? "não lido" : "lido"}`} onClick={() => void onMutate(() => updateVolumeReading(volume.id, !volume.read), "Estado de leitura atualizado.")} className="mt-2 block text-sm font-bold text-primary disabled:opacity-50">Marcar como {volume.read ? "não lido" : "lido"}</button>
              <button type="button" disabled={busy} aria-label={`Remover ${label} de ${work.title} da coleção`} onClick={() => void onMutate(() => removeCollectionVolume(volume.id), "Volume removido da coleção.")} className="mt-2 text-sm text-muted-foreground disabled:opacity-50">Remover da coleção</button>
            </article>
          );
        })}
      </div>
      {error && <p role="alert" className="mt-4 text-red-300">{error}</p>}
      {!expanded && item.volumesPagination.totalPages > 1 && <button type="button" disabled={loading || busy} onClick={() => void expand()} className="mt-5 text-sm font-bold text-primary">{loading ? "Carregando Volumes..." : "Mostrar todos os Volumes adquiridos"}</button>}
    </section>
  );
}
