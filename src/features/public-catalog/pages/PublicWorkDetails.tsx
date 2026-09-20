import { useEffect, useState, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, ChevronRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { CatalogCover } from "@/features/public-catalog/CatalogCover";
import { getPublicWorkDetails } from "@/features/public-catalog/publicCatalogService";
import type {
  PublicEditionDetails,
  PublicVolumePreview,
  PublicWorkDetails as PublicWorkDetailsData,
} from "@/features/public-catalog/publicCatalogTypes";
import { LoadingState } from "@/components/shared/AsyncState";
import { getApiError } from "@/lib/apiError";
import { formatPublicationStatus, publicVolumeLabel } from "@/features/public-catalog/publicCatalogFormatters";

function publicationPeriod(work: PublicWorkDetailsData) {
  const start = work.originalPublicationStartYear;
  const end = work.originalPublicationEndYear;
  if (start && end) return start === end ? String(start) : `${start}–${end}`;
  if (start) return `${start}-??`;
  if (end) return String(end);
  return "Não informado";
}

function MetaItem({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function StackedValues({ values }: { values: string[] }) {
  if (values.length === 0) return null;
  return (
    <span className="flex flex-col gap-1">
      {values.map((value, index) => <span key={`${value}-${index}`}>{value}</span>)}
    </span>
  );
}

function VolumePreview({ volume, workTitle }: { volume: PublicVolumePreview; workTitle: string }) {
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
          alt={`Capa de ${label} de ${workTitle}`}
          className="transition-transform group-hover:-translate-y-1"
        />
        <h4 className="mt-2 truncate text-sm font-bold text-foreground group-hover:text-primary">{label}</h4>
      </Link>
    </article>
  );
}

function volumesCount(total: number) {
  return `${total} ${total === 1 ? "volume" : "volumes"}`;
}

function EditionCard({ edition, workSlug, workTitle }: { edition: PublicEditionDetails; workSlug: string; workTitle: string }) {
  const label = `${edition.chronologicalNumber}ª edição`;
  return (
    <article className="min-w-0 py-5 first:pt-0">
      <Link
        to={`/obras/${encodeURIComponent(workSlug)}/edicao/${edition.id}`}
        className="-ml-3 flex w-[calc(100%+0.75rem)] flex-col items-start rounded-2xl bg-background px-3 py-3 text-left transition-colors hover:bg-sidebar-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <h3 className="flex flex-wrap items-center gap-2 text-base font-bold text-primary">
          <span>{label}</span>
          <span aria-hidden="true">·</span>
          <span>{edition.brazilianPublisher.label}</span>
        </h3>
        <span className="mt-1 text-sm font-semibold text-muted-foreground">
          {formatPublicationStatus(edition.brazilPublicationStatus)} com {volumesCount(edition.volumesCount)}
        </span>
      </Link>
      {edition.volumes.length > 0 ? (
        <section className="mt-5" aria-label={`Prévia de Volumes da ${label}`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-xl">
            {edition.volumes.map((volume) => (
              <VolumePreview key={volume.id} volume={volume} workTitle={workTitle} />
            ))}
          </div>
        </section>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">Nenhum Volume público cadastrado.</p>
      )}
    </article>
  );
}

function PublicWorkDetails() {
  const { slug = "" } = useParams();
  const [work, setWork] = useState<PublicWorkDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getPublicWorkDetails(slug)
      .then((data) => {
        if (active) setWork(data);
      })
      .catch((requestError) => {
        if (!active) return;
        setWork(null);
        setError(getApiError(requestError, "Não foi possível carregar esta Obra."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retry, slug]);

  if (loading) return <LoadingState message="Carregando Obra..." fullPage />;

  if (error || !work) {
    return (
      <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-4 py-12">
        <section className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center">
          <AlertCircle className="mx-auto h-9 w-9 text-red-400" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold text-foreground">Obra indisponível</h1>
          <p className="mt-2 text-sm text-red-300">{error || "Obra não encontrada."}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setRetry((value) => value + 1)} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              Tentar novamente
            </button>
            <Link to="/pesquisa?tab=works&sortBy=title&order=ASC&page=1" className="rounded-lg border border-border bg-input px-4 py-2 text-sm font-bold text-foreground">
              Voltar à pesquisa
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1 px-4 pb-7 pt-[4.5rem] sm:px-6 sm:pb-9 xl:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="fixed inset-x-0 top-0 z-50 flex h-16 min-w-0 items-center gap-3 border-b border-border bg-background px-4 md:left-20 sm:px-6 lg:left-64 xl:px-10">
          <Link
            to="/pesquisa?tab=works&sortBy=title&order=ASC&page=1"
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
            <span className="truncate rounded-lg bg-sidebar-accent/30 px-2 py-1 text-primary" title={work.title} aria-current="page">
              {work.title}
            </span>
          </nav>
        </div>

        <section className="mt-4 grid items-start gap-x-7 gap-y-7 border-b border-border pb-9 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-y-[21px] lg:gap-x-10">
          <CatalogCover
            key={work.coverUrl || "empty"}
            src={work.coverUrl}
            alt={`Capa de ${work.title}`}
            eager
            className="order-1 w-full max-w-52 justify-self-center md:col-start-1 md:row-start-1 md:justify-self-start"
          />

          <div className="order-2 min-w-0 md:col-start-2 md:row-start-1">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{work.title}</h1>

            {work.synopsis ? (
              <section className="mt-6" aria-labelledby="synopsis-title">
                <h2 id="synopsis-title" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sinopse</h2>
                <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-foreground">{work.synopsis}</p>
              </section>
            ) : null}

          </div>

          <aside className="relative order-3 w-full border-b border-border pb-7 md:col-start-1 md:row-start-2 md:border-b-0 md:pb-0 md:pr-7 md:pt-7" aria-label="Informações da obra">
            <span className="absolute bottom-0 right-0 top-7 hidden w-px bg-border md:block" aria-hidden="true" />
            <dl className="grid gap-4">
              <MetaItem label="Título original" value={work.originalTitle} />
              <MetaItem label="Título romanizado" value={work.romanizedTitle} />
            </dl>

            <section className="mt-4" aria-labelledby="authors-title">
              <h3 id="authors-title" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Autor(es)</h3>
              <div className="mt-1 flex flex-col items-start gap-2">
                {work.authors.map((author) => (
                  <Link
                    key={author.id}
                    to={`/autores/${author.id}`}
                    aria-label={`Ver Obras de ${author.label}`}
                    className="-ml-3 -mt-1 flex w-[calc(100%+0.75rem)] flex-col items-start rounded-2xl bg-background px-3 pb-2 pt-1 text-left transition-colors hover:bg-sidebar-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <p className="text-sm font-bold text-primary">{author.label}</p>
                    {author.roles.length > 0 ? <p className="text-xs text-muted-foreground">{author.roles.join(" · ")}</p> : null}
                  </Link>
                ))}
              </div>
            </section>

            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-1">
              <MetaItem label="País de Origem" value={work.country} />
              <MetaItem label="Tipo de obra" value={work.type.label} />
              <MetaItem label="Publicação original" value={publicationPeriod(work)} />
              <MetaItem label="Status Original" value={formatPublicationStatus(work.originalPublicationStatus)} />
              <MetaItem label="Volumes originais" value={work.originalVolumeCount} />
              <MetaItem label="Editora Original" value={work.originalPublishers.length > 0 ? <StackedValues values={work.originalPublishers.map(({ label }) => label)} /> : null} />
              <MetaItem label="Pré-publicação" value={work.serializationMagazines.length > 0 ? <StackedValues values={work.serializationMagazines.map(({ label }) => label)} /> : null} />
              <MetaItem label="Demografia" value={work.demographics.length > 0 ? <StackedValues values={work.demographics} /> : null} />
              <MetaItem label="Gêneros" value={work.genres.length > 0 ? <StackedValues values={work.genres.map(({ label }) => label)} /> : null} />
            </dl>
          </aside>

          <section className="order-4 min-w-0 border-t border-border pt-7 md:col-start-2 md:row-start-2" aria-labelledby="editions-title">
            <h2 id="editions-title" className="text-2xl font-bold text-foreground">Edições brasileiras</h2>

            {work.editions.length > 0 ? (
              <div className="mt-5 divide-y divide-border">
                {work.editions.map((edition) => (
                  <EditionCard key={edition.id} edition={edition} workSlug={work.slug} workTitle={work.title} />
                ))}
              </div>
            ) : (
              <div className="mt-5 border-t border-border py-12 text-center">
                <p className="text-sm font-semibold text-muted-foreground">Nenhuma Edição pública cadastrada para esta Obra.</p>
              </div>
            )}
          </section>
        </section>
      </div>
    </div>
  );
}

export default PublicWorkDetails;
