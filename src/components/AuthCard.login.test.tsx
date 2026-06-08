import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthCard } from "@/components/AuthCard";
import { api } from "@/services/api";
import { toast } from "sonner";

const loginMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: loginMock,
  }),
}));

vi.mock("@/services/api", () => ({
  api: {
    post: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/entrar"]}>
      <AuthCard />
    </MemoryRouter>
  );
}

function fillLoginForm(email: string, password: string) {
  fireEvent.change(screen.getByPlaceholderText("E-mail"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByPlaceholderText("Senha"), {
    target: { value: password },
  });
}

describe("AuthCard login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("autentica credenciais validas e salva usuario no contexto", async () => {
    const user = {
      id: "user-id",
      username: "usuario_teste",
      role: "Usuário Padrão",
    };

    vi.mocked(api.post).mockResolvedValueOnce({
      data: { message: "Login realizado com sucesso!", user },
    });

    renderLogin();
    fillLoginForm("usuario@teste.com", "SenhaForte123!");

    fireEvent.click(screen.getByRole("button", { name: "ENTRAR" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/login", {
        email: "usuario@teste.com",
        password: "SenhaForte123!",
      });
    });

    expect(loginMock).toHaveBeenCalledWith(user);
    expect(toast.success).toHaveBeenCalledWith("Login realizado com sucesso!");
  });

  it("exibe erro exato para credenciais invalidas", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 401,
        data: { error: "Credenciais inválidas!" },
      },
    });

    renderLogin();
    fillLoginForm("usuario@teste.com", "SenhaErrada123!");

    fireEvent.click(screen.getByRole("button", { name: "ENTRAR" }));

    expect(await screen.findByText("Credenciais inválidas!")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Credenciais inválidas!");
  });

  it("exibe erro exato para conta pendente", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 403,
        data: {
          error: "Conta de acesso pendente. Ative a conta com o e-mail de verificação enviado anteriormente.",
        },
      },
    });

    renderLogin();
    fillLoginForm("pendente@teste.com", "SenhaForte123!");

    fireEvent.click(screen.getByRole("button", { name: "ENTRAR" }));

    const message = "Conta de acesso pendente. Ative a conta com o e-mail de verificação enviado anteriormente.";
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(message);
  });
});
