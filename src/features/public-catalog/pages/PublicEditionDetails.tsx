import { PersonalCatalogSession } from "../PersonalCatalogSession";
import { CatalogRefreshNotice } from "../CatalogRefreshNotice";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, BookOpen, ChevronRight, Heart, LibraryBig, type LucideIcon } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { LoadingState } from "@/components/shared/AsyncState";
import { BackLink } from "@/components/shared/BackLink";
import { CatalogCover } from "@/features/public-catalog/CatalogCover";
import { OwnedVolumeBadge } from "@/features/public-catalog/OwnedVolumeBadge";
import { WishedVolumeBadge } from "@/features/public-catalog/WishedVolumeBadge";
import { ReadVolumeBadge } from "@/features/public-catalog/ReadVolumeBadge";
import { formatPublicationStatus, formatPublicReleaseDate, publicVolumeLabel } from "@/features/public-catalog/publicCatalogFormatters";
import { getPublicEditionDetails } from "@/features/public-catalog/publicCatalogService";
import { prefetchEditionVolumes } from "@/features/public-catalog/prefetchCatalogDetails";
import type {
  PublicEditionDetailsResponse,
  PublicEditionVolumeSummary,
} from "@/features/public-catalog/publicCatalogTypes";
import { getApiError } from "@/lib/apiError";
import { PUBLIC_CATALOG_QUERY_ROOT } from "@/lib/queryClient";
import { usePublicCatalogScope } from "@/features/public-catalog/usePublicCatalogScope";
import { publicVolumePath, publicWorkPath } from "@/features/public-catalog/publicCatalogPaths";
import { catalogNavigationState, catalogRoot, directReturnPath, type CatalogNavigationState } from "@/features/public-catalog/publicCatalogNavigation";
import { useCatalogErrorToast } from "@/features/public-catalog/useCatalogErrorToast";

const libraryActionClass = "inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-3 text-center text-sm font-bold transition-colors";

function actionIconFill(active: boolean, icon: LucideIcon) {
  return active && (icon === Heart || icon === BookOpen || icon === LibraryBig) ? "currentColor" : "none";
}

function EditionLibraryAction({ to, label, guestMessage, authenticated, selectedCount, totalCount, selectedLabel, activeIcon, inactiveIcon }: {
  to: string;
  label: string;
  guestMessage: string;
  authenticated: boolean;
  selectedCount?: number;
  totalCount?: number;
  selectedLabel: string;
  activeIcon: LucideIcon;
  inactiveIcon?: LucideIcon;
}) {
  const hasSelectedVolumes = authenticated && (selectedCount ?? 0) > 0;
  const active = hasSelectedVolumes;
  const Icon = active ? activeIcon : inactiveIcon ?? activeIcon;
  const buttonLabel = authenticated && totalCount !== undefined
    ? `${selectedCount ?? 0}/${totalCount} ${selectedLabel}`
    : label;
  const className = `${libraryActionClass} ${active
    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
    : "border-sidebar-foreground/30 bg-sidebar text-white hover:bg-sidebar-accent"}`;
  const content = <><Icon className="h-4 w-4 shrink-0" fill={actionIconFill(active, Icon)} aria-hidden="true" /><span>{buttonLabel}</span></>;
  return authenticated
    ? <Link to={to} className={className}>{content}</Link>
    : <button type="button" className={className} onClick={() => toast.warning(guestMessage)}>{content}</button>;
}

function volumesCount(total: number) {
  return `${total} ${total === 1 ? "volume" : "volumes"}`;
}

function brazilPublicationPeriod(startYear?: number | null, endYear?: number | null) {
  if (!startYear) return "Não informada";
  if (startYear === endYear) return String(startYear);
  return `${startYear}-${endYear ?? "??"}`;
}

function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function StackedValues({ values }: { values: string[] }) {
  return (
    <span className="flex flex-col gap-1">
      {values.map((value, index) => <span key={`${value}-${index}`}>{value}</span>)}
    </span>
  );
}

function VolumeCard({ volume, workSlug, workTitle, editionNumber, navigationState }: {
  volume: PublicEditionVolumeSummary;
  workSlug: string;
  workTitle: string;
  editionNumber: number;
  navigationState: CatalogNavigationState;
}) {
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
          alt={`Capa do ${label} de ${workTitle}`}
          className="transition-transform group-hover:-translate-y-1"
        />
        <h3 className="mt-2 truncate text-sm font-normal text-foreground group-hover:text-primary sm:text-base">{label}</h3>
      </Link>
      <p className="text-xs font-normal text-muted-foreground">{formatPublicReleaseDate(volume)}</p>
    </article>
  );
}

function EditionLibraryActions({ edition, editionPath, authenticated }: {
  edition: PublicEditionDetailsResponse["edition"];
  editionPath: string;
  authenticated: boolean;
}) {
  const ownedCount = edition.personal?.ownedCount ?? 0;
  const missingCount = Math.max(0, edition.volumesCount - ownedCount);
  return (
    <div className="ml-auto flex min-w-0 items-center justify-end gap-2 overflow-x-auto">
      <span className="mr-1 shrink-0 whitespace-nowrap text-base font-bold leading-none text-muted-foreground">Gerenciar volumes:</span>
      <div className="grid w-max shrink-0 auto-cols-fr grid-flow-col gap-2">
        <EditionLibraryAction
          to={`${editionPath}/selecionar/colecao`}
          label="Coleção"
          guestMessage="Faça login para poder adicionar volumes desta edição à sua coleção."
          authenticated={authenticated}
          selectedCount={ownedCount}
          totalCount={edition.volumesCount}
          selectedLabel="adquiridos"
          activeIcon={LibraryBig}
          inactiveIcon={LibraryBig}
        />
        {authenticated && ownedCount > 0 && (
          <EditionLibraryAction
            to={`${editionPath}/selecionar/lidos`}
            label="Lidos"
            guestMessage=""
            authenticated
            selectedCount={edition.personal?.readCount}
            totalCount={ownedCount}
            selectedLabel="lidos"
            activeIcon={BookOpen}
            inactiveIcon={BookOpen}
          />
        )}
        <EditionLibraryAction
          to={`${editionPath}/selecionar/desejos`}
          label="Lista de desejos"
          guestMessage="Faça login para poder adicionar volumes desta edição à sua lista de desejos."
          authenticated={authenticated}
          selectedCount={edition.personal?.wishedCount}
          totalCount={missingCount}
          selectedLabel="desejados"
          activeIcon={Heart}
        />
      </div>
    </div>
  );
}

interface EditionContentProps {
  data: PublicEditionDetailsResponse;
  editionPath: string;
  isCollectionContext: boolean;
  navigationState: CatalogNavigationState;
  refreshError: string;
  onRetry: () => void;
}

function EditionContent({ data, editionPath, isCollectionContext, navigationState, refreshError, onRetry }: EditionContentProps) {
  const { user } = useAuth();
  const location = useLocation();
  const { edition, volumes } = data;
  const editionLabel = `${edition.chronologicalNumber}ª edição`;
  const workPath = publicWorkPath(edition.work.slug);
  const { path: rootPath, label: rootLabel } = catalogRoot(navigationState.catalogOrigin);
  const returnTo = directReturnPath(location.state, navigationState.catalogOrigin === "collection" ? ["/colecao"] : navigationState.catalogOrigin === "search" ? ["/pesquisa"] : []);
  const backPath = returnTo ?? (isCollectionContext ? "/colecao" : workPath);

  return (
    <div className="page-gutter min-w-0 flex-1 pb-7 pt-[4.5rem] sm:pb-9">
      <CatalogRefreshNotice message={refreshError} onRetry={onRetry} />
      <div className="mx-auto w-full max-w-7xl">
        <div className="page-gutter fixed inset-x-0 top-0 z-50 flex h-16 min-w-0 items-center gap-3 border-b border-border bg-background md:left-20 lg:left-56">
          <BackLink
            to={backPath}
            preferHistory={Boolean(returnTo)}
            state={navigationState}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-base font-bold leading-none text-foreground transition-colors hover:bg-sidebar-accent/30 hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5 text-primary" aria-hidden="true" />
            Voltar
          </BackLink>

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
              state={navigationState}
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

        <section className="mt-4 grid items-start gap-x-7 gap-y-7 border-b border-border pb-9 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-y-0 lg:gap-x-10">
          <div className="min-w-0 md:col-start-1">
            <CatalogCover
              key={edition.coverUrl || "empty"}
              src={edition.coverUrl}
              alt={`Capa da ${editionLabel} de ${edition.work.title}`}
              emptyLabel="Capa indisponível"
              eager
              className="order-1 mx-auto w-full max-w-52 md:mx-0"
            />

            <aside className="relative mt-7 w-full border-b border-border pb-7 md:border-b-0 md:pb-0 md:pr-7" aria-label="Informações da edição">
              <span className="absolute bottom-0 right-0 top-0 hidden w-px bg-border md:block" aria-hidden="true" />
              <section aria-labelledby="edition-work-title">
                <h2 id="edition-work-title" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Obra</h2>
                <div className="mt-1 flex flex-col items-start gap-2">
                  <Link
                    to={workPath}
                    state={navigationState}
                    aria-label={`Ver detalhes da obra ${edition.work.title}`}
                    className="-ml-3 -mt-1 flex w-[calc(100%+0.75rem)] flex-col items-start rounded-2xl bg-background px-3 py-1 text-left transition-colors hover:bg-sidebar-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <span className="break-words text-sm font-bold text-primary">{edition.work.title}</span>
                  </Link>
                </div>
              </section>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-1">
                <MetaItem label="Editora Brasileira" value={edition.brazilianPublisher.label} />
                {edition.format && <MetaItem label="Formato" value={edition.format.label} />}
                {edition.coverType && <MetaItem label="Acabamento" value={edition.coverType.label} />}
                {edition.papers && edition.papers.length > 0 && <MetaItem label="Miolo" value={<StackedValues values={edition.papers.map(({ label }) => label)} />} />}
                <MetaItem
                  label="Publicação no Brasil"
                  value={brazilPublicationPeriod(edition.brazilPublicationStartYear, edition.brazilPublicationEndYear)}
                />
              </dl>
            </aside>
          </div>
          <div className="contents md:col-start-2 md:block">
            <div className="order-2 min-w-0">
              <div className="flex min-w-0 items-center gap-4">
                <h1 className="shrink-0 text-3xl font-bold text-foreground sm:text-4xl">{editionLabel}</h1>
                <EditionLibraryActions edition={edition} editionPath={editionPath} authenticated={Boolean(user)} />
              </div>
              <h2 id="volumes-title" className="mt-3 text-xl font-normal text-foreground">{formatPublicationStatus(edition.brazilPublicationStatus)} com {volumesCount(edition.volumesCount)}</h2>
            </div>

            <section className="order-4 min-w-0 border-t border-border pt-7 md:mt-5" aria-labelledby="volumes-title">
              {volumes.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-5" aria-label="Volumes da edição">
                  {volumes.map((volume) => (
                    <VolumeCard
                      key={volume.id}
                      volume={volume}
                      workSlug={edition.work.slug}
                      workTitle={edition.work.title}
                      editionNumber={edition.chronologicalNumber}
                      navigationState={navigationState}
                    />
                  ))}
                </div>
              ) : (
                <div className="border-t border-border py-12 text-center">
                  <p className="text-sm font-semibold text-muted-foreground">Nenhum volume público cadastrado nesta edição.</p>
                </div>
              )}
            </section>
          </div>

        </section>
      </div>
    </div>
  );
}

function useEditionDetails(editionNumber: number, workSlug: string) {
  const scope = usePublicCatalogScope();
  const queryClient = useQueryClient();
  const valid = Boolean(workSlug) && Number.isInteger(editionNumber) && editionNumber > 0;
  const result = useQuery({
    queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "edition", workSlug, editionNumber],
    queryFn: async () => {
      const response = await getPublicEditionDetails(workSlug, editionNumber, { all: true });
      if (response.edition.work.slug !== workSlug || response.edition.chronologicalNumber !== editionNumber) {
        throw new Error("Edição não encontrada.");
      }
      return response;
    },
    enabled: valid,
  });
  const data: PublicEditionDetailsResponse | null = result.data ?? null;
  useEffect(() => {
    if (data) void prefetchEditionVolumes(queryClient, scope, data);
  }, [data, queryClient, scope]);
  return {
    data,
    loading: valid && result.isPending,
    error: !valid ? "Edição não encontrada." : result.isError && !data
      ? getApiError(result.error, "Não foi possível carregar esta edição.") : "",
    refreshError: result.isError && data ? "Não foi possível atualizar esta edição." : "",
    retry: () => { void result.refetch(); },
  };
}

function PublicEditionDetailsContent() {
  const { editionNumber = "", slug } = useParams();
  const location = useLocation();
  const { data, loading, error, refreshError, retry } = useEditionDetails(Number(editionNumber), slug || "");
  useCatalogErrorToast(error, retry, "edition-details");
  const isCollectionContext = location.pathname.startsWith("/colecao/");
  const navigationState = isCollectionContext ? { catalogOrigin: "collection" as const } : catalogNavigationState(location.state);
  const editionPath = `${isCollectionContext ? "/colecao" : "/obra"}/${encodeURIComponent(slug || "")}/edicao/${editionNumber}`;
  if (loading) return <LoadingState message="Carregando edição..." fullPage />;
  if (!data) {
    const returnTo = directReturnPath(location.state, navigationState.catalogOrigin === "collection" ? ["/colecao"] : navigationState.catalogOrigin === "search" ? ["/pesquisa"] : []);
    return <div className="page-gutter flex min-h-[calc(100dvh-5rem)] items-center justify-center py-12"><BackLink to={returnTo ?? "/pesquisa?tab=editions&sortBy=title&order=ASC&page=1"} preferHistory={Boolean(returnTo)} className="rounded-lg border border-border bg-input px-4 py-2 text-sm font-bold text-foreground">Voltar</BackLink></div>;
  }
  return (
    <EditionContent
      data={data}
      editionPath={editionPath}
      isCollectionContext={isCollectionContext}
      navigationState={navigationState}
      refreshError={refreshError}
      onRetry={retry}
    />
  );
}

function PublicEditionDetails() {
  return <PersonalCatalogSession><PublicEditionDetailsContent /></PersonalCatalogSession>;
}

export default PublicEditionDetails;
