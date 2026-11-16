import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import { BackLink } from "@/components/shared/BackLink";
import { useLoadingScrollReset } from "@/hooks/useLoadingScrollReset";
import { catalogNavigationState, catalogRoot, directReturnPath } from "./publicCatalogNavigation";
import { publicEditionPath, publicWorkPath } from "./publicCatalogPaths";

type CatalogDetailKind = "work" | "edition" | "volume";

function loadingParentPath(kind: CatalogDetailKind, slug: string, editionNumber: string, collectionContext: boolean, rootPath: string) {
  if (kind === "work" || !slug) return rootPath;
  if (kind === "volume" && editionNumber) return publicEditionPath(slug, editionNumber);
  return collectionContext ? "/colecao" : publicWorkPath(slug);
}

function LoadingNavigation({ kind }: { kind: CatalogDetailKind }) {
  const { slug = "", editionNumber = "" } = useParams();
  const location = useLocation();
  const isCollectionContext = location.pathname.startsWith("/colecao/");
  const navigationState = isCollectionContext ? { catalogOrigin: "collection" as const } : catalogNavigationState(location.state);
  const root = catalogRoot(navigationState.catalogOrigin);
  const allowedPaths = kind === "edition"
    ? navigationState.catalogOrigin === "collection" ? ["/colecao"] : navigationState.catalogOrigin === "search" ? ["/pesquisa"] : []
    : kind === "volume"
      ? navigationState.catalogOrigin === "wishlist" ? ["/desejos"] : navigationState.catalogOrigin === "checklist" ? ["/lancamentos"] : []
      : [];
  const returnTo = directReturnPath(location.state, allowedPaths);
  const parentPath = loadingParentPath(kind, slug, editionNumber, isCollectionContext, root.path);
  const pathItems = { work: 2, edition: 3, volume: 4 }[kind];

  return (
    <div className="page-gutter fixed inset-x-0 top-0 z-50 flex h-16 min-w-0 items-center gap-3 border-b border-border bg-background md:left-20 lg:left-56">
      <BackLink to={returnTo ?? parentPath} preferHistory={Boolean(returnTo)} state={navigationState}
        className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-base font-bold leading-none text-foreground transition-colors hover:bg-sidebar-accent/30 hover:text-foreground">
        <ArrowLeft className="h-5 w-5 text-primary" aria-hidden="true" />
        Voltar
      </BackLink>
      <div className="flex min-w-0 items-center gap-1 overflow-hidden" aria-hidden="true">
        {Array.from({ length: pathItems }, (_, index) => (
          <div key={index} className="flex min-w-0 items-center gap-1">
            {index > 0 && <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
            <Shape className={`h-5 ${index === 1 ? "w-28" : "w-20"} min-w-4 max-w-full`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Shape({ className = "" }: { className?: string }) {
  return <div className={`catalog-skeleton-card catalog-skeleton-shape rounded ${className}`} />;
}

function TextLines() {
  return <div className="grid gap-3"><Shape className="h-4 w-full" /><Shape className="h-4 w-full" /><Shape className="h-4 w-4/5" /></div>;
}

function Metadata({ count, className = "grid-cols-2 md:grid-cols-1" }: { count: number; className?: string }) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="grid min-w-0 gap-2">
          <Shape className="h-3 w-3/5" />
          <Shape className="h-4 w-4/5" />
        </div>
      ))}
    </div>
  );
}

function VolumePreviews({ edition = false }: { edition?: boolean }) {
  return (
    <div className={edition ? "grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-5" : "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"}>
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="min-w-0">
          <Shape className="aspect-[2/3] rounded-lg border border-sidebar-foreground/15" />
          <Shape className="mt-2 h-4 w-3/4" />
          {edition && <Shape className="mt-1 h-3 w-1/2" />}
        </div>
      ))}
    </div>
  );
}

function WorkOrEditionLoading({ kind }: { kind: "work" | "edition" }) {
  return (
    <section className="mt-4 grid items-start gap-x-7 gap-y-7 border-b border-border pb-9 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-y-0 lg:gap-x-10">
      <div className="min-w-0">
        <Shape className="mx-auto aspect-[2/3] w-full max-w-52 rounded-lg border border-sidebar-foreground/15 md:mx-0" />
        <div className="relative mt-7 border-b border-border pb-7 md:border-b-0 md:pb-0 md:pr-7">
          <span className="absolute bottom-0 right-0 top-0 hidden w-px bg-border md:block" />
          {kind === "work" ? <>
            <Metadata count={2} className="grid-cols-1" />
            <div className="mt-4">
              <Shape className="h-3 w-20" />
              <Shape className="mt-2 h-4 w-4/5" />
              <Shape className="mt-1 h-3 w-1/2" />
            </div>
            <div className="mt-4"><Metadata count={8} /></div>
          </> : <>
            <Shape className="h-3 w-12" />
            <Shape className="mt-2 h-4 w-4/5" />
            <div className="mt-4"><Metadata count={5} /></div>
          </>}
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-4">
          <Shape className={kind === "work" ? "h-10 w-3/5 max-w-sm" : "h-10 w-40"} />
          {kind === "edition" && <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
            <Shape className="mr-1 h-4 w-32" />
            <Shape className="h-10 w-28 rounded-full" /><Shape className="h-10 w-28 rounded-full" />
          </div>}
        </div>
        {kind === "work" ? (
          <div className="mt-6"><Shape className="mb-3 h-3 w-20" /><TextLines /></div>
        ) : <Shape className="mt-3 h-6 w-2/3 max-w-sm" />}
        <div className={`border-t border-border pt-7 ${kind === "work" ? "mt-7" : "mt-5"}`}>
          {kind === "work" && <>
            <Shape className="h-7 w-56 max-w-full" />
            <div className="mb-5 mt-5 py-3"><Shape className="h-5 w-3/5" /><Shape className="mt-1 h-4 w-2/5" /></div>
          </>}
          <VolumePreviews edition={kind === "edition"} />
        </div>
      </div>
    </section>
  );
}

function VolumeLoading() {
  return (
    <div className="-mx-4 grid min-h-[calc(100dvh-7.5rem)] w-[calc(100%+2rem)] sm:-mx-6 sm:w-[calc(100%+3rem)] xl:-mx-10 xl:w-[calc(100%+5rem)] lg:items-start lg:grid-cols-[minmax(22rem,0.85fr)_minmax(24rem,1.15fr)]">
      <div className="flex min-h-[34rem] items-center justify-center border-b border-border bg-card/30 p-8 sm:min-h-[42rem] sm:p-12 lg:fixed lg:bottom-0 lg:left-56 lg:top-16 lg:h-[calc(100dvh-4rem)] lg:w-[calc((100vw-14rem)*0.425)] lg:min-h-0 lg:border-b-0 lg:border-r">
        <div className="flex w-full max-w-md flex-col items-center gap-6 lg:-translate-y-3">
          <Shape className="aspect-[2/3] w-full max-w-sm rounded-lg sm:max-w-md lg:max-w-[23rem]" />
          <div className="grid w-full max-w-sm grid-cols-2 gap-3 sm:max-w-md lg:max-w-[23rem]">
            <div className="inline-flex min-h-12 w-fit max-w-full items-center gap-2 rounded-full bg-sidebar px-5 py-3 shadow-md">
              <ArrowLeft className="h-5 w-5 shrink-0 text-muted-foreground" />
              <Shape className="h-4 w-16 min-w-0" />
            </div>
            <div className="col-start-2 inline-flex min-h-12 w-fit max-w-full items-center gap-2 justify-self-end rounded-full bg-sidebar px-5 py-3 shadow-md">
              <Shape className="h-4 w-16 min-w-0" />
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
      <div className="min-w-0 bg-card/30 px-5 py-6 sm:px-8 lg:col-start-2 lg:row-start-1">
        <Shape className="h-9 w-40" />
        <div className="mt-4 flex flex-wrap gap-x-7 gap-y-3">
          <div className="grid gap-2"><Shape className="h-4 w-12" /><Shape className="h-7 w-40" /></div>
          <div className="grid gap-2"><Shape className="h-4 w-16" /><Shape className="h-7 w-52" /></div>
        </div>
        <div className="my-6 grid grid-cols-2 gap-3 border-y border-border py-6">
          {Array.from({ length: 4 }, (_, index) => <Shape key={index} className="h-[3.25rem] rounded-full" />)}
        </div>
        <Shape className="mb-4 h-4 w-24" /><TextLines />
        <div className="mt-6 border-t border-border pt-6">
          <Shape className="mb-4 h-4 w-24" />
          <div className="grid gap-x-3 gap-y-3 sm:grid-cols-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="grid min-w-0 grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2">
                <Shape className="mt-0.5 h-4 w-4" />
                <div className="grid gap-2"><Shape className="h-3 w-3/5" /><Shape className="h-4 w-4/5" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CatalogDetailsLoading({ kind }: { kind: CatalogDetailKind }) {
  useLoadingScrollReset(true);
  const label = { work: "Carregando Obra...", edition: "Carregando edição...", volume: "Carregando volume..." }[kind];
  return (
    <div className={`page-gutter min-w-0 flex-1 bg-background pb-7 sm:pb-9 ${kind === "volume" ? "pt-16" : "pt-[4.5rem]"}`}>
      <LoadingNavigation kind={kind} />
      <div role="status" aria-label={label} aria-busy="true">
        <span className="sr-only">{label}</span>
        <div className="w-full" aria-hidden="true">
          {kind === "volume" ? <VolumeLoading /> : <div className="mx-auto w-full max-w-7xl"><WorkOrEditionLoading kind={kind} /></div>}
        </div>
      </div>
    </div>
  );
}
