import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "./useAuth";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

function AuthConsumer() {
  const { profiles, activeProfile, hasAdminProfile, updateUser } = useAuth();

  return (
    <div>
      <span data-testid="profiles">{profiles.join("|") || "nenhum"}</span>
      <span data-testid="active">{activeProfile}</span>
      <span data-testid="admin">{hasAdminProfile ? "sim" : "não"}</span>
      <button onClick={() => updateUser({ active_profile: "Usuário Padrão" })}>Trocar contexto</button>
    </div>
  );
}

function renderAuthProvider() {
  return render(
    <MemoryRouter initialEntries={["/perfil"]}>
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("AuthContext — perfis de acesso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("expõe perfis e perfil ativo da sessão validada", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        user: {
          id: "1",
          username: "admin",
          profiles: ["Administrador", "Usuário Padrão"],
          active_profile: "Administrador",
        },
      },
    });

    renderAuthProvider();

    await waitFor(() => expect(screen.getByTestId("active")).toHaveTextContent("Administrador"));
    expect(screen.getByTestId("profiles")).toHaveTextContent("Administrador|Usuário Padrão");
    expect(screen.getByTestId("admin")).toHaveTextContent("sim");
  });

  it("rebaixa para o perfil padrão quando o perfil ativo não pertence à conta", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        user: {
          id: "1",
          username: "leitor",
          profiles: ["Usuário Padrão"],
          active_profile: "Administrador",
        },
      },
    });

    renderAuthProvider();

    await waitFor(() => expect(screen.getByTestId("active")).toHaveTextContent("Usuário Padrão"));
    expect(screen.getByTestId("admin")).toHaveTextContent("não");
  });

  it("mantém visitante sem perfis quando a sessão é inválida", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("sem sessão"));

    renderAuthProvider();

    await waitFor(() => expect(screen.getByTestId("profiles")).toHaveTextContent("nenhum"));
    expect(screen.getByTestId("active")).toHaveTextContent("Usuário Padrão");
  });

  it("atualiza o contexto após a troca de perfil ativo sem recarregar", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        user: {
          id: "1",
          username: "admin",
          profiles: ["Administrador", "Usuário Padrão"],
          active_profile: "Administrador",
        },
      },
    });

    renderAuthProvider();
    await waitFor(() => expect(screen.getByTestId("active")).toHaveTextContent("Administrador"));

    fireEvent.click(screen.getByRole("button", { name: "Trocar contexto" }));

    await waitFor(() => expect(screen.getByTestId("active")).toHaveTextContent("Usuário Padrão"));
    expect(screen.getByTestId("admin")).toHaveTextContent("sim");
  });

  it("ignora atualização de contexto quando não há sessão", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("sem sessão"));

    renderAuthProvider();
    await waitFor(() => expect(screen.getByTestId("profiles")).toHaveTextContent("nenhum"));

    fireEvent.click(screen.getByRole("button", { name: "Trocar contexto" }));

    expect(screen.getByTestId("active")).toHaveTextContent("Usuário Padrão");
    expect(screen.getByTestId("admin")).toHaveTextContent("não");
  });
});
