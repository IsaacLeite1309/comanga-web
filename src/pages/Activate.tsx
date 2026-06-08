import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api } from "@/services/api";
import { BrandLogo } from "@/components/BrandLogo";

/* ──────────────────────── Tipos ──────────────────────────── */

type ActivationStatus = "loading" | "success" | "error";

/* ──────────────────────── Activate ──────────────────────── */

const Activate = () => {
  const { token } = useParams<{ token: string }>();

  const [status, setStatus] = useState<ActivationStatus>("loading");
  const [message, setMessage] = useState("");

  // Proteção contra duplo disparo do React Strict Mode
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    if (!token) {
      setStatus("error");
      setMessage("Token de ativação não encontrado na URL.");
      return;
    }

    async function activateAccount() {
      try {
        const response = await api.get(`/auth/activate/${token}`);
        setStatus("success");
        setMessage(response.data.message || "Conta ativada com sucesso!");
      } catch (error: unknown) {
        setStatus("error");

        if (isAxiosError(error) && error.response) {
          setMessage(error.response.data?.error || "Erro ao ativar conta.");
        } else {
          setMessage("Erro ao conectar com o servidor.");
        }
      }
    }

    activateAccount();
  }, [token]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-8">
        <BrandLogo />
        <h1 className="text-3xl font-bold tracking-wide text-primary-foreground">
          Co<span className="text-primary">Mangá</span>
        </h1>
      </div>

      {/* Card */}
      <div className="w-full max-w-md p-8 bg-card rounded-2xl border border-border shadow-2xl">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-lg text-muted-foreground font-medium">
              Ativando sua conta...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground text-center">
              Conta Ativada!
            </h2>
            <p className="text-sm text-muted-foreground text-center">
              {message}
            </p>
            <Link
              to="/entrar"
              className="mt-4 w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center"
            >
              IR PARA O LOGIN
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground text-center">
              Falha na Ativação
            </h2>
            <p className="text-sm text-red-400 text-center">
              {message}
            </p>
            <Link
              to="/entrar"
              className="mt-4 w-full h-12 rounded-xl bg-muted text-muted-foreground font-bold text-sm tracking-wide hover:bg-muted/80 transition-opacity flex items-center justify-center"
            >
              VOLTAR AO INÍCIO
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Activate;

/* ── Type guard para AxiosError ── */

function isAxiosError(error: unknown): error is import("axios").AxiosError<{ error?: string }> {
  return typeof error === "object" && error !== null && "isAxiosError" in error;
}
