import { useEffect, useState } from "react";
import { User, Mail, ShieldAlert, Loader2, LogOut } from "lucide-react";
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
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  async function toggleAdultContent() {
    if (!profile || isUpdating) return;

    setIsUpdating(true);
    const newStatus = !profile.conteudo_adulto;
    
    try {
      await api.patch("/users/me/adult-content", {
        conteudo_adulto: newStatus
      });
      setProfile({ ...profile, conteudo_adulto: newStatus });
      toast.success(`Conteúdo +18 ${newStatus ? "ativado" : "desativado"}.`);
    } catch (error) {
      toast.error("Erro ao atualizar o filtro de conteúdo.");
    } finally {
      setIsUpdating(false);
    }
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
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg p-8 bg-card rounded-2xl border border-border shadow-2xl">
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Meu Perfil</h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">Buscando dados cadastrais...</p>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Username */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Nome de Usuário</span>
                <span className="text-foreground font-semibold text-lg">{profile.username}</span>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">E-mail Cadastrado</span>
                <span className="text-foreground font-semibold text-lg">{profile.email}</span>
              </div>
            </div>

            {/* +18 */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-sm font-semibold text-foreground">Conteúdo +18</span>
                <span className="text-xs text-muted-foreground mt-0.5">Exibir material com restrição de idade</span>
              </div>
              
              <button
                onClick={toggleAdultContent}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 ${
                  profile.conteudo_adulto ? 'bg-red-500' : 'bg-muted-foreground/30'
                }`}
              >
                <span className="sr-only">Alternar filtro de conteúdo +18</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    profile.conteudo_adulto ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 mt-8 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold transition-colors"
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
    </div>
  );
};

export default UserProfile;
