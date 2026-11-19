import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { GuestRoute } from "@/app/GuestRoute";

const authState = { isAuthenticated: true, loading: false, activeProfile: "Usuário Padrão", user: { username: "leitor" } };

vi.mock("@/features/auth", () => ({
  ADMIN_PROFILE: "Administrador",
  useAuth: () => authState,
}));

describe("GuestRoute", () => {
  it.each([
    ["Usuário Padrão", "Coleção"],
    ["Administrador", "Perfil"],
  ])("redireciona a sessão de %s para %s", async (profile, destination) => {
    authState.activeProfile = profile;
    render(<MemoryRouter initialEntries={[{ pathname: "/entrar", state: { from: { pathname: "/perfil/leitor" } } }]}><Routes>
      <Route path="/entrar" element={<GuestRoute><div>Login</div></GuestRoute>} />
      <Route path="/colecao" element={<div>Coleção</div>} />
      <Route path="/perfil/leitor" element={<div>Perfil</div>} />
    </Routes></MemoryRouter>);
    expect(await screen.findByText(destination)).toBeInTheDocument();
  });
});
