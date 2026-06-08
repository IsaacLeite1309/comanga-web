import { useState, ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";

/* ── Type guard para AxiosError ── */
function isAxiosError(error: unknown): error is import("axios").AxiosError<{ error?: string }> {
  return typeof error === "object" && error !== null && "isAxiosError" in error;
}

const ResendActivation = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError(""); // Limpa o erro ao digitar
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Informe seu e-mail.");
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Informe um e-mail válido.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/resend-activation", { email });
      toast.success(response.data.message || "E-mail de ativação reenviado! Verifique sua caixa de entrada.");
      setEmail(""); // Limpa após o sucesso
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response) {
        // Exibe o erro exato vindo da API (RN0009, RN0010, etc)
        const errorMsg = err.response.data?.error || "Erro ao reenviar ativação.";
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        toast.error("Erro ao conectar com o servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

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
      <div className="w-full max-w-md p-8 bg-card rounded-2xl border border-border shadow-2xl relative">
        {/* Voltar */}
        <Link
          to="/entrar"
          className="absolute top-8 left-8 text-muted-foreground hover:text-primary transition-colors"
          title="Voltar ao início"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>

        <h2 className="text-center text-2xl font-semibold text-foreground mt-2 mb-2">
          Reenviar Ativação
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-8 px-4">
          Não recebeu o e-mail? Digite seu e-mail abaixo para enviarmos um novo link de ativação.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="E-mail"
              disabled={loading}
              className={`w-full h-12 px-4 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 text-sm transition-colors disabled:opacity-50 ${
                error
                  ? "border-red-500 focus:ring-red-500"
                  : "border-border focus:ring-primary"
              }`}
            />
            {error && (
              <span className="block text-xs text-red-500 mt-1 ml-1">{error}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                ENVIANDO...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                REENVIAR LINK
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResendActivation;
