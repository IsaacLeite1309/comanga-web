import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({ api: { get: vi.fn() } }));
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));
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
