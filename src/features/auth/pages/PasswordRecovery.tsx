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
  onChange: (value: string) => void;
  onToggle: () => void;
}

function PasswordField({ label, value, visible, onChange, onToggle }: PasswordFieldProps) {
  const toggleLabel = label === "Nova senha"
    ? visible ? "Esconder senha" : "Mostrar senha"
    : visible ? "Esconder confirmação de senha" : "Mostrar confirmação de senha";

  return (
    <div className="relative">
      <input
        aria-label={label}
        type={visible ? "text" : "password"}
        autoComplete="new-password"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        className={`${FIELD_CLASS} pr-12`}
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
  );
}

interface RecoveryFieldsProps {
  reset: boolean;
  email: string;
  password: string;
  confirmation: string;
  showPassword: boolean;
  showConfirmation: boolean;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setConfirmation: (value: string) => void;
  togglePassword: () => void;
  toggleConfirmation: () => void;
}

function RecoveryFields(props: RecoveryFieldsProps) {
  if (!props.reset) {
    return (
      <input
        aria-label="E-mail"
        type="email"
        autoComplete="email"
        required
        value={props.email}
        onChange={(event) => props.setEmail(event.target.value)}
        placeholder="E-mail"
        className={FIELD_CLASS}
      />
    );
  }

  return (
    <>
      <PasswordField
        label="Nova senha"
        value={props.password}
        visible={props.showPassword}
        onChange={props.setPassword}
        onToggle={props.togglePassword}
      />
      <PasswordField
        label="Confirmar senha"
        value={props.confirmation}
        visible={props.showConfirmation}
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

function getSubmissionError(reset: boolean, token: string | undefined, email: string, password: string, confirmation: string): string {
  if (!reset && !email.trim()) return "Informe seu e-mail.";
  if (!reset && !EMAIL_PATTERN.test(email)) return "Informe um e-mail válido.";
  if (reset && !/^[a-f0-9]{64}$/.test(token || "")) return "Link de redefinição inválido. Solicite um novo link.";
  const passwordError = reset ? validatePassword(password) : "";
  if (passwordError) return passwordError;
  if (reset && !confirmation) return "Confirme a nova senha.";
  if (reset && password !== confirmation) return "As senhas não conferem.";
  return "";
}

function PasswordRecoveryForm({ reset, token }: { reset: boolean; token?: string }) {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setError("");
    const submissionError = getSubmissionError(reset, token, email, password, confirmation);
    if (submissionError) return setError(submissionError);
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
      setError(getApiError(cause, "Não foi possível concluir. Tente novamente."));
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
          setEmail={(value) => { setEmail(value); if (error) setError(""); }}
          setPassword={(value) => { setPassword(value); if (error) setError(""); }}
          setConfirmation={(value) => { setConfirmation(value); if (error) setError(""); }}
          togglePassword={() => setShowPassword((value) => !value)}
          toggleConfirmation={() => setShowConfirmation((value) => !value)}
        />
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
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
