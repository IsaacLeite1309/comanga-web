import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserProfile from "@/pages/UserProfile";
import { api } from "@/services/api";

const logoutMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    logout: logoutMock,
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

describe("UserProfile logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe a opcao de sair e aciona a rotina de logout do contexto", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        user: {
          id: "user-id",
          username: "usuario_teste",
          email: "usuario@teste.com",
          conteudo_adulto: false,
        },
      },
    });

    render(<UserProfile />);

    expect(api.get).toHaveBeenCalledWith("/users/me");
    fireEvent.click(await screen.findByRole("button", { name: /sair da conta/i }));

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});
