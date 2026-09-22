import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "./useAuth";
import { ProtectedRoute } from "@/app/ProtectedRoute";
import { api } from "@/services/api";
import { toast } from "sonner";

const router = vi.hoisted(() => ({ pathname: "/perfil", navigate: vi.fn() }));
vi.mock("react-router-dom", async (importOriginal) => ({
  ...await importOriginal<typeof import("react-router-dom")>(),
  useNavigate: () => router.navigate,
  useLocation: () => ({ pathname: router.pathname }),
  // Simula uma navegação solicitada cujo destino ainda não foi renderizado.
  Navigate: () => <div>Redirecionando</div>,
}));
vi.mock("@/services/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function SessionState() {
  const { isSessionEnding } = useAuth();
  return <span>{isSessionEnding ? "Encerrando" : "Ociosa"}</span>;
}

function LogoutButton() {
  const { logout } = useAuth();
  return <button onClick={logout}>Sair</button>;
}

beforeEach(() => {
  vi.clearAllMocks();
  router.pathname = "/perfil";
  vi.mocked(api.get).mockResolvedValue({ data: { user: { id: "user", username: "pessoa" } } });
  vi.mocked(api.post).mockResolvedValue({ data: {} });
});

it("suprime o aviso de sessão inválida até o destino do logout ser renderizado", async () => {
  const view = render(<AuthProvider>
    <ProtectedRoute><LogoutButton /></ProtectedRoute><SessionState />
  </AuthProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "Sair" }));
  await waitFor(() => expect(router.navigate).toHaveBeenCalledWith("/entrar"));
  await act(async () => { await new Promise(resolve => window.setTimeout(resolve, 20)); });
  expect(toast.error).not.toHaveBeenCalled();
  expect(screen.getByText("Encerrando")).toBeInTheDocument();
  expect(toast.success).toHaveBeenCalledTimes(1);

  router.pathname = "/entrar";
  view.rerender(<AuthProvider><SessionState /></AuthProvider>);
  expect(await screen.findByText("Ociosa")).toBeInTheDocument();
});
