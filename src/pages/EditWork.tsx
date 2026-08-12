import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, LayoutGrid, List, Loader2, Pencil, Plus, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { getApiError } from "@/lib/apiError";
import {
  editionAdminPath,
  newEditionAdminPath,
  workAdminPath,
  workEditAdminPath,
} from "@/lib/catalogPaths";
import { CatalogVisibilityAction } from "@/components/catalog/CatalogVisibility";
import { visibilityActionClassName } from "@/components/catalog/catalogVisibilityStyles";
import { EmptyState, LoadingState } from "@/components/shared/AsyncState";

interface OptionValue {
  id: number | string;
  label: string;
}

interface WorkDetail {
  id: number;
  slug: string;
  title: string;
  originalTitle?: string | null;
  coverUrl?: string | null;
  country?: string | null;
  type?: OptionValue | null;
  visibility: "Privado" | "Público";
  authors: Array<{
    author: OptionValue | null;
    roles: string[];
  }>;
}

interface WorkDetailResponse {
  work: WorkDetail;
}

interface Edition {
  id: number;
  workId: number;
  chronologicalNumber: number;
  coverUrl?: string | null;
  visibility: "Privado" | "Público";
  brazilianPublisher: OptionValue | null;
  editionType: OptionValue | null;
  brazilPublicationStatus: string | OptionValue | null;
  volumesCount?: number;
}

interface EditionsResponse {
  editions: Edition[];
  pagination: {
    total: number;
  };
}

function formatEditionNumber(chronologicalNumber: number) {
  return `${chronologicalNumber}ª Edição`;
}

function formatVolumesCount(count?: number) {
  const total = count ?? 0;
  return `${total} ${total === 1 ? "volume" : "volumes"}`;
}

function getPublicationStatusLabel(status: Edition["brazilPublicationStatus"]) {
  return typeof status === "string" ? status : status?.label || "-";
}

const EditWork = () => {
  const { workSlug = "" } = useParams();
  const [work, setWork] = useState<WorkDetail | null>(null);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingEdition, setDeletingEdition] = useState<Edition | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isMobileGrid, setIsMobileGrid] = useState(false);
  const [error, setError] = useState("");

  const workPath = useMemo(() => workAdminPath(workSlug), [workSlug]);
  const showGridView = editions.length > 0 && (isMobileGrid || viewMode === "grid");
  const showListView = !showGridView;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncMobileView = () => setIsMobileGrid(mediaQuery.matches);

    syncMobileView();
    mediaQuery.addEventListener("change", syncMobileView);

    return () => mediaQuery.removeEventListener("change", syncMobileView);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkHub() {
      setLoading(true);
      setError("");

      try {
        if (!workSlug) throw new Error("Obra não encontrada.");

        const workResponse = await api.get<WorkDetailResponse>(
          `/admin/works/slug/${encodeURIComponent(workSlug)}`,
        );
        const loadedWork = workResponse.data.work;

        const editionsResponse = await api.get<EditionsResponse>(
          `/admin/works/${loadedWork.id}/editions`,
          { params: { order: "DESC", page: 1, limit: 50 } },
        );

        if (!isMounted) return;

        setWork(loadedWork);
        setEditions(editionsResponse.data.editions);
      } catch (loadError) {
        if (!isMounted) return;
        setError(getApiError(loadError, loadError instanceof Error ? loadError.message : "Erro ao carregar dados da Obra."));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadWorkHub();

    return () => {
      isMounted = false;
    };
  }, [workSlug]);

  async function toggleEditionVisibility(edition: Edition) {
    const nextVisibility = edition.visibility === "Público" ? "Privado" : "Público";
    setUpdatingVisibilityId(edition.id);

    try {
      const response = await api.patch<{ edition: Edition }>(`/admin/editions/${edition.id}/visibility`, {
        visibility: nextVisibility,
      });

      setEditions((current) => current.map((item) => (
        item.id === edition.id ? response.data.edition : item
      )));
      toast.success("Visibilidade da Edição atualizada com sucesso.");
    } catch (visibilityError) {
      toast.error(getApiError(visibilityError, "Erro ao alterar visibilidade da Edição."));
    } finally {
      setUpdatingVisibilityId(null);
    }
  }

  async function confirmDeleteEdition() {
    if (!deletingEdition || deletingId) return;

    setDeletingId(deletingEdition.id);

    try {
      await api.delete(`/admin/editions/${deletingEdition.id}`);
      setEditions((current) => current.filter((item) => item.id !== deletingEdition.id));
      toast.success("Edição excluída com sucesso.");
      setDeletingEdition(null);
    } catch (deleteError) {
      toast.error(getApiError(deleteError, "Erro ao excluir Edição."));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <LoadingState message="Carregando dados da Obra..." fullPage />;
  }

  if (error || !work) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-sm font-semibold text-red-300">
        {error || "Obra não encontrada."}
      </div>
    );
  }

  const authorsText = work.authors
    .map((item) => item.author?.label)
    .filter(Boolean)
    .join(", ") || "Autor não informado";

  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Link
          to="/admin/editar-mangas"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-input px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </Link>

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
                <InfoBlock label="Tipo de obra" value={work.type?.label || "Tipo não informado"} />
                <InfoBlock label="Autor" value={authorsText} />
                <InfoBlock label="País de origem" value={work.country || "País não informado"} />
                <InfoBlock label="Visibilidade" value={work.visibility} badgeClassName={visibilityActionClassName(work.visibility)} />
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

        <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Edições</h2>
              <p className="text-sm text-muted-foreground">Gerencie as publicações físicas vinculadas a esta Obra.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="hidden rounded-xl border border-border bg-input p-1 md:inline-flex">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <List className="h-3.5 w-3.5" />
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Grade
                </button>
              </div>
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

          {showGridView && (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {editions.map((edition) => (
                <article key={edition.id} className="rounded-lg border border-border bg-input p-2">
                  <div className="aspect-[2/3] overflow-hidden rounded-md border border-border bg-card">
                    {edition.coverUrl ? (
                      <img src={edition.coverUrl} alt={`Capa da ${formatEditionNumber(edition.chronologicalNumber)}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-3 text-center text-sm font-semibold text-muted-foreground">
                        Sem capa
                      </div>
                    )}
                  </div>
                  <h3 className="mt-2 truncate text-center text-sm font-bold text-foreground">
                    {formatEditionNumber(edition.chronologicalNumber)}
                  </h3>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    <CatalogVisibilityAction
                      visibility={edition.visibility}
                      ariaLabel={`Alterar visibilidade da ${formatEditionNumber(edition.chronologicalNumber)}`}
                      onClick={() => toggleEditionVisibility(edition)}
                      loading={updatingVisibilityId === edition.id}
                      showLabel={false}
                      className="h-8 w-full rounded-md"
                    />
                    <Link
                      to={editionAdminPath(workSlug, edition.id)}
                      state={{ workId: work.id, editionId: edition.id }}
                      aria-label={`Gerenciar ${formatEditionNumber(edition.chronologicalNumber)}`}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeletingEdition(edition)}
                      disabled={deletingId === edition.id}
                      aria-label={`Excluir ${formatEditionNumber(edition.chronologicalNumber)}`}
                      className="inline-flex h-8 items-center justify-center rounded-md bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-60"
                    >
                      {deletingId === edition.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {showListView && (
          <div className="overflow-hidden rounded-xl border border-border">
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

            {editions.length === 0 ? (
              <EmptyState message="Nenhuma Edição cadastrada. Cadastre uma edição para começar a detalhar esta Obra." />
            ) : (
              editions.map((edition) => (
                <article
                  key={edition.id}
                  className="grid grid-cols-[72px_minmax(0,1fr)_auto] gap-4 border-b border-border px-4 py-4 last:border-b-0 md:grid-cols-[72px_minmax(140px,1fr)_120px_minmax(140px,0.9fr)_100px_132px_92px_92px] md:items-center"
                >
                  <div className="aspect-[2/3] w-16 overflow-hidden rounded-md border border-border bg-input">
                    {edition.coverUrl ? (
                      <img
                        src={edition.coverUrl}
                        alt={`Capa da ${formatEditionNumber(edition.chronologicalNumber)}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-semibold text-muted-foreground">
                        Sem capa
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-foreground">{formatEditionNumber(edition.chronologicalNumber)}</h3>
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
                      ariaLabel={`Alterar visibilidade da ${formatEditionNumber(edition.chronologicalNumber)}`}
                      onClick={() => toggleEditionVisibility(edition)}
                      loading={updatingVisibilityId === edition.id}
                    />
                  </div>

                  <div className="flex items-center justify-start gap-2 md:contents">
                    <CatalogVisibilityAction
                      visibility={edition.visibility}
                      ariaLabel={`Alterar visibilidade compacta da ${formatEditionNumber(edition.chronologicalNumber)}`}
                      onClick={() => toggleEditionVisibility(edition)}
                      loading={updatingVisibilityId === edition.id}
                      className="h-7 min-w-0 px-2 text-xs md:hidden"
                    />
                    <Link
                      to={editionAdminPath(workSlug, edition.id)}
                      state={{ workId: work.id, editionId: edition.id }}
                      aria-label={`Gerenciar ${formatEditionNumber(edition.chronologicalNumber)}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-input text-foreground transition-colors hover:border-primary hover:text-primary md:justify-self-center"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeletingEdition(edition)}
                      disabled={deletingId === edition.id}
                      aria-label={`Excluir ${formatEditionNumber(edition.chronologicalNumber)}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-60 md:justify-self-center"
                    >
                      {deletingId === edition.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
          )}
        </section>

        {deletingEdition && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
            <div className="w-fit max-w-[calc(100vw-2rem)] rounded-2xl border border-red-500/30 bg-card p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-foreground">Excluir Edição</h2>
              <p className="mt-2 whitespace-nowrap text-sm text-muted-foreground max-sm:whitespace-normal">
                Confirme a exclusão da {formatEditionNumber(deletingEdition.chronologicalNumber)}. Esta ação não pode ser desfeita.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingEdition(null)}
                  disabled={Boolean(deletingId)}
                  className="rounded-lg border border-border bg-input px-4 py-2 text-sm font-bold text-foreground disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteEdition}
                  disabled={Boolean(deletingId)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {deletingId && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirmar exclusão
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function InfoBlock({
  label,
  value,
  badgeClassName = "",
}: {
  label: string;
  value: string;
  badgeClassName?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-input px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 inline-flex max-w-full truncate text-base font-bold text-foreground ${badgeClassName ? `rounded-lg border px-3 py-1 text-sm ${badgeClassName}` : ""}`}>
        {value}
      </p>
    </div>
  );
}

export default EditWork;


