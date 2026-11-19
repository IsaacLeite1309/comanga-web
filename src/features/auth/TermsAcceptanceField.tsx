import { useId } from "react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { PRIVACY_POLICY_PATH, TERMS_OF_USE_PATH } from "@/components/legal/legalPaths";

const documentLinkClass = "text-primary underline underline-offset-2 transition-colors hover:text-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

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
    <div className="-my-2">
      <label htmlFor={inputId} className={`flex min-h-11 items-center justify-center gap-3 text-sm font-normal text-muted-foreground ${termsOutdated ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          id={inputId}
          name="acceptedTerms"
          type="checkbox"
          required
          checked={checked}
          aria-label="Li e aceito os Termos de Uso e Política de privacidade."
          aria-disabled={termsOutdated || undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => { if (!termsOutdated) onChange(event.target.checked); }}
          className="peer h-5 w-5 cursor-inherit appearance-none rounded-[4px] border border-sidebar-foreground/35 bg-sidebar transition-colors hover:border-primary checked:border-primary checked:bg-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        />
          <Check className="pointer-events-none absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100" aria-hidden="true" />
        </span>
        <span className="min-w-0 text-center leading-relaxed">
          Li e aceito os <Link to={TERMS_OF_USE_PATH} target="_blank" rel="noopener" aria-label="Termos de Uso (abre em nova aba)" className={documentLinkClass}>Termos de Uso</Link>
          {" e "}<Link to={PRIVACY_POLICY_PATH} target="_blank" rel="noopener" aria-label="Política de Privacidade (abre em nova aba)" className={documentLinkClass}>Política de privacidade</Link>.
        </span>
      </label>
      {error && <p id={errorId} role="alert" className="mt-1 text-center text-xs font-normal text-red-500">{error}</p>}
      {termsOutdated && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-11 rounded-sm text-sm text-foreground underline underline-offset-4 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Atualizar página
        </button>
      )}
    </div>
  );
}
