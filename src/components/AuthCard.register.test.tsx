import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthCard } from "@/components/AuthCard";
import { api } from "@/services/api";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: vi.fn(),
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

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/cadastrar"]}>
      <AuthCard />
    </MemoryRouter>
  );
}

function fillRegisterForm(data: {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}) {
  if (data.username !== undefined) {
    fireEvent.change(screen.getByPlaceholderText("Nome de Usuário"), {
      target: { value: data.username },
    });
  }

  if (data.email !== undefined) {
    fireEvent.change(screen.getByPlaceholderText("E-mail"), {
      target: { value: data.email },
    });
  }

  if (data.password !== undefined) {
    fireEvent.change(screen.getByPlaceholderText("Senha"), {
      target: { value: data.password },
    });
  }

  if (data.confirmPassword !== undefined) {
    fireEvent.change(screen.getByPlaceholderText("Confirmar Senha"), {
      target: { value: data.confirmPassword },
    });
  }
}

describe("AuthCard cadastro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bloqueia submissao quando senha e confirmacao divergem", async () => {
    renderRegister();

    fillRegisterForm({
      username: "novo_user",
      email: "novo@usuario.com",
      password: "SenhaForte123!",
      confirmPassword: "SenhaDiferente123!",
    });

    fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));

    expect(await screen.findByText("Divergência nos valores da senha e confirmação de senha!")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("renderiza erro de duplicidade retornado pela API no campo de e-mail", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          field: "email",
          error: "Este endereço de e-mail já está em uso. Tente fazer login ou recuperar sua senha.",
        },
      },
    });

    renderRegister();

    fillRegisterForm({
      username: "novo_user",
      email: "existente@usuario.com",
      password: "SenhaForte123!",
      confirmPassword: "SenhaForte123!",
    });

    fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/register", {
        username: "novo_user",
        email: "existente@usuario.com",
        password: "SenhaForte123!",
        confirmPassword: "SenhaForte123!",
      });
    });

    expect(await screen.findByText("Este endereço de e-mail já está em uso. Tente fazer login ou recuperar sua senha.")).toBeInTheDocument();
  });
});
