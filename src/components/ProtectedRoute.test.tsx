import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "sonner";

let authState = {
  isAuthenticated: false,
  loading: false,
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <div>Área protegida</div>
            </ProtectedRoute>
          }
        />
        <Route path="/entrar" element={<div>Tela de login</div>} />
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
    };

    renderProtectedRoute();

    expect(screen.getByText("Área protegida")).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
