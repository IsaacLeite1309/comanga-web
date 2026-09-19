import { Globe2, Loader2, Lock } from "lucide-react";
import type { CatalogVisibility } from "@/types/catalog";
import { visibilityActionClassName } from "@/components/catalog/catalogVisibilityStyles";

export function VisibilityIcon({
  visibility,
  className = "h-3.5 w-3.5",
}: {
  visibility: CatalogVisibility;
  className?: string;
}) {
  const Icon = visibility === "Público" ? Globe2 : Lock;
  return <Icon className={className} />;
}

interface CatalogVisibilityActionProps {
  visibility: CatalogVisibility;
  ariaLabel: string;
  onClick: () => void;
  loading?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function CatalogVisibilityAction({
  visibility,
  ariaLabel,
  onClick,
  loading = false,
  showLabel = true,
  className = "h-10 min-w-[118px] px-3",
}: CatalogVisibilityActionProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={loading}
      onClick={onClick}
      className={`${visibilityActionClassName(visibility)} inline-flex items-center justify-center gap-2 rounded-lg border text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <VisibilityIcon visibility={visibility} />}
      {!loading && showLabel ? visibility : null}
    </button>
  );
}
