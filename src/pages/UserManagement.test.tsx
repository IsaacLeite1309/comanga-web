import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserManagement from "@/pages/UserManagement";
import { resetUserManagementMemoryForTests } from "@/pages/userManagementMemory";
import { api } from "@/services/api";
import { toast } from "sonner";

const currentUser = {
  id: "admin-1",
  username: "admin",
  role: "Administrador",
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: currentUser,
  }),
}));

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function mockUsersResponse(users = [
  {
    id: "admin-1",
    username: "admin",
    email: "admin@teste.local",
    role: "Administrador",
    status: "Ativada",
  },
  {
    id: "user-1",
    username: "maria",
    email: "maria@teste.local",
    role: "Usuário Padrão",
    status: "Ativada",
  },
], paginationOverrides = {}) {
  vi.mocked(api.get).mockResolvedValueOnce({
    data: {
      users,
      pagination: {
        page: 1,
        limit: 8,
        total: users.length,
        totalPages: 1,
        ...paginationOverrides,
      },
    },
  });
}

describe("UserManagement", () => {
  beforeEach(() => {
    resetUserManagementMemoryForTests();
    vi.clearAllMocks();
  });

  it("carrega usuarios e desabilita alteracao da propria conta", async () => {
    mockUsersResponse();

    render(<UserManagement />);

    expect(screen.getAllByText("Carregando usuários...")[0]).toBeInTheDocument();
    expect((await screen.findAllByText("admin"))[0]).toBeInTheDocument();
    expect(screen.getAllByText("maria")[0]).toBeInTheDocument();

    expect(screen.getAllByLabelText("Nível de acesso de admin")[0]).toBeDisabled();
    expect(screen.getAllByLabelText("Nível de acesso de maria")[0]).not.toBeDisabled();
  });

  it("envia filtros e alterna ordenacao por usuario", async () => {
    mockUsersResponse();
    mockUsersResponse();
    mockUsersResponse();

    render(<UserManagement />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/admin/users", expect.objectContaining({
        params: expect.objectContaining({ order: "ASC", page: 1, limit: 8 }),
      }));
    });

    fireEvent.change(screen.getByPlaceholderText("Buscar por usuário ou e-mail"), {
      target: { value: "maria" },
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/admin/users", expect.objectContaining({
        params: expect.objectContaining({ term: "maria" }),
      }));
    }, { timeout: 1000 });

    fireEvent.click(screen.getByRole("button", { name: /usuário/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/admin/users", expect.objectContaining({
        params: expect.objectContaining({ order: "DESC" }),
      }));
    });
  });

  it("exibe estado vazio quando nenhum usuario atende aos filtros", async () => {
    mockUsersResponse([]);

    render(<UserManagement />);

    expect((await screen.findAllByText("Nenhum usuário encontrado com os filtros aplicados."))[0]).toBeInTheDocument();
  });

  it("pagina usuarios com oito registros por pagina", async () => {
    mockUsersResponse(undefined, { total: 12, totalPages: 2 });
    mockUsersResponse([
      {
        id: "user-2",
        username: "joao",
        email: "joao@teste.local",
        role: "Usuário Padrão",
        status: "Ativada",
      },
    ], { page: 2, total: 12, totalPages: 2 });

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getAllByText((content) => content.includes("Exibindo 2 de 12"))[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: /pr.xima/i })[0]);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/admin/users", expect.objectContaining({
        params: expect.objectContaining({ page: 2, limit: 8 }),
      }));
    });
    expect((await screen.findAllByText("joao"))[0]).toBeInTheDocument();
  });

  it("exibe acesso negado quando API retorna 403", async () => {
    vi.mocked(api.get).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 403,
      },
    });

    render(<UserManagement />);

    expect((await screen.findAllByText("Acesso negado: você não possui permissão para gerenciar usuários."))[0]).toBeInTheDocument();
  });

  it("altera nivel de acesso de terceiro e atualiza a tabela", async () => {
    mockUsersResponse();
    vi.mocked(api.patch).mockResolvedValueOnce({
      data: {
        user: {
          id: "user-1",
          username: "maria",
          email: "maria@teste.local",
          role: "Administrador",
          status: "Ativada",
        },
      },
    });

    render(<UserManagement />);

    const mariaRoleSelect = (await screen.findAllByLabelText("Nível de acesso de maria"))[0];
    fireEvent.click(mariaRoleSelect);
    fireEvent.click(screen.getAllByRole("button", { name: "Administrador" })[0]);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/admin/users/user-1/role", {
        role: "Administrador",
      });
    });
    expect(toast.success).toHaveBeenCalledWith("Nível de acesso atualizado com sucesso.");
  });

  it("restaura valor anterior quando alteracao de nivel falha", async () => {
    mockUsersResponse();
    vi.mocked(api.patch).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: {
          error: "Você não pode alterar o nível de acesso de sua própria conta!",
        },
      },
    });

    render(<UserManagement />);

    const mariaRoleSelect = (await screen.findAllByLabelText("Nível de acesso de maria"))[0];
    fireEvent.click(mariaRoleSelect);
    fireEvent.click(screen.getAllByRole("button", { name: "Administrador" })[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Você não pode alterar o nível de acesso de sua própria conta!");
    });
    expect(screen.getAllByLabelText("Nível de acesso de maria")[0]).toHaveTextContent("Usuário Padrão");
  });
});
