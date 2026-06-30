import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Activate from "@/pages/Activate";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

function renderActivate(path = "/activate/token-valido") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/activate/:token" element={<Activate />} />
        <Route path="/activate" element={<Activate />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Activate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe carregamento e ativa conta com token da URL", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { message: "Conta ativada com sucesso!" },
    });

    renderActivate();

    expect(screen.getByText("Ativando sua conta...")).toBeInTheDocument();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/auth/activate/token-valido");
    });

    expect(await screen.findByText("Conta ativada!")).toBeInTheDocument();
    expect(screen.getByText("Conta ativada com sucesso!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o Login" })).toHaveAttribute("href", "/entrar");
  });

  it("exibe mensagem exata retornada pela API para token expirado", async () => {
    vi.mocked(api.get).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          error: "Este link de ativação expirou. Solicite um novo e-mail de ativação.",
        },
      },
    });

    renderActivate("/activate/token-expirado");

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/auth/activate/token-expirado");
    });

    expect(await screen.findByText("Falha na ativação")).toBeInTheDocument();
    expect(screen.getByText("Este link de ativação expirou. Solicite um novo e-mail de ativação.")).toBeInTheDocument();
  });

  it("exibe erro quando token nao esta presente na URL", async () => {
    renderActivate("/activate");

    expect(await screen.findByText("Token de ativação não encontrado na URL.")).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });

  it("exibe erro generico quando nao ha resposta da API", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("rede indisponivel"));

    renderActivate("/activate/token-sem-rede");

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/auth/activate/token-sem-rede");
    });

    expect(await screen.findByText("Erro ao conectar com o servidor.")).toBeInTheDocument();
  });
});
