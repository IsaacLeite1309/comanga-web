import { useEffect, useMemo, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ, Check, ChevronDown, LayoutGrid, List, Loader2, Search, Settings, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useDropdown } from "@/hooks/useDropdown";
import { getApiError } from "@/lib/apiError";
import { workAdminPath } from "@/lib/catalogPaths";
import { CatalogVisibilityAction } from "@/components/catalog/CatalogVisibility";
import { EmptyState, LoadingState } from "@/components/shared/AsyncState";

type WorkVisibility = "Privado" | "Público";
type SortOrder = "ASC" | "DESC";

interface OptionValue {
  id: number;
  label: string;
  depends_on?: Array<{
    id: number;
    label: string;
    category: {
      slug: string;
      name: string;
    };
  }>;
}

interface WorkSummary {
  id: number;
  slug: string;
  title: string;
  originalTitle?: string | null;
  coverUrl?: string | null;
  visibility: WorkVisibility;
  type?: OptionValue | null;
  country?: string | null;
  authors?: OptionValue[];
  editionsCount?: number;
}

interface WorksResponse {
  works: WorkSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface WorkTypeOptionsResponse {
  values: OptionValue[];
}

const WORKS_PAGE_SIZE = 8;
const VISIBILITY_OPTIONS: Array<"Todos" | WorkVisibility> = ["Todos", "Privado", "Público"];
const COUNTRY_OPTIONS: FilterOption[] = [
  { value: "Japão", label: "Japão" },
  { value: "Coreia do Sul", label: "Coreia do Sul" },
  { value: "China", label: "China" },
  { value: "Taiwan", label: "Taiwan" },
];

interface FilterOption {
  value: string;
  label: string;
}

function formatEditionsCount(count?: number) {
  const total = count ?? 0;
  return `${total} ${total === 1 ? "edição" : "edições"}`;
}

function buildWorkEditPath(work: WorkSummary) {
  return workAdminPath(work.slug);
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
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

function SortHeader({
  label,
  order,
  onSort,
  className = "",
}: {
  label: string;
  order: SortOrder;
  onSort: () => void;
  className?: string;
}) {
  const SortIcon = order === "ASC" ? ArrowDownAZ : ArrowUpAZ;

  return (
    <button
      type="button"
      onClick={onSort}
      className={`inline-flex items-center justify-start gap-2 justify-self-start text-left text-muted-foreground ${className}`}
    >
      {label}
      <SortIcon className="h-3.5 w-3.5 shrink-0 opacity-100" />
    </button>
  );
}

const EditMangas = () => {
  const [works, setWorks] = useState<WorkSummary[]>([]);
  const [workTypes, setWorkTypes] = useState<OptionValue[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [typeId, setTypeId] = useState("Todos");
  const [countryId, setCountryId] = useState("Todos");
  const [visibility, setVisibility] = useState<"Todos" | WorkVisibility>("Todos");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isMobileGrid, setIsMobileGrid] = useState(false);
  const [order, setOrder] = useState<SortOrder>("ASC");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: WORKS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<number | null>(null);
  const [deletingWork, setDeletingWork] = useState<WorkSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasWorks = works.length > 0;
  const hasActiveFilters = Boolean(debouncedTerm)
    || typeId !== "Todos"
    || countryId !== "Todos"
    || visibility !== "Todos";
  const emptyWorksMessage = hasActiveFilters
    ? "Nenhuma Obra encontrada com os filtros aplicados."
    : "Nenhuma Obra cadastrada. Cadastre novas obras no menu Novo mangá.";
  const showPagination = !loading && !error && hasWorks;
  const showGridView = hasWorks && !loading && !error && (isMobileGrid || viewMode === "grid");
  const showListView = !showGridView;
  const typeFilterOptions = useMemo<FilterOption[]>(() => [
    { value: "Todos", label: "Todos os tipos" },
    ...workTypes.map((type) => ({ value: String(type.id), label: type.label })),
  ], [workTypes]);
  const countryFilterOptions = useMemo<FilterOption[]>(() => [
    { value: "Todos", label: "Todos os países" },
    ...COUNTRY_OPTIONS,
  ], []);
  const visibilityFilterOptions = useMemo<FilterOption[]>(() => (
    VISIBILITY_OPTIONS.map((option) => ({
      value: option,
      label: option === "Todos" ? "Todas as visibilidades" : option,
    }))
  ), []);

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const response = await api.get<WorkTypeOptionsResponse>("/admin/options/tipos-obra", {
          params: {
            order: "ASC",
            page: 1,
            limit: 100,
          },
        });
        setWorkTypes(response.data.values || []);
      } catch {
        toast.error("Erro ao carregar filtros de Obras.");
      }
    }

    loadFilterOptions();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncMobileView = () => setIsMobileGrid(mediaQuery.matches);

    syncMobileView();
    mediaQuery.addEventListener("change", syncMobileView);

    return () => mediaQuery.removeEventListener("change", syncMobileView);
  }, []);

  const requestParams = useMemo(() => ({
    ...(debouncedTerm ? { term: debouncedTerm } : {}),
    ...(typeId !== "Todos" ? { typeId: Number(typeId) } : {}),
    ...(countryId !== "Todos" ? { country: countryId } : {}),
    ...(visibility !== "Todos" ? { visibility } : {}),
    order,
    page,
    limit: WORKS_PAGE_SIZE,
  }), [countryId, debouncedTerm, order, page, typeId, visibility]);

  function toggleTitleSort() {
    setOrder((currentOrder) => currentOrder === "ASC" ? "DESC" : "ASC");
    setPage(1);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadWorks() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get<WorksResponse>("/admin/works", {
          params: requestParams,
        });

        if (!isMounted) return;

        setWorks(response.data.works);
        setPagination(response.data.pagination);
      } catch (loadError) {
        if (!isMounted) return;

        setError(getApiError(loadError, "Erro ao listar Obras."));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadWorks();

    return () => {
      isMounted = false;
    };
  }, [requestParams]);

  async function toggleVisibility(work: WorkSummary) {
    if (updatingVisibilityId) return;

    const nextVisibility: WorkVisibility = work.visibility === "Público" ? "Privado" : "Público";
    setUpdatingVisibilityId(work.id);

    try {
      const response = await api.patch(`/admin/works/${work.id}/visibility`, {
        visibility: nextVisibility,
      });
      const updatedWork = response.data.work as WorkSummary;

      setWorks((currentWorks) => (
        currentWorks.map((currentWork) => (
          currentWork.id === work.id
            ? { ...currentWork, visibility: updatedWork.visibility }
            : currentWork
        ))
      ));
      toast.success("Visibilidade atualizada com sucesso.");
    } catch (visibilityError) {
      toast.error(getApiError(visibilityError, "Erro ao alterar visibilidade da Obra."));
    } finally {
      setUpdatingVisibilityId(null);
    }
  }

  async function confirmDeleteWork() {
    if (!deletingWork || isDeleting) return;

    setIsDeleting(true);

    try {
      await api.delete(`/admin/works/${deletingWork.id}`);
      setWorks((currentWorks) => currentWorks.filter((work) => work.id !== deletingWork.id));
      toast.success("Obra excluída com sucesso.");
      setDeletingWork(null);
    } catch (deleteError) {
      toast.error(getApiError(deleteError, "Erro ao excluir Obra."));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Gerenciar Mangás</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Localize Obras cadastradas, revise metadados e controle a visibilidade no catálogo.
          </p>
        </div>

        <div className="hidden justify-end md:flex">
          <div className="inline-flex rounded-xl border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Grade
            </button>
          </div>
        </div>

        <section className="grid gap-3 rounded-xl border border-border bg-card p-4 lg:grid-cols-[minmax(420px,1fr)_180px_180px_220px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por título ou autor"
              className="h-12 w-full rounded-xl border border-border bg-input pl-10 pr-3 text-base font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/40"
            />
          </label>

          <FilterDropdown
            label="Filtrar por tipo"
            value={typeId}
            options={typeFilterOptions}
            onChange={(value) => { setTypeId(value); setPage(1); }}
          />

          <FilterDropdown
            label="Filtrar por país"
            value={countryId}
            options={countryFilterOptions}
            onChange={(value) => { setCountryId(value); setPage(1); }}
          />

          <FilterDropdown
            label="Filtrar por visibilidade"
            value={visibility}
            options={visibilityFilterOptions}
            onChange={(value) => { setVisibility(value as "Todos" | WorkVisibility); setPage(1); }}
          />
        </section>

        {showGridView && (
          <section className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {works.map((work) => (
              <article key={work.id} className="rounded-lg border border-border bg-card p-2">
                <div className="aspect-[2/3] overflow-hidden rounded-md border border-border bg-input">
                  {work.coverUrl ? (
                    <img src={work.coverUrl} alt={`Capa de ${work.title}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-3 text-center text-sm font-semibold text-muted-foreground">
                      Sem capa
                    </div>
                  )}
                </div>
                <h2 className="mt-2 truncate text-center text-sm font-bold text-foreground">{work.title}</h2>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  <CatalogVisibilityAction
                    visibility={work.visibility}
                    ariaLabel={`Alterar visibilidade de ${work.title}`}
                    onClick={() => toggleVisibility(work)}
                    loading={updatingVisibilityId === work.id}
                    showLabel={false}
                    className="h-8 w-full rounded-md"
                  />
                  <Link
                    to={buildWorkEditPath(work)}
                    state={{ workId: work.id }}
                    aria-label={`Gerenciar ${work.title}`}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-input text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeletingWork(work)}
                    aria-label={`Excluir ${work.title}`}
                    className="inline-flex h-8 items-center justify-center rounded-md bg-red-500 text-white transition-colors hover:bg-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}

        {showListView && (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-4 border-b border-border bg-muted/20 py-3 pl-5 pr-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid-cols-[72px_minmax(150px,1fr)_minmax(120px,0.8fr)_minmax(110px,0.62fr)_minmax(110px,0.62fr)_minmax(90px,0.45fr)_128px_84px_88px]">
            <span className="justify-self-start">Capa</span>
            <SortHeader label="TÍTULO" order={order} onSort={toggleTitleSort} />
            <span className="hidden justify-self-start md:block">AUTOR</span>
            <span className="hidden justify-self-start md:block">PAÍS DE ORIGEM</span>
            <span className="hidden justify-self-start md:block">TIPO DE OBRA</span>
            <span className="hidden justify-self-start md:block">EDIÇÕES</span>
            <span className="hidden justify-self-start md:block">VISIBILIDADE</span>
            <span className="hidden justify-self-center md:block">GERENCIAR</span>
            <span className="hidden justify-self-center md:block">EXCLUIR</span>
          </div>

          {loading ? (
            <LoadingState message="Carregando Obras..." />
          ) : error ? (
            <div className="px-4 py-12 text-center text-sm font-semibold text-red-300">{error}</div>
          ) : !hasWorks ? (
            <EmptyState message={emptyWorksMessage} />
          ) : (
            works.map((work) => (
              <article
                key={work.id}
                className="grid grid-cols-[72px_minmax(0,1fr)_auto] gap-4 border-b border-border py-4 pl-5 pr-3 last:border-b-0 md:grid-cols-[72px_minmax(150px,1fr)_minmax(120px,0.8fr)_minmax(110px,0.62fr)_minmax(110px,0.62fr)_minmax(90px,0.45fr)_128px_84px_88px] md:items-center"
              >
                <div className="aspect-[2/3] w-16 overflow-hidden rounded-md border border-border bg-input">
                  {work.coverUrl ? (
                    <img
                      src={work.coverUrl}
                      alt={`Capa de ${work.title}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-semibold text-muted-foreground">
                      Sem capa
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-foreground">{work.title}</h2>
                  {work.originalTitle && (
                    <p className="truncate text-sm text-muted-foreground">{work.originalTitle}</p>
                  )}
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
                      onClick={() => toggleVisibility(work)}
                      loading={updatingVisibilityId === work.id}
                      className="h-7 min-w-0 px-2 text-xs"
                    />
                  </div>
                </div>

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
                    onClick={() => toggleVisibility(work)}
                    loading={updatingVisibilityId === work.id}
                  />
                </div>

                <div className="flex items-center justify-start gap-2 md:contents">
                  <Link
                    to={buildWorkEditPath(work)}
                    state={{ workId: work.id }}
                    aria-label={`Gerenciar ${work.title}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-input text-foreground transition-colors hover:border-primary hover:text-primary md:justify-self-center"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeletingWork(work)}
                    aria-label={`Excluir ${work.title}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-white transition-colors hover:bg-red-600 md:justify-self-center"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))
          )}

          {showPagination && (
            <div className="flex flex-col gap-3 border-t border-border px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>Exibindo {works.length} de {pagination.total} Obras</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-border bg-input px-3 py-2 font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="min-w-16 text-center font-semibold text-foreground">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((currentPage) => Math.min(currentPage + 1, pagination.totalPages))}
                  disabled={page >= pagination.totalPages}
                  className="rounded-lg border border-border bg-input px-3 py-2 font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </section>
        )}
      </div>

      {deletingWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
          <div className="w-fit max-w-[calc(100vw-2rem)] rounded-2xl border border-red-500/30 bg-card p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-foreground">Excluir Obra</h2>
            <p className="mt-2 whitespace-nowrap text-sm text-muted-foreground max-sm:whitespace-normal">
              Confirme a exclusão de {deletingWork.title}. Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingWork(null)}
                disabled={isDeleting}
                className="rounded-lg border border-border bg-input px-4 py-2 text-sm font-bold text-foreground disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteWork}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirmar exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditMangas;

