import { Link, useLocation } from "react-router-dom";
import { publicAuthorPath } from "./publicCatalogPaths";
import { catalogNavigationState } from "./publicCatalogNavigation";
import { CatalogCover } from "@/features/public-catalog/CatalogCover";
import type { PublicWorkSummary } from "@/features/public-catalog/publicCatalogTypes";

export function PublicWorkCard({
  work,
  showAuthors = true,
}: {
  work: PublicWorkSummary;
  showAuthors?: boolean;
}) {
  const metadata = [work.type?.label, work.country].filter(Boolean).join(" · ");
  const navigationState = catalogNavigationState(useLocation().state);

  return (
    <article className="min-w-0">
      <Link
        to={`/obra/${encodeURIComponent(work.slug)}`}
        state={navigationState}
        aria-label={`Ver detalhes de ${work.title}`}
        className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <CatalogCover key={work.coverUrl || "empty"} src={work.coverUrl} alt={`Capa de ${work.title}`} className="transition-transform group-hover:-translate-y-1" />
        <h2 className="mt-2 truncate text-sm font-normal text-foreground group-hover:text-primary sm:text-base" title={work.title}>
          {work.title}
        </h2>
      </Link>
      {showAuthors ? (
        work.authors.length > 0 ? (
          <p className="truncate text-xs font-normal text-muted-foreground">
            {work.authors.map((author, index) => (
              <span key={author.id}>
                {index > 0 ? ", " : null}
                <Link to={publicAuthorPath(author.slug || "")} state={{ ...navigationState, fromWork: { slug: work.slug, title: work.title } }} aria-label={`Ver Obras de ${author.label}`} className="hover:text-primary hover:underline">
                  {author.label}
                </Link>
              </span>
            ))}
          </p>
        ) : (
          <p className="truncate text-xs font-normal text-muted-foreground">Autor não informado</p>
        )
      ) : null}
      {metadata ? <p className="mt-1 truncate text-xs text-muted-foreground" title={metadata}>{metadata}</p> : null}
    </article>
  );
}
