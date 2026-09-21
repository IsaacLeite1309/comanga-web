import { Link } from "react-router-dom";
import { Loader2, Pencil, Plus, Settings, Trash2 } from "lucide-react";
import { VisibilityIcon } from "./CatalogVisibility";
import { visibilityActionClassName } from "./catalogVisibilityStyles";
import { CatalogViewToggle, DeleteCatalogItemDialog, DetailInfoBlock } from "./AdminCatalogDetailShared";
import { editionEditAdminPath, newVolumeAdminPath, volumeEditAdminPath } from "../domain/catalogPaths";
import {
  formatEditionNumber,
  formatPrice,
  formatVolumeNumber,
  formatVolumesCount,
  getPublicationStatusLabel,
  type EditionDetail,
  type VolumeDetail,
} from "../domain/adminCatalogDetails";
import type { CatalogViewMode } from "../hooks/useCatalogDetailView";

interface VolumeActions {
  deletingId: number | null;
  onDelete: (volume: VolumeDetail) => void;
}

interface VolumeNavigation {
  workSlug: string;
  workId: number;
  editionId: number;
}

export function EditionSummary({
  edition,
  workId,
  workSlug,
}: {
  edition: EditionDetail;
  workId: number;
  workSlug: string;
}) {
  const label = formatEditionNumber(edition.chronologicalNumber);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid gap-5 p-4 sm:grid-cols-[180px_1fr] sm:p-5">
        <div className="mx-auto aspect-[2/3] w-40 overflow-hidden rounded-xl border border-border bg-input sm:mx-0 sm:w-full">
          {edition.coverUrl ? (
            <img src={edition.coverUrl} alt={`Capa da ${label}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm font-semibold text-muted-foreground">
              Sem capa
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold text-foreground">{label}</h1>
            <p className="mt-1 truncate text-lg font-semibold text-muted-foreground">
              {edition.brazilianPublisher?.label || "Editora não informada"}
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailInfoBlock label="Tipo de edição" value={edition.editionType?.label || "Tipo não informado"} />
            <DetailInfoBlock label="Acabamento" value={edition.coverType?.label || "Acabamento não informado"} />
            <DetailInfoBlock label="Formato" value={edition.format?.label || "Formato não informado"} />
            <DetailInfoBlock label="Status no Brasil" value={getPublicationStatusLabel(edition.brazilPublicationStatus)} />
            <DetailInfoBlock label="Volumes" value={formatVolumesCount(edition.volumesCount)} />
            <DetailInfoBlock
              label="Visibilidade"
              value={edition.visibility}
              badgeClassName={visibilityActionClassName(edition.visibility)}
              icon={<VisibilityIcon visibility={edition.visibility} />}
            />
          </div>
          <div className="mt-6 flex justify-end">
            <Link
              to={editionEditAdminPath(workSlug, edition.id)}
              state={{ workId, editionId: edition.id }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar Edição
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function VolumeGridCard({
  volume,
  navigation,
  actions,
}: {
  volume: VolumeDetail;
  navigation: VolumeNavigation;
  actions: VolumeActions;
}) {
  const label = formatVolumeNumber(volume.number, volume.singleVolume);
  const deleting = actions.deletingId === volume.id;

  return (
    <article className="rounded-lg border border-border bg-input p-2">
      <div className="aspect-[2/3] overflow-hidden rounded-md border border-border bg-card">
        {volume.coverUrl ? (
          <img src={volume.coverUrl} alt={`Capa do ${label}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-3 text-center text-sm font-semibold text-muted-foreground">
            Sem capa
          </div>
        )}
      </div>
      <h3 className="mt-2 truncate text-center text-sm font-bold text-foreground">{label}</h3>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <button
          type="button"
          aria-label={`Visibilidade de ${label}`}
          className={visibilityActionClassName(volume.visibility) + " inline-flex h-8 items-center justify-center rounded-md border"}
        >
          <VisibilityIcon visibility={volume.visibility} />
        </button>
        <Link
          to={volumeEditAdminPath(navigation.workSlug, navigation.editionId, volume.id)}
          state={{ workId: navigation.workId, editionId: navigation.editionId, volumeId: volume.id }}
          aria-label={`Gerenciar ${label}`}
          className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Settings className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          onClick={() => actions.onDelete(volume)}
          disabled={deleting}
          aria-label={`Excluir ${label}`}
          className="inline-flex h-8 items-center justify-center rounded-md bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-60"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </article>
  );
}

function VolumeListRow({
  volume,
  navigation,
  actions,
}: {
  volume: VolumeDetail;
  navigation: VolumeNavigation;
  actions: VolumeActions;
}) {
  const label = formatVolumeNumber(volume.number, volume.singleVolume);
  const price = formatPrice(volume.price, volume.priceCurrency || "R$");
  const deleting = actions.deletingId === volume.id;

  return (
    <article className="grid grid-cols-[72px_minmax(0,1fr)_auto] gap-4 border-b border-border px-4 py-4 last:border-b-0 md:grid-cols-[72px_minmax(120px,1fr)_100px_100px_132px_92px_92px] md:items-center">
      <div className="aspect-[2/3] w-16 overflow-hidden rounded-md border border-border bg-input">
        {volume.coverUrl ? (
          <img src={volume.coverUrl} alt={`Capa do ${label}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-semibold text-muted-foreground">
            Sem capa
          </div>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="truncate font-bold text-foreground">{label}</h3>
        <div className="mt-1 flex flex-wrap gap-2 md:hidden">
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            {volume.pages ? `${volume.pages} páginas` : "Páginas não informadas"}
          </span>
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            {price}
          </span>
        </div>
      </div>
      <p className="hidden text-sm font-semibold text-muted-foreground md:block">
        {volume.pages ? `${volume.pages}` : "-"}
      </p>
      <p className="hidden text-sm font-semibold text-muted-foreground md:block">{price}</p>
      <div className="hidden justify-self-start md:block">
        <span className={visibilityActionClassName(volume.visibility) + " inline-flex h-10 min-w-[118px] items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold"}>
          <VisibilityIcon visibility={volume.visibility} />
          {volume.visibility}
        </span>
      </div>
      <div className="flex items-center justify-start gap-2 md:contents">
        <span className={visibilityActionClassName(volume.visibility) + " inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-bold md:hidden"}>
          <VisibilityIcon visibility={volume.visibility} className="h-3.5 w-3.5" />
          {volume.visibility}
        </span>
        <Link
          to={volumeEditAdminPath(navigation.workSlug, navigation.editionId, volume.id)}
          state={{ workId: navigation.workId, editionId: navigation.editionId, volumeId: volume.id }}
          aria-label={`Gerenciar ${label}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-input text-foreground transition-colors hover:border-primary hover:text-primary md:justify-self-center"
        >
          <Settings className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          onClick={() => actions.onDelete(volume)}
          disabled={deleting}
          aria-label={`Excluir ${label}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-60 md:justify-self-center"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </article>
  );
}

function VolumesListHeader() {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-4 border-b border-border bg-muted/20 px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid-cols-[72px_minmax(120px,1fr)_100px_100px_132px_92px_92px]">
      <span>Capa</span>
      <span>Número</span>
      <span className="hidden md:block">Páginas</span>
      <span className="hidden md:block">Preço</span>
      <span className="hidden md:block">Visibilidade</span>
      <span className="hidden justify-self-center md:block">Gerenciar</span>
      <span className="hidden justify-self-center md:block">Excluir</span>
    </div>
  );
}

function VolumesList({
  volumes,
  navigation,
  actions,
}: {
  volumes: VolumeDetail[];
  navigation: VolumeNavigation;
  actions: VolumeActions;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <VolumesListHeader />
      {volumes.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm font-semibold text-muted-foreground">
          Nenhum Volume cadastrado. Cadastre um volume para completar esta Edição.
        </p>
      ) : (
        volumes.map((volume) => (
          <VolumeListRow
            key={volume.id}
            volume={volume}
            navigation={navigation}
            actions={actions}
          />
        ))
      )}
    </div>
  );
}

export function EditionVolumesSection({
  edition,
  volumes,
  navigation,
  viewMode,
  showGridView,
  actions,
  onViewModeChange,
}: {
  edition: EditionDetail;
  volumes: VolumeDetail[];
  navigation: VolumeNavigation;
  viewMode: CatalogViewMode;
  showGridView: boolean;
  actions: VolumeActions;
  onViewModeChange: (viewMode: CatalogViewMode) => void;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Volumes</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os volumes vinculados a esta Edição.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <CatalogViewToggle viewMode={viewMode} onChange={onViewModeChange} />
          <Link
            to={newVolumeAdminPath(navigation.workSlug, edition.id)}
            state={{ workId: navigation.workId, editionId: edition.id }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar volume
          </Link>
        </div>
      </div>
      {showGridView ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {volumes.map((volume) => (
            <VolumeGridCard
              key={volume.id}
              volume={volume}
              navigation={navigation}
              actions={actions}
            />
          ))}
        </div>
      ) : (
        <VolumesList volumes={volumes} navigation={navigation} actions={actions} />
      )}
    </section>
  );
}

export function DeleteVolumeDialog({
  volume,
  deleting,
  onCancel,
  onConfirm,
}: {
  volume: VolumeDetail;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <DeleteCatalogItemDialog
      title="Excluir Volume"
      description={`Confirme a exclusão do ${formatVolumeNumber(volume.number, volume.singleVolume)}. Esta ação não pode ser desfeita.`}
      deleting={deleting}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
