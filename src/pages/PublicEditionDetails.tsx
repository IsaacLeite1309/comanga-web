import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, BookOpen, Box, Library } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { LoadingState } from "@/components/shared/AsyncState";
import { CatalogCover } from "@/features/public-catalog/CatalogCover";
import { CatalogPagination } from "@/features/public-catalog/CatalogPagination";
import { formatPublicReleaseDate, publicVolumeLabel } from "@/features/public-catalog/publicCatalogFormatters";
import { getPublicEditionDetails } from "@/features/public-catalog/publicCatalogService";
import type {
  PublicEditionDetailsResponse,
  PublicEditionVolumeSummary,
} from "@/features/public-catalog/publicCatalogTypes";
import { getApiError } from "@/lib/apiError";

const PAGE_SIZE = 24;

function positiveInteger(value: string | null, fallback = 1) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function pagesLabel(pages?: number | null) {
  if (!pages) return null;
  return `${pages} ${pages === 1 ? "página" : "páginas"}`;
}

function volumesCount(total: number) {
  return `${total} ${total === 1 ? "Volume" : "Volumes"}`;
}

function MetaItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-input px-3 py-3">
      <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-sm font-bold text-foreground" title={String(value)}>{value}</dd>
    </div>
  );
}

function VolumeCard({ volume, workTitle }: { volume: PublicEditionVolumeSummary; workTitle: string }) {
  const label = publicVolumeLabel(volume);
  const pages = pagesLabel(volume.pages);
  return (
    <article className="min-w-0">
      <Link
        to={`/volumes/${volume.id}`}
        aria-label={`Ver detalhes do ${label}`}
        className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <CatalogCover
          key={volume.coverUrl || "empty"}
          src={volume.coverUrl}
          alt={`Capa do ${label} de ${workTitle}`}
          className="transition-transform group-hover:-translate-y-1"
        />
        <h3 className="mt-2 truncate text-sm font-bold text-foreground group-hover:text-primary sm:text-base">{label}</h3>
      </Link>
      <p className="text-xs font-medium text-muted-foreground">{formatPublicReleaseDate(volume)}</p>
      {pages ? <p className="text-xs text-muted-foreground">{pages}</p> : null}
    </article>
  );
}

function PublicEditionDetails() {
  const { editionId = "" } = useParams();
  const numericEditionId = Number(editionId);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = positiveInteger(searchParams.get("page"));
  const [data, setData] = useState<PublicEditionDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    if (!Number.isInteger(numericEditionId) || numericEditionId <= 0) {
      setData(null);
      setError("Edição não encontrada.");
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError("");
    getPublicEditionDetails(numericEditionId, { page, limit: PAGE_SIZE })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError) => {
        if (!active) return;
        setData(null);
        setError(getApiError(requestError, "Não foi possível carregar esta Edição."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [numericEditionId, page, retry]);

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  if (loading) return <LoadingState message="Carregando Edição..." fullPage />;

  if (error || !data) {
    return (
      <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-4 py-12">
        <section className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center">
          <AlertCircle className="mx-auto h-9 w-9 text-red-400" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold text-foreground">Edição indisponível</h1>
          <p className="mt-2 text-sm text-red-300">{error || "Edição não encontrada."}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setRetry((value) => value + 1)} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              Tentar novamente
            </button>
            <Link to="/pesquisa?tab=editions&sortBy=title&order=ASC&page=1" className="rounded-lg border border-border bg-input px-4 py-2 text-sm font-bold text-foreground">
              Voltar às Edições
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const { edition, volumes, pagination } = data;
  const editionLabel = `${edition.chronologicalNumber}ª Edição`;

  return (
    <div className="min-w-0 flex-1 px-4 py-7 sm:px-6 sm:py-9 xl:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Link to={`/obras/${encodeURIComponent(edition.work.slug)}`} className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar para {edition.work.title}
        </Link>

        <section className="mt-5 grid gap-7 rounded-2xl border border-border bg-card p-4 sm:p-6 md:grid-cols-[14rem_minmax(0,1fr)] lg:grid-cols-[18rem_minmax(0,1fr)]">
          <CatalogCover key={edition.coverUrl || "empty"} src={edition.coverUrl} alt={`Capa da ${editionLabel} de ${edition.work.title}`} eager className="w-full max-w-72 justify-self-center md:max-w-none" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-primary">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>Publicação brasileira</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">{edition.work.title} — {editionLabel}</h1>
            {edition.work.originalTitle ? <p className="mt-1 text-lg font-semibold text-muted-foreground">{edition.work.originalTitle}</p> : null}
            {edition.work.authors.length > 0 ? <p className="mt-2 text-sm font-medium text-muted-foreground">{edition.work.authors.map(({ label }) => label).join(", ")}</p> : null}

            <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
              <MetaItem label="Editora" value={edition.brazilianPublisher.label} />
              <MetaItem label="Tipo" value={edition.editionType.label} />
              <MetaItem label="Formato" value={edition.format.label} />
              <MetaItem label="Acabamento" value={edition.coverType.label} />
              <MetaItem label="Status" value={edition.brazilPublicationStatus} />
              <MetaItem label="Total" value={volumesCount(edition.volumesCount)} />
            </dl>

            <Link to={`/obras/${encodeURIComponent(edition.work.slug)}`} aria-label={`Ver detalhes de ${edition.work.title}`} className="mt-6 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/15">
              Ver detalhes de {edition.work.title}
            </Link>
          </div>
        </section>

        <section className="mt-9" aria-labelledby="volumes-title">
          <div className="flex items-center gap-3">
            <Box className="h-6 w-6 text-primary" aria-hidden="true" />
            <div>
              <h2 id="volumes-title" className="text-2xl font-bold text-foreground">Volumes</h2>
              <p className="text-sm text-muted-foreground">{volumesCount(pagination.total)} públicos nesta Edição</p>
            </div>
          </div>

          {volumes.length > 0 ? (
            <>
              <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" aria-label="Volumes da Edição">
                {volumes.map((volume) => <VolumeCard key={volume.id} volume={volume} workTitle={edition.work.title} />)}
              </div>
              <CatalogPagination pagination={pagination} onPageChange={changePage} ariaLabel="Paginação dos Volumes" />
            </>
          ) : (
            <div className="mt-5 rounded-2xl border border-border bg-card px-4 py-12 text-center">
              <Library className="mx-auto h-9 w-9 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-muted-foreground">Nenhum Volume público cadastrado nesta Edição.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default PublicEditionDetails;
