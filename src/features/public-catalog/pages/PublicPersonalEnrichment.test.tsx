import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PublicVolumeDetails from "./PublicVolumeDetails";
import type { AuthUser } from "@/features/auth";
import type { PublicPersonalVolumeState } from "../publicCatalogTypes";

const mocks = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(), clearSession: vi.fn(), auth: { user: null as AuthUser | null, loading: false } }));
vi.mock("@/services/api", () => ({ api: { get: mocks.get, put: mocks.put, patch: mocks.patch, delete: mocks.delete } }));
vi.mock("@/features/auth", () => ({ useAuth: () => ({ ...mocks.auth, clearSession: mocks.clearSession }) }));

function volume(personal?: PublicPersonalVolumeState) {
  return {
    id: 30, number: 1, singleVolume: false, priceCurrency: "R$", releaseDatePrecision: "Completa", releaseYear: 2026,
    previousVolume: null, nextVolume: null, personal,
    edition: { id: 20, chronologicalNumber: 2, brazilianPublisher: { id: 4, label: "Panini" }, work: { id: 8, slug: "monster", title: "Monster" } },
  };
}
function LoginProbe() {
  const location = useLocation();
  return <p>Entrar: {location.state?.from?.pathname}</p>;
}
function Page() {
  return <MemoryRouter initialEntries={["/obras/monster/edicao/2/volume/1"]}><Routes><Route path="/obras/:slug/edicao/:editionNumber/volume/:volumeNumber" element={<PublicVolumeDetails />} /><Route path="/entrar" element={<LoginProbe />} /></Routes></MemoryRouter>;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
const EMPTY = { owned: false, read: null, wished: false };

describe("estado pessoal nos detalhes públicos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.user = { id: "account-a", username: "a" };
    mocks.auth.loading = false;
    mocks.get.mockReset().mockResolvedValue({ data: { volume: volume(EMPTY) } });
    mocks.put.mockReset(); mocks.patch.mockReset(); mocks.delete.mockReset();
  });

  it("direciona visitante ao login preservando o contexto e sem gravar", async () => {
    mocks.auth.user = null;
    mocks.get.mockResolvedValue({ data: { volume: volume() } });
    render(<Page />);
    fireEvent.click(await screen.findByRole("button", { name: "Coleção" }));
    expect(screen.getByText("Entrar: /obras/monster/edicao/2/volume/1")).toBeInTheDocument();
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("mostra somente estado confirmado e sincroniza desejo, posse, leitura e remoção", async () => {
    let persisted = { ...EMPTY } as PublicPersonalVolumeState;
    mocks.get.mockImplementation(async () => ({ data: { volume: volume(persisted) } }));
    const saving = deferred<{ data: object }>();
    mocks.put.mockImplementationOnce(() => saving.promise).mockImplementationOnce(async () => {
      persisted = { owned: true, read: false, wished: false };
      return { data: { ...persisted, volumeId: 30 } };
    });
    render(<Page />);
    fireEvent.click(await screen.findByRole("button", { name: "Lista de Desejos" }));
    expect(screen.getByRole("button", { name: "Lista de Desejos" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Na Lista de Desejos" })).not.toBeInTheDocument();
    await act(async () => {
      persisted = { owned: false, read: null, wished: true };
      saving.resolve({ data: { ...persisted, volumeId: 30 } });
    });
    expect(await screen.findByRole("button", { name: "Na Lista de Desejos", pressed: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Coleção" }));
    expect(await screen.findByRole("button", { name: "Na coleção", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lista de Desejos" })).toBeDisabled();
    mocks.patch.mockImplementation(async () => {
      persisted = { owned: true, read: true, wished: false };
      return { data: { ...persisted, volumeId: 30 } };
    });
    fireEvent.click(screen.getByRole("button", { name: "Marcar como lido" }));
    expect(await screen.findByRole("button", { name: "Lido", pressed: true })).toBeInTheDocument();
    expect(mocks.patch).toHaveBeenCalledWith("/users/me/collection/volumes/30", { read: true });
    mocks.delete.mockImplementation(async () => { persisted = { ...EMPTY }; });
    fireEvent.click(screen.getByRole("button", { name: "Na coleção" }));
    expect(await screen.findByRole("button", { name: "Coleção", pressed: false })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lido" })).not.toBeInTheDocument();
  });

  it("atualiza estado após conflito sem marcar localmente uma gravação recusada", async () => {
    const config = { headers: new AxiosHeaders() };
    mocks.put.mockRejectedValue(new AxiosError("conflict", "ERR_BAD_RESPONSE", config, undefined, { data: { error: "O Volume já está na Estante." }, status: 409, statusText: "Conflict", headers: new AxiosHeaders(), config }));
    mocks.get.mockResolvedValueOnce({ data: { volume: volume(EMPTY) } }).mockResolvedValue({ data: { volume: volume({ owned: true, read: false, wished: false }) } });
    render(<Page />);
    fireEvent.click(await screen.findByRole("button", { name: "Lista de Desejos" }));
    expect(await screen.findByRole("button", { name: "Na coleção" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Na Lista de Desejos" })).not.toBeInTheDocument();
  });

  it("ao receber 401 limpa sessão e retorna ao login com contexto", async () => {
    const config = { headers: new AxiosHeaders() };
    mocks.put.mockRejectedValue(new AxiosError("expired", "ERR_BAD_RESPONSE", config, undefined, { data: {}, status: 401, statusText: "Unauthorized", headers: new AxiosHeaders(), config }));
    render(<Page />);
    fireEvent.click(await screen.findByRole("button", { name: "Coleção" }));
    expect(await screen.findByText("Entrar: /obras/monster/edicao/2/volume/1")).toBeInTheDocument();
    expect(mocks.clearSession).toHaveBeenCalledTimes(1);
  });

  it("remove desejo após confirmação da API", async () => {
    mocks.get.mockResolvedValueOnce({ data: { volume: volume({ owned: false, read: null, wished: true }) } });
    mocks.delete.mockResolvedValue(undefined);
    render(<Page />);
    fireEvent.click(await screen.findByRole("button", { name: "Na Lista de Desejos" }));
    expect(await screen.findByRole("button", { name: "Lista de Desejos", pressed: false })).toBeInTheDocument();
    expect(mocks.delete).toHaveBeenCalledWith("/users/me/wishlist/volumes/30");
  });

  it("oculta o resultado anterior imediatamente ao mudar de conta", async () => {
    mocks.get.mockResolvedValueOnce({ data: { volume: volume({ owned: true, read: true, wished: false }) } });
    const other = deferred<{ data: { volume: ReturnType<typeof volume> } }>();
    mocks.get.mockImplementationOnce(() => other.promise);
    const view = render(<Page />);
    expect(await screen.findByRole("button", { name: "Lido" })).toBeInTheDocument();
    mocks.auth.user = { id: "account-b", username: "b" };
    view.rerender(<Page />);
    expect(screen.queryByRole("button", { name: "Lido" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Na coleção" })).not.toBeInTheDocument();
    await act(async () => { other.resolve({ data: { volume: volume(EMPTY) } }); });
    expect(await screen.findByRole("button", { name: "Coleção", pressed: false })).toBeInTheDocument();
  });

  it("descarta resposta em voo da conta anterior mesmo se ela chegar por último", async () => {
    const old = deferred<{ data: { volume: ReturnType<typeof volume> } }>();
    mocks.get.mockImplementationOnce(() => old.promise).mockResolvedValue({ data: { volume: volume({ owned: false, read: null, wished: true }) } });
    const view = render(<Page />);
    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(1));
    mocks.auth.user = { id: "account-b", username: "b" };
    view.rerender(<Page />);
    expect(await screen.findByRole("button", { name: "Na Lista de Desejos" })).toBeInTheDocument();
    await act(async () => { old.resolve({ data: { volume: volume({ owned: true, read: true, wished: false }) } }); });
    expect(screen.getByRole("button", { name: "Na Lista de Desejos" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lido" })).not.toBeInTheDocument();
  });

  it("remove os dados pessoais ao encerrar sessão e espera validação inicial", async () => {
    mocks.auth.loading = true;
    const view = render(<Page />);
    expect(mocks.get).not.toHaveBeenCalled();
    mocks.auth.loading = false;
    mocks.get.mockResolvedValueOnce({ data: { volume: volume({ owned: true, read: true, wished: false }) } });
    view.rerender(<Page />);
    expect(await screen.findByRole("button", { name: "Lido" })).toBeInTheDocument();
    mocks.auth.user = null;
    mocks.get.mockResolvedValue({ data: { volume: volume() } });
    view.rerender(<Page />);
    expect(screen.queryByRole("button", { name: "Lido" })).not.toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Coleção" })).toBeInTheDocument();
  });
});
