import { ArrowLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export type AdminBreadcrumbItem = { label: string; to?: string; state?: object };

export function AdminCatalogBreadcrumb({ backTo, backState, items }: {
  backTo: string;
  backState?: object;
  items: AdminBreadcrumbItem[];
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-border pb-4">
      <Link to={backTo} state={backState} className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 text-base font-bold leading-none text-foreground transition-colors hover:bg-sidebar-accent/30">
        <ArrowLeft className="h-5 w-5 text-primary" />
        Voltar
      </Link>
      <nav className="flex min-w-0 items-center gap-1 text-base font-semibold leading-none" aria-label="Caminho de navegação">
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
            {index > 0 && <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
            {item.to ? <Link to={item.to} state={item.state} className="truncate rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-sidebar-accent/30 hover:text-foreground">{item.label}</Link> : <span className="truncate rounded-lg bg-sidebar-accent/30 px-2 py-1 text-primary" aria-current="page">{item.label}</span>}
          </div>
        ))}
      </nav>
    </div>
  );
}
