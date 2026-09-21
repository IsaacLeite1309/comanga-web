import { ShieldCheck, Loader2 } from "lucide-react";

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
        <label htmlFor="active-profile" className="text-sm font-semibold text-foreground">
          Perfil ativo
        </label>
        <span className="text-xs text-muted-foreground mt-0.5">
          Define o contexto de uso desta sessão. Não concede nem remove perfis da conta.
        </span>
        <select
          id="active-profile"
          value={activeProfile}
          disabled={updating}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-border bg-input px-3 text-base font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
        >
          {profiles.map((profile) => (
            <option key={profile} value={profile}>{profile}</option>
          ))}
        </select>
      </div>
      {updating && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-primary" />}
    </div>
  );
}
