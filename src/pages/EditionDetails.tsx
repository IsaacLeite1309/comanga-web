import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Globe2, LayoutGrid, List, Loader2, Lock, Pencil, Plus, Settings, Trash2 } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { api } from "@/services/api";

interface LocationState {
  workId?: number;
  editionId?: number;
}

interface OptionValue {
  id: number | string;
  label: string;
}

interface Edition {
  id: number;
  workId: number;
  chronologicalNumber: number;
  coverUrl?: string | null;
  visibility: string;
  brazilianPublisher: OptionValue | null;
  editionType: OptionValue | null;
  coverType: OptionValue | null;
  format: OptionValue | null;
  brazilPublicationStatus: string | OptionValue | null;
  volumesCount?: number;
}

interface EditionResponse {
  edition: Edition;
}

interface Volume {
  id: number;
  editionId: number;
  number: number;
  singleVolume?: boolean | null;
  coverUrl?: string | null;
  pages?: number | null;
  price?: number | null;
  priceCurrency?: string | null;
  releaseDatePrecision?: string | null;
  releaseYear?: number | null;
  releaseMonth?: number | null;
  releaseDay?: number | null;
  isbn10?: string | null;
  isbn13?: string | null;
  affiliateLink?: string | null;
  synopsis?: string | null;
  visibility: string;
}

interface VolumesResponse {
  volumes: Volume[];
  pagination: {
    total: number;
  };
}

function getApiError(error: unknown, fallback: string) {
  if (isAxiosError(error) && error.response?.data?.error) {
    return error.response.data.error;
  }

  return fallback;
}

function buildWorkPath(workSlug = "") {
  return `/admin/editar-mangas/obras/${encodeURIComponent(decodeURIComponent(workSlug))}`;
}

function formatEditionNumber(chronologicalNumber: number) {
  return `${chronologicalNumber}ª Edição`;
}

function formatVolumesCount(count?: number) {
  const total = count ?? 0;
  return `${total} ${total === 1 ? "volume" : "volumes"}`;
}

function formatVolumeNumber(number: number, singleVolume?: boolean | null) {
  if (singleVolume) return "Volume único";
  return `Volume ${number}`;
}

function formatPrice(price?: number | null, currency = "R$") {
  if (price === null || price === undefined) return "-";

  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

  return `${currency} ${formatted}`;
}

function getPublicationStatusLabel(status: Edition["brazilPublicationStatus"]) {
  return typeof status === "string" ? status : status?.label || "-";
}

function isPublicVisibility(visibility: string) {
  return visibility !== "Privado";
}

function visibilityActionClassName(visibility: string) {
  return isPublicVisibility(visibility)
    ? "border-green-500/40 bg-green-500/15 text-green-300"
    : "border-yellow-500/40 bg-yellow-500/15 text-yellow-300";
}

function VisibilityIcon({ visibility, className = "h-3.5 w-3.5" }: { visibility: string; className?: string }) {
  const Icon = isPublicVisibility(visibility) ? Globe2 : Lock;

  return <Icon className={className} />;
}

const EditionDetails = () => {
  const { workSlug = "", editionId = "" } = useParams();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const workPath = useMemo(() => buildWorkPath(workSlug), [workSlug]);
  const [edition, setEdition] = useState<Edition | null>(null);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingVolume, setDeletingVolume] = useState<Volume | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isMobileGrid, setIsMobileGrid] = useState(false);
  const [error, setError] = useState("");
  const showGridView = volumes.length > 0 && (isMobileGrid || viewMode === "grid");
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

    async function loadEdition() {
      setLoading(true);
      setError("");

      try {
        const currentEditionId = editionId || state?.editionId;
        const [editionResponse, volumesResponse] = await Promise.all([
          api.get<EditionResponse>(`/admin/editions/${currentEditionId}`),
          api.get<VolumesResponse>(`/admin/editions/${currentEditionId}/volumes`, {
            params: { order: "ASC", page: 1, limit: 50 },
          }),
        ]);
        if (!isMounted) return;
        setEdition(editionResponse.data.edition);
        setVolumes(volumesResponse.data.volumes);
      } catch (loadError) {
        if (!isMounted) return;
        setError(getApiError(loadError, "Erro ao carregar dados da Edição."));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEdition();

    return () => {
      isMounted = false;
    };
  }, [editionId, state?.editionId]);

  async function confirmDeleteVolume() {
    if (!deletingVolume || deletingId) return;

    setDeletingId(deletingVolume.id);

    try {
      await api.delete(`/admin/volumes/${deletingVolume.id}`);
      setVolumes((current) => current.filter((volume) => volume.id !== deletingVolume.id));
      toast.success("Volume excluído com sucesso.");
      setDeletingVolume(null);
    } catch (deleteError) {
      toast.error(getApiError(deleteError, "Erro ao excluir Volume."));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Carregando dados da Edição...
      </div>
    );
  }

  if (error || !edition) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-sm font-semibold text-red-300">
        {error || "Edição não encontrada."}
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Link
          to={workPath}
          state={{ workId: state?.workId || edition.workId }}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-input px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </Link>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid gap-5 p-4 sm:grid-cols-[180px_1fr] sm:p-5">
            <div className="mx-auto aspect-[2/3] w-40 overflow-hidden rounded-xl border border-border bg-input sm:mx-0 sm:w-full">
              {edition.coverUrl ? (
                <img src={edition.coverUrl} alt={`Capa da ${formatEditionNumber(edition.chronologicalNumber)}`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm font-semibold text-muted-foreground">
                  Sem capa
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-col">
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-bold text-foreground">{formatEditionNumber(edition.chronologicalNumber)}</h1>
                <p className="mt-1 truncate text-lg font-semibold text-muted-foreground">
                  {edition.brazilianPublisher?.label || "Editora não informada"}
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoBlock label="Tipo de edição" value={edition.editionType?.label || "Tipo não informado"} />
                <InfoBlock label="Acabamento" value={edition.coverType?.label || "Acabamento não informado"} />
                <InfoBlock label="Formato" value={edition.format?.label || "Formato não informado"} />
                <InfoBlock label="Status no Brasil" value={getPublicationStatusLabel(edition.brazilPublicationStatus)} />
                <InfoBlock label="Volumes" value={formatVolumesCount(edition.volumesCount)} />
                <InfoBlock label="Visibilidade" value={edition.visibility} badgeClassName={visibilityActionClassName(edition.visibility)} icon={<VisibilityIcon visibility={edition.visibility} />} />
              </div>

              <div className="mt-6 flex justify-end">
                <Link
                  to={`${workPath}/edicoes/${edition.id}/editar`}
                  state={{ workId: state?.workId || edition.workId, editionId: edition.id }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar Edição
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Volumes</h2>
              <p className="text-sm text-muted-foreground">Gerencie os volumes vinculados a esta Edição.</p>
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
                to={`${workPath}/edicoes/${edition.id}/volumes/novo`}
                state={{ workId: state?.workId || edition.workId, editionId: edition.id }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar volume
              </Link>
            </div>
          </div>

          {showGridView && (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {volumes.map((volume) => (
                <article key={volume.id} className="rounded-lg border border-border bg-input p-2">
                  <div className="aspect-[2/3] overflow-hidden rounded-md border border-border bg-card">
                    {volume.coverUrl ? (
                      <img src={volume.coverUrl} alt={`Capa do ${formatVolumeNumber(volume.number, volume.singleVolume)}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-3 text-center text-sm font-semibold text-muted-foreground">
                        Sem capa
                      </div>
                    )}
                  </div>
                  <h3 className="mt-2 truncate text-center text-sm font-bold text-foreground">
                    {formatVolumeNumber(volume.number, volume.singleVolume)}
                  </h3>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      aria-label={`Visibilidade de ${formatVolumeNumber(volume.number, volume.singleVolume)}`}
                      className={visibilityActionClassName(volume.visibility) + " inline-flex h-8 items-center justify-center rounded-md border"}
                    >
                      <VisibilityIcon visibility={volume.visibility} />
                    </button>
                    <Link
                      to={`${workPath}/edicoes/${edition.id}/volumes/${volume.id}`}
                      state={{ workId: state?.workId || edition.workId, editionId: edition.id, volumeId: volume.id }}
                      aria-label={`Gerenciar ${formatVolumeNumber(volume.number, volume.singleVolume)}`}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeletingVolume(volume)}
                      disabled={deletingId === volume.id}
                      aria-label={`Excluir ${formatVolumeNumber(volume.number, volume.singleVolume)}`}
                      className="inline-flex h-8 items-center justify-center rounded-md bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-60"
                    >
                      {deletingId === volume.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {showListView && (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-4 border-b border-border bg-muted/20 px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid-cols-[72px_minmax(120px,1fr)_100px_100px_132px_92px_92px]">
              <span>Capa</span>
              <span>Número</span>
              <span className="hidden md:block">Páginas</span>
              <span className="hidden md:block">Preço</span>
              <span className="hidden md:block">Visibilidade</span>
              <span className="hidden justify-self-center md:block">Gerenciar</span>
              <span className="hidden justify-self-center md:block">Excluir</span>
            </div>

            {volumes.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm font-semibold text-muted-foreground">
                Nenhum Volume cadastrado. Cadastre um volume para completar esta Edição.
              </p>
            ) : (
              volumes.map((volume) => (
                <article
                  key={volume.id}
                  className="grid grid-cols-[72px_minmax(0,1fr)_auto] gap-4 border-b border-border px-4 py-4 last:border-b-0 md:grid-cols-[72px_minmax(120px,1fr)_100px_100px_132px_92px_92px] md:items-center"
                >
                  <div className="aspect-[2/3] w-16 overflow-hidden rounded-md border border-border bg-input">
                    {volume.coverUrl ? (
                      <img src={volume.coverUrl} alt={`Capa do ${formatVolumeNumber(volume.number, volume.singleVolume)}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-semibold text-muted-foreground">
                        Sem capa
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-foreground">{formatVolumeNumber(volume.number, volume.singleVolume)}</h3>
                    <div className="mt-1 flex flex-wrap gap-2 md:hidden">
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                        {volume.pages ? `${volume.pages} páginas` : "Páginas não informadas"}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                        {formatPrice(volume.price, volume.priceCurrency || "R$")}
                      </span>
                    </div>
                  </div>

                  <p className="hidden text-sm font-semibold text-muted-foreground md:block">
                    {volume.pages ? `${volume.pages}` : "-"}
                  </p>
                  <p className="hidden text-sm font-semibold text-muted-foreground md:block">{formatPrice(volume.price, volume.priceCurrency || "R$")}</p>

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
                      to={`${workPath}/edicoes/${edition.id}/volumes/${volume.id}`}
                      state={{ workId: state?.workId || edition.workId, editionId: edition.id, volumeId: volume.id }}
                      aria-label={`Gerenciar ${formatVolumeNumber(volume.number, volume.singleVolume)}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-input text-foreground transition-colors hover:border-primary hover:text-primary md:justify-self-center"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeletingVolume(volume)}
                      disabled={deletingId === volume.id}
                      aria-label={`Excluir ${formatVolumeNumber(volume.number, volume.singleVolume)}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-60 md:justify-self-center"
                    >
                      {deletingId === volume.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
          )}
        </section>

        {deletingVolume && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
            <div className="w-fit max-w-[calc(100vw-2rem)] rounded-2xl border border-red-500/30 bg-card p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-foreground">Excluir Volume</h2>
              <p className="mt-2 whitespace-nowrap text-sm text-muted-foreground max-sm:whitespace-normal">
                Confirme a exclusão do {formatVolumeNumber(deletingVolume.number, deletingVolume.singleVolume)}. Esta ação não pode ser desfeita.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingVolume(null)}
                  disabled={Boolean(deletingId)}
                  className="rounded-lg border border-border bg-input px-4 py-2 text-sm font-bold text-foreground disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteVolume}
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
  icon,
}: {
  label: string;
  value: string;
  badgeClassName?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-input px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 inline-flex max-w-full items-center gap-2 truncate text-base font-bold text-foreground ${badgeClassName ? `rounded-lg border px-3 py-1 text-sm ${badgeClassName}` : ""}`}>
        {icon}
        {value}
      </p>
    </div>
  );
}

export default EditionDetails;


