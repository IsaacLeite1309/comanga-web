import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useDropdown } from "@/hooks/useDropdown";
import type { SelectOption } from "@/components/forms/SearchableSelect";

interface MultiSelectProps {
  label: string;
  options: SelectOption[];
  selectedIds: Array<number | string>;
  onToggle: (id: number | string) => void;
  onOpen?: () => void;
  emptyMessage?: string;
  disabled?: boolean;
  disabledMessage?: string;
  required?: boolean;
  invalid?: boolean;
  errorMessage?: string;
  searchable?: boolean;
  reorderable?: boolean;
  onMove?: (fromIndex: number, toIndex: number) => void;
  maxVisibleItems?: number;
}

function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function getOptionValue(option: SelectOption): number | string {
  if (typeof option.id === "number") return option.id;
  return option.value ?? String(option.id ?? "");
}

export function MultiSelect({
  label,
  options,
  selectedIds,
  onToggle,
  onOpen,
  emptyMessage = "Nenhum valor cadastrado para esta lista.",
  disabled = false,
  disabledMessage = "Campo desabilitado.",
  required = false,
  invalid = false,
  errorMessage = "",
  searchable = false,
  reorderable = false,
  onMove,
  maxVisibleItems = 6,
}: MultiSelectProps) {
  const { isOpen, closeDropdown, toggleDropdown, rootProps } = useDropdown();
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedOptions = selectedIds.flatMap((selectedId) => {
    const option = options.find((candidate) => getOptionValue(candidate) === selectedId);
    return option ? [option] : [];
  });
  const filteredOptions = searchable && searchTerm.trim()
    ? options.filter((option) => normalizeSearchText(option.label).includes(normalizeSearchText(searchTerm)))
    : options;
  const summary = selectedOptions.length > 0
    ? selectedOptions.map((option) => option.label).join(", ")
    : disabled
      ? disabledMessage
      : "Selecione";
  const visibleChips = selectedOptions.slice(0, 3);
  const hiddenChipCount = Math.max(selectedOptions.length - visibleChips.length, 0);

  useEffect(() => {
    if (isOpen && searchable) searchInputRef.current?.focus();
    if (!isOpen) setSearchTerm("");
  }, [isOpen, searchable]);

  function handleToggleDropdown() {
    if (!isOpen) onOpen?.();
    toggleDropdown();
  }

  return (
    <div {...rootProps} className="min-w-0">
      <div className="relative min-w-0">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {label}{required ? <span className="text-red-400"> *</span> : ""}
        </span>
        {isOpen && searchable && !disabled ? (
          <div className={`mt-2 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border bg-input px-3 py-2 text-base font-semibold text-foreground outline-none transition-colors focus-within:ring-2 ${
            invalid
              ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/30"
              : "border-primary focus-within:border-primary focus-within:ring-primary/40"
          }`}>
            <input
              ref={searchInputRef}
              data-comanga-dropdown-search="true"
              aria-label={`Selecionar ${label}`}
              aria-expanded={isOpen}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "Escape") {
                  event.preventDefault();
                  closeDropdown();
                }
              }}
              placeholder="Digite para buscar..."
              className="min-w-0 flex-1 bg-transparent text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              aria-label={`Fechar ${label}`}
              onClick={closeDropdown}
              className="-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground"
            >
              <ChevronDown className="h-4 w-4 rotate-180" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={handleToggleDropdown}
            className={`mt-2 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border bg-input px-3 py-2 text-left text-base font-semibold text-foreground outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
              invalid
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : "border-border focus:border-primary focus:ring-primary/40"
            }`}
            aria-expanded={isOpen}
            aria-label={`Selecionar ${label}`}
          >
            {searchable && selectedOptions.length > 0 ? (
              <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {visibleChips.map((option) => (
                  <span key={getOptionValue(option)} className="max-w-full truncate rounded-md bg-primary/15 px-2 py-1 text-xs font-bold text-primary">
                    {option.label}
                  </span>
                ))}
                {hiddenChipCount > 0 ? (
                  <span className="rounded-md bg-muted px-2 py-1 text-xs font-bold text-muted-foreground">
                    +{hiddenChipCount}
                  </span>
                ) : null}
              </span>
            ) : (
              <span className={`truncate ${selectedOptions.length > 0 ? "" : "text-muted-foreground"}`}>
                {summary}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        )}

        {isOpen && !disabled ? (
          <div
            className="absolute left-0 top-[calc(100%+4px)] z-30 w-full overflow-y-auto rounded-lg border border-primary bg-background shadow-2xl"
            style={{ maxHeight: maxVisibleItems * 40 }}
          >
            {options.length === 0 ? (
              <div className="px-3 py-4 text-sm font-semibold text-muted-foreground">{emptyMessage}</div>
            ) : null}
            {options.length > 0 && filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm font-semibold text-muted-foreground">Nenhum resultado encontrado.</div>
            ) : null}
            {filteredOptions.map((option) => {
              const optionValue = getOptionValue(option);
              const selected = selectedIds.includes(optionValue);

              return (
                <button
                  key={optionValue}
                  type="button"
                  onClick={() => onToggle(optionValue)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      closeDropdown();
                    }
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold transition-colors ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  <span>{option.label}</span>
                  {selected ? <Check className="h-4 w-4" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {reorderable && onMove && selectedOptions.length > 1 ? (
        <div className="mt-2 space-y-2">
          {selectedOptions.map((option, index) => (
            <div key={getOptionValue(option)} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-input px-3 py-2">
              <span className="min-w-0 truncate text-sm font-semibold text-foreground">{option.label}</span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label={`Mover ${option.label} para cima`}
                  disabled={index === 0}
                  onClick={() => onMove(index, index - 1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Mover ${option.label} para baixo`}
                  disabled={index === selectedOptions.length - 1}
                  onClick={() => onMove(index, index + 1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {invalid && errorMessage ? (
        <p className="mt-2 text-sm font-semibold text-red-400">{errorMessage}</p>
      ) : null}
    </div>
  );
}
