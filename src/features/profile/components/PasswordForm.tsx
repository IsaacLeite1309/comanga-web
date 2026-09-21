import { FormEvent, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { validatePassword } from "@/features/auth";

interface PasswordFormProps {
  onSubmit: (input: { currentPassword: string; newPassword: string; confirmPassword: string }) => Promise<string>;
}

const EMPTY_FORM = { currentPassword: "", newPassword: "", confirmPassword: "" };

function validate(form: typeof EMPTY_FORM): string {
  if (!form.currentPassword) return "Informe sua senha atual.";
  const passwordError = validatePassword(form.newPassword);
  if (passwordError) return passwordError;
  if (form.newPassword !== form.confirmPassword) {
    return "Divergência nos valores da senha e confirmação de senha!";
  }
  if (form.newPassword === form.currentPassword) {
    return "A nova senha deve ser diferente da senha atual.";
  }
  return "";
}

export function PasswordForm({ onSubmit }: PasswordFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    const failure = await onSubmit(form);
    if (failure) setError(failure);
    else setForm(EMPTY_FORM);
    setSaving(false);
  }

  const fields: Array<{ id: keyof typeof EMPTY_FORM; label: string }> = [
    { id: "currentPassword", label: "Senha atual" },
    { id: "newPassword", label: "Nova senha" },
    { id: "confirmPassword", label: "Confirmação da nova senha" },
  ];

  return (
    <form className="rounded-xl border border-border bg-muted/20 p-4 space-y-3" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="text-sm font-bold text-foreground">Alterar senha</h3>
      </div>
      {fields.map((field) => (
        <label className="block" key={field.id}>
          <span className="text-xs font-semibold text-muted-foreground">{field.label}</span>
          <input
            type="password"
            value={form[field.id]}
            disabled={saving}
            onChange={(event) => updateField(field.id, event.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground outline-none transition-colors focus:border-primary disabled:opacity-50"
          />
        </label>
      ))}
      {error && <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {saving ? "Alterando..." : "Alterar senha"}
      </button>
    </form>
  );
}
