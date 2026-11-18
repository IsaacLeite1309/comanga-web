import { useId } from "react";
import { LegalLinks } from "@/components/legal/LegalLinks";

interface TermsAcceptanceFieldProps {
  checked: boolean;
  error: string;
  termsOutdated: boolean;
  onChange: (checked: boolean) => void;
}

export function TermsAcceptanceField({ checked, error, termsOutdated, onChange }: TermsAcceptanceFieldProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;

  return (
    <div>
      <label htmlFor={inputId} className={`flex min-h-11 items-center gap-3 text-sm text-foreground ${termsOutdated ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
        <input
          id={inputId}
          name="acceptedTerms"
          type="checkbox"
          required
          checked={checked}
          aria-disabled={termsOutdated || undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => { if (!termsOutdated) onChange(event.target.checked); }}
          className="h-5 w-5 shrink-0 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        Li e aceito os Termos de Uso.
      </label>
      {error && <p id={errorId} role="alert" className="text-sm text-red-400">{error}</p>}
      {termsOutdated && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-11 rounded-sm text-sm text-foreground underline underline-offset-4 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Atualizar página
        </button>
      )}
      <LegalLinks />
    </div>
  );
}
