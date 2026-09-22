import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublicNav } from "./PublicNav";

let authState = {
  isAuthenticated: false,
  loading: false,
  activeProfile: "Usuário Padrão",
  user: null as null | { username: string },
};

vi.mock("@/features/auth", () => ({
  useAuth: () => authState,
}));

function renderPublicNav(path = "/pesquisa") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PublicNav />
    </MemoryRouter>
  );
}

describe("PublicNav", () => {
  beforeEach(() => {
    authState = {
      isAuthenticated: false,
      loading: false,
      activeProfile: "Usuário Padrão",
      user: null,
    };
  });

  it("renderiza links principais e destaca entrada para visitante", () => {
    const { container } = renderPublicNav("/entrar");

    expect(container).toHaveTextContent("CoMangá");
    expect(container.querySelector("a button")).not.toBeInTheDocument();
    expect(screen.getAllByText("Pesquisar").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Checklists").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lista de Desejos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Entrar").length).toBeGreaterThan(0);
  });

  it("renderiza menu administrativo para administrador autenticado", () => {
    authState = {
      isAuthenticated: true,
      loading: false,
      activeProfile: "Administrador",
      user: { username: "admin" },
    };

    renderPublicNav("/admin/users");

    expect(screen.queryByText("Coleção")).not.toBeInTheDocument();
    expect(screen.getAllByText("Novo mangá").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gerenciar Mangás").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gerenciar Opções").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gerenciar Usuários").length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /pesquisar/i })).not.toBeInTheDocument();
  });

  it("renderiza link de perfil quando o usuario esta autenticado", () => {
    authState = {
      isAuthenticated: true,
      loading: false,
      activeProfile: "Usuário Padrão",
      user: { username: "isaac" },
    };

    renderPublicNav("/perfil/isaac");

    expect(screen.getAllByText("Meu Perfil").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /meu perfil/i })[0]).toHaveAttribute(
      "href",
      "/perfil/isaac"
    );
  });

  it("usa rota de perfil vazia quando sessao autenticada ainda nao tem username", () => {
    authState = {
      isAuthenticated: true,
      loading: false,
      activeProfile: "Usuário Padrão",
      user: null,
    };

    renderPublicNav("/perfil");

    expect(screen.getAllByRole("link", { name: /meu perfil/i })[0]).toHaveAttribute(
      "href",
      "/perfil/"
    );
  });

  it("nao renderiza menu de usuario padrao enquanto a sessao esta carregando", () => {
    authState = {
      isAuthenticated: false,
      loading: true,
      activeProfile: "Usuário Padrão",
      user: null,
    };

    renderPublicNav("/admin/users");

    expect(screen.queryByText("Coleção")).not.toBeInTheDocument();
    expect(screen.queryByText("Gerenciar Usuários")).not.toBeInTheDocument();
    expect(screen.queryByText("Entrar")).not.toBeInTheDocument();
  });
});
