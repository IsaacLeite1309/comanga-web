import { useEffect, useRef } from "react";

export function WishlistToCollectionDialog({ count, onConfirm, onCancel }: {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    confirmButtonRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const description = count === 1
    ? "Este volume está na sua lista de desejos. Ao adicioná-lo à coleção, ele será removido da lista de desejos."
    : `${count} volumes selecionados estão na sua lista de desejos. Ao adicioná-los à coleção, eles serão removidos da lista de desejos.`;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="wishlist-transfer-title" aria-describedby="wishlist-transfer-description" className="w-full max-w-md rounded-2xl border border-primary/30 bg-card p-6 text-center shadow-2xl">
        <h2 id="wishlist-transfer-title" className="text-base font-bold text-foreground">Adicionar à coleção?</h2>
        <p id="wishlist-transfer-description" className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
          <button type="button" onClick={onCancel} className="min-w-32 rounded-lg border border-border px-4 py-2 text-base font-bold text-foreground transition-colors hover:bg-muted">Cancelar</button>
          <button ref={confirmButtonRef} type="button" onClick={onConfirm} className="min-w-32 rounded-lg bg-primary px-4 py-2 text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90">Adicionar</button>
        </div>
      </div>
    </div>
  );
}
