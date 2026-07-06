import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthCard } from "@/components/AuthCard";
import { api } from "@/services/api";
import { toast } from "sonner";

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

  it("exibe toast quando erro da API nao aponta campo especifico", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 500,
        data: {
          error: "Erro no cadastro.",
        },
      },
    });

    renderRegister();

    fillRegisterForm({
      username: "novo_user",
      email: "novo@usuario.com",
      password: "SenhaForte123!",
      confirmPassword: "SenhaForte123!",
    });

    fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro no cadastro.");
    });
  });

  it("exibe toast generico quando cadastro falha sem resposta da API", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("rede indisponivel"));

    renderRegister();

    fillRegisterForm({
      username: "novo_user",
      email: "novo@usuario.com",
      password: "SenhaForte123!",
      confirmPassword: "SenhaForte123!",
    });

    fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao conectar com o servidor.");
    });
  });

  it("alterna visibilidade dos campos de senha", () => {
    renderRegister();

    const senha = screen.getByPlaceholderText("Senha");
    expect(senha).toHaveAttribute("type", "password");

    fireEvent.click(screen.getAllByRole("button", { name: "Mostrar senha" })[0]);
    expect(senha).toHaveAttribute("type", "text");

    fireEvent.click(screen.getAllByRole("button", { name: "Esconder senha" })[0]);
    expect(senha).toHaveAttribute("type", "password");
  });

  it("bloqueia cadastro com campos vazios antes de chamar API", async () => {
    renderRegister();

    fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));

    expect(await screen.findByText("Informe um Nome de Usuário.")).toBeInTheDocument();
    expect(screen.getByText("Informe um e-mail.")).toBeInTheDocument();
    expect(screen.getByText("Informe uma senha.")).toBeInTheDocument();
    expect(screen.getByText("Informe a confirmação da senha.")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("bloqueia cadastro com username, e-mail e senha fora do padrao", async () => {
    renderRegister();

    fillRegisterForm({
      username: "ab",
      email: "email-invalido",
      password: "fraca",
      confirmPassword: "fraca",
    });
    fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));

    expect(await screen.findByText("Utilize entre 3 e 20 caracteres, sem espaços, acentos ou caracteres especiais.")).toBeInTheDocument();
    expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(screen.getByText("Utilize no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
});
