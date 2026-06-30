import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResendActivation from "@/pages/ResendActivation";
import { api } from "@/services/api";
import { toast } from "sonner";

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

function renderPage() {
  return render(
    <MemoryRouter>
      <ResendActivation />
    </MemoryRouter>
  );
}

describe("ResendActivation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envia e-mail e exibe feedback de sucesso", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { message: "Novo link de ativação enviado com sucesso para o seu e-mail!" },
    });

    renderPage();

    fireEvent.change(screen.getByPlaceholderText("E-mail"), {
      target: { value: "pendente@usuario.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reenviar link/i }));

    expect(screen.getByRole("button", { name: /enviando/i })).toBeDisabled();

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/resend-activation", {
        email: "pendente@usuario.com",
      });
    });

    expect(toast.success).toHaveBeenCalledWith("Novo link de ativação enviado com sucesso para o seu e-mail!");
    expect(screen.getByPlaceholderText("E-mail")).toHaveValue("");
  });

  it("exibe erro exato para e-mail inexistente", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 404,
        data: { error: "Endereço de e-mail não cadastrado" },
      },
    });

    renderPage();

    fireEvent.change(screen.getByPlaceholderText("E-mail"), {
      target: { value: "inexistente@usuario.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reenviar link/i }));

    expect(await screen.findByText("Endereço de e-mail não cadastrado")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Endereço de e-mail não cadastrado");
  });

  it("exibe erro exato para conta ja ativada", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 400,
        data: { error: "Este endereço de e-mail pertence a uma conta ativada." },
      },
    });

    renderPage();

    fireEvent.change(screen.getByPlaceholderText("E-mail"), {
      target: { value: "ativada@usuario.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reenviar link/i }));

    expect(await screen.findByText("Este endereço de e-mail pertence a uma conta ativada.")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Este endereço de e-mail pertence a uma conta ativada.");
  });

  it("bloqueia envio sem e-mail valido", () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText("E-mail"), {
      target: { value: "email-invalido" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reenviar link/i }));

    expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("bloqueia envio com campo vazio", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /reenviar link/i }));

    expect(screen.getByText("Informe seu e-mail.")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("limpa mensagem de erro quando usuario volta a digitar", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /reenviar link/i }));
    expect(screen.getByText("Informe seu e-mail.")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("E-mail"), {
      target: { value: "novo@usuario.com" },
    });

    expect(screen.queryByText("Informe seu e-mail.")).not.toBeInTheDocument();
  });

  it("exibe toast generico quando ocorre erro de conexao", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("rede indisponivel"));

    renderPage();

    fireEvent.change(screen.getByPlaceholderText("E-mail"), {
      target: { value: "pendente@usuario.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reenviar link/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao conectar com o servidor.");
    });
  });
});
