import { useEffect, useRef } from "react";

function volumeNames(labels: string[]) {
  const numbers = labels.map((label) => label.replace(/^Volume\s+/i, ""));
  const names = numbers.length < 2 ? numbers[0] ?? "" : `${numbers.slice(0, -1).join(", ")} e ${numbers[numbers.length - 1]}`;
  return `${labels.length === 1 ? "O volume" : "Os volumes"} ${names}`;
}

export function CollectionChangeDialog({ wishlistVolumes, readVolumes, confirmLabel, wishlistCopy = false, onConfirm, onCancel }: {
  wishlistVolumes: string[];
  readVolumes: string[];
  confirmLabel: string;
  wishlistCopy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const title = wishlistCopy ? "Confirmar alteração na lista de desejos?" : "Confirmar alterações na coleção?";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    confirmButtonRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="collection-change-title" aria-describedby="collection-change-description" className={`max-h-[calc(100dvh-2rem)] w-full ${wishlistCopy ? "max-w-sm" : "max-w-md"} overflow-y-auto rounded-2xl border border-primary/30 bg-card p-6 text-center shadow-2xl`}>
        <h2 id="collection-change-title" className="text-base font-bold text-foreground">{title}</h2>
        <div id="collection-change-description" className="mt-3 space-y-3 text-base leading-relaxed text-muted-foreground">
          {wishlistVolumes.length > 0 && (
            <p>{wishlistCopy ? "Ao adicionar este volume à coleção, ele será removido da lista." : `${volumeNames(wishlistVolumes)} ${wishlistVolumes.length === 1 ? "está" : "estão"} na sua lista de desejos. Ao ${wishlistVolumes.length === 1 ? "adicioná-lo" : "adicioná-los"} à coleção, ${wishlistVolumes.length === 1 ? "ele será removido" : "eles serão removidos"} da lista.`}</p>
          )}
          {readVolumes.length > 0 && (
            <p>{volumeNames(readVolumes)} {readVolumes.length === 1 ? "está marcado como lido" : "estão marcados como lidos"}. Ao {readVolumes.length === 1 ? "removê-lo" : "removê-los"} da coleção, {readVolumes.length === 1 ? "removerá seu estado de leitura" : "serão removidos seus estados de leitura"}.</p>
          )}
        </div>
        <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
          <button type="button" onClick={onCancel} className="min-w-32 rounded-lg border border-border px-4 py-2 text-base font-bold text-foreground transition-colors hover:bg-muted">Cancelar</button>
          <button ref={confirmButtonRef} type="button" onClick={onConfirm} className="min-w-32 rounded-lg bg-primary px-4 py-2 text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
