import { FormEvent, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
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
  const [visibleFields, setVisibleFields] = useState<Record<keyof typeof EMPTY_FORM, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function toggleVisibility(field: keyof typeof EMPTY_FORM) {
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }));
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
        <div key={field.id}>
          <div className="relative">
            <input
              aria-label={field.label}
              placeholder={field.label}
              type={visibleFields[field.id] ? "text" : "password"}
              value={form[field.id]}
              disabled={saving}
              onChange={(event) => updateField(field.id, event.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-input px-3 pr-12 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => toggleVisibility(field.id)}
              aria-label={visibleFields[field.id] ? `Ocultar ${field.label.toLowerCase()}` : `Mostrar ${field.label.toLowerCase()}`}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {visibleFields[field.id] ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
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
