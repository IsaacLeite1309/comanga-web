import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { useDropdown } from "@/hooks/useDropdown";
import {
  getSelectFieldStyles,
  normalizeSearchText,
  type SelectFieldStyles,
  type SelectTone,
} from "@/components/forms/selectFieldStyles";

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
  tone?: SelectTone;
  textSize?: "sm" | "base";
}

function resolveSearchableSelectProps({
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
  return {
    ariaLabel,
    ariaLabelledBy,
    label,
    value,
    options,
    onChange,
    onOpen,
    disabled,
    placeholder,
    emptyMessage,
    maxVisibleItems,
    invalid,
    searchable,
    searchPlaceholder,
    className,
    showIndicator,
    allowEmptyOption,
    clearable,
    tone,
    textSize,
  };
}

interface ControlProps extends SelectFieldStyles {
  accessibleLabel?: string;
  ariaLabelledBy?: string;
  clearable: boolean;
  closeDropdown: () => void;
  disabled: boolean;
  handleToggle: () => void;
  invalid: boolean;
  isOpen: boolean;
  onChange: (value: string) => void;
  placeholder: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchable: boolean;
  searchPlaceholder: string;
  searchTerm: string;
  selectedOption?: SelectOption;
  setSearchTerm: (value: string) => void;
  showIndicator: boolean;
}

function getOptionValue(option: SelectOption) {
  return option.value ?? String(option.id ?? "");
}

function SearchControl(props: ControlProps) {
  const {
    accessibleLabel, brightTone, clearable, closeDropdown, controlTextSize,
    fieldSurface, invalid, onChange, searchInputRef, searchPlaceholder, searchTerm,
    secondaryText, selectedOption, setSearchTerm,
  } = props;
  const border = invalid ? "border-red-500 ring-red-500/30" : "border-primary ring-primary/40";

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" && event.key !== "Escape") return;
    event.preventDefault();
    closeDropdown();
  }

  return (
    <div className={`flex h-12 w-full items-center gap-3 rounded-xl border px-3 font-semibold outline-none ring-2 ${controlTextSize} ${fieldSurface} ${border}`}>
      <input
        ref={searchInputRef}
        data-comanga-dropdown-search="true"
        aria-label={accessibleLabel}
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        onKeyDown={handleKeyDown}
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
  );
}

function ClearableControl(props: ControlProps) {
  const {
    accessibleLabel, ariaLabelledBy, brightTone, controlTextSize, fieldSurface,
    handleToggle, invalid, isOpen, onChange, secondaryText, selectedOption,
  } = props;
  const border = invalid
    ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/30"
    : `${brightTone ? "border-sidebar-foreground/35" : "border-border"} focus-within:border-primary focus-within:ring-primary/40`;

  return (
    <div className={`flex h-12 w-full items-center rounded-xl border font-semibold text-foreground outline-none transition-colors focus-within:ring-2 ${controlTextSize} ${fieldSurface} ${border}`}>
      <button
        type="button"
        aria-label={accessibleLabel}
        aria-labelledby={ariaLabelledBy}
        aria-expanded={isOpen}
        onClick={handleToggle}
        className="flex h-full min-w-0 flex-1 items-center px-3 text-left outline-none"
      >
        <span className="truncate">{selectedOption?.label}</span>
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
  );
}

function DefaultControl(props: ControlProps) {
  const {
    accessibleLabel, ariaLabelledBy, brightTone, controlTextSize, disabled,
    fieldSurface, handleToggle, invalid, isOpen, placeholder, secondaryText,
    selectedOption, showIndicator,
  } = props;
  const border = invalid
    ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
    : `${brightTone ? "border-sidebar-foreground/35" : "border-border"} focus:border-primary focus:ring-primary/40`;

  return (
    <button
      type="button"
      aria-label={accessibleLabel}
      aria-labelledby={ariaLabelledBy}
      aria-expanded={isOpen}
      disabled={disabled}
      onClick={handleToggle}
      className={`flex h-12 w-full items-center justify-between gap-3 rounded-xl border px-3 text-left font-semibold text-foreground outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${controlTextSize} ${fieldSurface} ${border}`}
    >
      <span className={`truncate ${selectedOption ? "" : "text-muted-foreground"}`}>
        {selectedOption?.label || placeholder}
      </span>
      {showIndicator ? (
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${secondaryText} ${isOpen ? "rotate-180" : ""}`} />
      ) : null}
    </button>
  );
}

function SelectControl(props: ControlProps) {
  if (props.isOpen && props.searchable && !props.disabled) return <SearchControl {...props} />;
  if (props.clearable && props.selectedOption && !props.disabled) return <ClearableControl {...props} />;
  return <DefaultControl {...props} />;
}

function EmptyOption({ placeholder, selectOption, selected }: {
  placeholder: string;
  selectOption: (value: string) => void;
  selected: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => selectOption("")}
      className={`flex h-11 w-full items-center justify-between gap-2 px-3 text-left text-sm font-semibold transition-colors ${selected ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-primary hover:text-primary-foreground"}`}
    >
      <span>{placeholder}</span>
      {selected ? <Check className="h-4 w-4" /> : null}
    </button>
  );
}

function OptionsMenu({
  allowEmptyOption, emptyMessage, filteredOptions, maxVisibleItems, menuSurface,
  placeholder, searchable, secondaryText, selectOption, value,
}: {
  allowEmptyOption: boolean;
  emptyMessage: string;
  filteredOptions: SelectOption[];
  maxVisibleItems: number;
  menuSurface: string;
  placeholder: string;
  searchable: boolean;
  secondaryText: string;
  selectOption: (value: string) => void;
  value: string;
}) {
  return (
    <div
      className={`absolute left-0 top-[calc(100%+4px)] z-40 w-full overflow-y-auto rounded-lg border border-primary shadow-2xl ${menuSurface}`}
      style={{ maxHeight: maxVisibleItems * 44 }}
    >
      {!searchable && allowEmptyOption ? (
        <EmptyOption
          placeholder={placeholder}
          selectOption={selectOption}
          selected={value === ""}
        />
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
            className={`flex h-11 w-full items-center justify-between gap-2 px-3 text-left text-sm font-semibold transition-colors ${selected ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-primary hover:text-primary-foreground"}`}
          >
            <span className="truncate">{option.label}</span>
            {selected ? <Check className="h-4 w-4 shrink-0" /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function SearchableSelect(props: SearchableSelectProps) {
  const {
    ariaLabel, ariaLabelledBy, label, value, options, onChange, onOpen, disabled,
    placeholder, emptyMessage, maxVisibleItems, invalid, searchable, searchPlaceholder,
    className, showIndicator, allowEmptyOption, clearable, tone, textSize,
  } = resolveSearchableSelectProps(props);
  const { isOpen, closeDropdown, toggleDropdown, rootProps } = useDropdown();
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const accessibleLabel = ariaLabel ?? label;
  const selectedOption = options.find((option) => getOptionValue(option) === value);
  const filteredOptions = searchable && searchTerm.trim()
    ? options.filter((option) => normalizeSearchText(option.label).includes(normalizeSearchText(searchTerm)))
    : options;
  const styles = getSelectFieldStyles(tone, textSize);

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

  const controlProps: ControlProps = {
    ...styles,
    accessibleLabel,
    ariaLabelledBy,
    clearable,
    closeDropdown,
    disabled,
    handleToggle,
    invalid,
    isOpen,
    onChange,
    placeholder,
    searchInputRef,
    searchable,
    searchPlaceholder,
    searchTerm,
    selectedOption,
    setSearchTerm,
    showIndicator,
  };

  return (
    <div {...rootProps} className={`relative min-w-0 ${className}`}>
      <SelectControl {...controlProps} />
      {isOpen && !disabled ? (
        <OptionsMenu
          allowEmptyOption={allowEmptyOption}
          emptyMessage={emptyMessage}
          filteredOptions={filteredOptions}
          maxVisibleItems={maxVisibleItems}
          menuSurface={styles.menuSurface}
          placeholder={placeholder}
          searchable={searchable}
          secondaryText={styles.secondaryText}
          selectOption={selectOption}
          value={value}
        />
      ) : null}
    </div>
  );
}
