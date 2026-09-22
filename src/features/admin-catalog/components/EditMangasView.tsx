import { ArrowDownAZ, ArrowUpAZ, Check, ChevronDown, LayoutGrid, List, Loader2, Pencil, Search, Settings, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState, LoadingState } from "@/components/shared/AsyncState";
import { useDropdown } from "@/hooks/useDropdown";
import { CatalogVisibilityAction } from "./CatalogVisibility";
import { workAdminPath, workEditAdminPath } from "../domain/catalogPaths";
import { EditMangasPageModel } from "../hooks/useEditMangasPage";
import { FilterOption, formatEditionsCount, WorkSummary } from "../pages/editMangasModel";

function FilterDropdown({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  const { isOpen, closeDropdown, toggleDropdown, rootProps } = useDropdown();
  const selectedOption = options.find((option) => option.value === value) || options[0];

  function selectOption(nextValue: string) {
    onChange(nextValue);
    closeDropdown();
  }

  return (
    <div {...rootProps} className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-input px-3 text-left text-base font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/40"
        aria-expanded={isOpen}
        aria-label={label}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-30 w-full overflow-hidden rounded-lg border border-primary bg-background shadow-2xl">
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => selectOption(option.value)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-base font-semibold transition-colors ${
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                <span>{option.label}</span>
                {selected && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ViewModePicker({ model }: { model: EditMangasPageModel }) {
  return (
    <div className="hidden justify-end md:flex">
      <div className="inline-flex rounded-xl border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => model.setViewMode("list")}
          className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors ${
            model.viewMode === "list"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <List className="h-3.5 w-3.5" />
          Lista
        </button>
        <button
          type="button"
          onClick={() => model.setViewMode("grid")}
          className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors ${
            model.viewMode === "grid"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Grade
        </button>
      </div>
    </div>
  );
}

function WorkFilters({ model }: { model: EditMangasPageModel }) {
  return (
    <section className="grid gap-3 rounded-xl border border-border bg-card p-4 lg:grid-cols-[minmax(420px,1fr)_180px_180px_220px]">
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={model.searchTerm}
          onChange={(event) => model.setSearchTerm(event.target.value)}
          placeholder="Buscar por título ou autor"
          className="h-12 w-full rounded-xl border border-border bg-input pl-10 pr-3 text-base font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </label>
      <FilterDropdown
        label="Filtrar por tipo"
        value={model.typeId}
        options={model.typeFilterOptions}
        onChange={model.changeType}
      />
      <FilterDropdown
        label="Filtrar por país"
        value={model.countryId}
        options={model.countryFilterOptions}
        onChange={model.changeCountry}
      />
      <FilterDropdown
        label="Filtrar por visibilidade"
        value={model.visibility}
        options={model.visibilityFilterOptions}
        onChange={model.changeVisibility}
      />
    </section>
  );
}

function WorkCover({ work, compact = false }: { work: WorkSummary; compact?: boolean }) {
  return (
    <div className={compact
      ? "aspect-[2/3] overflow-hidden rounded-md border border-border bg-input"
      : "aspect-[2/3] w-16 overflow-hidden rounded-md border border-border bg-input"}
    >
      {work.coverUrl ? (
        <img src={work.coverUrl} alt={`Capa de ${work.title}`} className="h-full w-full object-cover" />
      ) : (
        <div className={`flex h-full w-full items-center justify-center text-center font-semibold text-muted-foreground ${
          compact ? "px-3 text-sm" : "px-2 text-xs"
        }`}>
          Sem capa
        </div>
      )}
    </div>
  );
}

function WorkManageActions({ model, work, compact = false }: {
  model: EditMangasPageModel;
  work: WorkSummary;
  compact?: boolean;
}) {
  const sizeClass = compact ? "h-8" : "h-10 w-10";
  const radiusClass = compact ? "rounded-md" : "rounded-lg";
  return (
    <>
      <Link
        to={workEditAdminPath(work.slug)}
        state={{ workId: work.id }}
        aria-label={`Editar ${work.title}`}
        className={`inline-flex items-center justify-center border border-border bg-input text-foreground transition-colors hover:border-primary hover:text-primary ${sizeClass} ${radiusClass} ${compact ? "" : "md:justify-self-center"}`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Link>
      <Link
        to={workAdminPath(work.slug)}
        state={{ workId: work.id }}
        aria-label={`Gerenciar edições de ${work.title}`}
        className={`inline-flex items-center justify-center border border-border bg-input text-foreground transition-colors hover:border-primary hover:text-primary ${sizeClass} ${radiusClass} ${compact ? "" : "md:justify-self-center"}`}
      >
        <Settings className="h-3.5 w-3.5" />
      </Link>
      <button
        type="button"
        onClick={() => model.setDeletingWork(work)}
        aria-label={`Excluir ${work.title}`}
        className={`inline-flex items-center justify-center bg-red-500 text-white transition-colors hover:bg-red-600 ${sizeClass} ${radiusClass} ${compact ? "" : "md:justify-self-center"}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </>
  );
}

function WorksGrid({ model }: { model: EditMangasPageModel }) {
  if (!model.showGridView) return null;
  return (
    <section className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {model.works.map((work) => (
        <article key={work.id} className="rounded-lg border border-border bg-card p-2">
          <WorkCover work={work} compact />
          <h2 className="mt-2 truncate text-center text-sm font-bold text-foreground">{work.title}</h2>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            <CatalogVisibilityAction
              visibility={work.visibility}
              ariaLabel={`Alterar visibilidade de ${work.title}`}
              onClick={() => void model.toggleVisibility(work)}
              loading={model.updatingVisibilityId === work.id}
              showLabel={false}
              className="h-8 w-full rounded-md"
            />
            <WorkManageActions model={model} work={work} compact />
          </div>
        </article>
      ))}
    </section>
  );
}

function SortHeader({ model }: { model: EditMangasPageModel }) {
  const SortIcon = model.order === "ASC" ? ArrowDownAZ : ArrowUpAZ;
  return (
    <button
      type="button"
      onClick={model.toggleTitleSort}
      className="inline-flex items-center justify-start gap-2 justify-self-start text-left text-muted-foreground"
    >
      TÍTULO
      <SortIcon className="h-3.5 w-3.5 shrink-0 opacity-100" />
    </button>
  );
}

function WorksListHeader({ model }: { model: EditMangasPageModel }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-muted/20 py-3 pl-5 pr-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid-cols-[72px_minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,0.72fr)_minmax(0,0.72fr)_minmax(0,0.55fr)_118px_76px_76px_76px]">
      <span className="justify-self-start">Capa</span>
      <SortHeader model={model} />
      <span className="hidden justify-self-start md:block">AUTOR</span>
      <span className="hidden justify-self-start md:block">PAÍS DE ORIGEM</span>
      <span className="hidden justify-self-start md:block">TIPO DE OBRA</span>
      <span className="hidden justify-self-start md:block">EDIÇÕES</span>
      <span className="hidden justify-self-start md:block">VISIBILIDADE</span>
      <span className="hidden justify-self-center md:block">EDITAR</span>
      <span className="hidden justify-self-center md:block">GERENCIAR EDIÇÕES</span>
      <span className="hidden justify-self-center md:block">EXCLUIR</span>
    </div>
  );
}

function WorkTitle({ model, work }: { model: EditMangasPageModel; work: WorkSummary }) {
  return (
    <div className="min-w-0">
      <h2 className="truncate text-base font-bold text-foreground">{work.title}</h2>
      <div className="mt-2 flex flex-wrap gap-2 md:hidden">
        <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
          {work.type?.label || "Tipo não informado"}
        </span>
        <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
          {work.country || "País não informado"}
        </span>
        <CatalogVisibilityAction
          visibility={work.visibility}
          ariaLabel={`Alterar visibilidade compacta de ${work.title}`}
          onClick={() => void model.toggleVisibility(work)}
          loading={model.updatingVisibilityId === work.id}
          className="h-7 min-w-0 px-2 text-xs"
        />
      </div>
    </div>
  );
}

function WorkListRow({ model, work }: { model: EditMangasPageModel; work: WorkSummary }) {
  return (
    <article className="grid grid-cols-[72px_minmax(0,1fr)_auto] gap-3 border-b border-border py-4 pl-5 pr-3 last:border-b-0 md:grid-cols-[72px_minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,0.72fr)_minmax(0,0.72fr)_minmax(0,0.55fr)_118px_76px_76px_76px] md:items-center">
      <WorkCover work={work} />
      <WorkTitle model={model} work={work} />
      <div className="hidden min-w-0 text-sm font-semibold text-muted-foreground md:block">
        {(work.authors || []).map((author) => author.label).join(", ") || "Sem autor"}
      </div>
      <div className="hidden text-sm font-semibold text-muted-foreground md:block">
        {work.country || "-"}
      </div>
      <div className="hidden text-sm font-semibold text-muted-foreground md:block">
        {work.type?.label || "-"}
      </div>
      <div className="hidden text-sm font-semibold text-muted-foreground md:block">
        {formatEditionsCount(work.editionsCount)}
      </div>
      <div className="hidden justify-self-start md:block">
        <CatalogVisibilityAction
          visibility={work.visibility}
          ariaLabel={`Alterar visibilidade de ${work.title}`}
          onClick={() => void model.toggleVisibility(work)}
          loading={model.updatingVisibilityId === work.id}
        />
      </div>
      <div className="flex items-center justify-start gap-2 md:contents">
        <WorkManageActions model={model} work={work} />
      </div>
    </article>
  );
}

function WorksListBody({ model }: { model: EditMangasPageModel }) {
  if (model.loading) return <LoadingState message="Carregando Obras..." />;
  if (model.error) {
    return <div className="px-4 py-12 text-center text-sm font-semibold text-red-300">{model.error}</div>;
  }
  if (!model.hasWorks) return <EmptyState message={model.emptyWorksMessage} />;
  return <>{model.works.map((work) => <WorkListRow key={work.id} model={model} work={work} />)}</>;
}

function WorksPagination({ model }: { model: EditMangasPageModel }) {
  if (!model.showPagination) return null;
  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>Exibindo {model.works.length} de {model.pagination.total} Obras</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => model.setPage((current) => Math.max(current - 1, 1))}
          disabled={model.page <= 1}
          className="rounded-lg border border-border bg-input px-3 py-2 font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="min-w-16 text-center font-semibold text-foreground">
          {model.pagination.page} / {model.pagination.totalPages}
        </span>
        <button
          type="button"
          onClick={() => model.setPage((current) => Math.min(current + 1, model.pagination.totalPages))}
          disabled={model.page >= model.pagination.totalPages}
          className="rounded-lg border border-border bg-input px-3 py-2 font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}

function WorksList({ model }: { model: EditMangasPageModel }) {
  if (!model.showListView) return null;
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <WorksListHeader model={model} />
      <WorksListBody model={model} />
      <WorksPagination model={model} />
    </section>
  );
}

function DeleteWorkDialog({ model }: { model: EditMangasPageModel }) {
  if (!model.deletingWork) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
      <div className="w-fit max-w-[calc(100vw-2rem)] rounded-2xl border border-red-500/30 bg-card p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-foreground">Excluir Obra</h2>
        <p className="mt-2 whitespace-nowrap text-sm text-muted-foreground max-sm:whitespace-normal">
          Confirme a exclusão de {model.deletingWork.title}. Esta ação não pode ser desfeita.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => model.setDeletingWork(null)}
            disabled={model.isDeleting}
            className="rounded-lg border border-border bg-input px-4 py-2 text-sm font-bold text-foreground disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void model.confirmDeleteWork()}
            disabled={model.isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {model.isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirmar exclusão
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditMangasView({ model }: { model: EditMangasPageModel }) {
  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Gerenciar Mangás</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Localize Obras cadastradas, revise metadados e controle a visibilidade no catálogo.
          </p>
        </div>
        <ViewModePicker model={model} />
        <WorkFilters model={model} />
        <WorksGrid model={model} />
        <WorksList model={model} />
      </div>
      <DeleteWorkDialog model={model} />
    </div>
  );
}
