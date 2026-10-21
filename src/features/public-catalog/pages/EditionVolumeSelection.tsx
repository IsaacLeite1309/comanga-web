import { useState } from "react";
import { BackLink } from "@/components/shared/BackLink";
import { BookOpen, Heart, LibraryBig } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { CatalogCover } from "../CatalogCover";
import { publicVolumeLabel } from "../publicCatalogFormatters";
import { CollectionChangeDialog } from "@/features/personal-library";
import type { PersonalVolume } from "@/features/personal-library";
import { useEditionSelection, type SelectionMode } from "./useEditionSelection";
import { useCatalogErrorToast } from "@/features/public-catalog/useCatalogErrorToast";
import { usePageScrollLock } from "@/hooks/usePageScrollLock";

function SelectableVolume({
  volume,
  workTitle,
  selected,
  mode,
  onToggle,
  disabled,
}: {
  volume: PersonalVolume;
  workTitle: string;
  selected: boolean;
  mode: SelectionMode;
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
          {selected && (mode === "desejos"
            ? <Heart className="h-5 w-5" fill="currentColor" strokeWidth={2.5} />
            : mode === "lidos"
              ? <BookOpen className="h-5 w-5" fill="currentColor" strokeWidth={2.5} />
              : <LibraryBig className="h-5 w-5" fill="currentColor" />)}
        </span>
      </span>
      <CatalogCover
        key={volume.coverUrl || "empty"}
        src={volume.coverUrl}
        alt={`Capa de ${label} de ${workTitle}`}
        className={`transition-all ${selected ? "ring-2 ring-primary" : ""}`}
      />
      <span className={`mt-2 block truncate text-sm font-normal ${selected ? "text-primary" : "text-foreground"}`}>
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
  const selectable = data.volumes.filter((volume) => mode === "colecao" || (mode === "desejos" ? !volume.owned : volume.owned));
  const allSelected = selectable.length > 0 && selectable.every(({ id }) => selectedIds.has(id));
  const noneSelected = selectedIds.size === 0;
  return (
      <footer className="page-gutter fixed bottom-16 left-0 right-0 z-20 bg-background/95 backdrop-blur md:bottom-0 md:left-20 lg:left-56">
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

function selectionEmptyMessage(mode: SelectionMode) {
  if (mode === "lidos") return "Nenhum volume desta edição está na sua coleção.";
  if (mode === "desejos") return "Nenhum volume faltante nesta edição.";
  return "Nenhum volume público cadastrado nesta edição.";
}

function collectionWarnings(data: ReturnType<typeof useEditionSelection>["data"], selectedIds: Set<number>, mode: SelectionMode) {
  if (mode !== "colecao" || !data) return { wishlistVolumes: [], readVolumes: [] };
  return {
    wishlistVolumes: data.volumes.filter((volume) => volume.wished && !volume.owned && selectedIds.has(volume.id)),
    readVolumes: data.volumes.filter((volume) => volume.owned && volume.read && !selectedIds.has(volume.id)),
  };
}

function SelectionLoading({ editionPath }: { editionPath: string }) {
  return (
    <div className="min-w-0 flex-1 bg-background" role="status" aria-label="Carregando seleção de volumes">
      <header className="page-gutter sticky top-0 z-20 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 border-b border-border py-4">
          <BackLink to={editionPath} className="text-sm font-bold text-primary hover:text-primary/80">Cancelar</BackLink>
          <p className="min-w-0 truncate text-center text-sm font-semibold text-foreground sm:text-base">Carregando...</p>
          <button type="button" disabled className="text-sm font-bold text-muted-foreground">OK</button>
        </div>
      </header>

      <main className="page-gutter mx-auto w-full max-w-7xl pb-28 pt-6">
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <div
              key={index}
              className="catalog-skeleton-card relative min-w-0"
              style={{ animationDelay: `${index * 110}ms` }}
            >
              <span className="absolute -left-3 -top-3 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-background">
                <span className="h-9 w-9 rounded-full border-2 border-white/30 bg-background" />
              </span>
              <div className="catalog-skeleton-shape aspect-[2/3] rounded-lg border border-border" />
              <div className="catalog-skeleton-shape mt-2 h-4 w-20 max-w-full rounded" />
            </div>
          ))}
        </div>
      </main>

      <footer className="page-gutter fixed bottom-16 left-0 right-0 z-20 bg-background/95 backdrop-blur md:bottom-0 md:left-20 lg:left-56">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 border-t border-border py-4">
          <button type="button" disabled className="text-sm font-bold text-muted-foreground">Desmarcar todos</button>
          <button type="button" disabled className="text-sm font-bold text-muted-foreground">Selecionar todos</button>
        </div>
      </footer>
    </div>
  );
}

function SelectionContent({ slug, editionNumber, mode }: { slug: string; editionNumber: string; mode: SelectionMode }) {
  const [confirmingCollection, setConfirmingCollection] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const state = useEditionSelection(slug, Number(editionNumber), mode);
  const { data, selectedIds, loading, error, saving, hasChanges } = state;
  usePageScrollLock(loading);
  useCatalogErrorToast(error, state.reload, "edition-volume-selection");
  const visibleVolumes = data?.volumes.filter((volume) => mode === "colecao" || (mode === "desejos" ? !volume.owned : volume.owned)) ?? [];
  const { wishlistVolumes, readVolumes } = collectionWarnings(data, selectedIds, mode);
  const needsConfirmation = wishlistVolumes.length > 0 || readVolumes.length > 0;
  const editionPath = `${location.pathname.startsWith("/colecao/") ? "/colecao" : "/obra"}/${encodeURIComponent(slug)}/edicao/${editionNumber}`;
  const toggleVolume = (volumeId: number) => state.setSelectedIds((current) => {
    const next = new Set(current);
    if (next.has(volumeId)) next.delete(volumeId); else next.add(volumeId);
    return next;
  });
  const saveSelection = () => void state.save().then((saved) => {
    if (!saved) return;
    toast.success(mode === "colecao" ? "Coleção atualizada." : mode === "desejos" ? "Lista de desejos atualizada." : "Volumes lidos atualizados.");
    navigate(editionPath);
  });
  if (loading) return <SelectionLoading editionPath={editionPath} />;

  if (error || !data) {
    return <div className="page-gutter flex min-h-[calc(100dvh-5rem)] items-center justify-center py-12"><BackLink to={editionPath} className="inline-flex text-sm font-bold text-primary">Voltar à Edição</BackLink></div>;
  }

  return (
    <div className="min-w-0 flex-1 bg-background">
      <header className="page-gutter sticky top-0 z-20 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 border-b border-border py-4">
          <BackLink to={editionPath} className="text-sm font-bold text-primary hover:text-primary/80">Cancelar</BackLink>
          <p className="min-w-0 truncate text-center text-sm font-semibold text-foreground sm:text-base">
            {selectedIds.size} de {visibleVolumes.length} selecionados
          </p>
          <button
            type="button"
            disabled={!hasChanges || saving}
            onClick={() => { if (needsConfirmation) setConfirmingCollection(true); else saveSelection(); }}
            className="text-sm font-bold text-primary hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:text-muted-foreground"
          >
            {saving ? "Salvando..." : "OK"}
          </button>
        </div>
      </header>

      <main className="page-gutter mx-auto w-full max-w-7xl pb-28 pt-6">
        {state.message && <p role="status" className="mb-6 text-sm font-semibold text-primary">{state.message}</p>}
        {visibleVolumes.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {visibleVolumes.map((volume) => (
              <SelectableVolume
                key={volume.id}
                volume={volume}
                workTitle={data.edition.work.title}
                selected={selectedIds.has(volume.id)}
                mode={mode}
                disabled={saving}
                onToggle={() => toggleVolume(volume.id)}
              />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-sm font-semibold text-muted-foreground">{selectionEmptyMessage(mode)}</p>
        )}
      </main>

      <SelectionFooter data={data} mode={mode} state={state} />
      {confirmingCollection && <CollectionChangeDialog
        wishlistVolumes={wishlistVolumes.map(publicVolumeLabel)}
        readVolumes={readVolumes.map(publicVolumeLabel)}
        confirmLabel="Salvar"
        onCancel={() => setConfirmingCollection(false)}
        onConfirm={() => {
          setConfirmingCollection(false);
          saveSelection();
        }} />}
    </div>
  );
}

function EditionVolumeSelection({ mode }: { mode: SelectionMode }) {
  const { slug = "", editionNumber = "" } = useParams();
  return <SelectionContent key={`${slug}/${editionNumber}/${mode}`} slug={slug} editionNumber={editionNumber} mode={mode} />;
}

export default EditionVolumeSelection;
