import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  ExternalLink,
  FileText,
  Hash,
  ShoppingCart,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { LoadingState } from "@/components/shared/AsyncState";
import { CatalogCover } from "@/features/public-catalog/CatalogCover";
import {
  formatPublicReleaseDate,
  publicVolumeLabel,
} from "@/features/public-catalog/publicCatalogFormatters";
import { getPublicVolumeDetails } from "@/features/public-catalog/publicCatalogService";
import type { PublicVolumeDetails as PublicVolume } from "@/features/public-catalog/publicCatalogTypes";
import { getApiError } from "@/lib/apiError";

function formatPrice(price: number, currency: string) {
  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
  return `${currency} ${formatted}`;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2 text-sm">
      <span className="mt-0.5 text-muted-foreground" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 break-words font-semibold text-foreground">{value}</dd>
      </div>
    </div>
  );
}

function PublicVolumeDetails() {
  const { volumeId = "" } = useParams();
  const numericVolumeId = Number(volumeId);
  const [volume, setVolume] = useState<PublicVolume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    if (!Number.isInteger(numericVolumeId) || numericVolumeId <= 0) {
      setVolume(null);
      setError("Volume não encontrado.");
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError("");
    getPublicVolumeDetails(numericVolumeId)
      .then((result) => {
        if (active) setVolume(result);
      })
      .catch((requestError) => {
        if (!active) return;
        setVolume(null);
        setError(getApiError(requestError, "Não foi possível carregar este Volume."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [numericVolumeId, retry]);

  if (loading) return <LoadingState message="Carregando Volume..." fullPage />;

  if (error || !volume) {
    return (
      <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-4 py-12">
        <section className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center">
          <AlertCircle className="mx-auto h-9 w-9 text-red-400" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold text-foreground">Volume indisponível</h1>
          <p className="mt-2 text-sm text-red-300">{error || "Volume não encontrado."}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setRetry((value) => value + 1)} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              Tentar novamente
            </button>
            <Link to="/pesquisa?tab=editions&sortBy=title&order=ASC&page=1" className="rounded-lg border border-border bg-input px-4 py-2 text-sm font-bold text-foreground">
              Voltar ao catálogo
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const volumeLabel = publicVolumeLabel(volume);
  const editionLabel = `${volume.edition.chronologicalNumber}ª Edição`;
  const hasReleaseDate = Boolean(volume.releaseYear);

  return (
    <div className="min-w-0 flex-1 bg-background">
      <header className="border-b border-border bg-background/95 px-4 py-4 backdrop-blur sm:px-6 xl:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4">
          <Link aria-label={`Voltar para ${editionLabel}`} to={`/edicoes/${volume.edition.id}`} className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">{volumeLabel}</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100dvh-4.5rem)] w-full max-w-7xl lg:grid-cols-[minmax(22rem,1.05fr)_minmax(24rem,0.95fr)]">
        <section className="relative isolate flex min-h-[34rem] items-center justify-center overflow-hidden border-b border-border p-8 sm:min-h-[42rem] sm:p-12 lg:min-h-0 lg:border-b-0 lg:border-r">
          {volume.coverUrl ? (
            <>
              <img src={volume.coverUrl} alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full scale-110 object-cover opacity-45 blur-2xl" />
              <div className="absolute inset-0 -z-10 bg-background/55 backdrop-blur-sm" aria-hidden="true" />
            </>
          ) : (
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-card via-background to-input" aria-hidden="true" />
          )}
          <CatalogCover
            key={volume.coverUrl || "empty"}
            src={volume.coverUrl}
            alt={`Capa do ${volumeLabel} de ${volume.edition.work.title}`}
            eager
            className="w-full max-w-sm shadow-2xl shadow-black/50 sm:max-w-md lg:max-w-[25rem]"
          />
        </section>

        <article className="flex min-w-0 flex-col bg-card/30">
          <div className="border-b border-border px-5 py-6 sm:px-8">
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>{editionLabel}</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              {volume.edition.work.title} — {volumeLabel}
            </h1>
            {volume.edition.work.originalTitle ? (
              <p className="mt-1 text-base font-semibold text-muted-foreground">{volume.edition.work.originalTitle}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
              <Link to={`/edicoes/${volume.edition.id}`} className="text-primary hover:underline">Ver {editionLabel}</Link>
              <Link to={`/obras/${encodeURIComponent(volume.edition.work.slug)}`} aria-label={`Ver detalhes de ${volume.edition.work.title}`} className="text-primary hover:underline">
                Ver detalhes de {volume.edition.work.title}
              </Link>
            </div>
          </div>

          {volume.affiliateLink ? (
            <div className="border-b border-border px-5 py-4 sm:px-8">
              <a href={volume.affiliateLink} target="_blank" rel="noreferrer noopener" className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-foreground px-5 py-3 text-base font-bold text-background transition-opacity hover:opacity-90">
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                Comprar em loja parceira
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          ) : null}

          {volume.synopsis ? (
            <section className="border-b border-border px-5 py-6 sm:px-8" aria-labelledby="synopsis-title">
              <h2 id="synopsis-title" className="text-lg font-bold text-foreground">Sinopse</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">{volume.synopsis}</p>
            </section>
          ) : null}

          <section className="px-5 py-6 sm:px-8" aria-labelledby="details-title">
            <h2 id="details-title" className="text-lg font-bold text-foreground">Detalhes</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {hasReleaseDate ? (
                <DetailRow icon={<Calendar className="h-4 w-4" />} label="Lançamento" value={formatPublicReleaseDate(volume)} />
              ) : null}
              {volume.pages ? (
                <DetailRow icon={<FileText className="h-4 w-4" />} label="Páginas" value={`${volume.pages} ${volume.pages === 1 ? "página" : "páginas"}`} />
              ) : null}
              {volume.price !== null && volume.price !== undefined ? (
                <DetailRow icon={<ShoppingCart className="h-4 w-4" />} label="Preço" value={formatPrice(volume.price, volume.priceCurrency)} />
              ) : null}
              {volume.isbn10 ? (
                <DetailRow icon={<Hash className="h-4 w-4" />} label="ISBN-10" value={volume.isbn10} />
              ) : null}
              {volume.isbn13 ? (
                <DetailRow icon={<Hash className="h-4 w-4" />} label="ISBN-13" value={volume.isbn13} />
              ) : null}
            </dl>
          </section>
        </article>
      </div>
    </div>
  );
}

export default PublicVolumeDetails;
