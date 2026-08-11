import { useEffect, useRef, useState } from "react";

const DEFAULT_MESSAGE = "Você tem alterações não salvas. Deseja sair mesmo assim?";

export function UnsavedChangesPrompt({
  when,
  message = DEFAULT_MESSAGE,
  continueLabel = "Continuar editando",
}: {
  when: boolean;
  message?: string;
  continueLabel?: string;
}) {
  const [pendingAnchor, setPendingAnchor] = useState<HTMLAnchorElement | null>(null);
  const bypassNextNavigation = useRef(false);

  useEffect(() => {
    if (!when) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    function handleDocumentClick(event: MouseEvent) {
      if (bypassNextNavigation.current) {
        bypassNextNavigation.current = false;
        return;
      }

      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      const anchor = target instanceof Element
        ? target.closest("a[href]")
        : null;

      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank") return;
      if (anchor.origin !== window.location.origin) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      event.preventDefault();
      event.stopPropagation();
      setPendingAnchor(anchor);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [when]);

  if (!pendingAnchor) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-foreground">Alterações não salvas</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{message}</p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setPendingAnchor(null)}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-input px-6 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {continueLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              const anchor = pendingAnchor;
              setPendingAnchor(null);
              bypassNextNavigation.current = true;
              anchor.click();
            }}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-red-500 px-6 text-sm font-bold text-white transition-colors hover:bg-red-600"
          >
            Sair sem salvar
          </button>
        </div>
      </section>
    </div>
  );
}
