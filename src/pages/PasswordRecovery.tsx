import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
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

  const fieldClass = "mt-1 h-12 w-full rounded-xl border border-border bg-input px-4";
  return <main className="flex min-h-screen items-center justify-center bg-background p-4">
    <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-foreground">
      <BrandLogo />
      <h1 className="my-5 text-2xl font-bold">{reset ? "Redefinir senha" : "Recuperar senha"}</h1>
      {message ? <p role="status">{message}</p> : <form onSubmit={submit} className="space-y-4">
        {reset ? <>
          <label className="block">Nova senha<input type="password" autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)} className={fieldClass} /></label>
          <label className="block">Confirmar senha<input type="password" autoComplete="new-password" required value={confirmation} onChange={event => setConfirmation(event.target.value)} className={fieldClass} /></label>
        </> : <label className="block">E-mail<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} className={fieldClass} /></label>}
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button disabled={loading} className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-50">{loading ? "Aguarde..." : reset ? "Salvar nova senha" : "Enviar instruções"}</button>
      </form>}
      <div className="mt-5 flex justify-between text-sm text-primary">
        <Link to="/entrar">Voltar ao login</Link>
        {reset && <Link to="/recuperar-senha">Solicitar novo link</Link>}
      </div>
    </section>
  </main>;
}
