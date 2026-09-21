import { FormEvent, useState } from "react";
import { Loader2, UserCog } from "lucide-react";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const USERNAME_RULE_MESSAGE = "Utilize entre 3 e 20 caracteres, sem espaços, acentos ou caracteres especiais.";

interface UsernameFormProps {
  currentUsername: string;
  onSubmit: (username: string) => Promise<string>;
}

export function UsernameForm({ currentUsername, onSubmit }: UsernameFormProps) {
  const [username, setUsername] = useState(currentUsername);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    if (!USERNAME_PATTERN.test(username)) {
      setError(USERNAME_RULE_MESSAGE);
      return;
    }
    if (username === currentUsername) {
      setError("O novo nome de usuário deve ser diferente do atual.");
      return;
    }

    setSaving(true);
    setError("");
    const failure = await onSubmit(username);
    if (failure) setError(failure);
    setSaving(false);
  }

  return (
    <form className="rounded-xl border border-border bg-muted/20 p-4 space-y-3" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
        <UserCog className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Alterar nome de usuário</h3>
      </div>
      <div>
        <input
          aria-label="Novo nome de usuário"
          aria-invalid={Boolean(error)}
          placeholder="Novo nome de usuário"
          type="text"
          value={username}
          disabled={saving}
          onChange={(event) => {
            setUsername(event.target.value);
            setError("");
          }}
          className={`h-12 w-full rounded-xl border bg-input px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:ring-2 disabled:opacity-50 ${
            error ? "border-red-500 focus:ring-red-500" : "border-border focus:ring-primary"
          }`}
        />
      </div>
      {error && <p role="alert" className="-mt-1 ml-1 text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {saving ? "Salvando..." : "Salvar nome de usuário"}
      </button>
    </form>
  );
}
