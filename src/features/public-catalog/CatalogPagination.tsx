import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicPagination } from "@/features/public-catalog/publicCatalogTypes";

type CatalogPaginationProps = {
  pagination: PublicPagination;
  onPageChange: (page: number) => void;
  ariaLabel?: string;
};

export function CatalogPagination({
  pagination,
  onPageChange,
  ariaLabel = "Paginação do catálogo",
}: CatalogPaginationProps) {
  if (pagination.totalPages <= 1) return null;

  return (
    <nav className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row" aria-label={ariaLabel}>
      <button
        type="button"
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={pagination.page <= 1}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-input px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Anterior
      </button>
      <span className="min-w-28 text-center text-sm font-semibold text-muted-foreground">
        Página {pagination.page} de {pagination.totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={pagination.page >= pagination.totalPages}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-input px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        Próxima
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
