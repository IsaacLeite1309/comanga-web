import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Send } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { getApiError } from "@/lib/apiError";
import { validatePassword } from "../passwordValidation";
import { BrandLogo } from "@/components/BrandLogo";

export default function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const { token } = useParams();
  return <PasswordRecoveryForm key={`${reset}:${token || ""}`} reset={reset} token={token} />;
}

const FIELD_CLASS = "h-12 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";
const MINIMUM_REQUEST_FEEDBACK_MS = 500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PasswordFieldProps {
  label: string;
  value: string;
  visible: boolean;
  error?: string;
  onChange: (value: string) => void;
  onToggle: () => void;
}

function PasswordField({ label, value, visible, error, onChange, onToggle }: PasswordFieldProps) {
  const toggleLabel = label === "Nova senha"
    ? visible ? "Esconder senha" : "Mostrar senha"
    : visible ? "Esconder confirmação de senha" : "Mostrar confirmação de senha";

  return (
    <div>
      <div className="relative">
        <input
          aria-label={label}
          aria-invalid={Boolean(error)}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
          className={`${FIELD_CLASS} pr-12 ${error ? "border-red-500 focus:ring-red-500" : ""}`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={toggleLabel}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {error && <span role="alert" className="ml-1 mt-1 block text-xs text-red-500">{error}</span>}
    </div>
  );
}

interface RecoveryFieldsProps {
  reset: boolean;
  email: string;
  password: string;
  confirmation: string;
  showPassword: boolean;
  showConfirmation: boolean;
  errors: RecoveryErrors;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setConfirmation: (value: string) => void;
  togglePassword: () => void;
  toggleConfirmation: () => void;
}

function RecoveryFields(props: RecoveryFieldsProps) {
  if (!props.reset) {
    return (
      <div>
        <input
          aria-label="E-mail"
          aria-invalid={Boolean(props.errors.email)}
          type="email"
          autoComplete="email"
          required
          value={props.email}
          onChange={(event) => props.setEmail(event.target.value)}
          placeholder="E-mail"
          className={`${FIELD_CLASS} ${props.errors.email ? "border-red-500 focus:ring-red-500" : ""}`}
        />
        {props.errors.email && <span role="alert" className="ml-1 mt-1 block text-xs text-red-500">{props.errors.email}</span>}
      </div>
    );
  }

  return (
    <>
      <PasswordField
        label="Nova senha"
        value={props.password}
        visible={props.showPassword}
        error={props.errors.password}
        onChange={props.setPassword}
        onToggle={props.togglePassword}
      />
      <PasswordField
        label="Confirmar senha"
        value={props.confirmation}
        visible={props.showConfirmation}
        error={props.errors.confirmation}
        onChange={props.setConfirmation}
        onToggle={props.toggleConfirmation}
      />
    </>
  );
}

function RecoveryIntroduction({ reset }: { reset: boolean }) {
  return (
    <>
      <h2 className="mb-2 mt-12 text-center text-2xl font-semibold sm:mt-2">{reset ? "Redefinir senha" : "Recuperar senha"}</h2>
      {reset
        ? <div className="mb-8" />
        : <p className="mb-8 px-4 text-center text-sm text-muted-foreground">Informe seu e-mail abaixo para enviarmos as instruções de redefinição de senha.</p>}
    </>
  );
}

function RecoverySubmitButton({ reset, loading }: { reset: boolean; loading: boolean }) {
  const label = loading ? "AGUARDE..." : reset ? "SALVAR NOVA SENHA" : "ENVIAR INSTRUÇÕES";
  const ariaLabel = loading ? "Aguarde" : reset ? "Salvar nova senha" : "Enviar instruções";

  return (
    <button
      aria-label={ariaLabel}
      disabled={loading}
      className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {!reset && !loading && <Send className="h-5 w-5" />}
      {label}
    </button>
  );
}

type RecoveryErrors = Record<"email" | "password" | "confirmation", string>;

const EMPTY_ERRORS: RecoveryErrors = { email: "", password: "", confirmation: "" };

function getSubmissionErrors(reset: boolean, email: string, password: string, confirmation: string): RecoveryErrors {
  if (!reset) {
    return {
      ...EMPTY_ERRORS,
      email: !email.trim() ? "Informe seu e-mail." : !EMAIL_PATTERN.test(email) ? "Informe um e-mail válido." : "",
    };
  }

  return {
    ...EMPTY_ERRORS,
    password: validatePassword(password),
    confirmation: !confirmation ? "Informe a confirmação da senha." : password !== confirmation ? "As senhas não conferem." : "",
  };
}

function PasswordRecoveryForm({ reset, token }: { reset: boolean; token?: string }) {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<RecoveryErrors>(EMPTY_ERRORS);
  const [formError, setFormError] = useState("");

  function clearFieldError(field: keyof RecoveryErrors) {
    setErrors((current) => current[field] ? { ...current, [field]: "" } : current);
    setFormError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setFormError("");
    const submissionErrors = getSubmissionErrors(reset, email, password, confirmation);
    setErrors(submissionErrors);
    if (Object.values(submissionErrors).some(Boolean)) return;
    if (reset && !/^[a-f0-9]{64}$/.test(token || "")) {
      setFormError("Link de redefinição inválido. Solicite um novo link.");
      return;
    }
    setLoading(true);
    const requestStartedAt = Date.now();
    try {
      const response = await api.post(reset ? "/auth/reset-password" : "/auth/forgot-password",
        reset ? { token, password, confirmPassword: confirmation } : { email });
      if (reset) {
        toast.success("Senha redefinida com sucesso. Faça login novamente.");
        navigate("/entrar");
      } else {
        setEmail("");
        const remainingFeedbackTime = MINIMUM_REQUEST_FEEDBACK_MS - (Date.now() - requestStartedAt);
        if (remainingFeedbackTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingFeedbackTime));
        }
        toast.success(response.data.message);
      }
    } catch (cause) {
      setFormError(getApiError(cause, "Não foi possível concluir. Tente novamente."));
    } finally { setLoading(false); }
  }

  return <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-8">
    <div className="mb-8 flex items-center gap-3">
      <BrandLogo />
      <h1 className="text-3xl font-bold tracking-wide text-primary-foreground">
        Co<span className="text-primary">Mangá</span>
      </h1>
    </div>
    <section className="relative w-full max-w-md rounded-2xl border border-border bg-background p-8 text-foreground">
      <Link
        to="/entrar"
        className="absolute left-6 top-6 text-muted-foreground transition-colors hover:text-primary sm:left-8 sm:top-8"
        title="Voltar ao login"
        aria-label="Voltar ao login"
      >
        <ArrowLeft className="h-6 w-6" />
      </Link>
      <RecoveryIntroduction reset={reset} />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <RecoveryFields
          reset={reset}
          email={email}
          password={password}
          confirmation={confirmation}
          showPassword={showPassword}
          showConfirmation={showConfirmation}
          errors={errors}
          setEmail={(value) => { setEmail(value); clearFieldError("email"); }}
          setPassword={(value) => { setPassword(value); clearFieldError("password"); }}
          setConfirmation={(value) => { setConfirmation(value); clearFieldError("confirmation"); }}
          togglePassword={() => setShowPassword((value) => !value)}
          toggleConfirmation={() => setShowConfirmation((value) => !value)}
        />
        {formError && <p role="alert" className="text-sm text-red-400">{formError}</p>}
        <RecoverySubmitButton reset={reset} loading={loading} />
      </form>
      {reset && (
        <div className="mt-5 text-center text-sm text-muted-foreground">
          <Link to="/recuperar-senha" className="underline underline-offset-2 hover:text-primary transition-colors">
            Solicitar novo link
          </Link>
        </div>
      )}
    </section>
  </main>;
}
