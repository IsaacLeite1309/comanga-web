import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Barcode,
  BookOpen,
  Calendar,
  ChevronRight,
  Plus,
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
import { publicEditionPath, publicVolumePath, publicWorkPath } from "@/features/public-catalog/publicCatalogPaths";

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
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`grid min-w-0 grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2 text-sm ${className}`}>
      <span className="mt-0.5 text-muted-foreground" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <dt className="break-words text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 break-words font-semibold text-foreground">{value}</dd>
      </div>
    </div>
  );
}

function useVolumeDetails(volumeId: number, workSlug: string, editionId: number, retry: number) {
  const [volume, setVolume] = useState<PublicVolume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    if (!workSlug || !Number.isInteger(editionId) || editionId <= 0 || !Number.isInteger(volumeId) || volumeId <= 0) {
      setVolume(null);
      setError("Volume não encontrado.");
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError("");
    getPublicVolumeDetails(volumeId)
      .then((result) => {
        if (!active) return;
        if (result.edition.id !== editionId || result.edition.work.slug !== workSlug) {
          setVolume(null);
          setError("Volume não encontrado.");
          return;
        }
        setVolume(result);
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
  }, [editionId, retry, volumeId, workSlug]);

  return { volume, loading, error };
}

function VolumeUnavailable({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center">
        <AlertCircle className="mx-auto h-9 w-9 text-red-400" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-foreground">Volume indisponível</h1>
        <p className="mt-2 text-sm text-red-300">{error || "Volume não encontrado."}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onRetry} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
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

interface VolumeSectionProps {
  volume: PublicVolume;
  volumeLabel: string;
  editionLabel: string;
}

function VolumeBreadcrumb({ volume, volumeLabel, editionLabel }: VolumeSectionProps) {
  const editionPath = publicEditionPath(volume.edition.work.slug, volume.edition.id);
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex h-16 min-w-0 items-center gap-3 border-b border-border bg-background px-4 md:left-20 sm:px-6 lg:left-64 xl:px-10">
      <Link
        aria-label={`Voltar para ${editionLabel}`}
        to={editionPath}
        className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-base font-bold leading-none text-foreground transition-colors hover:bg-sidebar-accent/30 hover:text-foreground"
      >
        <ArrowLeft className="h-5 w-5 text-primary" aria-hidden="true" />
        Voltar
      </Link>
      <nav className="flex min-w-0 items-center gap-1 text-base font-semibold leading-none" aria-label="Caminho de navegação">
        <Link
          to="/pesquisa?tab=works&sortBy=title&order=ASC&page=1"
          className="shrink-0 rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-sidebar-accent/30 hover:text-foreground"
        >
          Pesquisar
        </Link>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <Link
          to={publicWorkPath(volume.edition.work.slug)}
          className="truncate rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-sidebar-accent/30 hover:text-foreground"
          title={volume.edition.work.title}
        >
          {volume.edition.work.title}
        </Link>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <Link
          to={editionPath}
          className="shrink-0 rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-sidebar-accent/30 hover:text-foreground"
        >
          {editionLabel}
        </Link>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate rounded-lg bg-sidebar-accent/30 px-2 py-1 text-primary" aria-current="page">
          {volumeLabel}
        </span>
      </nav>
    </div>
  );
}

function VolumeCover({ volume, volumeLabel }: Omit<VolumeSectionProps, "editionLabel">) {
  const hasNavigation = volume.previousVolume || volume.nextVolume;
  return (
    <section className="relative isolate flex min-h-[34rem] items-center justify-center overflow-hidden border-b border-border p-8 sm:min-h-[42rem] sm:p-12 lg:fixed lg:bottom-0 lg:left-64 lg:top-16 lg:h-[calc(100dvh-4rem)] lg:w-[calc((100vw-16rem)*0.425)] lg:min-h-0 lg:border-b-0 lg:border-r">
      {volume.coverUrl ? (
        <>
          <img src={volume.coverUrl} alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full scale-110 object-cover opacity-45 blur-2xl" />
          <div className="absolute inset-0 -z-10 bg-background/55 backdrop-blur-sm" aria-hidden="true" />
        </>
      ) : (
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-card via-background to-input" aria-hidden="true" />
      )}
      <div className="flex w-full max-w-md flex-col items-center gap-6 lg:-translate-y-3">
        <CatalogCover
          key={volume.coverUrl || "empty"}
          src={volume.coverUrl}
          alt={`Capa do ${volumeLabel} de ${volume.edition.work.title}`}
          eager
          className="w-full max-w-sm shadow-2xl shadow-black/50 sm:max-w-md lg:max-w-[23rem]"
        />
        {hasNavigation ? (
          <nav className="grid w-full grid-cols-2 gap-3" aria-label="Navegação entre Volumes">
            {volume.previousVolume ? (
              <Link
                to={publicVolumePath(volume.edition.work.slug, volume.edition.id, volume.previousVolume.id)}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-sidebar px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-sidebar-accent"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {publicVolumeLabel(volume.previousVolume)}
              </Link>
            ) : null}
            {volume.nextVolume ? (
              <Link
                to={publicVolumePath(volume.edition.work.slug, volume.edition.id, volume.nextVolume.id)}
                className="col-start-2 inline-flex w-fit items-center gap-2 justify-self-end rounded-full bg-sidebar px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-sidebar-accent"
              >
                {publicVolumeLabel(volume.nextVolume)}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </section>
  );
}

function PurchaseActions({ affiliateLink }: { affiliateLink?: string | null }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        className="relative inline-flex min-h-[3.25rem] items-center justify-center rounded-full border border-sidebar-foreground/30 bg-sidebar px-4 py-3 text-base font-bold text-white transition-colors hover:bg-sidebar-accent"
      >
        <Plus className="absolute left-5 h-5 w-5" strokeWidth={3} aria-hidden="true" />
        Coleção
      </button>
      <button
        type="button"
        className="relative inline-flex min-h-[3.25rem] items-center justify-center rounded-full border border-sidebar-foreground/30 bg-sidebar px-4 py-3 text-base font-bold text-white transition-colors hover:bg-sidebar-accent"
      >
        <Plus className="absolute left-5 h-5 w-5" strokeWidth={3} aria-hidden="true" />
        Lista de Desejos
      </button>
      {affiliateLink ? (
        <a
          href={affiliateLink}
          target="_blank"
          rel="noreferrer noopener"
          className="col-span-2 mt-3 inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-full border border-[#ff9900]/45 bg-white px-5 py-2.5 text-base font-semibold text-black transition-colors hover:border-[#ff9900] hover:bg-[#fffaf3]"
        >
          Comprar na <img src="/amazon-logo.svg" alt="Amazon" className="h-8 w-8 -translate-y-px object-contain" />
        </a>
      ) : (
        <div className="relative col-span-2 mt-3 overflow-hidden rounded-full">
          <button
            type="button"
            disabled
            className="inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 border border-[#ff9900]/25 bg-white/45 px-5 py-2.5 text-base font-semibold text-background/70"
          >
            Comprar na <img src="/amazon-logo.svg" alt="Amazon" className="h-8 w-8 -translate-y-px object-contain opacity-55" />
          </button>
          <div className="pointer-events-none absolute left-[19%] top-1/2 flex h-8 w-[62%] -translate-y-1/2 rotate-[4deg] items-center justify-center bg-red-500 px-3 text-xs font-bold uppercase tracking-wide text-white shadow-sm shadow-black/30">
            Indisponível
          </div>
        </div>
      )}
    </div>
  );
}

function VolumeArticle({ volume, volumeLabel, editionLabel }: VolumeSectionProps) {
  const volumePageTitle = `${volume.edition.work.title} ${volumeLabel.replace(/^Volume\b/, "volume")}`;
  const editionPath = publicEditionPath(volume.edition.work.slug, volume.edition.id);
  return (
    <article className="flex min-w-0 flex-col bg-card/30 lg:col-start-2 lg:row-start-1">
      <div className="px-5 pb-0 pt-6 sm:px-8">
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">{volumePageTitle}</h1>
        <div className="mt-4 flex flex-wrap gap-x-7 gap-y-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Obra</p>
            <Link
              to={publicWorkPath(volume.edition.work.slug)}
              aria-label={`Ver detalhes da Obra ${volume.edition.work.title}`}
              className="-ml-3 -mt-1 inline-flex w-fit rounded-2xl bg-background px-3 py-2 text-left transition-colors hover:bg-sidebar-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <p className="text-2xl font-bold text-primary">{volume.edition.work.title}</p>
            </Link>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Edição</p>
            <Link
              to={editionPath}
              aria-label={`Ver ${editionLabel}`}
              className="-ml-3 -mt-1 inline-flex w-fit rounded-2xl bg-background px-3 py-2 text-left transition-colors hover:bg-sidebar-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <p className="text-2xl font-bold text-primary">{editionLabel} · {volume.edition.brazilianPublisher.label}</p>
            </Link>
          </div>
        </div>
        <div className="mt-6 w-full border-t border-border pt-6">
          <PurchaseActions affiliateLink={volume.affiliateLink} />
        </div>
        <div className="mt-6 border-b border-border" aria-hidden="true" />
      </div>
      {volume.synopsis ? (
        <section className="px-5 pb-0 pt-6 sm:px-8" aria-labelledby="synopsis-title">
          <h2 id="synopsis-title" className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Sinopse</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-foreground sm:text-base">{volume.synopsis}</p>
          <div className="mt-6 border-b border-border" aria-hidden="true" />
        </section>
      ) : null}
      <section className="px-5 py-6 sm:px-8" aria-labelledby="details-title">
        <h2 id="details-title" className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Detalhes</h2>
        <dl className="mt-4 grid gap-x-3 gap-y-3 sm:grid-cols-3">
          {volume.releaseYear ? (
            <DetailRow
              icon={<Calendar className="h-4 w-4" />}
              label="Lançamento"
              value={formatPublicReleaseDate(volume)}
              className="sm:col-start-1 sm:row-start-1"
            />
          ) : null}
          {volume.price !== null && volume.price !== undefined ? (
            <DetailRow
              icon={<ShoppingCart className="h-4 w-4" />}
              label="Preço"
              value={formatPrice(volume.price, volume.priceCurrency)}
              className="sm:col-start-2 sm:row-start-1"
            />
          ) : null}
          {volume.pages ? (
            <DetailRow
              icon={<BookOpen className="h-4 w-4" />}
              label="Número de páginas"
              value={`${volume.pages} ${volume.pages === 1 ? "página" : "páginas"}`}
              className="sm:col-start-3 sm:row-start-1"
            />
          ) : null}
          {volume.isbn10 ? (
            <DetailRow
              icon={<Barcode className="h-4 w-4" />}
              label="ISBN-10"
              value={volume.isbn10}
              className="sm:col-start-1 sm:row-start-2"
            />
          ) : null}
          {volume.isbn13 ? (
            <DetailRow
              icon={<Barcode className="h-4 w-4" />}
              label="ISBN-13"
              value={volume.isbn13}
              className="sm:col-start-2 sm:row-start-2"
            />
          ) : null}
        </dl>
      </section>
    </article>
  );
}

function PublicVolumeDetails() {
  const { slug = "", editionId = "", volumeId = "" } = useParams();
  const [retry, setRetry] = useState(0);
  const { volume, loading, error } = useVolumeDetails(Number(volumeId), slug, Number(editionId), retry);
  if (loading) return <LoadingState message="Carregando Volume..." fullPage />;
  if (!volume) return <VolumeUnavailable error={error} onRetry={() => setRetry((value) => value + 1)} />;
  const volumeLabel = publicVolumeLabel(volume);
  const editionLabel = `${volume.edition.chronologicalNumber}ª edição`;

  return (
    <div className="min-w-0 flex-1 bg-background px-4 pb-7 pt-16 sm:px-6 sm:pb-9 xl:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <VolumeBreadcrumb volume={volume} volumeLabel={volumeLabel} editionLabel={editionLabel} />
      </div>
      <div className="-mx-4 grid min-h-[calc(100dvh-7.5rem)] w-[calc(100%+2rem)] sm:-mx-6 sm:w-[calc(100%+3rem)] xl:-mx-10 xl:w-[calc(100%+5rem)] lg:items-start lg:grid-cols-[minmax(22rem,0.85fr)_minmax(24rem,1.15fr)]">
        <VolumeCover volume={volume} volumeLabel={volumeLabel} />
        <VolumeArticle volume={volume} volumeLabel={volumeLabel} editionLabel={editionLabel} />
      </div>
    </div>
  );
}

export default PublicVolumeDetails;
