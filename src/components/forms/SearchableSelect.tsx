import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { useDropdown } from "@/hooks/useDropdown";

export interface SelectOption {
  id?: number | string;
  value?: string;
  label: string;
}

interface SearchableSelectProps {
  ariaLabel?: string;
  ariaLabelledBy?: string;
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  onOpen?: () => void;
  disabled?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  maxVisibleItems?: number;
  invalid?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  showIndicator?: boolean;
  allowEmptyOption?: boolean;
  clearable?: boolean;
  tone?: "default" | "sidebar" | "panel";
  textSize?: "sm" | "base";
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getOptionValue(option: SelectOption) {
  return option.value ?? String(option.id ?? "");
}

export function SearchableSelect({
  ariaLabel,
  ariaLabelledBy,
  label,
  value,
  options,
  onChange,
  onOpen,
  disabled = false,
  placeholder = "Selecione",
  emptyMessage = "Nenhum resultado encontrado.",
  maxVisibleItems = 6,
  invalid = false,
  searchable = false,
  searchPlaceholder = "Digite para buscar...",
  className = "mt-2",
  showIndicator = true,
  allowEmptyOption = true,
  clearable = false,
  tone = "default",
  textSize = "base",
}: SearchableSelectProps) {
  const { isOpen, closeDropdown, toggleDropdown, rootProps } = useDropdown();
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const accessibleLabel = ariaLabel ?? label;
  const selectedOption = options.find((option) => getOptionValue(option) === value);
  const filteredOptions = searchable && searchTerm.trim()
    ? options.filter((option) => normalizeSearchText(option.label).includes(normalizeSearchText(searchTerm)))
    : options;
  const sidebarTone = tone === "sidebar";
  const panelTone = tone === "panel";
  const brightTone = sidebarTone || panelTone;
  const fieldSurface = sidebarTone
    ? "border-sidebar-foreground/35 bg-sidebar"
    : panelTone
      ? "border-sidebar-foreground/35 bg-background"
      : "border-border bg-input";
  const secondaryText = brightTone ? "text-foreground" : "text-muted-foreground";
  const menuSurface = sidebarTone ? "bg-sidebar" : "bg-background";
  const controlTextSize = textSize === "sm" ? "text-sm" : "text-base";
  const placeholderText = "text-muted-foreground";

  useEffect(() => {
    if (isOpen && searchable) searchInputRef.current?.focus();
    if (!isOpen) setSearchTerm("");
  }, [isOpen, searchable]);

  function handleToggle() {
    if (!isOpen) onOpen?.();
    toggleDropdown();
  }

  function selectOption(nextValue: string) {
    onChange(clearable && nextValue === value ? "" : nextValue);
    closeDropdown();
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault();
      closeDropdown();
    }
  }

  return (
    <div {...rootProps} className={`relative min-w-0 ${className}`}>
      {isOpen && searchable && !disabled ? (
        <div className={`flex h-12 w-full items-center gap-3 rounded-xl border px-3 font-semibold outline-none ring-2 ${controlTextSize} ${fieldSurface} ${
          invalid ? "border-red-500 ring-red-500/30" : "border-primary ring-primary/40"
        }`}>
          <input
            ref={searchInputRef}
            data-comanga-dropdown-search="true"
            aria-label={accessibleLabel}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={searchPlaceholder}
            className={`min-w-0 flex-1 bg-transparent font-semibold text-foreground outline-none ${controlTextSize} ${brightTone ? "placeholder:text-foreground" : "placeholder:text-muted-foreground"}`}
          />
          {clearable && selectedOption ? (
            <button
              type="button"
              aria-label={`Limpar ${accessibleLabel || "seleção"}`}
              onClick={() => onChange("")}
              className={`-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center transition-colors hover:text-foreground focus:text-foreground focus:outline-none ${secondaryText}`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              aria-label={`Fechar ${accessibleLabel || "lista"}`}
              onClick={closeDropdown}
              className={`-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center ${secondaryText}`}
            >
              <ChevronDown className="h-4 w-4 rotate-180" />
            </button>
          )}
        </div>
      ) : clearable && selectedOption && !disabled ? (
        <div className={`flex h-12 w-full items-center rounded-xl border font-semibold text-foreground outline-none transition-colors focus-within:ring-2 ${controlTextSize} ${fieldSurface} ${
          invalid
            ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/30"
            : `${brightTone ? "border-sidebar-foreground/35" : "border-border"} focus-within:border-primary focus-within:ring-primary/40`
        }`}>
          <button
            type="button"
            aria-label={accessibleLabel}
            aria-labelledby={ariaLabelledBy}
            aria-expanded={isOpen}
            onClick={handleToggle}
            className="flex h-full min-w-0 flex-1 items-center px-3 text-left outline-none"
          >
            <span className="truncate">{selectedOption.label}</span>
          </button>
          <button
            type="button"
            aria-label={`Limpar ${accessibleLabel || "seleção"}`}
            onClick={() => onChange("")}
            className={`inline-flex h-full w-11 shrink-0 items-center justify-center transition-colors hover:text-foreground focus:text-foreground focus:outline-none ${secondaryText}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label={accessibleLabel}
          aria-labelledby={ariaLabelledBy}
          aria-expanded={isOpen}
          disabled={disabled}
          onClick={handleToggle}
          className={`flex h-12 w-full items-center justify-between gap-3 rounded-xl border px-3 text-left font-semibold text-foreground outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${controlTextSize} ${fieldSurface} ${
            invalid
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
              : `${brightTone ? "border-sidebar-foreground/35" : "border-border"} focus:border-primary focus:ring-primary/40`
          }`}
        >
          <span className={`truncate ${selectedOption ? "" : placeholderText}`}>
            {selectedOption?.label || placeholder}
          </span>
          {showIndicator ? (
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${secondaryText} ${isOpen ? "rotate-180" : ""}`} />
          ) : null}
        </button>
      )}

      {isOpen && !disabled ? (
        <div
          className={`absolute left-0 top-[calc(100%+4px)] z-40 w-full overflow-y-auto rounded-lg border border-primary shadow-2xl ${menuSurface}`}
          style={{ maxHeight: maxVisibleItems * 44 }}
        >
          {!searchable && allowEmptyOption ? (
            <button
              type="button"
              onClick={() => selectOption("")}
              className={`flex h-11 w-full items-center justify-between gap-2 px-3 text-left text-sm font-semibold transition-colors ${
                value === "" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-primary hover:text-primary-foreground"
              }`}
            >
              <span>{placeholder}</span>
              {value === "" ? <Check className="h-4 w-4" /> : null}
            </button>
          ) : null}

          {filteredOptions.length === 0 ? (
            <div className={`px-3 py-4 text-sm font-semibold ${secondaryText}`}>{emptyMessage}</div>
          ) : null}

          {filteredOptions.map((option) => {
            const optionValue = getOptionValue(option);
            const selected = optionValue === value;

            return (
              <button
                key={optionValue}
                type="button"
                title={option.label}
                onClick={() => selectOption(optionValue)}
                className={`flex h-11 w-full items-center justify-between gap-2 px-3 text-left text-sm font-semibold transition-colors ${
                  selected ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {selected ? <Check className="h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
