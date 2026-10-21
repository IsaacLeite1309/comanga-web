import { ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { FilteredEmptyState } from '@/components/shared/AsyncState';
import { CatalogCover } from '@/features/public-catalog/CatalogCover';
import { CatalogResultsLoading } from '@/features/public-catalog/CatalogResultsLoading';
import { CatalogPagination } from '@/features/public-catalog/CatalogPagination';
import { PublicWorkCard } from '@/features/public-catalog/PublicWorkCard';
import type { PublicCatalogTab, PublicEditionSummary } from '@/features/public-catalog/publicCatalogTypes';
import { type PesquisaCatalog } from '../hooks/usePesquisaCatalog';
import { CatalogRefreshNotice } from '@/features/public-catalog/CatalogRefreshNotice';

export { ResultsSummary, CatalogResults };

function resultCount(tab: PublicCatalogTab, total: number) {
  if (tab === "works") return `${total} ${total === 1 ? "obra encontrada" : "obras encontradas"}`;
  return `${total} ${total === 1 ? "edição encontrada" : "edições encontradas"}`;
}

function EditionCard({ edition }: { edition: PublicEditionSummary }) {
  const location = useLocation();
  const editionLabel = `${edition.chronologicalNumber}ª edição`;
  const metadata = `${editionLabel} · ${edition.brazilianPublisher.label}`;
  return (
    <article className="min-w-0">
      <Link
        to={`/obra/${encodeURIComponent(edition.work.slug)}/edicao/${edition.chronologicalNumber}`}
        state={{ catalogOrigin: "search", returnTo: `${location.pathname}${location.search}` }}
        aria-label={`Ver detalhes da ${editionLabel} de ${edition.work.title}`}
        className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <CatalogCover
          key={edition.coverUrl || "empty"}
          src={edition.coverUrl}
          alt={`Capa da ${editionLabel} de ${edition.work.title}`}
          emptyLabel="Capa indisponível"
          className="transition-transform group-hover:-translate-y-1"
        />
        <h2 className="mt-2 truncate text-sm font-normal text-foreground group-hover:text-primary sm:text-base" title={edition.work.title}>
          {edition.work.title}
        </h2>
        <p className="mt-1 truncate text-xs text-muted-foreground" title={metadata}>{metadata}</p>
      </Link>
    </article>
  );
}

function ResultsSummary({ catalog }: { catalog: PesquisaCatalog }) {
  if (catalog.error) return null;
  const SortIcon = catalog.order === "ASC" ? ArrowDownAZ : ArrowUpAZ;
  return (
    <div className="catalog-menu-search-divider-space flex min-h-5 items-center gap-3 text-sm text-primary">
      {catalog.loading ? (
        <span data-testid="results-divider" className="h-px flex-1 bg-border" aria-hidden="true" />
      ) : (
        <>
          <span className="shrink-0">{resultCount(catalog.tab, catalog.pagination.total)}</span>
          <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />
          <button
            type="button"
            onClick={catalog.toggleTitleSort}
            aria-label={catalog.order === "ASC" ? "Ordenar por título de Z a A" : "Ordenar por título de A a Z"}
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Título
            <SortIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <span data-testid="results-divider" className="h-px flex-1 bg-border" aria-hidden="true" />
        </>
      )}
    </div>
  );
}

function ResultCards({ catalog }: { catalog: PesquisaCatalog }) {
  return (
    <>
      <section
        className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
        aria-label={catalog.tab === "works" ? "Obras encontradas" : "Edições encontradas"}
      >
        {catalog.tab === "works"
          ? catalog.works.map((work) => <PublicWorkCard key={work.id} work={work} showAuthors={false} />)
          : catalog.editions.map((edition) => <EditionCard key={edition.id} edition={edition} />)}
      </section>
      <CatalogPagination
        pagination={catalog.pagination}
        onPageChange={(page) => catalog.changePage(page, catalog.pagination.totalPages)}
      />
    </>
  );
}

function CatalogResults({ catalog }: { catalog: PesquisaCatalog }) {
  if (catalog.loading) {
    return <CatalogResultsLoading label={catalog.tab === "works" ? "Carregando Obras..." : "Carregando Edições..."} />;
  }
  if (catalog.error) {
    return null;
  }
  const hasResults = catalog.tab === "works" ? catalog.works.length > 0 : catalog.editions.length > 0;
  if (hasResults) return <><CatalogRefreshNotice message={catalog.refreshError} onRetry={catalog.retryResults} /><ResultCards catalog={catalog} /></>;
  return (
    <>
      <CatalogRefreshNotice message={catalog.refreshError} onRetry={catalog.retryResults} />
      <FilteredEmptyState
        message={catalog.tab === "works"
          ? "Nenhuma obra encontrada com os filtros selecionados."
          : "Nenhuma edição encontrada com os filtros selecionados."}
        onClear={catalog.clearFilters}
      />
    </>
  );
}
