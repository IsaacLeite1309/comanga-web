import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthCard } from "@/features/auth/AuthCard";
import { api } from "@/services/api";
import { toast } from "sonner";

vi.mock("@/features/auth/useAuth", () => ({
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

function getAcceptanceCheckbox() {
  return screen.getByRole<HTMLInputElement>("checkbox", { name: "Li e aceito os Termos de Uso e Política de privacidade." });
}

function fillRegisterForm(data: {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}) {
  fireEvent.change(screen.getByLabelText("Data de nascimento"), { target: { value: "2000-01-01" } });
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

  it.each([
    ["Conta criada com sucesso! Enviamos o e-mail de ativação.", "Cadastro realizado com sucesso! Ative sua conta clicando no link de ativação que te enviamos no e-mail."],
    ["Conta criada, mas não foi possível enviar o e-mail de ativação. Use a opção de reenvio.", "Conta criada, mas não foi possível enviar o e-mail de ativação. Use a opção de reenvio."],
  ])("mostra o aviso do cadastro em /entrar até fechar pelo X: %s", async (apiMessage, expectedMessage) => {
    vi.mocked(api.post).mockResolvedValueOnce({ status: 201, data: { message: apiMessage } });
    render(
      <MemoryRouter initialEntries={["/cadastrar"]}>
        <Routes>
          <Route path="/cadastrar" element={<AuthCard />} />
          <Route path="/entrar" element={<><span data-testid="login-route" /><AuthCard /></>} />
        </Routes>
      </MemoryRouter>,
    );
    fillRegisterForm({ username: "novo_user", email: "novo@usuario.com", password: "SenhaForte123!", confirmPassword: "SenhaForte123!" });
    fireEvent.click(getAcceptanceCheckbox());
    fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));

    const dialog = await screen.findByRole("dialog", { name: "Aviso de cadastro" });
    expect(api.post).toHaveBeenCalledWith("/auth/register/v1", expect.objectContaining({
      acceptedTerms: true,
      termsVersion: "2026-11-19",
    }));
    expect(screen.getByTestId("login-route")).toBeInTheDocument();
    expect(dialog).toHaveTextContent(expectedMessage);
    expect(within(dialog).queryByRole("heading")).not.toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
    const close = within(dialog).getByRole("button", { name: "Fechar aviso de cadastro" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: "Escape" });
    fireEvent.mouseDown(dialog.parentElement as HTMLElement);
    expect(dialog).toBeInTheDocument();
    fireEvent.click(close);
    expect(screen.queryByRole("dialog", { name: "Aviso de cadastro" })).not.toBeInTheDocument();
    expect(screen.getByTestId("login-route")).toBeInTheDocument();
  });

  it("retira o painel da aba da ordem de tabulacao", () => {
    renderRegister();

    expect(screen.getByRole("tabpanel")).toHaveAttribute("tabindex", "-1");
  });

  it.each([404, 405, 503])("exibe orientação quando o cadastro versionado retorna %i e permite tentar novamente", async (status) => {
    vi.mocked(api.post)
      .mockRejectedValueOnce({ isAxiosError: true, response: { status, data: { error: "Indisponível." } } })
      .mockResolvedValueOnce({ status: 201, data: { message: "Conta criada com sucesso!" } });
    renderRegister();
    fillRegisterForm({ username: "novo_user", email: "novo@usuario.com", password: "SenhaForte123!", confirmPassword: "SenhaForte123!" });
    const acceptance = getAcceptanceCheckbox();
    const submit = screen.getByRole("button", { name: "CADASTRAR" });
    fireEvent.click(acceptance);
    fireEvent.click(submit);

    expect(await screen.findByRole("alert")).toHaveTextContent("Atualize a página ou tente novamente");
    expect(acceptance).toBeChecked();
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith("/auth/register/v1", expect.any(Object));
    expect(screen.queryByRole("dialog", { name: "Aviso de cadastro" })).not.toBeInTheDocument();

    fireEvent.click(submit);

    expect(await screen.findByRole("dialog", { name: "Aviso de cadastro" })).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledTimes(2);
    expect(api.post).toHaveBeenLastCalledWith("/auth/register/v1", expect.any(Object));
  });

  it("não confirma cadastro se o Preview responder com HTML da SPA", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200, data: "<!doctype html>" });
    renderRegister();
    fillRegisterForm({ username: "novo_user", email: "novo@usuario.com", password: "SenhaForte123!", confirmPassword: "SenhaForte123!" });
    fireEvent.click(getAcceptanceCheckbox());
    fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Atualize a página ou tente novamente");
    expect(screen.queryByRole("dialog", { name: "Aviso de cadastro" })).not.toBeInTheDocument();
  });

  it("impede um cadastro válido sem aceite e associa a mensagem ao campo", () => {
    renderRegister();
    fillRegisterForm({ username: "novo_user", email: "novo@usuario.com", password: "SenhaForte123!", confirmPassword: "SenhaForte123!" });
    const checkbox = getAcceptanceCheckbox();

    expect(checkbox).not.toBeChecked();
    expect(checkbox).toBeRequired();
    fireEvent.submit(checkbox.form!);

    expect(api.post).not.toHaveBeenCalled();
    expect(checkbox).toHaveFocus();
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).toHaveAccessibleDescription("Aceite os Termos de Uso para concluir o cadastro.");
    expect(screen.getByRole("alert")).toHaveTextContent("Aceite os Termos de Uso para concluir o cadastro.");

    fireEvent.click(checkbox.labels![0]);
    expect(checkbox).toBeChecked();
    expect(checkbox).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));
    expect(api.post).not.toHaveBeenCalled();
  });

  it("mostra a rejeição da API junto ao campo de aceite", async () => {
    const error = "Aceite os Termos de Uso para criar sua conta.";
    vi.mocked(api.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 400, data: { field: "acceptedTerms", error } },
    });
    renderRegister();
    fillRegisterForm({ username: "novo_user", email: "novo@usuario.com", password: "SenhaForte123!", confirmPassword: "SenhaForte123!" });
    const checkbox = getAcceptanceCheckbox();
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(error);
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toHaveAccessibleDescription(error);
    expect(screen.getByPlaceholderText("Nome de Usuário")).toHaveValue("novo_user");
  });

  it("bloqueia novo envio após a API rejeitar uma versão antiga dos termos", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 400, data: { field: "termsVersion", error: "Versão desatualizada." } },
    });
    renderRegister();
    fillRegisterForm({ username: "novo_user", email: "novo@usuario.com", password: "SenhaForte123!", confirmPassword: "SenhaForte123!" });
    const checkbox = getAcceptanceCheckbox();
    const submit = screen.getByRole("button", { name: "CADASTRAR" });
    fireEvent.click(checkbox);
    fireEvent.click(submit);

    expect(await screen.findByRole("alert")).toHaveTextContent("Atualize a página para ler e aceitar a versão atual.");
    expect(checkbox).toHaveFocus();
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Atualizar página" })).toBeEnabled();
    expect(submit).toBeDisabled();

    fireEvent.click(checkbox);
    fireEvent.submit(checkbox.form!);
    expect(checkbox).not.toBeChecked();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it("seleciona ano, mês e dia no calendário próprio", () => {
    renderRegister();
    fireEvent.click(screen.getByRole("button", { name: "Selecionar data de nascimento" }));
    const picker = screen.getByRole("dialog", { name: "Selecionar data de nascimento" });
    const yearList = within(picker).getByRole("listbox", { name: "Ano de nascimento" });
    expect(within(yearList).getByRole("option", { name: "1900" })).toBeInTheDocument();
    expect(within(picker).queryByRole("spinbutton")).not.toBeInTheDocument();
    fireEvent.click(within(yearList).getByRole("option", { name: "2000" }));
    fireEvent.click(within(picker).getByRole("button", { name: "Fevereiro" }));
    fireEvent.click(within(picker).getByRole("button", { name: "29" }));
    expect(screen.getByRole("textbox", { name: "Data de nascimento" })).toHaveValue("29/02/2000");
    expect(screen.queryByRole("dialog", { name: "Selecionar data de nascimento" })).not.toBeInTheDocument();
  });

  it("recusa senha multibyte longa antes de enviar cadastro", async () => {
    renderRegister();
    const password = "Aa1!" + "é".repeat(35);
    fillRegisterForm({ username: "novo_user", email: "novo@usuario.com", password, confirmPassword: password });
    fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));
    expect(await screen.findByText(/72 bytes/)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
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

    fireEvent.click(getAcceptanceCheckbox());
    fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/register/v1", {
        birthDate: "2000-01-01",
        username: "novo_user",
        email: "existente@usuario.com",
        password: "SenhaForte123!",
        confirmPassword: "SenhaForte123!",
        acceptedTerms: true,
        termsVersion: "2026-11-19",
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

    fireEvent.click(getAcceptanceCheckbox());
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

    fireEvent.click(getAcceptanceCheckbox());
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

it("exige data válida e envia nascimento no cadastro", async () => {
  vi.clearAllMocks();
  vi.mocked(api.post).mockResolvedValue({ status: 201, data: { message: "Conta criada." } });
  renderRegister();
  fillRegisterForm({ username: "new_user", email: "new@example.com", password: "SenhaForte123!", confirmPassword: "SenhaForte123!" });
  fireEvent.click(getAcceptanceCheckbox());
  fireEvent.change(screen.getByLabelText("Data de nascimento"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("data de nascimento válida");
  fireEvent.change(screen.getByLabelText("Data de nascimento"), { target: { value: "2999-01-01" } });
  fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("não futura");
  fireEvent.change(screen.getByLabelText("Data de nascimento"), { target: { value: "2000-02-29" } });
  fireEvent.click(screen.getByRole("button", { name: "CADASTRAR" }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith("/auth/register/v1", expect.objectContaining({ birthDate: "2000-02-29" })));
});
