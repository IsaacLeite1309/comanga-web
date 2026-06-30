import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { toast } from "sonner";

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

function AuthConsumer() {
  const { user, login, logout } = useAuth();

  return (
    <div>
      <span>{user ? user.username : "sem usuário"}</span>
      <button onClick={() => login({ id: "login-id", username: "usuario_login" })}>Entrar contexto</button>
      <button onClick={logout}>Sair</button>
    </div>
  );
}

function renderAuthProvider() {
  return render(
    <MemoryRouter initialEntries={["/perfil"]}>
      <AuthProvider>
        <Routes>
          <Route path="/perfil" element={<AuthConsumer />} />
          <Route path="/entrar" element={<div>Tela de login</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("AuthContext logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("encerra sessao no backend, limpa usuario em memoria e redireciona para login", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        user: {
          id: "user-id",
          username: "usuario_teste",
        },
      },
    });
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { message: "Sessão encerrada com sucesso." },
    });

    renderAuthProvider();

    expect(await screen.findByText("usuario_teste")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sair" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/logout");
    });

    expect(toast.success).toHaveBeenCalledWith("Sessão encerrada com segurança.");
    expect(await screen.findByText("Tela de login")).toBeInTheDocument();
  });

  it("mantem usuario vazio quando a validacao inicial da sessao falha", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("sessao invalida"));

    renderAuthProvider();

    expect(await screen.findByText("sem usuário")).toBeInTheDocument();
  });

  it("atualiza usuario em memoria ao chamar login do contexto", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("sessao invalida"));

    renderAuthProvider();

    expect(await screen.findByText("sem usuário")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Entrar contexto" }));

    expect(await screen.findByText("usuario_login")).toBeInTheDocument();
  });

  it("limpa usuario e redireciona mesmo quando logout falha no backend", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        user: {
          id: "user-id",
          username: "usuario_teste",
        },
      },
    });
    vi.mocked(api.post).mockRejectedValueOnce(new Error("backend indisponivel"));

    renderAuthProvider();

    expect(await screen.findByText("usuario_teste")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
    expect(toast.success).toHaveBeenCalledWith("Sessão encerrada com segurança.");
    expect(await screen.findByText("Tela de login")).toBeInTheDocument();
  });
});
