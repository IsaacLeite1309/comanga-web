import { SearchableSelect, type SelectOption } from "@/components/forms/SearchableSelect";

interface CommonFieldProps {
  label: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  errorMessage?: string;
}

interface InputFieldProps extends CommonFieldProps {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
  placeholder?: string;
}

export function InputField({
  label,
  value,
  onChange,
  type = "text",
  step,
  required = false,
  disabled = false,
  invalid = false,
  errorMessage = "",
  placeholder = "",
}: InputFieldProps) {
  return (
    <label className="min-w-0">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}{required ? <span className="text-red-400"> *</span> : ""}
      </span>
      <input
        type={type}
        step={step}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={disabled ? "Incompatível" : placeholder}
        className={`mt-2 h-12 w-full rounded-xl border bg-input px-3 text-base font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
          invalid
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
            : "border-border focus:border-primary focus:ring-primary/40"
        }`}
      />
      {invalid && errorMessage ? (
        <p className="mt-2 text-sm font-semibold text-red-400">{errorMessage}</p>
      ) : null}
    </label>
  );
}

interface SelectFieldProps extends CommonFieldProps {
  value: string;
  onChange: (value: string) => void;
  onOpen?: () => void;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  maxVisibleItems?: number;
}

export function SelectField({
  label,
  value,
  onChange,
  onOpen,
  options,
  required = false,
  disabled = false,
  placeholder = "Selecione",
  invalid = false,
  errorMessage = "",
  searchable = false,
  maxVisibleItems = 6,
}: SelectFieldProps) {
  return (
    <div className="min-w-0">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}{required ? <span className="text-red-400"> *</span> : ""}
      </span>
      <SearchableSelect
        label={label}
        value={value}
        onChange={onChange}
        onOpen={onOpen}
        options={options}
        disabled={disabled}
        placeholder={disabled ? "Incompatível" : placeholder}
        invalid={invalid}
        searchable={searchable}
        maxVisibleItems={maxVisibleItems}
      />
      {invalid && errorMessage ? (
        <p className="mt-2 text-sm font-semibold text-red-400">{errorMessage}</p>
      ) : null}
    </div>
  );
}

type YearSelectFieldProps = Omit<SelectFieldProps, "options" | "placeholder">;

export function YearSelectField(props: YearSelectFieldProps) {
  const lastYear = new Date().getFullYear() + 1;
  const options = Array.from({ length: lastYear - 1899 }, (_, index) => {
    const year = String(lastYear - index);
    return { id: Number(year), label: year };
  });

  return <SelectField {...props} options={options} placeholder="Selecione" />;
}

interface ToggleFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function ToggleField({
  label,
  checked,
  onChange,
  disabled = false,
  className = "",
}: ToggleFieldProps) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-80 ${
          checked ? "border-primary bg-primary" : "border-border bg-muted"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <span className="min-w-0 text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
