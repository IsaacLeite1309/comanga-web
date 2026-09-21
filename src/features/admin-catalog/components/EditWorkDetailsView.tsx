import { Link } from "react-router-dom";
import { Loader2, Pencil, Plus, Settings, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/AsyncState";
import { CatalogVisibilityAction } from "./CatalogVisibility";
import { visibilityActionClassName } from "./catalogVisibilityStyles";
import { CatalogViewToggle, DeleteCatalogItemDialog, DetailInfoBlock } from "./AdminCatalogDetailShared";
import { editionAdminPath, newEditionAdminPath, workEditAdminPath } from "../domain/catalogPaths";
import {
  formatEditionNumber,
  formatVolumesCount,
  type EditionDetail,
  type WorkDetail,
} from "../domain/adminCatalogDetails";
import type { CatalogViewMode } from "../hooks/useCatalogDetailView";

interface EditionActions {
  deletingId: number | null;
  updatingVisibilityId: number | null;
  onDelete: (edition: EditionDetail) => void;
  onToggleVisibility: (edition: EditionDetail) => void;
}

export function WorkSummary({
  work,
  workSlug,
}: {
  work: WorkDetail;
  workSlug: string;
}) {
  const authorsText = work.authors
    .map((item) => item.author?.label)
    .filter(Boolean)
    .join(", ") || "Autor não informado";

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid gap-5 p-4 sm:grid-cols-[180px_1fr] sm:p-5">
        <div className="mx-auto aspect-[2/3] w-40 overflow-hidden rounded-xl border border-border bg-input sm:mx-0 sm:w-full">
          {work.coverUrl ? (
            <img src={work.coverUrl} alt={`Capa de ${work.title}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm font-semibold text-muted-foreground">
              Sem capa
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold text-foreground">{work.title}</h1>
            {work.originalTitle && (
              <p className="mt-1 truncate text-lg font-semibold text-muted-foreground">{work.originalTitle}</p>
            )}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <DetailInfoBlock
              label="Tipo de obra"
              value={work.type?.label || "Tipo não informado"}
              withIconLayout={false}
            />
            <DetailInfoBlock label="Autor" value={authorsText} withIconLayout={false} />
            <DetailInfoBlock
              label="País de origem"
              value={work.country || "País não informado"}
              withIconLayout={false}
            />
            <DetailInfoBlock
              label="Visibilidade"
              value={work.visibility}
              badgeClassName={visibilityActionClassName(work.visibility)}
              withIconLayout={false}
            />
          </div>
          <div className="mt-6 flex justify-end">
            <Link
              to={workEditAdminPath(workSlug)}
              state={{ workId: work.id }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar Obra
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function EditionGridCard({
  edition,
  work,
  workSlug,
  actions,
}: {
  edition: EditionDetail;
  work: WorkDetail;
  workSlug: string;
  actions: EditionActions;
}) {
  const label = formatEditionNumber(edition.chronologicalNumber);

  return (
    <article className="rounded-lg border border-border bg-input p-2">
      <div className="aspect-[2/3] overflow-hidden rounded-md border border-border bg-card">
        {edition.coverUrl ? (
          <img src={edition.coverUrl} alt={`Capa da ${label}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-3 text-center text-sm font-semibold text-muted-foreground">
            Sem capa (cadastre o Volume 1)
          </div>
        )}
      </div>
      <h3 className="mt-2 truncate text-center text-sm font-bold text-foreground">{label}</h3>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <CatalogVisibilityAction
          visibility={edition.visibility}
          ariaLabel={`Alterar visibilidade da ${label}`}
          onClick={() => actions.onToggleVisibility(edition)}
          loading={actions.updatingVisibilityId === edition.id}
          showLabel={false}
          className="h-8 w-full rounded-md"
        />
        <Link
          to={editionAdminPath(workSlug, edition.id)}
          state={{ workId: work.id, editionId: edition.id }}
          aria-label={`Gerenciar ${label}`}
          className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Settings className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          onClick={() => actions.onDelete(edition)}
          disabled={actions.deletingId === edition.id}
          aria-label={`Excluir ${label}`}
          className="inline-flex h-8 items-center justify-center rounded-md bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-60"
        >
          {actions.deletingId === edition.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </article>
  );
}

function EditionListRow({
  edition,
  work,
  workSlug,
  actions,
}: {
  edition: EditionDetail;
  work: WorkDetail;
  workSlug: string;
  actions: EditionActions;
}) {
  const label = formatEditionNumber(edition.chronologicalNumber);
  const updating = actions.updatingVisibilityId === edition.id;
  const deleting = actions.deletingId === edition.id;

  return (
    <article className="grid grid-cols-[72px_minmax(0,1fr)_auto] gap-4 border-b border-border px-4 py-4 last:border-b-0 md:grid-cols-[72px_minmax(140px,1fr)_120px_minmax(140px,0.9fr)_100px_132px_92px_92px] md:items-center">
      <div className="aspect-[2/3] w-16 overflow-hidden rounded-md border border-border bg-input">
        {edition.coverUrl ? (
          <img src={edition.coverUrl} alt={`Capa da ${label}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-semibold text-muted-foreground">
            Sem capa (cadastre o Volume 1)
          </div>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="truncate font-bold text-foreground">{label}</h3>
        <div className="mt-1 flex flex-wrap gap-2 md:hidden">
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            {edition.brazilianPublisher?.label || "Editora não informada"}
          </span>
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            {edition.editionType?.label || "Tipo não informado"}
          </span>
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            {formatVolumesCount(edition.volumesCount)}
          </span>
        </div>
      </div>
      <p className="hidden text-sm font-semibold text-muted-foreground md:block">
        {edition.brazilianPublisher?.label || "Editora não informada"}
      </p>
      <p className="hidden text-sm font-semibold text-muted-foreground md:block">{edition.editionType?.label || "-"}</p>
      <p className="hidden text-sm font-semibold text-muted-foreground md:block">{formatVolumesCount(edition.volumesCount)}</p>
      <div className="hidden justify-self-start md:block">
        <CatalogVisibilityAction
          visibility={edition.visibility}
          ariaLabel={`Alterar visibilidade da ${label}`}
          onClick={() => actions.onToggleVisibility(edition)}
          loading={updating}
        />
      </div>
      <div className="flex items-center justify-start gap-2 md:contents">
        <CatalogVisibilityAction
          visibility={edition.visibility}
          ariaLabel={`Alterar visibilidade compacta da ${label}`}
          onClick={() => actions.onToggleVisibility(edition)}
          loading={updating}
          className="h-7 min-w-0 px-2 text-xs md:hidden"
        />
        <Link
          to={editionAdminPath(workSlug, edition.id)}
          state={{ workId: work.id, editionId: edition.id }}
          aria-label={`Gerenciar ${label}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-input text-foreground transition-colors hover:border-primary hover:text-primary md:justify-self-center"
        >
          <Settings className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          onClick={() => actions.onDelete(edition)}
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

function EditionsListHeader() {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-4 border-b border-border bg-muted/20 px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid-cols-[72px_minmax(140px,1fr)_120px_minmax(140px,0.9fr)_100px_132px_92px_92px]">
      <span>Capa</span>
      <span>Número da edição</span>
      <span className="hidden md:block">Editora</span>
      <span className="hidden md:block">Tipo de edição</span>
      <span className="hidden md:block">Volumes</span>
      <span className="hidden md:block">Visibilidade</span>
      <span className="hidden justify-self-center md:block">Gerenciar</span>
      <span className="hidden justify-self-center md:block">Excluir</span>
    </div>
  );
}

function EditionsList({
  editions,
  work,
  workSlug,
  actions,
}: {
  editions: EditionDetail[];
  work: WorkDetail;
  workSlug: string;
  actions: EditionActions;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <EditionsListHeader />
      {editions.length === 0 ? (
        <EmptyState message="Nenhuma Edição cadastrada. Cadastre uma edição para começar a detalhar esta Obra." />
      ) : (
        editions.map((edition) => (
          <EditionListRow
            key={edition.id}
            edition={edition}
            work={work}
            workSlug={workSlug}
            actions={actions}
          />
        ))
      )}
    </div>
  );
}

export function WorkEditionsSection({
  work,
  workSlug,
  editions,
  viewMode,
  showGridView,
  actions,
  onViewModeChange,
}: {
  work: WorkDetail;
  workSlug: string;
  editions: EditionDetail[];
  viewMode: CatalogViewMode;
  showGridView: boolean;
  actions: EditionActions;
  onViewModeChange: (viewMode: CatalogViewMode) => void;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Edições</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie as publicações físicas vinculadas a esta Obra.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <CatalogViewToggle viewMode={viewMode} onChange={onViewModeChange} />
          <Link
            to={newEditionAdminPath(workSlug)}
            state={{ workId: work.id }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar edição
          </Link>
        </div>
      </div>
      {showGridView ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {editions.map((edition) => (
            <EditionGridCard
              key={edition.id}
              edition={edition}
              work={work}
              workSlug={workSlug}
              actions={actions}
            />
          ))}
        </div>
      ) : (
        <EditionsList editions={editions} work={work} workSlug={workSlug} actions={actions} />
      )}
    </section>
  );
}

export function DeleteEditionDialog({
  edition,
  deleting,
  onCancel,
  onConfirm,
}: {
  edition: EditionDetail;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <DeleteCatalogItemDialog
      title="Excluir Edição"
      description={`Confirme a exclusão da ${formatEditionNumber(edition.chronologicalNumber)}. Esta ação não pode ser desfeita.`}
      deleting={deleting}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
