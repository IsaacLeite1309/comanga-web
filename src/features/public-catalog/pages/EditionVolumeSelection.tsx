import { Check, Heart } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { CatalogCover } from "../CatalogCover";
import { publicVolumeLabel } from "../publicCatalogFormatters";
import { LoadingState } from "@/components/shared/AsyncState";
import type { PersonalVolume } from "@/features/personal-library";
import { useEditionSelection } from "./useEditionSelection";

function SelectableVolume({
  volume,
  workTitle,
  selected,
  useHeart,
  onToggle,
  disabled,
}: {
  volume: PersonalVolume;
  workTitle: string;
  selected: boolean;
  useHeart: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const label = publicVolumeLabel(volume);
  return (
    <button
      type="button"
      disabled={disabled}
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

function SelectionFooter({ data, mode, state }: {
  data: NonNullable<ReturnType<typeof useEditionSelection>["data"]>;
  mode: string; state: ReturnType<typeof useEditionSelection>;
}) {
  const { selectedIds, saving } = state;
  const selectable = data.volumes.filter((volume) => mode === "estante" || !volume.owned);
  const allSelected = selectable.length > 0 && selectable.every(({ id }) => selectedIds.has(id));
  const noneSelected = selectedIds.size === 0;
  return (
      <footer className="fixed bottom-16 left-0 right-0 z-20 bg-background/95 px-4 backdrop-blur md:bottom-0 md:left-20 lg:left-64 sm:px-6 xl:px-10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 border-t border-border py-4">
          <button
            type="button"
            disabled={noneSelected || saving}
            onClick={() => state.setSelectedIds(new Set())}
            className="text-sm font-bold text-primary hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:text-muted-foreground"
          >
            Desmarcar todos
          </button>
          <button
            type="button"
            disabled={allSelected || saving || selectable.length === 0}
            onClick={() => state.setSelectedIds(new Set(selectable.map(({ id }) => id)))}
            className="text-sm font-bold text-primary hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:text-muted-foreground"
          >
            Selecionar todos
          </button>
        </div>
      </footer>
  );
}

function SelectionContent({ slug, editionNumber, mode }: { slug: string; editionNumber: string; mode: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const state = useEditionSelection(slug, Number(editionNumber), mode);
  const { data, selectedIds, loading, error, saving, hasChanges } = state;
  const editionPath = `${location.pathname.startsWith("/colecao/") ? "/colecao" : "/obras"}/${encodeURIComponent(slug)}/edicao/${editionNumber}`;
  const toggleVolume = (volumeId: number) => state.setSelectedIds((current) => {
    const next = new Set(current);
    if (next.has(volumeId)) next.delete(volumeId); else next.add(volumeId);
    return next;
  });
  if (loading) return <LoadingState message="Carregando Volumes..." fullPage />;

  if (error || !data) {
    return (
      <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-4 py-12">
        <div className="text-center">
          <p role="alert" className="font-semibold text-red-300">{error || "Edição não encontrada."}</p>
          <button type="button" onClick={state.reload} className="mt-4 block text-sm font-bold text-primary">Tentar novamente</button>
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
            disabled={!hasChanges || saving}
            onClick={() => void state.save().then((saved) => { if (saved) navigate(editionPath); })}
            className="text-sm font-bold text-primary hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:text-muted-foreground"
          >
            {saving ? "Salvando..." : "OK"}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 xl:px-10">
        {state.message && <p role="status" className="mb-6 text-sm font-semibold text-primary">{state.message}</p>}
        {mode === "desejos" && data.volumes.some((volume) => volume.owned) && <p className="mb-6 text-sm text-muted-foreground">Volumes já adquiridos não podem entrar na Lista de Desejos.</p>}
        {data.volumes.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {data.volumes.map((volume) => (
              <SelectableVolume
                key={volume.id}
                volume={volume}
                workTitle={data.edition.work.title}
                selected={selectedIds.has(volume.id)}
                useHeart={mode === "desejos"}
                disabled={saving || (mode === "desejos" && volume.owned)}
                onToggle={() => toggleVolume(volume.id)}
              />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-sm font-semibold text-muted-foreground">Nenhum Volume público cadastrado nesta Edição.</p>
        )}
      </main>

      <SelectionFooter data={data} mode={mode} state={state} />
    </div>
  );
}

function EditionVolumeSelection() {
  const { slug = "", editionNumber = "", mode = "" } = useParams();
  return <SelectionContent key={`${slug}/${editionNumber}/${mode}`} slug={slug} editionNumber={editionNumber} mode={mode} />;
}

export default EditionVolumeSelection;
