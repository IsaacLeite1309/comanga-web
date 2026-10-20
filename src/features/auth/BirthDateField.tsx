import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const today = () => new Date().toISOString().slice(0, 10);
const pad = (value: number) => String(value).padStart(2, "0");

function toDisplay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function toIso(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
}

function formatTypedDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return toDisplay(value);
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join("/");
}

interface BirthDateFieldProps {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function BirthDateField({ value, error, onChange }: BirthDateFieldProps) {
  const [display, setDisplay] = useState(() => toDisplay(value));
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"year" | "month" | "day">("year");
  const [year, setYear] = useState(() => Number(value.slice(0, 4)) || new Date().getUTCFullYear() - 20);
  const [month, setMonth] = useState(() => Number(value.slice(5, 7)) || 1);
  const rootRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);
  const selectedYearRef = useRef<HTMLButtonElement>(null);
  const maxDate = today();
  const maxYear = Number(maxDate.slice(0, 4));

  useEffect(() => {
    setDisplay(toDisplay(value));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || step !== "year" || !yearListRef.current || !selectedYearRef.current) return;
    const list = yearListRef.current;
    const selected = selectedYearRef.current;
    list.scrollTop = selected.offsetTop - (list.clientHeight - selected.clientHeight) / 2;
  }, [open, step, year]);

  function openPicker() {
    const selectedYear = Math.max(1900, Number(value.slice(0, 4)) || new Date().getUTCFullYear() - 20);
    setYear(selectedYear);
    setMonth(Number(value.slice(5, 7)) || 1);
    setStep("year");
    setOpen((wasOpen) => !wasOpen);
  }

  function selectDay(day: number) {
    const nextValue = `${year}-${pad(month)}-${pad(day)}`;
    setDisplay(toDisplay(nextValue));
    onChange(nextValue);
    setOpen(false);
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const optionClass = "min-h-10 rounded-xl text-sm font-semibold text-foreground transition-colors hover:bg-sidebar-accent hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          type="text"
          name="birthDate"
          inputMode="numeric"
          autoComplete="bday"
          maxLength={10}
          aria-label="Data de nascimento"
          aria-invalid={Boolean(error)}
          placeholder="Data de nascimento"
          value={display}
          onChange={(event) => {
            const nextDisplay = formatTypedDate(event.target.value);
            setDisplay(nextDisplay);
            onChange(toIso(nextDisplay));
          }}
          className={`h-12 w-full rounded-xl border bg-sidebar px-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${error ? "border-red-500 focus:border-red-500" : "border-sidebar-foreground/30 hover:border-primary focus:border-primary"}`}
        />
        <button type="button" aria-label="Selecionar data de nascimento" aria-expanded={open} onClick={openPicker} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary">
          <CalendarDays className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div role="dialog" aria-label="Selecionar data de nascimento" className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-primary/40 bg-sidebar p-4 text-foreground shadow-2xl">
          <div className="mb-4 flex gap-2">
            {(["year", "month", "day"] as const).map((part, index) => (
              <button key={part} type="button" onClick={() => setStep(part)} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${step === part ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"}`}>
                {["Ano", "Mês", "Dia"][index]}
              </button>
            ))}
          </div>
          {step === "year" && (
            <div ref={yearListRef} role="listbox" aria-label="Ano de nascimento" className="relative grid max-h-56 grid-cols-3 gap-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:hsl(var(--primary))_transparent] [scrollbar-width:thin]">
              {Array.from({ length: maxYear - 1899 }, (_, index) => maxYear - index).map((option) => (
                <button key={option} ref={year === option ? selectedYearRef : undefined} role="option" aria-selected={year === option} type="button" onClick={() => { setYear(option); setStep("month"); }} className={`${optionClass} ${year === option ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : ""}`}>{option}</button>
              ))}
            </div>
          )}
          {step === "month" && (
            <div className="grid grid-cols-3 gap-1">
              {MONTHS.map((name, index) => (
                <button key={name} type="button" disabled={`${year}-${pad(index + 1)}` > maxDate.slice(0, 7)} onClick={() => { setMonth(index + 1); setStep("day"); }} className={`${optionClass} ${month === index + 1 ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : ""}`}>{name}</button>
              ))}
            </div>
          )}
          {step === "day" && (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => (
                <button key={day} type="button" disabled={`${year}-${pad(month)}-${pad(day)}` > maxDate} onClick={() => selectDay(day)} className={optionClass}>{day}</button>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <span role="alert" className="mt-1 ml-1 block text-xs text-red-500">{error}</span>}
    </div>
  );
}
