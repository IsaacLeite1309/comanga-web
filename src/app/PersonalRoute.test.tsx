import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { PersonalRoute } from "./PersonalRoute";
import { useLibraryPage, type PersonalPagination } from "@/features/personal-library";
const auth = vi.hoisted(() => ({ user: { id: "a" } as { id: string } | null, isAuthenticated: true, loading: false, isSessionEnding: false }));
vi.mock("@/features/auth", () => ({ useAuth: () => auth }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
const loader = vi.fn<() => Promise<{ secret: string; pagination: PersonalPagination }>>();
function Content() {
  const { data, loading } = useLibraryPage(loader);
  return <div>{loading ? "Carregando conta" : data?.secret}</div>;
}
function App() { return <MemoryRouter><Routes><Route path="/" element={<PersonalRoute><Content /></PersonalRoute>} /><Route path="/entrar" element={<div>Login</div>} /></Routes></MemoryRouter>; }
beforeEach(() => { vi.clearAllMocks(); auth.user = { id: "a" }; auth.isAuthenticated = true; });
it("remove dados imediatamente na troca de conta e descarta resposta pendente anterior", async () => {
  let resolveOld!: (value: { secret: string; pagination: PersonalPagination }) => void;
  const pagination = { page: 1, limit: 12, total: 1, totalPages: 1 };
  loader.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; })).mockResolvedValueOnce({ secret: "Conta B", pagination });
  const view = render(<App />);
  auth.user = { id: "b" }; view.rerender(<App />);
  expect(screen.queryByText("Conta A")).not.toBeInTheDocument();
  expect(await screen.findByText("Conta B")).toBeInTheDocument();
  await act(async () => { resolveOld({ secret: "Conta A", pagination }); });
  expect(screen.queryByText("Conta A")).not.toBeInTheDocument();
  auth.user = null; auth.isAuthenticated = false; view.rerender(<App />);
  expect(screen.queryByText("Conta B")).not.toBeInTheDocument();
  expect(await screen.findByText("Login")).toBeInTheDocument();
});
it("descarta dados já carregados no mesmo render da troca de identidade", async () => {
  const pagination = { page: 1, limit: 12, total: 1, totalPages: 1 };
  loader.mockResolvedValueOnce({ secret: "Conta A", pagination }).mockImplementationOnce(() => new Promise(() => {}));
  const view = render(<App />); await screen.findByText("Conta A");
  auth.user = { id: "b" }; view.rerender(<App />);
  expect(screen.queryByText("Conta A")).not.toBeInTheDocument();
  expect(screen.getByText("Carregando conta")).toBeInTheDocument();
});
