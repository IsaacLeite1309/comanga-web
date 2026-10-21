import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "@/app/ProtectedRoute";
import { toast } from "sonner";

let authState = {
  isAuthenticated: false,
  loading: false,
  isSessionEnding: false,
  activeProfile: "Usuário Padrão",
  hasAdminProfile: false,
  user: null as null | { username: string },
};

vi.mock("@/features/auth", () => ({
  ADMIN_PROFILE: "Administrador",
  useAuth: () => authState,
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

function renderProtectedRoute(requiredRole?: string) {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole={requiredRole}>
              <div>Área protegida</div>
            </ProtectedRoute>
          }
        />
        <Route path="/entrar" element={<div>Tela de login</div>} />
        <Route path="/perfil/:username" element={<div>Meu perfil</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = {
      isAuthenticated: false,
      loading: false,
      isSessionEnding: false,
      activeProfile: "Usuário Padrão",
      hasAdminProfile: false,
      user: null,
    };
  });

  it("redireciona usuario sem sessao e exibe mensagem RN0014", async () => {
    renderProtectedRoute();

    expect(await screen.findByText("Tela de login")).toBeInTheDocument();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Sua sessão é inválida ou foi encerrada. Por favor, faça login novamente."
      );
    });
  });

  it("renderiza conteudo protegido quando autenticado", () => {
    authState = {
      isAuthenticated: true,
      loading: false,
      isSessionEnding: false,
      activeProfile: "Usuário Padrão",
      hasAdminProfile: false,
      user: { username: "admin" },
    };

    renderProtectedRoute();

    expect(screen.getByText("Área protegida")).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("redireciona usuario autenticado sem perfil administrativo", async () => {
    authState = {
      isAuthenticated: true,
      loading: false,
      isSessionEnding: false,
      activeProfile: "Usuário Padrão",
      hasAdminProfile: false,
      user: { username: "isaac" },
    };

    renderProtectedRoute("Administrador");

    expect(await screen.findByText("Meu perfil")).toBeInTheDocument();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Acesso negado: Você não tem permissão para acessar esta área.");
    });
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("orienta a trocar de perfil quando o administrador está no perfil padrão", async () => {
    authState = {
      isAuthenticated: true,
      loading: false,
      isSessionEnding: false,
      activeProfile: "Usuário Padrão",
      hasAdminProfile: true,
      user: { username: "isaac" },
    };

    renderProtectedRoute("Administrador");

    expect(await screen.findByText("Meu perfil")).toBeInTheDocument();
    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith("Mude o perfil para administrador para acessar essa página.");
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("renderiza rota administrativa quando usuario e administrador", () => {
    authState = {
      isAuthenticated: true,
      loading: false,
      isSessionEnding: false,
      activeProfile: "Administrador",
      hasAdminProfile: true,
      user: { username: "admin" },
    };

    renderProtectedRoute("Administrador");

    expect(screen.getByText("Área protegida")).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
