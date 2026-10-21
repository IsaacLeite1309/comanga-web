type CatalogResultsLoadingProps = {
  label: string;
  className?: string;
  cardActions?: "calendar" | "wishlist";
};

export function CatalogResultsLoading({ label, className = "", cardActions }: CatalogResultsLoadingProps) {
  return (
    <div className={className} role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div
        className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
        aria-hidden="true"
      >
        {Array.from({ length: 12 }, (_, index) => (
          <div
            key={index}
            className="catalog-skeleton-card min-w-0"
            style={{ animationDelay: `${index * 110}ms` }}
          >
            <div className="catalog-skeleton-shape aspect-[2/3] rounded-lg border border-sidebar-foreground/15" />
            <div className="catalog-skeleton-shape mt-2 h-4 w-3/4 max-w-full rounded" />
            <div className="catalog-skeleton-shape mt-2 h-3 w-1/2 max-w-full rounded opacity-80" />
            {cardActions && <div className={`mt-3 grid ${cardActions === "calendar" ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
              {Array.from({ length: cardActions === "calendar" ? 3 : 2 }, (_, actionIndex) => (
                <div key={actionIndex} className="catalog-skeleton-shape h-10 rounded-lg border border-sidebar-foreground/20" />
              ))}
            </div>}
            {cardActions === "wishlist" && <div className="catalog-skeleton-shape mt-3 h-10 rounded-lg border border-sidebar-foreground/20" />}
          </div>
        ))}
      </div>
    </div>
  );
}
