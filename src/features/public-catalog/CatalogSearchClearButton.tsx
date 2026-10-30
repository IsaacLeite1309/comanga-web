import { X } from "lucide-react";

export function CatalogSearchClearButton({ value, onClear }: { value: string; onClear: () => void }) {
  if (!value) return null;

  return (
    <button
      type="button"
      aria-label="Limpar pesquisa"
      onClick={onClear}
      className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
