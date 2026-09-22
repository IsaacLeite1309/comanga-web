import { useState } from "react";
import { isAxiosError } from "axios";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";

interface AccountProfile {
  id: string;
  username: string;
  email: string;
  conteudo_adulto: boolean;
  can_enable_adult_content: boolean;
  profiles?: string[];
  active_profile?: string;
}

interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function readRequestError(error: unknown, fallback: string): string {
  if (isAxiosError(error) && typeof error.response?.data?.error === "string") {
    return error.response.data.error;
  }
  return fallback;
}

// Ações do próprio perfil: mantêm a tela e o contexto sincronizados sem recarregar a página.
export function useAccountSettings(
  profile: AccountProfile | null,
  setProfile: (profile: AccountProfile) => void
) {
  const { updateUser } = useAuth();
  const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);

  function applyProfileResponse(updated: AccountProfile) {
    setProfile(updated);
    updateUser({
      username: updated.username,
      email: updated.email,
      profiles: updated.profiles,
      active_profile: updated.active_profile,
      conteudo_adulto: updated.conteudo_adulto,
    });
  }

  async function changeActiveProfile(nextProfile: string) {
    if (!profile || isSwitchingProfile || nextProfile === profile.active_profile) return;

    setIsSwitchingProfile(true);
    try {
      const response = await api.patch("/users/me/active-profile", { profile: nextProfile });
      applyProfileResponse(response.data.user);
      toast.success(`Perfil ativo alterado para ${nextProfile}.`);
    } catch (error: unknown) {
      toast.error(readRequestError(error, "Erro ao alterar o perfil ativo."));
    } finally {
      setIsSwitchingProfile(false);
    }
  }

  async function changeUsername(username: string): Promise<string> {
    try {
      const response = await api.patch("/users/me/username", { username });
      applyProfileResponse(response.data.user);
      toast.success("Nome de usuário atualizado com sucesso!");
      return "";
    } catch (error: unknown) {
      const message = readRequestError(error, "Erro ao alterar o nome de usuário.");
      return message;
    }
  }

  async function changePassword(input: PasswordChangeInput): Promise<string> {
    try {
      const response = await api.patch("/users/me/password", input);
      toast.success(response.data?.message || "Senha alterada com sucesso!");
      return "";
    } catch (error: unknown) {
      const message = readRequestError(error, "Erro ao alterar a senha.");
      toast.error(message);
      return message;
    }
  }

  return { isSwitchingProfile, changeActiveProfile, changePassword, changeUsername };
}

export type { AccountProfile };
