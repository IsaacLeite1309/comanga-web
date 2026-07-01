import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserProfile from "@/pages/UserProfile";
import { api } from "@/services/api";
import { toast } from "sonner";

const logoutMock = vi.fn();
const clearSessionMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    logout: logoutMock,
    clearSession: clearSessionMock,
  }),
}));

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function mockLoadedProfile(conteudoAdulto = false) {
  vi.mocked(api.get).mockResolvedValueOnce({
    data: {
      user: {
        username: "usuario_teste",
        email: "usuario@teste.com",
        conteudo_adulto: conteudoAdulto,
      },
    },
  });
}

async function openAdvancedSettings() {
  fireEvent.click(await screen.findByRole("button", { name: /configura/i }));
}

describe("UserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe loading e renderiza os dados cadastrais retornados pela API", async () => {
    mockLoadedProfile(false);

    render(<UserProfile />);

    expect(screen.getByText("Buscando dados cadastrais...")).toBeInTheDocument();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/users/me");
    });

    expect(await screen.findByText("usuario_teste")).toBeInTheDocument();
    expect(screen.getByText("usuario@teste.com")).toBeInTheDocument();
    expect(screen.getByText("Desativado")).toBeInTheDocument();
  });

  it("exibe status Ativado quando a preferencia +18 estiver habilitada", async () => {
    mockLoadedProfile(true);

    render(<UserProfile />);

    expect(await screen.findByText("Ativado")).toBeInTheDocument();
  });

  it("aciona logout quando a API recusa a sessao com 401", async () => {
    vi.mocked(api.get).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 401,
      },
    });

    render(<UserProfile />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Sua sessão expirou ou é inválida.");
    });
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it("desabilita o toggle durante a atualizacao e exibe o novo estado apos sucesso", async () => {
    let resolvePatch: (value: unknown) => void;
    const patchPromise = new Promise((resolve) => {
      resolvePatch = resolve;
    });

    mockLoadedProfile(false);
    vi.mocked(api.patch).mockReturnValueOnce(patchPromise);

    render(<UserProfile />);

    const toggle = await screen.findByRole("button", {
      name: /alternar filtro de conteúdo \+18/i,
    });

    fireEvent.click(toggle);

    expect(api.patch).toHaveBeenCalledWith("/users/me/adult-content", {
      conteudo_adulto: true,
    });
    expect(toggle).toBeDisabled();

    resolvePatch!({
      data: {
        message: "Preferência de exibição atualizada com sucesso!",
        conteudo_adulto: true,
      },
    });

    await waitFor(() => {
      expect(toggle).not.toBeDisabled();
    });

    expect(await screen.findByText("Ativado")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Conteúdo +18 ativado.");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("exibe erro generico quando perfil nao carrega por falha de servidor", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("servidor indisponivel"));

    render(<UserProfile />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao carregar os dados do perfil.");
    });
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it("exibe erro quando atualizacao da preferencia +18 falha", async () => {
    mockLoadedProfile(true);
    vi.mocked(api.patch).mockRejectedValueOnce(new Error("falha"));

    render(<UserProfile />);

    const toggle = await screen.findByRole("button", {
      name: /alternar filtro de conteúdo \+18/i,
    });

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao atualizar o filtro de conteúdo.");
    });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("abre o modal de exclusao e exige senha atual", async () => {
    mockLoadedProfile(false);

    render(<UserProfile />);

    await openAdvancedSettings();
    fireEvent.click(screen.getByRole("button", { name: /^excluir conta$/i }));
    expect(screen.getByRole("dialog", { name: /excluir conta permanentemente/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirmar exclusão/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Informe sua senha atual.");
    expect(api.delete).not.toHaveBeenCalled();
  });

  it("permite mostrar e ocultar a senha no modal de exclusao", async () => {
    mockLoadedProfile(false);

    render(<UserProfile />);

    await openAdvancedSettings();
    fireEvent.click(screen.getByRole("button", { name: /^excluir conta$/i }));

    const passwordInput = screen.getByLabelText(/senha atual/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: /mostrar senha/i }));
    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: /ocultar senha/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("exibe erro da API quando a senha atual esta incorreta", async () => {
    mockLoadedProfile(false);
    vi.mocked(api.delete).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 401,
        data: { error: "Senha atual incorreta!" },
      },
    });

    render(<UserProfile />);

    await openAdvancedSettings();
    fireEvent.click(screen.getByRole("button", { name: /^excluir conta$/i }));
    fireEvent.change(screen.getByLabelText(/senha atual/i), {
      target: { value: "SenhaErrada123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirmar exclusão/i }));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/users/me", {
        data: { currentPassword: "SenhaErrada123!" },
      });
    });
    expect(await screen.findByText("Senha atual incorreta!")).toBeInTheDocument();
    expect(clearSessionMock).not.toHaveBeenCalled();
  });

  it("exclui conta com sucesso, exibe feedback e limpa a sessao local", async () => {
    mockLoadedProfile(false);
    vi.mocked(api.delete).mockResolvedValueOnce({
      data: { message: "Conta excluida permanentemente." },
    });

    render(<UserProfile />);

    await openAdvancedSettings();
    fireEvent.click(screen.getByRole("button", { name: /^excluir conta$/i }));
    fireEvent.change(screen.getByLabelText(/senha atual/i), {
      target: { value: "SenhaForte123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirmar exclusão/i }));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/users/me", {
        data: { currentPassword: "SenhaForte123!" },
      });
    });

    expect(toast.success).toHaveBeenCalledWith("Conta excluida permanentemente.");
    expect(clearSessionMock).toHaveBeenCalledTimes(1);
  });
});
