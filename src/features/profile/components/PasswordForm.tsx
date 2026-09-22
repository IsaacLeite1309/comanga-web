import { FormEvent, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { validatePassword } from "@/features/auth";

interface PasswordFormProps {
  onSubmit: (input: { currentPassword: string; newPassword: string; confirmPassword: string }) => Promise<string>;
}

const EMPTY_FORM = { currentPassword: "", newPassword: "", confirmPassword: "" };
type PasswordFieldId = keyof typeof EMPTY_FORM;

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

function getInvalidField(error: string): PasswordFieldId {
  if (error === "Informe sua senha atual." || error === "A nova senha deve ser diferente da senha atual.") {
    return "currentPassword";
  }
  if (error === "Divergência nos valores da senha e confirmação de senha!") return "confirmPassword";
  return "newPassword";
}

export function PasswordForm({ onSubmit }: PasswordFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState<PasswordFieldId | null>(null);
  const [saving, setSaving] = useState(false);
  const [visibleFields, setVisibleFields] = useState<Record<keyof typeof EMPTY_FORM, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setInvalidField(null);
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
      setInvalidField(getInvalidField(validationError));
      return;
    }

    setSaving(true);
    setError("");
    setInvalidField(null);
    const failure = await onSubmit(form);
    if (failure) {
      setError(failure);
      setInvalidField("currentPassword");
    }
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
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
          <KeyRound className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Alterar senha</h3>
      </div>
      {fields.map((field) => (
        <div key={field.id}>
          <div className="relative">
            <input
              aria-label={field.label}
              aria-invalid={invalidField === field.id}
              placeholder={field.label}
              type={visibleFields[field.id] ? "text" : "password"}
              value={form[field.id]}
              disabled={saving}
              onChange={(event) => updateField(field.id, event.target.value)}
              className={`h-12 w-full rounded-xl border bg-input px-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:ring-2 disabled:opacity-50 ${
                invalidField === field.id ? "border-red-500 focus:ring-red-500" : "border-border focus:ring-primary"
              }`}
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => toggleVisibility(field.id)}
              aria-label={visibleFields[field.id] ? `Ocultar ${field.label.toLowerCase()}` : `Mostrar ${field.label.toLowerCase()}`}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              {visibleFields[field.id] ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      ))}
      {error && <p role="alert" className="-mt-1 ml-1 text-xs text-red-500">{error}</p>}
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
