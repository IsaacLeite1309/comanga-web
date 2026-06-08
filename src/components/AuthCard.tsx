import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";

/* ──────────────────────────── Tipos ──────────────────────────── */

interface PasswordInputProps {
  placeholder: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type LoginErrors = Record<keyof LoginData, string>;
type RegisterErrors = Record<keyof RegisterData, string>;

/* ──────────────────────────── Validação ──────────────────────── */

const VALIDATION_MESSAGES = {
  RN0001: "Utilize entre 3 e 20 caracteres, sem espaços, acentos ou caracteres especiais.",
  RN0002: "Utilize no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.",
  RN0020: "Divergência nos valores da senha e confirmação de senha!",
  EMAIL_INVALID: "Informe um e-mail válido.",
  EMAIL_REQUIRED: "Informe seu e-mail.",
  PASSWORD_REQUIRED: "Informe sua senha.",
  // Mensagens de campo vazio (Cadastro)
  USERNAME_REQUIRED: "Informe um Nome de Usuário.",
  REG_EMAIL_REQUIRED: "Informe um e-mail.",
  REG_PASSWORD_REQUIRED: "Informe uma senha.",
  CONFIRM_PASSWORD_REQUIRED: "Informe a confirmação da senha.",
} as const;

function validateUsername(username: string): string {
  if (!username.trim()) return VALIDATION_MESSAGES.USERNAME_REQUIRED;
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return VALIDATION_MESSAGES.RN0001;
  return "";
}

function validateEmail(email: string): string {
  if (!email.trim()) return VALIDATION_MESSAGES.EMAIL_REQUIRED;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return VALIDATION_MESSAGES.EMAIL_INVALID;
  return "";
}

function validatePassword(password: string): string {
  if (!password) return VALIDATION_MESSAGES.REG_PASSWORD_REQUIRED;
  if (password.length < 8) return VALIDATION_MESSAGES.RN0002;
  if (!/[A-Z]/.test(password)) return VALIDATION_MESSAGES.RN0002;
  if (!/[a-z]/.test(password)) return VALIDATION_MESSAGES.RN0002;
  if (!/[0-9]/.test(password)) return VALIDATION_MESSAGES.RN0002;
  if (!/[\W_]/.test(password)) return VALIDATION_MESSAGES.RN0002;
  return "";
}

function validateConfirmPassword(password: string, confirmPassword: string): string {
  if (!confirmPassword) return VALIDATION_MESSAGES.CONFIRM_PASSWORD_REQUIRED;
  if (password !== confirmPassword) return VALIDATION_MESSAGES.RN0020;
  return "";
}

function validateRegisterEmail(email: string): string {
  if (!email.trim()) return VALIDATION_MESSAGES.REG_EMAIL_REQUIRED;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return VALIDATION_MESSAGES.EMAIL_INVALID;
  return "";
}

function validateRegisterForm(data: RegisterData): RegisterErrors {
  return {
    username: validateUsername(data.username),
    email: validateRegisterEmail(data.email),
    password: validatePassword(data.password),
    confirmPassword: validateConfirmPassword(data.password, data.confirmPassword),
  };
}

function validateLoginForm(data: LoginData): LoginErrors {
  return {
    email: validateEmail(data.email),
    password: data.password.trim() ? "" : VALIDATION_MESSAGES.PASSWORD_REQUIRED,
  };
}

function hasErrors(errors: Record<string, string>): boolean {
  return Object.values(errors).some((msg) => msg !== "");
}


/* ──────────────────────── PasswordInput ──────────────────────── */

function PasswordInput({ placeholder, name, value, onChange, error }: PasswordInputProps) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full h-12 px-4 pr-12 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 text-sm transition-colors ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-border focus:ring-primary"
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Esconder senha" : "Mostrar senha"}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {error && <span className="block text-xs text-red-500 mt-1 ml-1">{error}</span>}
    </div>
  );
}

/* ──────────────────── Componente de Input ────────────────────── */

interface TextInputProps {
  type?: string;
  placeholder: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

function TextInput({ type = "text", placeholder, name, value, onChange, error }: TextInputProps) {
  return (
    <div>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full h-12 px-4 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 text-sm transition-colors ${
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-border focus:ring-primary"
        }`}
      />
      {error && <span className="block text-xs text-red-500 mt-1 ml-1">{error}</span>}
    </div>
  );
}

/* ──────────────────────── AuthCard ───────────────────────────── */

export function AuthCard() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState(location.pathname === "/cadastrar" ? "register" : "login");

  useEffect(() => {
    if (location.pathname === "/cadastrar" && tab !== "register") setTab("register");
    else if (location.pathname === "/entrar" && tab !== "login") setTab("login");
  }, [location.pathname, tab]);
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginData, setLoginData] = useState<LoginData>({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({ email: "", password: "" });

  // Register state
  const [registerData, setRegisterData] = useState<RegisterData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  /* ── Troca de tab com reset ── */

  function handleTabChange(newTab: string) {
    setTab(newTab);
    navigate(newTab === "register" ? "/cadastrar" : "/entrar");
    setLoginData({ email: "", password: "" });
    setLoginErrors({ email: "", password: "" });
    setRegisterData({ username: "", email: "", password: "", confirmPassword: "" });
    setRegisterErrors({ username: "", email: "", password: "", confirmPassword: "" });
  }

  /* ── Handlers de mudança ── */

  function handleLoginChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
    // Limpar o erro do campo ao digitar
    if (loginErrors[name as keyof LoginErrors]) {
      setLoginErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function handleRegisterChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
    // Limpar o erro do campo ao digitar
    if (registerErrors[name as keyof RegisterErrors]) {
      setRegisterErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  /* ── Submit Login ── */

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    const errors = validateLoginForm(loginData);
    setLoginErrors(errors);
    if (hasErrors(errors)) return;

    setLoading(true);
    try {
      const response = await api.post("/auth/login", loginData);
      login(response.data.user);
      toast.success("Login realizado com sucesso!");
      navigate(`/perfil/${response.data.user.username}`);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response) {
        const status = error.response.status;
        const errorMsg = error.response.data?.error || "Credenciais inválidas.";

        if (status === 401 || status === 403) {
          setLoginErrors({ email: errorMsg, password: "" });
          toast.error(errorMsg);
        } else {
          toast.error("Erro ao conectar com o servidor.");
        }
      } else {
        toast.error("Erro ao conectar com o servidor.");
      }
    } finally {
      setLoading(false);
    }
  }

  /* ── Submit Register ── */

  async function handleRegister(e: FormEvent) {
    e.preventDefault();

    const errors = validateRegisterForm(registerData);
    setRegisterErrors(errors);
    if (hasErrors(errors)) return;

    setLoading(true);
    try {
      const response = await api.post("/auth/register", registerData);
      toast.success(response.data.message || "Cadastro realizado! Verifique seu e-mail.");

      // Limpar formulário e ir para login
      setRegisterData({ username: "", email: "", password: "", confirmPassword: "" });
      setRegisterErrors({ username: "", email: "", password: "", confirmPassword: "" });
      setTab("login");
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response) {
        const errorMsg = error.response.data?.error || "Erro no cadastro.";
        const errorField = (error.response.data as { field?: keyof RegisterData })?.field;

        // Se o back-end indicou o campo, pintamos ele de vermelho
        if (errorField && errorField in registerErrors) {
          setRegisterErrors((prev) => ({ ...prev, [errorField]: errorMsg }));
        } else {
          toast.error(errorMsg);
        }
      } else {
        toast.error("Erro ao conectar com o servidor.");
      }
    } finally {
      setLoading(false);
    }
  }

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
        <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full h-12 rounded-full bg-muted p-1">
            <TabsTrigger
              value="login"
              className="flex-1 rounded-full h-full text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none transition-all"
            >
              Entrar
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="flex-1 rounded-full h-full text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none transition-all"
            >
              Cadastrar
            </TabsTrigger>
          </TabsList>

          {/* Login */}
          <TabsContent value="login" className="mt-0">
            <h2 className="text-center text-2xl font-light tracking-[0.2em] text-foreground mt-8 mb-6">
              ENTRAR
            </h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
              <TextInput
                type="email"
                name="email"
                placeholder="E-mail"
                value={loginData.email}
                onChange={handleLoginChange}
                error={loginErrors.email}
              />
              <PasswordInput
                name="password"
                placeholder="Senha"
                value={loginData.password}
                onChange={handleLoginChange}
                error={loginErrors.password}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    ENTRANDO...
                  </>
                ) : (
                  "ENTRAR"
                )}
              </button>
              <p className="text-center text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors underline underline-offset-2">
                  Esqueceu a senha?
                </a>
              </p>
            </form>
          </TabsContent>

          {/* Register */}
          <TabsContent value="register" className="mt-0">
            <h2 className="text-center text-2xl font-light tracking-[0.2em] text-foreground mt-8 mb-6">
              CADASTRAR
            </h2>
            <form onSubmit={handleRegister} className="flex flex-col gap-4" noValidate>
              <TextInput
                name="username"
                placeholder="Nome de Usuário"
                value={registerData.username}
                onChange={handleRegisterChange}
                error={registerErrors.username}
              />
              <TextInput
                type="email"
                name="email"
                placeholder="E-mail"
                value={registerData.email}
                onChange={handleRegisterChange}
                error={registerErrors.email}
              />
              <PasswordInput
                name="password"
                placeholder="Senha"
                value={registerData.password}
                onChange={handleRegisterChange}
                error={registerErrors.password}
              />
              <PasswordInput
                name="confirmPassword"
                placeholder="Confirmar Senha"
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                error={registerErrors.confirmPassword}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    CADASTRANDO...
                  </>
                ) : (
                  "CADASTRAR"
                )}
              </button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/reenvio" className="hover:text-primary transition-colors underline underline-offset-2">
                  Reenviar e-mail de ativação?
                </Link>
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ── Type guard para AxiosError ── */

function isAxiosError(error: unknown): error is import("axios").AxiosError<{ error?: string; field?: string }> {
  return typeof error === "object" && error !== null && "isAxiosError" in error;
}
