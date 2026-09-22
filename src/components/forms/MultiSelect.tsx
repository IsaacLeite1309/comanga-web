import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { useDropdown } from "@/hooks/useDropdown";
import type { SelectOption } from "@/components/forms/SearchableSelect";
import {
  getSelectFieldStyles,
  normalizeSearchText,
  type SelectFieldStyles,
  type SelectTone,
} from "@/components/forms/selectFieldStyles";

interface MultiSelectProps {
  label: string;
  options: SelectOption[];
  selectedIds: Array<number | string>;
  onToggle: (id: number | string) => boolean | void;
  isOptionDisabled?: (id: number | string) => boolean;
  onOpen?: () => void;
  emptyMessage?: string;
  disabled?: boolean;
  disabledMessage?: string;
  required?: boolean;
  invalid?: boolean;
  errorMessage?: string;
  searchable?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  onClear?: () => void;
  reorderable?: boolean;
  onMove?: (fromIndex: number, toIndex: number) => void;
  maxVisibleItems?: number;
  tone?: SelectTone;
  textSize?: "sm" | "base";
}

function resolveMultiSelectProps({
  label,
  options,
  selectedIds,
  onToggle,
  isOptionDisabled,
  onOpen,
  emptyMessage = "Nenhum valor cadastrado para esta lista.",
  disabled = false,
  disabledMessage = "Campo desabilitado.",
  required = false,
  invalid = false,
  errorMessage = "",
  searchable = false,
  placeholder = "Selecione",
  searchPlaceholder = "Digite para buscar...",
  onClear,
  reorderable = false,
  onMove,
  maxVisibleItems = 6,
  tone = "default",
  textSize = "base",
}: MultiSelectProps) {
  return {
    label,
    options,
    selectedIds,
    onToggle,
    isOptionDisabled,
    onOpen,
    emptyMessage,
    disabled,
    disabledMessage,
    required,
    invalid,
    errorMessage,
    searchable,
    placeholder,
    searchPlaceholder,
    onClear,
    reorderable,
    onMove,
    maxVisibleItems,
    tone,
    textSize,
  };
}

interface ControlProps extends SelectFieldStyles {
  closeDropdown: () => void;
  disabled: boolean;
  handleToggleDropdown: () => void;
  invalid: boolean;
  isOpen: boolean;
  label: string;
  onClear?: () => void;
  placeholder: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchable: boolean;
  searchPlaceholder: string;
  searchTerm: string;
  selectedOptions: SelectOption[];
  setSearchTerm: (value: string) => void;
  summary: string;
}

function getOptionValue(option: SelectOption): number | string {
  if (typeof option.id === "number") return option.id;
  return option.value ?? String(option.id ?? "");
}

function SelectedChips({ brightTone, selectedOptions }: {
  brightTone: boolean;
  selectedOptions: SelectOption[];
}) {
  const visibleChips = selectedOptions.slice(0, 3);
  const hiddenChipCount = Math.max(selectedOptions.length - visibleChips.length, 0);
  const selectedChipText = brightTone ? "text-foreground" : "text-primary";
  const hiddenChipText = brightTone ? "text-foreground" : "text-muted-foreground";

  return (
    <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
      {visibleChips.map((option) => (
        <span
          key={getOptionValue(option)}
          className={`max-w-full truncate rounded-md bg-primary/15 px-2 py-1 text-xs font-bold ${selectedChipText}`}
        >
          {option.label}
        </span>
      ))}
      {hiddenChipCount > 0 ? (
        <span className={`rounded-md bg-muted px-2 py-1 text-xs font-bold ${hiddenChipText}`}>
          +{hiddenChipCount}
        </span>
      ) : null}
    </span>
  );
}

function SearchControl(props: ControlProps) {
  const {
    brightTone, closeDropdown, controlTextSize, fieldSurface, invalid, isOpen, label,
    onClear, searchInputRef, searchPlaceholder, searchTerm, secondaryText,
    selectedOptions, setSearchTerm,
  } = props;
  const border = invalid
    ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/30"
    : "border-primary focus-within:border-primary focus-within:ring-primary/40";

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" && event.key !== "Escape") return;
    event.preventDefault();
    closeDropdown();
  }

  return (
    <div className={`mt-2 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 font-semibold text-foreground outline-none transition-colors focus-within:ring-2 ${controlTextSize} ${fieldSurface} ${border}`}>
      <input
        ref={searchInputRef}
        data-comanga-dropdown-search="true"
        aria-label={`Selecionar ${label}`}
        aria-expanded={isOpen}
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={searchPlaceholder}
        className={`min-w-0 flex-1 bg-transparent font-semibold text-foreground outline-none ${controlTextSize} ${brightTone ? "placeholder:text-foreground" : "placeholder:text-muted-foreground"}`}
      />
      {selectedOptions.length > 0 && onClear ? (
        <button
          type="button"
          aria-label={`Limpar ${label}`}
          onClick={onClear}
          className={`-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center transition-colors hover:text-foreground focus:text-foreground focus:outline-none ${secondaryText}`}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : (
        <button
          type="button"
          aria-label={`Fechar ${label}`}
          onClick={closeDropdown}
          className={`-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center ${secondaryText}`}
        >
          <ChevronDown className="h-4 w-4 rotate-180" />
        </button>
      )}
    </div>
  );
}

function ClearableControl(props: ControlProps) {
  const {
    brightTone, controlTextSize, fieldSurface, handleToggleDropdown, invalid,
    isOpen, label, onClear, secondaryText, selectedOptions,
  } = props;
  const border = invalid
    ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/30"
    : `${brightTone ? "border-sidebar-foreground/35" : "border-border"} focus-within:border-primary focus-within:ring-primary/40`;

  return (
    <div className={`mt-2 flex min-h-12 w-full items-center rounded-xl border font-semibold text-foreground outline-none transition-colors focus-within:ring-2 ${controlTextSize} ${fieldSurface} ${border}`}>
      <button
        type="button"
        onClick={handleToggleDropdown}
        className="flex min-h-12 min-w-0 flex-1 items-center px-3 py-2 text-left outline-none"
        aria-expanded={isOpen}
        aria-label={`Selecionar ${label}`}
      >
        <SelectedChips brightTone={brightTone} selectedOptions={selectedOptions} />
      </button>
      <button
        type="button"
        aria-label={`Limpar ${label}`}
        onClick={onClear}
        className={`inline-flex min-h-12 w-11 shrink-0 items-center justify-center transition-colors hover:text-foreground focus:text-foreground focus:outline-none ${secondaryText}`}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function DefaultControl(props: ControlProps) {
  const {
    brightTone, controlTextSize, disabled, fieldSurface, handleToggleDropdown, invalid,
    isOpen, label, searchable, secondaryText, selectedOptions, summary,
  } = props;
  const border = invalid
    ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
    : `${brightTone ? "border-sidebar-foreground/35" : "border-border"} focus:border-primary focus:ring-primary/40`;
  const showChips = searchable && selectedOptions.length > 0;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleToggleDropdown}
      className={`mt-2 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left font-semibold text-foreground outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${controlTextSize} ${fieldSurface} ${border}`}
      aria-expanded={isOpen}
      aria-label={`Selecionar ${label}`}
    >
      {showChips ? (
        <SelectedChips brightTone={brightTone} selectedOptions={selectedOptions} />
      ) : (
        <span className={`truncate ${selectedOptions.length > 0 ? "" : "text-muted-foreground"}`}>
          {summary}
        </span>
      )}
      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${secondaryText} ${isOpen ? "rotate-180" : ""}`} />
    </button>
  );
}

function MultiSelectControl(props: ControlProps) {
  if (props.isOpen && props.searchable && !props.disabled) return <SearchControl {...props} />;
  if (props.selectedOptions.length > 0 && props.onClear && !props.disabled) return <ClearableControl {...props} />;
  return <DefaultControl {...props} />;
}

function OptionsMenu({
  closeDropdown, emptyMessage, filteredOptions, maxVisibleItems, menuSurface,
  isOptionDisabled, onToggle, options, secondaryText, selectedIds,
}: {
  closeDropdown: () => void;
  emptyMessage: string;
  filteredOptions: SelectOption[];
  maxVisibleItems: number;
  menuSurface: string;
  isOptionDisabled?: (id: number | string) => boolean;
  onToggle: (id: number | string) => boolean | void;
  options: SelectOption[];
  secondaryText: string;
  selectedIds: Array<number | string>;
}) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    closeDropdown();
  }

  return (
    <div
      className={`absolute left-0 top-[calc(100%+4px)] z-30 w-full overflow-y-auto rounded-lg border border-primary shadow-2xl ${menuSurface}`}
      style={{ maxHeight: maxVisibleItems * 44 + 2 }}
    >
      {options.length === 0 ? (
        <div className={`px-3 py-4 text-sm font-semibold ${secondaryText}`}>{emptyMessage}</div>
      ) : null}
      {options.length > 0 && filteredOptions.length === 0 ? (
        <div className={`px-3 py-4 text-sm font-semibold ${secondaryText}`}>Nenhum resultado encontrado.</div>
      ) : null}
      {filteredOptions.map((option) => {
        const optionValue = getOptionValue(option);
        const selected = selectedIds.includes(optionValue);
        const optionDisabled = isOptionDisabled?.(optionValue) ?? false;
        return (
          <button
            key={optionValue}
            type="button"
            title={option.label}
            disabled={optionDisabled}
            onClick={() => {
              if (onToggle(optionValue)) closeDropdown();
            }}
            onKeyDown={handleKeyDown}
            className={`flex h-11 w-full items-center justify-between gap-2 px-3 text-left text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${selected ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-primary hover:text-primary-foreground"}`}
          >
            <span>{option.label}</span>
            {selected ? <Check className="h-4 w-4" /> : null}
          </button>
        );
      })}
    </div>
  );
}

function ReorderList({ onMove, selectedOptions }: {
  onMove: (fromIndex: number, toIndex: number) => void;
  selectedOptions: SelectOption[];
}) {
  return (
    <div className="mt-2 space-y-2">
      {selectedOptions.map((option, index) => (
        <div
          key={getOptionValue(option)}
          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-input px-3 py-2"
        >
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
  );
}

export function MultiSelect(props: MultiSelectProps) {
  const {
    label, options, selectedIds, onToggle, isOptionDisabled, onOpen, emptyMessage, disabled,
    disabledMessage, required, invalid, errorMessage, searchable, placeholder,
    searchPlaceholder, onClear, reorderable, onMove, maxVisibleItems, tone, textSize,
  } = resolveMultiSelectProps(props);
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
    : disabled ? disabledMessage : placeholder;
  const styles = getSelectFieldStyles(tone, textSize);

  useEffect(() => {
    if (isOpen && searchable) searchInputRef.current?.focus();
    if (!isOpen) setSearchTerm("");
  }, [isOpen, searchable]);

  function handleToggleDropdown() {
    if (!isOpen) onOpen?.();
    toggleDropdown();
  }

  const controlProps: ControlProps = {
    ...styles,
    closeDropdown,
    disabled,
    handleToggleDropdown,
    invalid,
    isOpen,
    label,
    onClear,
    placeholder,
    searchInputRef,
    searchable,
    searchPlaceholder,
    searchTerm,
    selectedOptions,
    setSearchTerm,
    summary,
  };

  return (
    <div {...rootProps} className="min-w-0">
      <div className="relative min-w-0">
        <span className={`text-xs font-bold uppercase tracking-wide ${styles.brightTone ? "text-foreground" : "text-muted-foreground"}`}>
          {label}{required ? <span className="text-red-400"> *</span> : ""}
        </span>
        <MultiSelectControl {...controlProps} />
        {isOpen && !disabled ? (
          <OptionsMenu
            closeDropdown={closeDropdown}
            emptyMessage={emptyMessage}
            filteredOptions={filteredOptions}
            maxVisibleItems={maxVisibleItems}
            menuSurface={styles.menuSurface}
            isOptionDisabled={isOptionDisabled}
            onToggle={onToggle}
            options={options}
            secondaryText={styles.secondaryText}
            selectedIds={selectedIds}
          />
        ) : null}
      </div>
      {reorderable && onMove && selectedOptions.length > 1 ? (
        <ReorderList onMove={onMove} selectedOptions={selectedOptions} />
      ) : null}
      {invalid && errorMessage ? <p className="mt-2 text-sm font-semibold text-red-400">{errorMessage}</p> : null}
    </div>
  );
}
