import { ShieldCheck, Loader2 } from "lucide-react";
import { SearchableSelect } from "@/components/forms/SearchableSelect";

interface ActiveProfileSelectorProps {
  profiles: string[];
  activeProfile: string;
  updating: boolean;
  onChange: (profile: string) => void;
}

// O seletor só aparece para contas que possuem mais de um perfil de acesso.
export function ActiveProfileSelector({ profiles, activeProfile, updating, onChange }: ActiveProfileSelectorProps) {
  if (profiles.length < 2) return null;

  return (
    <div className="flex min-w-0 items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border sm:gap-4">
      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
        <ShieldCheck className="h-5 w-5 text-white" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Perfil ativo
        </span>
        <SearchableSelect
          ariaLabel="Perfil ativo"
          value={activeProfile}
          disabled={updating}
          onChange={onChange}
          options={profiles.map((profile) => ({ value: profile, label: profile }))}
          allowEmptyOption={false}
          className="mt-2"
        />
      </div>
      {updating && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-primary" />}
    </div>
  );
}
