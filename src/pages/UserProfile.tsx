import { FormEvent, useEffect, useState } from "react";
import { User, Mail, ShieldAlert, Loader2, LogOut, Trash2, X, ChevronDown, Eye, EyeOff } from "lucide-react";
import { isAxiosError } from "axios";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface UserProfileData {
  id: string;
  username: string;
  email: string;
  conteudo_adulto: boolean;
}

const UserProfile = () => {
  const { logout, clearSession } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  async function toggleAdultContent() {
    if (!profile || isUpdating) return;

    setIsUpdating(true);
    const newStatus = !profile.conteudo_adulto;

    try {
      await api.patch("/users/me/adult-content", {
        conteudo_adulto: newStatus,
      });
      setProfile({ ...profile, conteudo_adulto: newStatus });
      toast.success(`Conteúdo +18 ${newStatus ? "ativado" : "desativado"}.`);
    } catch (error) {
      toast.error("Erro ao atualizar o filtro de conteúdo.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!deletePassword.trim()) {
      setDeleteError("Informe sua senha atual.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await api.delete("/users/me", {
        data: { currentPassword: deletePassword },
      });
      toast.success(response.data?.message || "Conta excluída permanentemente.");
      clearSession();
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.error) {
        setDeleteError(error.response.data.error);
      } else {
        setDeleteError("Erro ao excluir a conta. Tente novamente.");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  function closeDeleteModal() {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setDeletePassword("");
    setDeleteError("");
    setShowDeletePassword(false);
  }

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await api.get("/users/me");
        setProfile(response.data.user || response.data);
      } catch (error: unknown) {
        if (isAxiosError(error) && error.response && (error.response.status === 401 || error.response.status === 403)) {
          toast.error("Sua sessão expirou ou é inválida.");
          logout();
        } else {
          toast.error("Erro ao carregar os dados do perfil.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [logout]);

  return (
    <div className="flex-1 flex min-w-0 flex-col items-center justify-center px-3 py-6 sm:px-4 sm:py-8">
      <div className="w-full max-w-lg min-w-0 p-5 sm:p-8 bg-card rounded-2xl border border-border shadow-2xl">
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Meu Perfil</h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">Buscando dados cadastrais...</p>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            <div className="flex min-w-0 items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border sm:gap-4">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Nome de Usuário</span>
                <span className="break-words text-foreground font-semibold text-lg">{profile.username}</span>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border sm:gap-4">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">E-mail Cadastrado</span>
                <span className="break-all text-foreground font-semibold text-base sm:text-lg">{profile.email}</span>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border sm:gap-4">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5 text-white" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-semibold text-foreground">Conteúdo +18</span>
                <span className="text-xs text-muted-foreground mt-0.5">Exibir material com restrição de idade</span>
                <span className="text-xs font-semibold text-foreground mt-1">
                  {profile.conteudo_adulto ? "Ativado" : "Desativado"}
                </span>
              </div>

              <button
                onClick={toggleAdultContent}
                disabled={isUpdating}
                aria-pressed={profile.conteudo_adulto}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 ${
                  profile.conteudo_adulto ? "bg-red-500" : "bg-muted-foreground/30"
                }`}
              >
                <span className="sr-only">Alternar filtro de conteúdo +18</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    profile.conteudo_adulto ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="rounded-xl border border-border bg-muted/20">
              <button
                type="button"
                onClick={() => setIsAdvancedOpen((current) => !current)}
                aria-expanded={isAdvancedOpen}
                aria-controls="advanced-settings-panel"
                className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/30"
              >
                <span className="text-sm font-bold text-foreground">Configurações avançadas</span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    isAdvancedOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isAdvancedOpen && (
                <div id="advanced-settings-panel" className="border-t border-border p-4">
                  <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                    <Trash2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-500">Excluir conta</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Excluir sua conta remove permanentemente seus dados e encerra suas sessões.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir conta
                  </button>
                </div>
                  </div>
                </div>
              </div>
              )}
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 mt-8 px-4 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 font-bold transition-colors"
            >
              <LogOut className="h-5 w-5" />
              SAIR DA CONTA
            </button>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Não foi possível exibir o perfil.
          </div>
        )}
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="w-full max-w-md rounded-2xl border border-red-500/30 bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="delete-account-title" className="text-xl font-bold text-foreground">
                  Excluir conta permanentemente
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Esta ação é irreversível. Confirme sua senha atual para continuar.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"
                aria-label="Fechar modal de exclusão"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleDeleteAccount}>
              <label className="block">
                <span className="text-sm font-semibold text-foreground">Senha Atual</span>
                <div className="relative mt-2">
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(event) => setDeletePassword(event.target.value)}
                    disabled={isDeleting}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-12 text-base text-foreground outline-none transition-colors focus:border-red-500 disabled:opacity-50"
                    placeholder="Digite sua senha atual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword((current) => !current)}
                    disabled={isDeleting}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                    aria-label={showDeletePassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {deleteError && (
                <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500">
                  {deleteError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isDeleting ? "Excluindo..." : "Confirmar exclusão"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
