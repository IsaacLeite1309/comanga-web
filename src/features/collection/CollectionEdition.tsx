import { useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { CatalogCover, publicEditionPath, publicVolumeLabel } from "@/features/public-catalog";
import { getCompleteCollectionEdition, type CollectedEdition, type PersonalWork } from "@/features/personal-library";
import { getApiError } from "@/lib/apiError";
import { CollectionManagementMenu } from "./CollectionManagementMenu";

export function CollectionEdition({ item, work, collectionPage }: { item: CollectedEdition; work: PersonalWork; collectionPage: number }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState<CollectedEdition["volumes"] | null>(null);
  const [loading, setLoading] = useState(false);
  const expansion = useRef(0);
  async function expand() {
    const version = ++expansion.current;
    setLoading(true);
    try {
      const result = await getCompleteCollectionEdition(item.edition.id);
      if (version === expansion.current) setExpanded(result.volumes.filter((volume) => volume.owned).map((volume) => ({ ...volume, read: Boolean(volume.read) })));
    } catch (failure) {
      const message = getApiError(failure, "Não foi possível carregar os demais Volumes.");
      toast.error(`${message} Tente novamente em instantes.`, { id: `collection-edition-${item.edition.id}-error` });
    }
    finally { setLoading(false); }
  }
  const path = publicEditionPath(work.slug, item.edition.chronologicalNumber);
  const missingCount = Math.max(0, item.progress.total - item.progress.owned);
  const isComplete = ["Completa", "Cancelada"].includes(item.edition.brazilPublicationStatus)
    && item.progress.total > 0 && missingCount === 0;
  const isUpToDate = ["Em andamento", "Em hiato"].includes(item.edition.brazilPublicationStatus)
    && item.progress.total > 0 && missingCount === 0;
  const collectionStatus = isComplete ? "completa" : isUpToDate ? "em dia" : "incompleta";
  const editionTitle = `${item.edition.chronologicalNumber}ª edição`;
  const navigationState = { catalogOrigin: "collection", returnTo: `${location.pathname}${location.search}` };
  return (
    <section className="border-b border-border pb-3 pt-6 first:pt-0" aria-label={`${item.edition.chronologicalNumber}ª edição de ${work.title}`}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2 py-3">
        <div className="min-w-0 flex-[1_1_24rem]">
          <h2 className="break-words text-lg font-bold text-white" aria-label={`${work.title} · ${editionTitle} · Coleção ${collectionStatus}`}>
            {work.title}<span className="mx-2"> · </span>{editionTitle}<span className="mx-2"> · </span>
            <span className="font-bold">Coleção {collectionStatus}</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{item.progress.owned}/{item.progress.total} volumes adquiridos · {item.progress.read}/{item.progress.owned} {item.progress.read === 1 ? "volume lido" : "volumes lidos"}{missingCount > 0 && <> · {item.progress.wished}/{missingCount} {item.progress.wished === 1 ? "volume faltante desejado" : "volumes faltantes desejados"}</>}</p>
        </div>
        <CollectionManagementMenu path={path} progress={item.progress} navigationState={navigationState} collectionPage={collectionPage} editionLabel={`${editionTitle} de ${work.title}`} />
      </div>
      <Link
        to={path}
        state={navigationState}
        aria-label={`Ver ${item.edition.chronologicalNumber}ª edição de ${work.title}`}
        className="group -ml-3 flex w-[calc(100%+0.75rem)] items-center gap-3 rounded-2xl bg-background px-3 py-3 text-left transition-colors hover:bg-sidebar-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="min-w-0 flex-1">
          <span className="flex min-w-0 gap-3 overflow-x-auto">
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
      {!expanded && item.volumesPagination.totalPages > 1 && <button type="button" disabled={loading} onClick={() => void expand()} className="mt-2 text-xs font-bold text-primary">{loading ? "Carregando volumes..." : "Mostrar todos os volumes adquiridos"}</button>}
    </section>
  );
}
