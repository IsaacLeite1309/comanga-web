import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { EmptyState, LoadingState } from "@/components/shared/AsyncState";
import { BackLink } from "@/components/shared/BackLink";
import { CatalogPagination } from "@/features/public-catalog/CatalogPagination";
import { CatalogCover } from "@/features/public-catalog/CatalogCover";
import { CatalogRefreshNotice } from "@/features/public-catalog/CatalogRefreshNotice";
import { catalogNavigationState, catalogRoot } from "@/features/public-catalog/publicCatalogNavigation";
import { publicWorkPath } from "@/features/public-catalog/publicCatalogPaths";
import { getPublicAuthorWorks } from "@/features/public-catalog/publicCatalogService";
import type { PublicAuthorWorksResponse } from "@/features/public-catalog/publicCatalogTypes";
import { getApiError } from "@/lib/apiError";
import { PUBLIC_CATALOG_QUERY_ROOT } from "@/lib/queryClient";
import { usePublicCatalogScope } from "@/features/public-catalog/usePublicCatalogScope";
import { useCatalogErrorToast } from "@/features/public-catalog/useCatalogErrorToast";

const PAGE_SIZE = 24;

function positiveInteger(value: string | null, fallback = 1) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function worksCount(total: number) {
  return `${total} ${total === 1 ? "obra publicada" : "obras publicadas"} no Brasil`;
}

function PublicAuthorWorks() {
  const { authorSlug = "" } = useParams();
  const location = useLocation();
  const navigationState = catalogNavigationState(location.state);
  const root = catalogRoot(navigationState.catalogOrigin);
  const backPath = navigationState.fromWork ? publicWorkPath(navigationState.fromWork.slug) : root.path;
  const [searchParams, setSearchParams] = useSearchParams();
  const page = positiveInteger(searchParams.get("page"));
  const scope = usePublicCatalogScope();
  const valid = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(authorSlug);
  const result = useQuery({
    queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "author", authorSlug, page],
    queryFn: () => getPublicAuthorWorks(authorSlug, {
      page,
      limit: PAGE_SIZE,
      sortBy: "title",
      order: "ASC",
    }),
    enabled: valid,
  });
  const data: PublicAuthorWorksResponse | null = result.data ?? null;
  const loading = valid && result.isPending;
  const error = !valid ? "Autor não encontrado." : result.isError && !data
    ? getApiError(result.error, "Não foi possível carregar as obras deste autor.") : "";
  useCatalogErrorToast(error, () => { void result.refetch(); }, "author-works");

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next, { state: navigationState });
  };

  if (loading) return <LoadingState message="Carregando Obras do Autor..." fullPage />;

  if (error || !data) {
    return <div className="page-gutter flex min-h-[calc(100dvh-5rem)] items-center justify-center py-12"><BackLink to={backPath} state={navigationState} className="rounded-lg border border-border bg-input px-4 py-2 text-sm font-bold text-foreground">Voltar</BackLink></div>;
  }

  return (
    <div className="page-gutter min-w-0 flex-1 pb-7 pt-[4.5rem] sm:pb-9">
      <CatalogRefreshNotice message={result.isError ? "Não foi possível atualizar as obras deste autor." : ""} onRetry={() => { void result.refetch(); }} />
      <div className="mx-auto w-full max-w-7xl">
        <div className="page-gutter fixed inset-x-0 top-0 z-50 flex h-16 min-w-0 items-center gap-3 border-b border-border bg-background md:left-20 lg:left-56">
          <BackLink to={backPath} state={navigationState} className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-base font-bold leading-none text-foreground transition-colors hover:bg-sidebar-accent/30">
            <ArrowLeft className="h-5 w-5 text-primary" aria-hidden="true" />Voltar
          </BackLink>
          <nav className="flex min-w-0 items-center gap-1 text-base font-semibold leading-none" aria-label="Caminho de navegação">
            <Link to={root.path} className="shrink-0 rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-sidebar-accent/30 hover:text-foreground">{root.label}</Link>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            {navigationState.fromWork ? <>
              <Link to={publicWorkPath(navigationState.fromWork.slug)} state={navigationState} className="truncate rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-sidebar-accent/30 hover:text-foreground">{navigationState.fromWork.title}</Link>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </> : null}
            <span className="truncate rounded-lg bg-sidebar-accent/30 px-2 py-1 text-primary" aria-current="page">{data.author.label}</span>
          </nav>
        </div>

        <header className="mt-4 border-b border-border pb-6">
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold text-foreground sm:text-4xl">{data.author.label}</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{worksCount(data.pagination.total)}</p>
          </div>
        </header>

        {data.works.length > 0 ? (
          <>
            <section className="mt-7 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" aria-label={`Obras de ${data.author.label}`}>
              {data.works.map((work) => <article key={work.id} className="min-w-0">
                <Link to={publicWorkPath(work.slug)} state={navigationState} aria-label={`Ver detalhes de ${work.title}`} className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <CatalogCover src={work.coverUrl} alt={`Capa de ${work.title}`} className="transition-transform group-hover:-translate-y-1" />
                  <h2 className="mt-2 truncate text-sm font-normal text-foreground group-hover:text-primary sm:text-base" title={work.title}>{work.title}</h2>
                </Link>
                {work.authorRoles.length > 0 ? <p className="mt-1 truncate text-xs text-muted-foreground" title={work.authorRoles.join(" · ")}>{work.authorRoles.join(" · ")}</p> : null}
              </article>)}
            </section>
            <CatalogPagination pagination={data.pagination} onPageChange={changePage} ariaLabel="Paginação das Obras do Autor" />
          </>
        ) : (
          <div className="mt-7 rounded-2xl border border-border bg-card">
            <EmptyState message="Nenhuma obra pública disponível para este autor." />
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicAuthorWorks;
