import { useId, useRef } from "react";
import { BookOpen, ChevronDown, Heart, LibraryBig } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDropdown } from "@/hooks/useDropdown";
import type { CollectionProgress } from "@/features/personal-library";

export function CollectionManagementMenu({ path, progress, navigationState, collectionPage, editionLabel }: {
  path: string;
  progress: CollectionProgress;
  navigationState: { catalogOrigin: string; returnTo: string };
  collectionPage: number;
  editionLabel: string;
}) {
  const { isOpen, toggleDropdown, closeDropdown, rootProps } = useDropdown();
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const missingCount = Math.max(0, progress.total - progress.owned);
  const actions = [
    { mode: "colecao", count: progress.owned, total: progress.total, label: "adquiridos", Icon: LibraryBig },
    { mode: "lidos", count: progress.read, total: progress.owned, label: "lidos", Icon: BookOpen },
    ...(missingCount > 0 ? [{ mode: "desejos", count: progress.wished, total: missingCount, label: "desejados", Icon: Heart }] : []),
  ];

  return (
    <div
      {...rootProps}
      className="relative ml-auto w-max max-w-full shrink-0"
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) closeDropdown();
      }}
      onKeyDown={event => {
        if (event.key === "Escape" && isOpen) {
          event.preventDefault();
          event.stopPropagation();
          closeDropdown();
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={toggleDropdown}
        className={`flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg border bg-sidebar px-3 text-left text-sm font-semibold outline-none transition-colors hover:border-primary hover:text-primary focus-visible:border-primary focus-visible:text-primary ${isOpen ? "border-primary text-primary" : "border-sidebar-foreground/20 text-sidebar-foreground"}`}
      >
        Gerenciar volumes
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {isOpen && (
        <nav id={panelId} aria-label={`Gerenciar volumes da ${editionLabel}`} className="absolute right-0 top-full z-20 mt-2 w-full overflow-hidden rounded-lg border border-primary bg-sidebar shadow-lg">
          {actions.map(({ mode, count, total, label, Icon }) => (
            <Link
              key={mode}
              to={`${path}/selecionar/${mode}`}
              state={navigationState}
              onClick={event => {
                closeDropdown();
                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                navigate(`${path}/selecionar/${mode}`, { state: {
                  ...navigationState,
                  collectionReturn: { page: collectionPage, scrollY: window.scrollY },
                } });
              }}
              className="group flex min-h-11 items-center gap-3 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:outline-none"
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{count}/{total} {label}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
