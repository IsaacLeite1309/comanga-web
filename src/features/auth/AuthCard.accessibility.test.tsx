import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthCard } from "./AuthCard";
import { api } from "@/services/api";

vi.mock("./useAuth", () => ({
  useAuth: () => ({ login: vi.fn() }),
}));

vi.mock("@/services/api", () => ({
  api: { post: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderAuthCard(rota: "/entrar" | "/cadastrar" = "/entrar") {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <AuthCard />
    </MemoryRouter>
  );
}

describe("acessibilidade básica do acesso à conta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("anuncia cada campo do login com um nome acessível próprio", () => {
    renderAuthCard();

    expect(screen.getByRole("textbox", { name: "E-mail" })).toBeInTheDocument();
    // Campos de senha não expõem papel textbox; o nome acessível é verificado pelo atributo.
    expect(document.querySelector('input[name="password"]')).toHaveAccessibleName("Senha");
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mostrar senha" })).toBeInTheDocument();
  });

  it("anuncia cada campo do cadastro com um nome acessível próprio", () => {
    renderAuthCard("/cadastrar");

    const painel = screen.getByRole("tabpanel");
    expect(within(painel).getByRole("textbox", { name: "Nome de Usuário" })).toBeInTheDocument();
    expect(within(painel).getByRole("textbox", { name: "E-mail" })).toBeInTheDocument();
    expect(within(painel).getByLabelText("Data de nascimento")).toBeInTheDocument();

    for (const nome of ["Senha", "Confirmar Senha"]) {
      expect(document.querySelector(`input[placeholder="${nome}"]`)).toHaveAccessibleName(nome);
    }
  });

  it.each([
    ["/entrar", /entrar/i, /cadastrar/i],
    ["/cadastrar", /cadastrar/i, /entrar/i]
  ] as const)("anuncia em %s somente a aba correspondente como selecionada", (rota, ativa, inativa) => {
    renderAuthCard(rota);

    expect(screen.getByRole("tab", { name: ativa })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: inativa })).toHaveAttribute("aria-selected", "false");
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  });

  it("marca o campo inválido e anuncia a mensagem de erro do login", async () => {
    renderAuthCard();

    fireEvent.change(screen.getByRole("textbox", { name: "E-mail" }), {
      target: { value: "sem-arroba" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    const campo = await screen.findByRole("textbox", { name: "E-mail" });
    expect(campo).toHaveAttribute("aria-invalid", "true");
    const alertas = await screen.findAllByRole("alert");
    expect(alertas.map((alerta) => alerta.textContent)).toContain("Informe um e-mail válido.");
    expect(api.post).not.toHaveBeenCalled();
  });

  it("retira a marcação de inválido assim que a pessoa corrige o campo", async () => {
    renderAuthCard();

    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));
    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "E-mail" })).toHaveAttribute("aria-invalid", "true");
    });

    fireEvent.change(screen.getByRole("textbox", { name: "E-mail" }), {
      target: { value: "pessoa@comanga.test" },
    });

    expect(screen.getByRole("textbox", { name: "E-mail" })).toHaveAttribute("aria-invalid", "false");
  });

  it("mantém o botão de envio nomeado e desabilitado enquanto a requisição está em andamento", async () => {
    let liberar: (() => void) | undefined;
    vi.mocked(api.post).mockImplementationOnce(() => new Promise((resolve) => {
      liberar = () => resolve({ data: { user: { id: "1", username: "a", role: "Usuário Padrão" } } });
    }));

    renderAuthCard();
    fireEvent.change(screen.getByRole("textbox", { name: "E-mail" }), {
      target: { value: "pessoa@comanga.test" },
    });
    fireEvent.change(document.querySelector('input[name="password"]') as HTMLInputElement, {
      target: { value: "SenhaForte123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    const botao = await screen.findByRole("button", { name: /entrando/i });
    expect(botao).toBeDisabled();

    liberar?.();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^entrar$/i })).toBeEnabled();
    });
  });
});
