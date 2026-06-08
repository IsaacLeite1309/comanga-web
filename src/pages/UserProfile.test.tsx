import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserProfile from "@/pages/UserProfile";
import { api } from "@/services/api";
import { toast } from "sonner";

const logoutMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    logout: logoutMock,
  }),
}));

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("UserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe loading e renderiza os dados cadastrais retornados pela API", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        user: {
          username: "usuario_teste",
          email: "usuario@teste.com",
          conteudo_adulto: false,
        },
      },
    });

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
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        user: {
          username: "usuario_teste",
          email: "usuario@teste.com",
          conteudo_adulto: true,
        },
      },
    });

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

    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        user: {
          username: "usuario_teste",
          email: "usuario@teste.com",
          conteudo_adulto: false,
        },
      },
    });
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
});
