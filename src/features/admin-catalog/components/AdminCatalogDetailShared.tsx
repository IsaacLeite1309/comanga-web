import type React from "react";
import { LayoutGrid, List, Loader2 } from "lucide-react";
import type { CatalogViewMode } from "../hooks/useCatalogDetailView";

export function DetailInfoBlock({
  label,
  value,
  badgeClassName = "",
  icon,
  withIconLayout = true,
}: {
  label: string;
  value: string;
  badgeClassName?: string;
  icon?: React.ReactNode;
  withIconLayout?: boolean;
}) {
  const layoutClassName = withIconLayout ? "items-center gap-2 " : "";

  return (
    <div className="min-w-0 rounded-xl border border-border bg-input px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={`mt-1 inline-flex max-w-full ${layoutClassName}truncate text-base font-bold text-foreground ${
          badgeClassName ? `rounded-lg border px-3 py-1 text-sm ${badgeClassName}` : ""
        }`}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}

export function CatalogViewToggle({
  viewMode,
  onChange,
}: {
  viewMode: CatalogViewMode;
  onChange: (viewMode: CatalogViewMode) => void;
}) {
  const buttonClassName = "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors";
  const activeClassName = "bg-primary text-primary-foreground";
  const idleClassName = "text-muted-foreground hover:text-foreground";

  return (
    <div className="hidden rounded-xl border border-border bg-input p-1 md:inline-flex">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`${buttonClassName} ${viewMode === "list" ? activeClassName : idleClassName}`}
      >
        <List className="h-3.5 w-3.5" />
        Lista
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`${buttonClassName} ${viewMode === "grid" ? activeClassName : idleClassName}`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Grade
      </button>
    </div>
  );
}

export function DetailLoading({ message }: { message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 text-muted-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
      {message}
    </div>
  );
}

export function DetailError({ message }: { message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 text-sm font-semibold text-red-300">
      {message}
    </div>
  );
}

export function DeleteCatalogItemDialog({
  title,
  description,
  deleting,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
      <div className="w-fit max-w-[calc(100vw-2rem)] rounded-2xl border border-red-500/30 bg-card p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="mt-2 whitespace-nowrap text-sm text-muted-foreground max-sm:whitespace-normal">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-lg border border-border bg-input px-4 py-2 text-sm font-bold text-foreground disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirmar exclusão
          </button>
        </div>
      </div>
    </div>
  );
}
