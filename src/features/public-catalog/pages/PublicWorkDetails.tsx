import { PersonalCatalogSession } from "../PersonalCatalogSession";
import { useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { CatalogCover } from "@/features/public-catalog/CatalogCover";
import { CatalogRefreshNotice } from "@/features/public-catalog/CatalogRefreshNotice";
import { OwnedVolumeBadge } from "@/features/public-catalog/OwnedVolumeBadge";
import { WishedVolumeBadge } from "@/features/public-catalog/WishedVolumeBadge";
import { ReadVolumeBadge } from "@/features/public-catalog/ReadVolumeBadge";
import { getPublicWorkDetails } from "@/features/public-catalog/publicCatalogService";
import { prefetchWorkAuthors, prefetchWorkEditions } from "@/features/public-catalog/prefetchCatalogDetails";
import type {
  PublicEditionDetails,
  PublicVolumePreview,
  PublicWorkDetails as PublicWorkDetailsData,
} from "@/features/public-catalog/publicCatalogTypes";
import { LoadingState } from "@/components/shared/AsyncState";
import { BackLink } from "@/components/shared/BackLink";
import { getApiError } from "@/lib/apiError";
import { PUBLIC_CATALOG_QUERY_ROOT } from "@/lib/queryClient";
import { usePublicCatalogScope } from "@/features/public-catalog/usePublicCatalogScope";
import { formatPublicationStatus, publicVolumeLabel } from "@/features/public-catalog/publicCatalogFormatters";
import { publicAuthorPath, publicEditionPath, publicVolumePath } from "@/features/public-catalog/publicCatalogPaths";
import { catalogNavigationState, catalogRoot } from "@/features/public-catalog/publicCatalogNavigation";
import { useCatalogErrorToast } from "@/features/public-catalog/useCatalogErrorToast";

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

function VolumePreview({ volume, workSlug, workTitle, editionNumber }: {
  volume: PublicVolumePreview;
  workSlug: string;
  workTitle: string;
  editionNumber: number;
}) {
  const navigationState = catalogNavigationState(useLocation().state);
  const label = publicVolumeLabel(volume);
  return (
    <article className="min-w-0">
      <Link
        to={publicVolumePath(workSlug, editionNumber, volume.number)}
        state={navigationState}
        aria-label={`Ver detalhes do ${label}${volume.personal?.owned ? " (na coleção)" : volume.personal?.wished ? " (na lista de desejos)" : ""}`}
        className="group relative block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {volume.personal?.owned && (
          <span className="pointer-events-none absolute -left-1 top-0 z-10 flex -translate-y-1/4 gap-1">
            <OwnedVolumeBadge compact />
            {volume.personal.read && <ReadVolumeBadge compact />}
          </span>
        )}
        {volume.personal?.wished && <WishedVolumeBadge compact />}
        <CatalogCover
          key={volume.coverUrl || "empty"}
          src={volume.coverUrl}
          alt={`Capa de ${label} de ${workTitle}`}
          className="transition-transform group-hover:-translate-y-1"
        />
        <h4 className="mt-2 truncate text-sm font-normal text-foreground group-hover:text-primary">{label}</h4>
      </Link>
    </article>
  );
}

function volumesCount(total: number) {
  return `${total} ${total === 1 ? "volume" : "volumes"}`;
}

function EditionCard({ edition, workSlug, workTitle }: { edition: PublicEditionDetails; workSlug: string; workTitle: string }) {
  const navigationState = catalogNavigationState(useLocation().state);
  const label = `${edition.chronologicalNumber}ª edição`;
  return (
    <article className="min-w-0 py-5 first:pt-0">
      <Link
        to={publicEditionPath(workSlug, edition.chronologicalNumber)}
        state={navigationState}
        className="-ml-3 flex w-[calc(100%+0.75rem)] flex-col items-start rounded-2xl bg-background px-3 py-3 text-left transition-colors hover:bg-sidebar-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <h3 className="flex flex-wrap items-center gap-2 text-base font-bold text-primary">
          <span>{label}</span>
          <span aria-hidden="true">·</span>
          <span>{edition.brazilianPublisher.label}</span>
        </h3>
        <span className="mt-1 text-sm font-normal text-muted-foreground">
          {formatPublicationStatus(edition.brazilPublicationStatus)} com {volumesCount(edition.volumesCount)}
        </span>
      </Link>
      {edition.volumes.length > 0 ? (
        <section className="mt-5" aria-label={`Prévia de volumes da ${label}`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {edition.volumes.slice(0, 5).map((volume) => (
              <VolumePreview
                key={volume.id}
                volume={volume}
                workSlug={workSlug}
                workTitle={workTitle}
                editionNumber={edition.chronologicalNumber}
              />
            ))}
          </div>
        </section>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">Nenhum volume público cadastrado.</p>
      )}
    </article>
  );
}

function useWorkDetails(slug: string) {
  const scope = usePublicCatalogScope();
  const queryClient = useQueryClient();
  const result = useQuery({
    queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "work", slug],
    queryFn: () => getPublicWorkDetails(slug),
    enabled: Boolean(slug),
  });
  const work: PublicWorkDetailsData | null = result.data ?? null;
  useEffect(() => {
    if (work) {
      void prefetchWorkEditions(queryClient, scope, work);
      void prefetchWorkAuthors(queryClient, scope, work);
    }
  }, [queryClient, scope, work]);
  const loading = Boolean(slug) && result.isPending;
  const error = !slug ? "Obra não encontrada." : result.isError && !work
    ? getApiError(result.error, "Não foi possível carregar esta obra.") : "";
  return {
    work,
    loading,
    error,
    refreshError: result.isError && work ? "Não foi possível atualizar esta obra." : "",
    retry: () => { void result.refetch(); },
  };
}

function PublicWorkDetailsContent() {
  const { slug = "" } = useParams();
  const location = useLocation();
  const navigationState = catalogNavigationState(location.state);
  const root = catalogRoot(navigationState.catalogOrigin);
  const { work, loading, error, refreshError, retry } = useWorkDetails(slug);
  useCatalogErrorToast(error, retry, "work-details");

  if (loading) return <LoadingState message="Carregando Obra..." fullPage />;

  if (error || !work) {
    return <div className="page-gutter flex min-h-[calc(100dvh-5rem)] items-center justify-center py-12"><BackLink to={root.path} className="rounded-lg border border-border bg-input px-4 py-2 text-sm font-bold text-foreground">Voltar</BackLink></div>;
  }

  return (
    <div className="page-gutter min-w-0 flex-1 pb-7 pt-[4.5rem] sm:pb-9">
      <CatalogRefreshNotice message={refreshError} onRetry={retry} />
      <div className="mx-auto w-full max-w-7xl">
        <div className="page-gutter fixed inset-x-0 top-0 z-50 flex h-16 min-w-0 items-center gap-3 border-b border-border bg-background md:left-20 lg:left-56">
          <BackLink
            to={root.path}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-base font-bold leading-none text-foreground transition-colors hover:bg-sidebar-accent/30 hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5 text-primary" aria-hidden="true" />
            Voltar
          </BackLink>

          <nav className="flex min-w-0 items-center gap-1 text-base font-semibold leading-none" aria-label="Caminho de navegação">
            <Link
              to={root.path}
              className="shrink-0 rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-sidebar-accent/30 hover:text-foreground"
            >
              {root.label}
            </Link>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate rounded-lg bg-sidebar-accent/30 px-2 py-1 text-primary" title={work.title} aria-current="page">
              {work.title}
            </span>
          </nav>
        </div>

        <section className="mt-4 grid items-start gap-x-7 gap-y-7 border-b border-border pb-9 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-y-0 lg:gap-x-10">
          <div className="min-w-0 md:col-start-1">
            <CatalogCover
              key={work.coverUrl || "empty"}
              src={work.coverUrl}
              alt={`Capa de ${work.title}`}
              eager
              className="order-1 mx-auto w-full max-w-52 md:mx-0"
            />

            <aside className="relative mt-7 w-full border-b border-border pb-7 md:border-b-0 md:pb-0 md:pr-7" aria-label="Informações da obra">
              <span className="absolute bottom-0 right-0 top-0 hidden w-px bg-border md:block" aria-hidden="true" />
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
                      to={publicAuthorPath(author.slug || "")}
                      state={{ ...navigationState, fromWork: { slug: work.slug, title: work.title } }}
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
                <MetaItem label="Editora Original" value={work.originalPublishers.length > 0 ? <StackedValues values={work.originalPublishers.map(({ label }) => label)} /> : null} />
                <MetaItem label="Pré-publicação" value={work.serializationMagazines.length > 0 ? <StackedValues values={work.serializationMagazines.map(({ label }) => label)} /> : null} />
                <MetaItem label="Demografia" value={work.demographics.length > 0 ? <StackedValues values={work.demographics} /> : null} />
                <MetaItem label="Gêneros" value={work.genres.length > 0 ? <StackedValues values={work.genres.map(({ label }) => label)} /> : null} />
              </dl>
            </aside>
          </div>

          <div className="contents md:col-start-2 md:block">
            <div className="order-2 min-w-0">
              <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{work.title}</h1>

              {work.synopsis ? (
                <section className="mt-6" aria-labelledby="synopsis-title">
                  <h2 id="synopsis-title" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sinopse</h2>
                  <p className="mt-2 whitespace-pre-line text-sm font-normal leading-relaxed text-foreground">{work.synopsis}</p>
                </section>
              ) : null}
            </div>

            <section className="order-4 mt-0 min-w-0 border-t border-border pt-7 md:mt-7" aria-labelledby="editions-title">
              <h2 id="editions-title" className="text-2xl font-bold text-foreground">Edições brasileiras</h2>

              {work.editions.length > 0 ? (
                <div className="mt-5 divide-y divide-border">
                  {[...work.editions].sort((first, second) => (
                    second.chronologicalNumber - first.chronologicalNumber || second.id - first.id
                  )).map((edition) => (
                    <EditionCard key={edition.id} edition={edition} workSlug={work.slug} workTitle={work.title} />
                  ))}
                </div>
              ) : (
                <div className="mt-5 border-t border-border py-12 text-center">
                  <p className="text-sm font-semibold text-muted-foreground">Nenhuma edição pública cadastrada para esta obra.</p>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}

function PublicWorkDetails() {
  return <PersonalCatalogSession><PublicWorkDetailsContent /></PersonalCatalogSession>;
}

export default PublicWorkDetails;
