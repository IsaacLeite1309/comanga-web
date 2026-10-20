import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { api } from "@/services/api";
import { toast } from "sonner";

vi.mock("@/services/api", () => ({ api: { get: vi.fn() } }));
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));
vi.mock("@/features/auth", async () => {
  const actual = await vi.importActual<typeof import("@/features/auth")>("@/features/auth");

  return {
    ...actual,
    PasswordRecoveryPage: () => "Recuperar senha",
    AuthPage: () => "Entrar na conta",
    ActivatePage: () => "Ativar conta",
    ResendActivationPage: () => "Reenviar ativação",
  };
});
vi.mock("@/features/profile", () => ({ ProfilePage: () => "Meu perfil" }));
vi.mock("@/features/admin-users", () => ({ AdminUsersPage: () => "Administrar usuários" }));
vi.mock("@/features/public-catalog", () => ({
  PublicCatalogPage: () => "Catálogo público",
  PublicChecklistPage: () => "Lançamentos públicos",
  PublicAuthorWorksPage: () => "Obras do autor",
  PublicEditionDetailsPage: () => "Edição pública",
  EditionVolumeSelectionPage: () => "Seleção de Volumes",
  PublicVolumeDetailsPage: () => "Volume público",
  PublicWorkDetailsPage: () => "Obra pública",
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.get).mockResolvedValue({ data: { user: null } });
});

describe("navegação e acesso administrativo", () => {
  it("abre a coleção ao acessar a raiz do site", async () => {
    window.history.replaceState({}, "", "/");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Sua coleção" })).toHaveClass("sr-only");
    expect(window.location.pathname).toBe("/colecao");
  });
  it.each([null, { id: "1", username: "leitor", profiles: ["Usuário Padrão"], active_profile: "Usuário Padrão" }])("permite consultar lançamentos com sessão %j", async user => {
    vi.mocked(api.get).mockResolvedValue({ data: { user } });
    window.history.replaceState({}, "", "/lancamentos");
    render(<App />);
    expect(await screen.findByText("Lançamentos públicos")).toBeInTheDocument();
  });
  it.each([
    ["/autor/naoki-urasawa", "Obras do autor"],
    ["/obra/monster", "Obra pública"],
    ["/obra/monster/edicao/1", "Edição pública"],
    ["/obra/monster/edicao/1/volume/2", "Volume público"],
  ])("abre a rota pública %s", async (path, content) => {
    window.history.replaceState({}, "", path);
    render(<App />);
    expect(await screen.findByText(content)).toBeInTheDocument();
  });
  it.each(["/checklist", "/obras/monster", "/autores/naoki-urasawa"])('não mantém a URL pública antiga %s', async (path) => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      window.history.replaceState({}, "", path);
      render(<App />);
      expect(await screen.findByRole("heading", { name: "404" })).toBeInTheDocument();
    } finally {
      errorSpy.mockRestore();
    }
  });
  it.each([
    ["/colecao", "Sua coleção", "Faça login com sua conta CoMangá para gerenciar sua coleção."],
    ["/desejos", "Lista de desejos", "Faça login com sua conta CoMangá para gerenciar sua lista de desejos."],
  ])("mostra o acervo vazio para visitantes em %s", async (path, heading, warning) => {
    window.history.replaceState({}, "", path);
    render(<App />);
    expect(await screen.findByRole("heading", { name: heading })).toHaveClass("sr-only");
    expect(screen.getByRole("status")).toHaveTextContent(warning);
    expect(screen.queryByText(/está vazia/i)).not.toBeInTheDocument();
    expect(screen.getByText("Ainda não tem uma conta? O cadastro é rápido e gratuito!")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Entrar" })).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: expect.stringContaining("/entrar") })]),
    );
    expect(screen.getByRole("link", { name: "Cadastrar" })).toHaveAttribute("href", "/cadastrar");
    expect(window.location.pathname).toBe(path);
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith("/auth/me");
  });
  it.each(["/obra/monster/edicao/1/selecionar/colecao", "/colecao/monster/edicao/1/selecionar/desejos", "/colecao/monster/edicao/1"])("protege ações pessoais de visitantes: %s", async (path) => {
    window.history.replaceState({}, "", path);
    render(<App />);
    expect(await screen.findByText("Entrar na conta")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith("/auth/me");
  });
  it("não aceita o endereço antigo do selecionador da coleção", async () => {
    window.history.replaceState({}, "", "/obra/monster/edicao/1/selecionar/estante");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      render(<App />);
      expect(await screen.findByRole("heading", { name: "404" })).toBeInTheDocument();
    } finally {
      log.mockRestore();
    }
  });
  it("navega da entrada para o catálogo público", async () => {
    window.history.replaceState({}, "", "/entrar");
    render(<App />);
    expect(await screen.findByText("Entrar na conta")).toBeInTheDocument();
    const [searchLink] = await screen.findAllByRole("link", { name: /pesquisar/i });
    fireEvent.click(searchLink);
    expect(await screen.findByText("Catálogo público")).toBeInTheDocument();
  });

  it("redireciona visitantes que abrem a administração diretamente", async () => {
    window.history.replaceState({}, "", "/admin/users");
    render(<App />);
    expect(await screen.findByText("Entrar na conta")).toBeInTheDocument();
    expect(screen.queryByText("Administrar usuários")).not.toBeInTheDocument();
  });

  it.each([
    ["Administrador", ["Administrador", "Usuário Padrão"], "Administrar usuários"],
    ["Usuário Padrão", ["Administrador", "Usuário Padrão"], "Meu perfil"],
    ["Usuário Padrão", ["Usuário Padrão"], "Meu perfil"],
  ])("preserva a autorização para o perfil ativo %s", async (activeProfile, profiles, expectedPage) => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        user: {
          id: "1",
          username: "leitor",
          profiles,
          active_profile: activeProfile,
        },
      },
    });
    window.history.replaceState({}, "", "/admin/users");
    render(<App />);
    expect(await screen.findByText(expectedPage)).toBeInTheDocument();
  });

  it("não autoriza a administração quando o perfil ativo não pertence à conta", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        user: {
          id: "1",
          username: "leitor",
          profiles: ["Usuário Padrão"],
          active_profile: "Administrador",
        },
      },
    });
    window.history.replaceState({}, "", "/admin/users");
    render(<App />);
    expect(await screen.findByText("Meu perfil")).toBeInTheDocument();
  });

  it("redireciona usuários autenticados das páginas de visitante para o perfil", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { user: { id: "1", username: "leitor", profiles: ["Usuário Padrão"], active_profile: "Usuário Padrão" } },
    });
    window.history.replaceState({}, "", "/entrar");
    render(<App />);

    expect(await screen.findByText("Meu perfil")).toBeInTheDocument();
    expect(screen.queryByText("Entrar na conta")).not.toBeInTheDocument();
  });

  it("desvia o perfil administrativo das páginas públicas e orienta a troca de perfil", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { user: { id: "1", username: "admin", profiles: ["Administrador", "Usuário Padrão"], active_profile: "Administrador" } },
    });
    window.history.replaceState({}, "", "/pesquisa");
    render(<App />);

    expect(await screen.findByText("Meu perfil")).toBeInTheDocument();
    expect(toast.warning).toHaveBeenCalledWith("Mude o perfil para usuário padrão para acessar essa página.");
  });

  it.each(["/edicoes/20", "/volumes/30"])("invalida a URL pública isolada %s", async (path) => {
    window.history.replaceState({}, "", path);
    render(<App />);
    expect(await screen.findByText("404")).toBeInTheDocument();
  });

  it("preserva a página de rota inexistente", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      window.history.replaceState({}, "", "/rota-inexistente");
      render(<App />);
      expect(await screen.findByText("404")).toBeInTheDocument();
      expect(consoleError.mock.calls).toEqual([
        ["404 Error: User attempted to access non-existent route:", "/rota-inexistente"],
      ]);
    } finally {
      consoleError.mockRestore();
    }
  });
});
