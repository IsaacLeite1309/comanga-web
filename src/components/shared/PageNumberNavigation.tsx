import { useState } from "react";

type PageItem = number | string;

function visiblePageItems(page: number, totalPages: number): PageItem[] {
  const nearby = [1, totalPages, page - 1, page, page + 1];
  if (page <= 3) nearby.push(2, 3);
  if (page >= totalPages - 2) nearby.push(totalPages - 2, totalPages - 1);
  const pages = [...new Set(nearby.filter((value) => value >= 1 && value <= totalPages))].sort((a, b) => a - b);
  const items: PageItem[] = [];

  pages.forEach((value, index) => {
    const previous = pages[index - 1];
    if (previous && value - previous === 2) items.push(previous + 1);
    if (previous && value - previous > 2) items.push(`gap-${previous}-${value}`);
    items.push(value);
  });
  return items;
}

export function PageNumberNavigation({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const [editingGap, setEditingGap] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState("");
  const lastPage = Math.max(1, Math.floor(totalPages));
  const currentPage = Math.min(Math.max(1, page), lastPage);

  function submitPage() {
    const requested = Number(pageInput);
    setEditingGap(null);
    setPageInput("");
    if (!pageInput || !Number.isSafeInteger(requested)) return;
    const target = Math.min(Math.max(requested, 1), lastPage);
    if (target !== currentPage) onPageChange(target);
  }

  return (
    <div className="flex max-w-full items-center justify-center gap-1 overflow-x-auto" aria-label="Páginas disponíveis">
      {visiblePageItems(currentPage, lastPage).map((item) => typeof item === "number" ? (
        <button
          key={item}
          type="button"
          aria-label={`Página ${item}`}
          aria-current={item === currentPage ? "page" : undefined}
          onClick={() => onPageChange(item)}
          className={`h-9 min-w-9 shrink-0 rounded-lg px-2 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${item === currentPage
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover:bg-sidebar-accent hover:text-primary"}`}
        >
          {item}
        </button>
      ) : editingGap === item ? (
        <input
          key={item}
          autoFocus
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label="Número da página"
          title="Digite a página e pressione Enter"
          value={pageInput}
          onChange={(event) => setPageInput(event.target.value.replace(/\D/g, "").slice(0, 12))}
          onKeyDown={(event) => {
            if (event.key === "Enter") { event.preventDefault(); submitPage(); }
            if (event.key === "Escape") { setEditingGap(null); setPageInput(""); }
          }}
          onBlur={() => { setEditingGap(null); setPageInput(""); }}
          className="h-9 w-14 shrink-0 rounded-lg border border-primary bg-input px-1 text-center text-sm font-bold text-foreground outline-none"
        />
      ) : (
        <button
          key={item}
          type="button"
          aria-label="Ir para outra página"
          title="Digitar número da página"
          onClick={() => { setEditingGap(item); setPageInput(""); }}
          className="h-9 min-w-9 shrink-0 rounded-lg px-2 text-sm font-bold text-foreground transition-colors hover:bg-sidebar-accent hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          ...
        </button>
      ))}
    </div>
  );
}
