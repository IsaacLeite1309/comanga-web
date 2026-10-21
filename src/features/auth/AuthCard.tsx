import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, EyeOff, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuth } from "./useAuth";
import { BrandLogo } from "@/components/BrandLogo";

import { validatePassword } from "./passwordValidation";
import { authReturnPath } from "./authReturnPath";
import { BirthDateField } from "./BirthDateField";

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
  birthDate: string;
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
  RN0020: "Divergência nos valores da senha e confirmação de senha!",
  EMAIL_INVALID: "Informe um e-mail válido.",
  EMAIL_REQUIRED: "Informe seu e-mail.",
  PASSWORD_REQUIRED: "Informe sua senha.",
  // Mensagens de campo vazio (Cadastro)
  USERNAME_REQUIRED: "Informe um Nome de Usuário.",
  REG_EMAIL_REQUIRED: "Informe um e-mail.",
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
  const birth = new Date(`${data.birthDate}T00:00:00Z`);
  const validBirth = /^(?!0000)\d{4}-\d{2}-\d{2}$/.test(data.birthDate)
    && Number.isFinite(birth.getTime()) && birth.toISOString().slice(0, 10) === data.birthDate
    && data.birthDate <= new Date().toISOString().slice(0, 10);
  return {
    birthDate: validBirth ? "" : "Informe uma data de nascimento válida e não futura.",
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
          aria-label={placeholder}
          aria-invalid={Boolean(error)}
          className={`w-full h-12 px-4 pr-12 rounded-xl bg-sidebar border text-foreground placeholder:text-muted-foreground focus:outline-none text-sm transition-colors ${
            error
              ? "border-red-500 focus:border-red-500"
              : "border-sidebar-foreground/30 hover:border-primary focus:border-primary"
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
      {error && <span role="alert" className="block text-xs text-red-500 mt-1 ml-1">{error}</span>}
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
        aria-label={placeholder}
        aria-invalid={Boolean(error)}
        className={`w-full h-12 px-4 rounded-xl bg-sidebar border text-foreground placeholder:text-muted-foreground focus:outline-none text-sm transition-colors ${
          error
            ? "border-red-500 focus:border-red-500"
            : "border-sidebar-foreground/30 hover:border-primary focus:border-primary"
        }`}
      />
      {error && <span role="alert" className="block text-xs text-red-500 mt-1 ml-1">{error}</span>}
    </div>
  );
}

interface LoginFormProps {
  data: LoginData;
  errors: LoginErrors;
  loading: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent) => void;
}

function LoginForm({ data, errors, loading, onChange, onSubmit }: LoginFormProps) {
  return (
    <TabsContent value="login" className="mt-0">
      <h2 className="text-center text-2xl font-light tracking-[0.2em] text-foreground mt-8 mb-6">
        ENTRAR
      </h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextInput
          type="email"
          name="email"
          placeholder="E-mail"
          value={data.email}
          onChange={onChange}
          error={errors.email}
        />
        <PasswordInput
          name="password"
          placeholder="Senha"
          value={data.password}
          onChange={onChange}
          error={errors.password}
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
          ) : "ENTRAR"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/recuperar-senha" className="hover:text-primary transition-colors underline underline-offset-2">
            Esqueceu a senha?
          </Link>
        </p>
      </form>
    </TabsContent>
  );
}

interface RegisterFormProps {
  data: RegisterData;
  errors: RegisterErrors;
  loading: boolean;
  onBirthDateChange: (value: string) => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent) => void;
}

function RegisterForm({
  data,
  errors,
  loading,
  onBirthDateChange,
  onChange,
  onSubmit,
}: RegisterFormProps) {
  return (
    <TabsContent value="register" className="mt-0">
      <h2 className="text-center text-2xl font-light tracking-[0.2em] text-foreground mt-8 mb-6">
        CADASTRAR
      </h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextInput
          name="username"
          placeholder="Nome de Usuário"
          value={data.username}
          onChange={onChange}
          error={errors.username}
        />
        <TextInput
          type="email"
          name="email"
          placeholder="E-mail"
          value={data.email}
          onChange={onChange}
          error={errors.email}
        />
        <BirthDateField value={data.birthDate} error={errors.birthDate} onChange={onBirthDateChange} />
        <PasswordInput
          name="password"
          placeholder="Senha"
          value={data.password}
          onChange={onChange}
          error={errors.password}
        />
        <PasswordInput
          name="confirmPassword"
          placeholder="Confirmar Senha"
          value={data.confirmPassword}
          onChange={onChange}
          error={errors.confirmPassword}
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
          ) : "CADASTRAR"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/reenvio" className="hover:text-primary transition-colors underline underline-offset-2">
            Reenviar e-mail de ativação?
          </Link>
        </p>
      </form>
    </TabsContent>
  );
}

function AuthHeader() {
  return (
    <div className="flex items-center gap-3 mb-8">
      <BrandLogo />
      <h1 className="text-3xl font-bold tracking-wide text-primary-foreground">
        Co<span className="text-primary">Mangá</span>
      </h1>
    </div>
  );
}

function AuthTabList() {
  const triggerClassName = "h-full flex-1 rounded-full px-5 text-sm font-semibold text-foreground transition-all hover:bg-sidebar-accent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none data-[state=active]:hover:bg-primary";

  return (
    <TabsList className="h-12 w-full rounded-full border border-sidebar-foreground/30 bg-sidebar p-1 text-foreground">
      <TabsTrigger
        value="login"
        className={triggerClassName}
      >
        Entrar
      </TabsTrigger>
      <TabsTrigger
        value="register"
        className={triggerClassName}
      >
        Cadastrar
      </TabsTrigger>
    </TabsList>
  );
}

const REGISTRATION_SUCCESS_MESSAGE = "Cadastro realizado com sucesso! Ative sua conta clicando no link de ativação que te enviamos no e-mail.";

function RegistrationSuccessDialog({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-label="Aviso de cadastro" aria-describedby="registration-success-message" className="relative w-full max-w-md rounded-2xl border border-primary/30 bg-card p-6 pt-10 text-center shadow-2xl">
        <button type="button" aria-label="Fechar aviso de cadastro" autoFocus onClick={onClose} onKeyDown={(event) => { if (event.key === "Tab") event.preventDefault(); }} className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <p id="registration-success-message" className="text-base leading-relaxed text-white">{message}</p>
      </div>
    </div>
  );
}

/* ──────────────────────── AuthCard ───────────────────────────── */

export function AuthCard() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const registrationNotice = location.pathname === "/entrar" && typeof location.state?.registrationNotice === "string" ? location.state.registrationNotice : "";
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
    birthDate: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({
    birthDate: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  /* ── Troca de tab com reset ── */

  function handleTabChange(newTab: string) {
    setTab(newTab);
    navigate(newTab === "register" ? "/cadastrar" : "/entrar", { state: location.state });
    setLoginData({ email: "", password: "" });
    setLoginErrors({ email: "", password: "" });
    setRegisterData({ birthDate: "", username: "", email: "", password: "", confirmPassword: "" });
    setRegisterErrors({ birthDate: "", username: "", email: "", password: "", confirmPassword: "" });
  }

  function closeRegistrationNotice() {
    const nextState = location.state && typeof location.state === "object" ? { ...location.state } : {};
    delete nextState.registrationNotice;
    navigate("/entrar", { replace: true, state: nextState });
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
      navigate(authReturnPath(location.state, `/perfil/${encodeURIComponent(response.data.user.username)}`), { replace: true });
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
      const apiMessage = response.data.message;
      const message = typeof apiMessage === "string" && apiMessage.includes("não foi possível enviar") ? apiMessage : REGISTRATION_SUCCESS_MESSAGE;

      // Limpar formulário e ir para login
      setRegisterData({ birthDate: "", username: "", email: "", password: "", confirmPassword: "" });
      setRegisterErrors({ birthDate: "", username: "", email: "", password: "", confirmPassword: "" });
      setTab("login");
      navigate("/entrar", { replace: true, state: { ...location.state, registrationNotice: message } });
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
    <div className="page-gutter flex-1 flex flex-col items-center justify-center py-8">
      <AuthHeader />

      <div className="w-full max-w-md p-8 bg-background rounded-2xl border border-border">
        <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
          <AuthTabList />

          <LoginForm
            data={loginData}
            errors={loginErrors}
            loading={loading}
            onChange={handleLoginChange}
            onSubmit={handleLogin}
          />
          <RegisterForm
            data={registerData}
            errors={registerErrors}
            loading={loading}
            onBirthDateChange={(value) => {
              setRegisterData((prev) => ({ ...prev, birthDate: value }));
              if (registerErrors.birthDate) setRegisterErrors((prev) => ({ ...prev, birthDate: "" }));
            }}
            onChange={handleRegisterChange}
            onSubmit={handleRegister}
          />
        </Tabs>
      </div>
      {registrationNotice && <RegistrationSuccessDialog message={registrationNotice} onClose={closeRegistrationNotice} />}
    </div>
  );
}

/* ── Type guard para AxiosError ── */

function isAxiosError(error: unknown): error is import("axios").AxiosError<{ error?: string; field?: string }> {
  return typeof error === "object" && error !== null && "isAxiosError" in error;
}
