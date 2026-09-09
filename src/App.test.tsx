import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({ api: { get: vi.fn() } }));
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));
vi.mock("@/features/auth", () => ({
  AuthPage: () => "Entrar na conta",
  ActivatePage: () => "Ativar conta",
  ResendActivationPage: () => "Reenviar ativação",
}));
vi.mock("@/features/profile", () => ({ ProfilePage: () => "Meu perfil" }));
vi.mock("@/features/admin-users", () => ({ AdminUsersPage: () => "Administrar usuários" }));
vi.mock("@/features/public-catalog", () => ({
  PublicCatalogPage: () => "Catálogo público",
  PublicAuthorWorksPage: () => "Obras do autor",
  PublicEditionDetailsPage: () => "Edição pública",
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
    fireEvent.click(screen.getAllByRole("link", { name: /pesquisar/i })[0]);
    expect(await screen.findByText("Catálogo público")).toBeInTheDocument();
  });

  it("redireciona visitantes que abrem a administração diretamente", async () => {
    window.history.replaceState({}, "", "/admin/users");
    render(<App />);
    expect(await screen.findByText("Entrar na conta")).toBeInTheDocument();
    expect(screen.queryByText("Administrar usuários")).not.toBeInTheDocument();
  });

  it.each([
    ["Administrador", "Administrar usuários"],
    ["Usuário Padrão", "Meu perfil"],
  ])("preserva a autorização para %s", async (role, expectedPage) => {
    vi.mocked(api.get).mockResolvedValue({ data: { user: { id: "1", username: "leitor", role } } });
    window.history.replaceState({}, "", "/admin/users");
    render(<App />);
    expect(await screen.findByText(expectedPage)).toBeInTheDocument();
  });

  it("preserva a página de rota inexistente", async () => {
    window.history.replaceState({}, "", "/rota-inexistente");
    render(<App />);
    expect(await screen.findByText("404")).toBeInTheDocument();
  });
});
