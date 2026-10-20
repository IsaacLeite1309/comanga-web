import { useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { CatalogCover, publicEditionPath, publicVolumeLabel } from "@/features/public-catalog";
import { getCompleteCollectionEdition, type CollectedEdition, type PersonalWork } from "@/features/personal-library";
import { getApiError } from "@/lib/apiError";

export function CollectionEdition({ item, work }: { item: CollectedEdition; work: PersonalWork }) {
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
  const missingCount = Math.max(0, item.progress.total - item.progress.owned);
  const isComplete = ["Completa", "Cancelada"].includes(item.edition.brazilPublicationStatus)
    && item.progress.total > 0 && missingCount === 0;
  return (
    <section className="border-b border-border pb-3 pt-6 first:pt-0" aria-label={`${item.edition.chronologicalNumber}ª edição de ${work.title}`}>
      <Link
        to={path}
        state={{ catalogOrigin: "collection" }}
        aria-label={`Ver ${item.edition.chronologicalNumber}ª edição de ${work.title}`}
        className="group -ml-3 flex w-[calc(100%+0.75rem)] items-center gap-3 rounded-2xl bg-background px-3 py-3 text-left transition-colors hover:bg-sidebar-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="min-w-0 flex-1">
          <h2 className="min-w-0 text-lg font-bold text-white" aria-label={`${work.title} · ${item.edition.chronologicalNumber}ª edição · Coleção ${isComplete ? "completa" : "incompleta"}`}>{work.title}<span className="mx-2"> · </span>{item.edition.chronologicalNumber}ª edição<span className="mx-2"> · </span><span className="font-bold">Coleção {isComplete ? "completa" : "incompleta"}</span></h2>
          <span className="mt-1 block text-sm text-muted-foreground">{item.progress.owned}/{item.progress.total} volumes adquiridos · {item.progress.read}/{item.progress.owned} {item.progress.read === 1 ? "volume lido" : "volumes lidos"} · {item.progress.wished}/{missingCount} {item.progress.wished === 1 ? "volume faltante desejado" : "volumes faltantes desejados"}</span>
          <span className="mt-3 flex min-w-0 gap-3 overflow-x-auto">
            {(expanded || item.volumes).map((volume) => {
              const label = publicVolumeLabel(volume);
              return (
                <span key={volume.id} className="w-24 shrink-0">
                  <CatalogCover src={volume.coverUrl} alt={`Capa de ${label} de ${work.title}`} />
                </span>
              );
            })}
          </span>
        </div>
        <ChevronRight className="h-6 w-6 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
      </Link>
      {error && <p role="alert" className="mt-2 text-red-300">{error}</p>}
      {!expanded && item.volumesPagination.totalPages > 1 && <button type="button" disabled={loading} onClick={() => void expand()} className="mt-2 text-xs font-bold text-primary">{loading ? "Carregando volumes..." : "Mostrar todos os volumes adquiridos"}</button>}
    </section>
  );
}
