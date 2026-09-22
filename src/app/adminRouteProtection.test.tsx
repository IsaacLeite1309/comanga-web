import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
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
vi.mock("@/features/admin-users", () => ({ AdminUsersPage: () => "Área administrativa: usuários" }));
vi.mock("@/features/admin-catalog", () => ({
  AdminOptionsPage: () => "Área administrativa: opções",
  EditionDetailsPage: () => "Área administrativa: edição",
  EditionFormPage: () => "Área administrativa: formulário de edição",
  EditMangasPage: () => "Área administrativa: obras",
  EditWorkFormPage: () => "Área administrativa: formulário de obra",
  EditWorkPage: () => "Área administrativa: obra",
  NewMangaPage: () => "Área administrativa: nova obra",
  PostCreateActionsPage: () => "Área administrativa: pós-cadastro",
  VolumeDetailsPage: () => "Área administrativa: volume",
  VolumeFormPage: () => "Área administrativa: formulário de volume",
}));
vi.mock("@/features/public-catalog", () => ({
  PublicCatalogPage: () => "Catálogo público",
  PublicAuthorWorksPage: () => "Obras do autor",
  PublicEditionDetailsPage: () => "Edição pública",
  EditionVolumeSelectionPage: () => "Seleção de Volumes",
  PublicVolumeDetailsPage: () => "Volume público",
  PublicWorkDetailsPage: () => "Obra pública",
}));

const EXEMPLOS_DE_PARAMETRO: Record<string, string> = {
  workSlug: "obra-exemplo",
  editionId: "10",
  volumeId: "20",
};

// A lista sai do próprio roteador: uma rota administrativa nova entra no teste sem edição manual.
const rotasAdministrativas = [
  ...readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8").matchAll(/path="(\/admin\/[^"]*)"/g),
].map(([, template]) => [
  template,
  template.replace(/:([A-Za-z]+)/g, (_todo, nome: string) => {
    if (!(nome in EXEMPLOS_DE_PARAMETRO)) throw new Error(`Parâmetro de rota sem exemplo: ${nome}`);
    return EXEMPLOS_DE_PARAMETRO[nome];
  }),
]);

type UsuarioDeTeste = { id: string; username: string; role: string } | null;

// O contrato de `/api/auth/me` devolve os perfis da conta e o perfil ativo da sessão.
function comPerfis(user: UsuarioDeTeste) {
  if (!user) return null;
  const profiles = user.role === "Administrador" ? ["Administrador", "Usuário Padrão"] : ["Usuário Padrão"];
  return { id: user.id, username: user.username, role: user.role, profiles, active_profile: user.role };
}

function abrir(path: string, user: UsuarioDeTeste) {
  vi.mocked(api.get).mockResolvedValue({ data: { user: comPerfis(user) } });
  window.history.replaceState({}, "", path);
  render(<App />);
}

describe("proteção de todas as rotas administrativas do roteador", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enumera todas as rotas declaradas sob /admin", () => {
    expect(rotasAdministrativas.length).toBeGreaterThanOrEqual(13);
  });

  it.each(rotasAdministrativas)("envia o visitante de %s para a tela de acesso", async (_template, path) => {
    abrir(path, null);

    expect(await screen.findByText("Entrar na conta")).toBeInTheDocument();
    expect(screen.queryByText(/Área administrativa/)).not.toBeInTheDocument();
  });

  it.each(rotasAdministrativas)("desvia o usuário padrão de %s para o próprio perfil", async (_template, path) => {
    abrir(path, { id: "1", username: "leitor", role: "Usuário Padrão" });

    expect(await screen.findByText("Meu perfil")).toBeInTheDocument();
    expect(screen.queryByText(/Área administrativa/)).not.toBeInTheDocument();
  });

  it.each(rotasAdministrativas)("entrega %s ao administrador autenticado", async (_template, path) => {
    abrir(path, { id: "2", username: "admin", role: "Administrador" });

    expect(await screen.findByText(/^Área administrativa/)).toBeInTheDocument();
    expect(screen.queryByText("Entrar na conta")).not.toBeInTheDocument();
  });
});
