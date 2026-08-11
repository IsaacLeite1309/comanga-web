import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, DollarSign, FileText, Globe2, Hash, Loader2, Lock, Pencil } from "lucide-react";
import { isAxiosError } from "axios";
import { api } from "@/services/api";

interface LocationState {
  workId?: number;
  editionId?: number;
  volumeId?: number;
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

interface VolumeResponse {
  volume: Volume;
}

function getApiError(error: unknown, fallback: string) {
  if (isAxiosError(error) && error.response?.data?.error) {
    return error.response.data.error;
  }

  return fallback;
}

function buildEditionPath(workSlug = "", editionId = "") {
  return `/admin/editar-mangas/obras/${encodeURIComponent(decodeURIComponent(workSlug))}/edicoes/${editionId}`;
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

function formatReleaseDate(volume: Volume) {
  if (volume.releaseDatePrecision === "Completa" && volume.releaseYear && volume.releaseMonth && volume.releaseDay) {
    return `${String(volume.releaseDay).padStart(2, "0")}/${String(volume.releaseMonth).padStart(2, "0")}/${volume.releaseYear}`;
  }

  if (volume.releaseDatePrecision === "Mes e ano" && volume.releaseYear && volume.releaseMonth) {
    return `${String(volume.releaseMonth).padStart(2, "0")}/${volume.releaseYear}`;
  }

  if (volume.releaseDatePrecision === "Ano" && volume.releaseYear) {
    return String(volume.releaseYear);
  }

  return "-";
}

function isPublicVisibility(visibility: string) {
  return visibility !== "Privado";
}

function visibilityActionClassName(visibility: string) {
  return isPublicVisibility(visibility)
    ? "border-green-500/40 bg-green-500/15 text-green-300"
    : "border-yellow-500/40 bg-yellow-500/15 text-yellow-300";
}

function VisibilityIcon({ visibility, className = "h-4 w-4" }: { visibility: string; className?: string }) {
  const Icon = isPublicVisibility(visibility) ? Globe2 : Lock;

  return <Icon className={className} />;
}

const VolumeDetails = () => {
  const { workSlug = "", editionId = "", volumeId = "" } = useParams();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const editionPath = useMemo(() => buildEditionPath(workSlug, editionId), [workSlug, editionId]);
  const [volume, setVolume] = useState<Volume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadVolume() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get<VolumeResponse>(`/admin/volumes/${volumeId || state?.volumeId}`);
        if (!isMounted) return;
        setVolume(response.data.volume);
      } catch (loadError) {
        if (!isMounted) return;
        setError(getApiError(loadError, "Erro ao carregar dados do Volume."));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadVolume();

    return () => {
      isMounted = false;
    };
  }, [state?.volumeId, volumeId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Carregando dados do Volume...
      </div>
    );
  }

  if (error || !volume) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-sm font-semibold text-red-300">
        {error || "Volume não encontrado."}
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Link
          to={editionPath}
          state={{ workId: state?.workId, editionId: state?.editionId || volume.editionId }}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-input px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid gap-5 p-4 sm:grid-cols-[180px_1fr] sm:p-5">
            <div className="mx-auto aspect-[2/3] w-40 overflow-hidden rounded-xl border border-border bg-input sm:mx-0 sm:w-full">
              {volume.coverUrl ? (
                <img src={volume.coverUrl} alt={`Capa do ${formatVolumeNumber(volume.number, volume.singleVolume)}`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm font-semibold text-muted-foreground">
                  Sem capa
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-col">
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-bold text-foreground">{formatVolumeNumber(volume.number, volume.singleVolume)}</h1>
                <p className="mt-1 truncate text-lg font-semibold text-muted-foreground">
                  {volume.isbn13 || volume.isbn10 || "ISBN não informado"}
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoBlock label="Páginas" value={volume.pages ? String(volume.pages) : "-"} icon={<FileText className="h-4 w-4" />} />
                <InfoBlock label="Preço" value={formatPrice(volume.price, volume.priceCurrency || "R$")} icon={<DollarSign className="h-4 w-4" />} />
                <InfoBlock label="Lançamento" value={formatReleaseDate(volume)} icon={<Calendar className="h-4 w-4" />} />
                <InfoBlock label="ISBN-10" value={volume.isbn10 || "-"} icon={<Hash className="h-4 w-4" />} />
                <InfoBlock label="ISBN-13" value={volume.isbn13 || "-"} icon={<Hash className="h-4 w-4" />} />
                <InfoBlock label="Visibilidade" value={volume.visibility} badgeClassName={visibilityActionClassName(volume.visibility)} icon={<VisibilityIcon visibility={volume.visibility} />} />
              </div>

              {volume.synopsis && (
                <div className="mt-5 rounded-xl border border-border bg-input px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sinopse</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{volume.synopsis}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Link
                  to={`${editionPath}/volumes/${volume.id}/editar`}
                  state={{ workId: state?.workId, editionId: state?.editionId || volume.editionId, volumeId: volume.id }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Pencil className="h-4 w-4" />
                  Editar Volume
                </Link>
              </div>
            </div>
          </div>
        </section>
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

export default VolumeDetails;
