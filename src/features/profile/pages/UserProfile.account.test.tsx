import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserProfile from "./UserProfile";
import { api } from "@/services/api";
import { toast } from "sonner";

const updateUserMock = vi.fn();

vi.mock("@/features/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/auth")>()),
  useAuth: () => ({
    logout: vi.fn(),
    clearSession: vi.fn(),
    updateUser: updateUserMock,
  }),
}));

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function profilePayload(overrides: Record<string, unknown> = {}) {
  return {
    username: "usuario_teste",
    email: "usuario@teste.com",
    conteudo_adulto: false,
    can_enable_adult_content: true,
    profiles: ["Usuário Padrão"],
    active_profile: "Usuário Padrão",
    ...overrides,
  };
}

function mockLoadedProfile(overrides: Record<string, unknown> = {}) {
  vi.mocked(api.get).mockResolvedValueOnce({ data: { user: profilePayload(overrides) } });
}

async function renderProfile(overrides: Record<string, unknown> = {}) {
  mockLoadedProfile(overrides);
  render(<UserProfile />);
  await screen.findByText("usuario_teste");
}

function axiosFailure(status: number, error: string) {
  return { isAxiosError: true, response: { status, data: { error } } };
}

describe("UserProfile — perfil ativo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não oferece seletor de perfil para conta somente padrão", async () => {
    await renderProfile();

    expect(screen.queryByLabelText("Perfil ativo")).not.toBeInTheDocument();
  });

  it("oferece o seletor com os perfis da conta quando há mais de um", async () => {
    await renderProfile({ profiles: ["Administrador", "Usuário Padrão"], active_profile: "Administrador" });

    const selector = screen.getByLabelText("Perfil ativo") as HTMLSelectElement;
    expect(selector).toHaveValue("Administrador");
    expect(Array.from(selector.options).map((option) => option.value)).toEqual([
      "Administrador",
      "Usuário Padrão",
    ]);
  });

  it("troca o perfil ativo, notifica e atualiza o contexto sem recarregar", async () => {
    await renderProfile({ profiles: ["Administrador", "Usuário Padrão"], active_profile: "Administrador" });
    vi.mocked(api.patch).mockResolvedValueOnce({
      data: {
        message: "Perfil ativo atualizado com sucesso!",
        user: profilePayload({
          profiles: ["Administrador", "Usuário Padrão"],
          active_profile: "Usuário Padrão",
        }),
      },
    });

    fireEvent.change(screen.getByLabelText("Perfil ativo"), { target: { value: "Usuário Padrão" } });

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/users/me/active-profile", { profile: "Usuário Padrão" });
    });
    expect(toast.success).toHaveBeenCalledWith("Perfil ativo alterado para Usuário Padrão.");
    expect(updateUserMock).toHaveBeenCalledWith(
      expect.objectContaining({ active_profile: "Usuário Padrão" })
    );
    expect(screen.getByLabelText("Perfil ativo")).toHaveValue("Usuário Padrão");
  });

  it("mantém o perfil anterior e notifica quando a API recusa a troca", async () => {
    await renderProfile({ profiles: ["Administrador", "Usuário Padrão"], active_profile: "Administrador" });
    vi.mocked(api.patch).mockRejectedValueOnce(
      axiosFailure(403, "Acesso negado: sua conta não possui este perfil de acesso.")
    );

    fireEvent.change(screen.getByLabelText("Perfil ativo"), { target: { value: "Usuário Padrão" } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Acesso negado: sua conta não possui este perfil de acesso.");
    });
    expect(screen.getByLabelText("Perfil ativo")).toHaveValue("Administrador");
    expect(updateUserMock).not.toHaveBeenCalled();
  });
});

describe("UserProfile — nome de usuário", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("valida o formato antes de chamar a API", async () => {
    await renderProfile();

    fireEvent.change(screen.getByLabelText("Novo nome de usuário"), { target: { value: "ab" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar nome de usuário" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Utilize entre 3 e 20 caracteres, sem espaços, acentos ou caracteres especiais."
    );
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("recusa repetir o nome atual sem chamar a API", async () => {
    await renderProfile();

    fireEvent.click(screen.getByRole("button", { name: "Salvar nome de usuário" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O novo nome de usuário deve ser diferente do atual."
    );
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("altera o nome, permanece na tela e atualiza contexto e cabeçalho", async () => {
    await renderProfile();
    vi.mocked(api.patch).mockResolvedValueOnce({
      data: {
        message: "Nome de usuário atualizado com sucesso!",
        user: profilePayload({ username: "novo_nome" }),
      },
    });

    fireEvent.change(screen.getByLabelText("Novo nome de usuário"), { target: { value: "novo_nome" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar nome de usuário" }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/users/me/username", { username: "novo_nome" });
    });
    expect(toast.success).toHaveBeenCalledWith("Nome de usuário atualizado com sucesso!");
    expect(updateUserMock).toHaveBeenCalledWith(expect.objectContaining({ username: "novo_nome" }));
    expect(await screen.findByText("novo_nome")).toBeInTheDocument();
    expect(screen.getByText("Meu Perfil")).toBeInTheDocument();
  });

  it("exibe o conflito de nome devolvido pela API", async () => {
    await renderProfile();
    vi.mocked(api.patch).mockRejectedValueOnce(
      axiosFailure(409, "Este nome de usuário não está disponível. Por favor, escolha outro.")
    );

    fireEvent.change(screen.getByLabelText("Novo nome de usuário"), { target: { value: "ocupado" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar nome de usuário" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Este nome de usuário não está disponível. Por favor, escolha outro."
    );
    expect(screen.getByText("usuario_teste")).toBeInTheDocument();
  });
});

describe("UserProfile — senha", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function fillPassword(current: string, novaSenha: string, confirmacao: string) {
    fireEvent.change(screen.getByLabelText("Senha atual"), { target: { value: current } });
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: novaSenha } });
    fireEvent.change(screen.getByLabelText("Confirmação da nova senha"), { target: { value: confirmacao } });
  }

  it("apresenta os três campos rotulados e o botão nomeado", async () => {
    await renderProfile();

    expect(screen.getByLabelText("Senha atual")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Nova senha")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Confirmação da nova senha")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Alterar senha" })).toBeEnabled();
  });

  it("recusa senha fora da política vigente sem chamar a API", async () => {
    await renderProfile();

    fillPassword("SenhaForte123!", "fraca", "fraca");
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Utilize no mínimo 8 caracteres");
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("recusa confirmação divergente sem chamar a API", async () => {
    await renderProfile();

    fillPassword("SenhaForte123!", "OutraSenha456@", "OutraSenha789@");
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Divergência nos valores da senha e confirmação de senha!"
    );
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("recusa nova senha igual à atual sem chamar a API", async () => {
    await renderProfile();

    fillPassword("SenhaForte123!", "SenhaForte123!", "SenhaForte123!");
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A nova senha deve ser diferente da senha atual."
    );
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("exige a senha atual antes de enviar", async () => {
    await renderProfile();

    fillPassword("", "OutraSenha456@", "OutraSenha456@");
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Informe sua senha atual.");
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("altera a senha, limpa os campos e permanece na tela de perfil", async () => {
    await renderProfile();
    vi.mocked(api.patch).mockResolvedValueOnce({
      data: { message: "Senha alterada com sucesso! As demais sessões da conta foram encerradas." },
    });

    fillPassword("SenhaForte123!", "OutraSenha456@", "OutraSenha456@");
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/users/me/password", {
        currentPassword: "SenhaForte123!",
        newPassword: "OutraSenha456@",
        confirmPassword: "OutraSenha456@",
      });
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Senha alterada com sucesso! As demais sessões da conta foram encerradas."
    );
    await waitFor(() => {
      expect(screen.getByLabelText("Senha atual")).toHaveValue("");
    });
    expect(screen.getByLabelText("Nova senha")).toHaveValue("");
    expect(screen.getByText("Meu Perfil")).toBeInTheDocument();
  });

  it("exibe o erro da API quando a senha atual está incorreta", async () => {
    await renderProfile();
    vi.mocked(api.patch).mockRejectedValueOnce(axiosFailure(401, "Senha atual incorreta!"));

    fillPassword("SenhaErrada123!", "OutraSenha456@", "OutraSenha456@");
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Senha atual incorreta!");
    expect(screen.getByLabelText("Senha atual")).toHaveValue("SenhaErrada123!");
  });

  it("exibe a recusa por excesso de tentativas", async () => {
    await renderProfile();
    vi.mocked(api.patch).mockRejectedValueOnce(
      axiosFailure(429, "Muitas tentativas com a senha atual. Tente novamente em alguns minutos.")
    );

    fillPassword("SenhaErrada123!", "OutraSenha456@", "OutraSenha456@");
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Muitas tentativas com a senha atual. Tente novamente em alguns minutos."
    );
  });
});
