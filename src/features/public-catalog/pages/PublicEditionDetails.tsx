import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, ChevronRight, Plus } from "lucide-react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { LoadingState } from "@/components/shared/AsyncState";
import { CatalogCover } from "@/features/public-catalog/CatalogCover";
import { CatalogPagination } from "@/features/public-catalog/CatalogPagination";
import { formatPublicationStatus, formatPublicReleaseDate, publicVolumeLabel } from "@/features/public-catalog/publicCatalogFormatters";
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

function volumesCount(total: number) {
  return `${total} ${total === 1 ? "volume" : "volumes"}`;
}

function brazilPublicationPeriod(startYear?: number | null, endYear?: number | null) {
  if (!startYear) return "Não informada";
  return `${startYear}-${endYear ?? "??"}`;
}

function MetaItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function VolumeCard({ volume, workTitle }: { volume: PublicEditionVolumeSummary; workTitle: string }) {
  const label = publicVolumeLabel(volume);
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
    </article>
  );
}

function EditionUnavailable({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center">
        <AlertCircle className="mx-auto h-9 w-9 text-red-400" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-foreground">Edição indisponível</h1>
        <p className="mt-2 text-sm text-red-300">{error || "Edição não encontrada."}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onRetry} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
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

interface EditionContentProps {
  data: PublicEditionDetailsResponse;
  editionPath: string;
  isCollectionContext: boolean;
  onPageChange: (page: number) => void;
}

function EditionContent({ data, editionPath, isCollectionContext, onPageChange }: EditionContentProps) {
  const { edition, volumes, pagination } = data;
  const editionLabel = `${edition.chronologicalNumber}ª edição`;
  const workPath = `/obras/${encodeURIComponent(edition.work.slug)}`;
  const rootPath = isCollectionContext ? "/colecao" : "/pesquisa?tab=works&sortBy=title&order=ASC&page=1";
  const rootLabel = isCollectionContext ? "Coleção" : "Pesquisar";
  const backPath = isCollectionContext ? "/colecao" : workPath;

  return (
    <div className="min-w-0 flex-1 px-4 pb-7 pt-[4.5rem] sm:px-6 sm:pb-9 xl:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="fixed inset-x-0 top-0 z-50 flex h-16 min-w-0 items-center gap-3 border-b border-border bg-background px-4 md:left-20 sm:px-6 lg:left-64 xl:px-10">
          <Link
            to={backPath}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-base font-bold leading-none text-foreground transition-colors hover:bg-sidebar-accent/30 hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5 text-primary" aria-hidden="true" />
            Voltar
          </Link>

          <nav className="flex min-w-0 items-center gap-1 text-base font-semibold leading-none" aria-label="Caminho de navegação">
            <Link
              to={rootPath}
              className="shrink-0 rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-sidebar-accent/30 hover:text-foreground"
            >
              {rootLabel}
            </Link>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Link
              to={workPath}
              className="truncate rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-sidebar-accent/30 hover:text-foreground"
              title={edition.work.title}
            >
              {edition.work.title}
            </Link>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate rounded-lg bg-sidebar-accent/30 px-2 py-1 text-primary" aria-current="page">
              {editionLabel}
            </span>
          </nav>
        </div>

        <section className="relative mt-4 border-b border-border pb-9">
          <div className="relative grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_18rem] md:gap-x-10 md:pl-[15.5rem]">
            <CatalogCover
              key={edition.coverUrl || "empty"}
              src={edition.coverUrl}
              alt={`Capa da ${editionLabel} de ${edition.work.title}`}
              eager
              className="order-1 w-full max-w-52 justify-self-center md:absolute md:left-0 md:top-0 md:justify-self-start"
            />

            <div className="order-2 min-w-0 md:col-start-1 md:row-start-1">
              <h1 className="text-3xl font-bold text-foreground sm:text-4xl md:whitespace-nowrap">{editionLabel}</h1>
              <div className="mt-3">
                <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Obra</p>
                <Link
                  to={`/obras/${encodeURIComponent(edition.work.slug)}`}
                  aria-label={`Ver detalhes da Obra ${edition.work.title}`}
                  className="-ml-3 -mt-1 inline-flex w-fit rounded-2xl bg-background px-3 py-2 text-left transition-colors hover:bg-sidebar-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <p className="text-2xl font-bold text-primary">{edition.work.title}</p>
                </Link>
              </div>
            </div>
            <div className="order-3 grid gap-3 md:col-start-2 md:row-start-1 md:w-full">
              <Link
                to={`${editionPath}/selecionar/estante`}
                className="relative inline-flex min-h-[3.25rem] items-center justify-center rounded-full border border-sidebar-foreground/30 bg-sidebar px-4 py-3 text-center text-base font-bold text-white transition-colors hover:bg-sidebar-accent"
              >
                <Plus className="absolute left-5 h-5 w-5" strokeWidth={3} aria-hidden="true" />
                Coleção
              </Link>
              <Link
                to={`${editionPath}/selecionar/desejos`}
                className="relative inline-flex min-h-[3.25rem] items-center justify-center rounded-full border border-sidebar-foreground/30 bg-sidebar px-4 py-3 text-center text-base font-bold text-white transition-colors hover:bg-sidebar-accent"
              >
                <Plus className="absolute left-5 h-5 w-5" strokeWidth={3} aria-hidden="true" />
                Lista de Desejos
              </Link>
            </div>
          </div>

          <div className="mt-4 grid items-start gap-y-7 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-x-10">
            <aside className="relative w-full border-b border-border pb-7 md:border-b-0 md:pb-0 md:pr-7 md:pt-[14.25rem]" aria-label="Informações da edição">
              <span className="absolute bottom-0 right-0 top-0 hidden w-px bg-border md:top-[14.25rem] md:block" aria-hidden="true" />
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-1">
                <MetaItem label="Editora Brasileira" value={edition.brazilianPublisher.label} />
                {edition.format && <MetaItem label="Formato" value={edition.format.label} />}
                {edition.coverType && <MetaItem label="Acabamento" value={edition.coverType.label} />}
                {edition.paper && <MetaItem label="Miolo" value={edition.paper.label} />}
                <MetaItem
                  label="Publicação no Brasil"
                  value={brazilPublicationPeriod(edition.brazilPublicationStartYear, edition.brazilPublicationEndYear)}
                />
              </dl>
            </aside>

            <section className="min-w-0 border-t border-border pt-7" aria-labelledby="volumes-title">
              <h2 id="volumes-title" className="text-2xl font-bold text-foreground">
                {formatPublicationStatus(edition.brazilPublicationStatus)} com {volumesCount(edition.volumesCount)}
              </h2>

              {volumes.length > 0 ? (
                <>
                  <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-5" aria-label="Volumes da Edição">
                    {volumes.map((volume) => <VolumeCard key={volume.id} volume={volume} workTitle={edition.work.title} />)}
                  </div>
                  <CatalogPagination pagination={pagination} onPageChange={onPageChange} ariaLabel="Paginação dos Volumes" />
                </>
              ) : (
                <div className="mt-5 border-t border-border py-12 text-center">
                  <p className="text-sm font-semibold text-muted-foreground">Nenhum Volume público cadastrado nesta Edição.</p>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}

function useEditionDetails(editionId: number, page: number, retry: number) {
  const [data, setData] = useState<PublicEditionDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!Number.isInteger(editionId) || editionId <= 0) {
      setData(null);
      setError("Edição não encontrada.");
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    setError("");
    getPublicEditionDetails(editionId, { page, limit: PAGE_SIZE })
      .then((result) => { if (active) setData(result); })
      .catch((requestError) => {
        if (!active) return;
        setData(null);
        setError(getApiError(requestError, "Não foi possível carregar esta Edição."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [editionId, page, retry]);

  return { data, loading, error };
}

function PublicEditionDetails() {
  const { editionId = "", slug } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [retry, setRetry] = useState(0);
  const page = positiveInteger(searchParams.get("page"));
  const { data, loading, error } = useEditionDetails(Number(editionId), page, retry);
  const isCollectionContext = location.pathname.startsWith("/colecao/");
  const editionPath = slug
    ? `${isCollectionContext ? "/colecao" : "/obras"}/${encodeURIComponent(slug)}/edicao/${editionId}`
    : `/edicoes/${editionId}`;
  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  if (loading) return <LoadingState message="Carregando Edição..." fullPage />;
  if (!data) return <EditionUnavailable error={error} onRetry={() => setRetry((value) => value + 1)} />;
  return (
    <EditionContent
      data={data}
      editionPath={editionPath}
      isCollectionContext={isCollectionContext}
      onPageChange={changePage}
    />
  );
}

export default PublicEditionDetails;
