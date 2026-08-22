import { Link } from "react-router-dom";
import { CatalogCover } from "@/features/public-catalog/CatalogCover";
import type { PublicWorkSummary } from "@/features/public-catalog/publicCatalogTypes";

export function PublicWorkCard({ work }: { work: PublicWorkSummary }) {
  const metadata = [work.type?.label, work.country].filter(Boolean).join(" · ");

  return (
    <article className="min-w-0">
      <Link
        to={`/obras/${encodeURIComponent(work.slug)}`}
        aria-label={`Ver detalhes de ${work.title}`}
        className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <CatalogCover key={work.coverUrl || "empty"} src={work.coverUrl} alt={`Capa de ${work.title}`} className="transition-transform group-hover:-translate-y-1" />
        <h2 className="mt-2 truncate text-sm font-bold text-foreground group-hover:text-primary sm:text-base" title={work.title}>
          {work.title}
        </h2>
      </Link>
      {work.authors.length > 0 ? (
        <p className="truncate text-xs font-medium text-muted-foreground">
          {work.authors.map((author, index) => (
            <span key={author.id}>
              {index > 0 ? ", " : null}
              <Link to={`/autores/${author.id}`} aria-label={`Ver Obras de ${author.label}`} className="hover:text-primary hover:underline">
                {author.label}
              </Link>
            </span>
          ))}
        </p>
      ) : (
        <p className="truncate text-xs font-medium text-muted-foreground">Autor não informado</p>
      )}
      {metadata ? <p className="mt-0.5 truncate text-xs text-muted-foreground" title={metadata}>{metadata}</p> : null}
    </article>
  );
}
