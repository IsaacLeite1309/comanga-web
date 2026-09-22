import { useEffect, useMemo, useState } from "react";
import { Check, Heart } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { CatalogCover } from "@/features/public-catalog/CatalogCover";
import { publicVolumeLabel } from "@/features/public-catalog/publicCatalogFormatters";
import { getPublicEditionDetails } from "@/features/public-catalog/publicCatalogService";
import type {
  PublicEditionDetailsResponse,
  PublicEditionVolumeSummary,
} from "@/features/public-catalog/publicCatalogTypes";
import { LoadingState } from "@/components/shared/AsyncState";
import { getApiError } from "@/lib/apiError";

const PAGE_SIZE = 50;

async function loadCompleteEdition(editionId: number) {
  const firstPage = await getPublicEditionDetails(editionId, { page: 1, limit: PAGE_SIZE });
  if (firstPage.pagination.totalPages <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.pagination.totalPages - 1 }, (_, index) => (
      getPublicEditionDetails(editionId, { page: index + 2, limit: PAGE_SIZE })
    )),
  );
  return {
    ...firstPage,
    volumes: [firstPage, ...remainingPages].flatMap(({ volumes }) => volumes),
  };
}

function SelectableVolume({
  volume,
  workTitle,
  selected,
  useHeart,
  onToggle,
}: {
  volume: PublicEditionVolumeSummary;
  workTitle: string;
  selected: boolean;
  useHeart: boolean;
  onToggle: () => void;
}) {
  const label = publicVolumeLabel(volume);
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${selected ? "Desmarcar" : "Selecionar"} ${label}`}
      onClick={onToggle}
      className="group relative min-w-0 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="absolute -left-3 -top-3 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-background" aria-hidden="true">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-white/60 bg-background text-transparent group-hover:border-primary"
          }`}
        >
          {selected && (useHeart
            ? <Heart className="h-5 w-5" fill="currentColor" strokeWidth={2.5} />
            : <Check className="h-6 w-6" strokeWidth={3} />)}
        </span>
      </span>
      <CatalogCover
        key={volume.coverUrl || "empty"}
        src={volume.coverUrl}
        alt={`Capa de ${label} de ${workTitle}`}
        className={`transition-all ${selected ? "ring-2 ring-primary" : ""}`}
      />
      <span className={`mt-2 block truncate text-sm font-bold ${selected ? "text-primary" : "text-foreground"}`}>
        {label}
      </span>
    </button>
  );
}

function EditionVolumeSelection() {
  const { editionId = "", mode = "", slug } = useParams();
  const location = useLocation();
  const numericEditionId = Number(editionId);
  const navigate = useNavigate();
  const isCollectionContext = location.pathname.startsWith("/colecao/");
  const editionPath = slug
    ? `${isCollectionContext ? "/colecao" : "/obras"}/${encodeURIComponent(slug)}/edicao/${editionId}`
    : "";
  const [data, setData] = useState<PublicEditionDetailsResponse | null>(null);
  // Futuramente, estes IDs virão da Estante ou da Lista de Desejos. Por ora, a tela é somente visual.
  const [initialSelectedIds] = useState<Set<number>>(() => new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const validMode = mode === "estante" || mode === "desejos";

  useEffect(() => {
    let active = true;
    if (!slug || !validMode || !Number.isInteger(numericEditionId) || numericEditionId <= 0) {
      setError("Seleção de Volumes inválida.");
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    loadCompleteEdition(numericEditionId)
      .then((result) => {
        if (!active) return;
        if (result.edition.work.slug !== slug) {
          setData(null);
          setError("Seleção de Volumes inválida.");
          return;
        }
        setData(result);
      })
      .catch((requestError) => {
        if (active) setError(getApiError(requestError, "Não foi possível carregar os Volumes."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [numericEditionId, slug, validMode]);

  const toggleVolume = (volumeId: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(volumeId)) next.delete(volumeId);
      else next.add(volumeId);
      return next;
    });
  };

  const allSelected = Boolean(data?.volumes.length) && data.volumes.every(({ id }) => selectedIds.has(id));
  const noneSelected = selectedIds.size === 0;
  const hasChanges = useMemo(() => (
    selectedIds.size !== initialSelectedIds.size
    || [...selectedIds].some((id) => !initialSelectedIds.has(id))
  ), [initialSelectedIds, selectedIds]);

  if (loading) return <LoadingState message="Carregando Volumes..." fullPage />;

  if (error || !data) {
    return (
      <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-4 py-12">
        <div className="text-center">
          <p className="font-semibold text-red-300">{error || "Edição não encontrada."}</p>
          <Link to={editionPath} className="mt-4 inline-flex text-sm font-bold text-primary">Voltar à Edição</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1 bg-background">
      <header className="sticky top-0 z-20 bg-background/95 px-4 backdrop-blur sm:px-6 xl:px-10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 border-b border-border py-4">
          <Link to={editionPath} className="text-sm font-bold text-primary hover:text-primary/80">Cancelar</Link>
          <p className="min-w-0 truncate text-center text-sm font-semibold text-foreground sm:text-base">
            {selectedIds.size} de {data.volumes.length} selecionados
          </p>
          <button
            type="button"
            disabled={!hasChanges}
            onClick={() => navigate(editionPath)}
            className="text-sm font-bold text-primary hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:text-muted-foreground"
          >
            OK
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 xl:px-10">
        {data.volumes.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {data.volumes.map((volume) => (
              <SelectableVolume
                key={volume.id}
                volume={volume}
                workTitle={data.edition.work.title}
                selected={selectedIds.has(volume.id)}
                useHeart={mode === "desejos"}
                onToggle={() => toggleVolume(volume.id)}
              />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-sm font-semibold text-muted-foreground">Nenhum Volume público cadastrado nesta Edição.</p>
        )}
      </main>

      <footer className="fixed bottom-16 left-0 right-0 z-20 bg-background/95 px-4 backdrop-blur md:bottom-0 md:left-20 lg:left-64 sm:px-6 xl:px-10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 border-t border-border py-4">
          <button
            type="button"
            disabled={noneSelected}
            onClick={() => setSelectedIds(new Set())}
            className="text-sm font-bold text-primary hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:text-muted-foreground"
          >
            Desmarcar todos
          </button>
          <button
            type="button"
            disabled={allSelected}
            onClick={() => setSelectedIds(new Set(data.volumes.map(({ id }) => id)))}
            className="text-sm font-bold text-primary hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:text-muted-foreground"
          >
            Selecionar todos
          </button>
        </div>
      </footer>
    </div>
  );
}

export default EditionVolumeSelection;
