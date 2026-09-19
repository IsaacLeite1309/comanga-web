import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Send } from "lucide-react";
import { api } from "@/services/api";
import { getApiError } from "@/lib/apiError";
import { validatePassword } from "@/lib/passwordValidation";
import { BrandLogo } from "@/components/BrandLogo";

export default function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const { token } = useParams();
  return <PasswordRecoveryForm key={`${reset}:${token || ""}`} reset={reset} token={token} />;
}

function PasswordRecoveryForm({ reset, token }: { reset: boolean; token?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (reset && !/^[a-f0-9]{64}$/.test(token || "")) {
      setError("Link de redefinição inválido. Solicite um novo link."); return;
    }
    const passwordError = reset ? validatePassword(password) : "";
    if (passwordError) {
      setError(passwordError); return;
    }
    if (reset && password !== confirmation) {
      setError("As senhas não conferem."); return;
    }
    setLoading(true);
    try {
      const response = await api.post(reset ? "/auth/reset-password" : "/auth/forgot-password",
        reset ? { token, password, confirmPassword: confirmation } : { email });
      setMessage(response.data.message);
      setPassword(""); setConfirmation("");
    } catch (cause) {
      setError(getApiError(cause, "Não foi possível concluir. Tente novamente."));
    } finally { setLoading(false); }
  }

  const fieldClass = "h-12 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";
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
      <h2 className="mb-2 mt-12 text-center text-2xl font-semibold sm:mt-2">{reset ? "Redefinir senha" : "Recuperar senha"}</h2>
      {!reset && (
        <p className="mb-8 px-4 text-center text-sm text-muted-foreground">
          Informe seu e-mail abaixo para enviarmos as instruções de redefinição de senha.
        </p>
      )}
      {reset && <div className="mb-8" />}
      {message ? <p role="status">{message}</p> : <form onSubmit={submit} className="space-y-4">
        {reset ? <>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="Nova senha" className={`${fieldClass} pr-12`} />
            <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Esconder senha" : "Mostrar senha"} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="relative">
            <input type={showConfirmation ? "text" : "password"} autoComplete="new-password" required value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="Confirmar senha" className={`${fieldClass} pr-12`} />
            <button type="button" onClick={() => setShowConfirmation(value => !value)} aria-label={showConfirmation ? "Esconder confirmação de senha" : "Mostrar confirmação de senha"} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors">
              {showConfirmation ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </> : <input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="E-mail" className={fieldClass} />}
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button disabled={loading} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
          {!reset && !loading && <Send className="h-5 w-5" />}
          {loading ? "AGUARDE..." : reset ? "SALVAR NOVA SENHA" : "ENVIAR INSTRUÇÕES"}
        </button>
      </form>}
      {reset && <div className="mt-5 text-center text-sm text-muted-foreground"><Link to="/recuperar-senha" className="underline underline-offset-2 hover:text-primary transition-colors">Solicitar novo link</Link></div>}
    </section>
  </main>;
}
