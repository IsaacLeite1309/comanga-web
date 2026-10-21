import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { render } from "../../../support/queryRender";
import { AxiosError, AxiosHeaders } from "axios";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import PublicVolumeDetails from "@/features/public-catalog/pages/PublicVolumeDetails";
import type { AuthUser } from "@/features/auth";
import type { PublicPersonalVolumeState } from "@/features/public-catalog/publicCatalogTypes";

const mocks = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(), clearSession: vi.fn(), auth: { user: null as AuthUser | null, loading: false } }));
vi.mock("@/services/api", () => ({ api: { get: mocks.get, put: mocks.put, patch: mocks.patch, delete: mocks.delete } }));
vi.mock("@/features/auth", () => ({ useAuth: () => ({ ...mocks.auth, clearSession: mocks.clearSession }) }));
vi.mock("sonner", () => ({ toast: { warning: vi.fn(), error: vi.fn(), success: vi.fn() } }));

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
  return <MemoryRouter initialEntries={["/obra/monster/edicao/2/volume/1"]}><Routes><Route path="/obra/:slug/edicao/:editionNumber/volume/:volumeNumber" element={<PublicVolumeDetails />} /><Route path="/entrar" element={<LoginProbe />} /></Routes></MemoryRouter>;
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

  it("avisa visitantes sem navegar ou gravar", async () => {
    mocks.auth.user = null;
    mocks.get.mockResolvedValue({ data: { volume: volume() } });
    render(<Page />);
    fireEvent.click(await screen.findByRole("button", { name: "Adicionar à coleção" }));
    expect(toast.warning).toHaveBeenCalledWith("Faça login para poder adicionar este volume à sua coleção.");
    fireEvent.click(screen.getByRole("button", { name: "Adicionar à lista de desejos" }));
    expect(toast.warning).toHaveBeenCalledWith("Faça login para poder adicionar este volume à sua lista de desejos.");
    expect(screen.getByRole("heading", { name: "Monster volume 1" })).toBeInTheDocument();
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
    expect((await screen.findByRole("button", { name: "Adicionar à coleção" })).querySelector("svg")).toHaveClass("lucide-library-big");
    expect(screen.getByRole("button", { name: "Adicionar à lista de desejos" }).querySelector("svg")).toHaveClass("lucide-heart");
    fireEvent.click(await screen.findByRole("button", { name: "Adicionar à lista de desejos" }));
    expect(screen.getByRole("button", { name: "Adicionando à lista de desejos…" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Na lista de desejos" })).not.toBeInTheDocument();
    await act(async () => {
      persisted = { owned: false, read: null, wished: true };
      saving.resolve({ data: { ...persisted, volumeId: 30 } });
    });
    expect(await screen.findByRole("button", { name: "Na lista de desejos", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Na lista de desejos" })).toHaveClass("bg-primary", "text-primary-foreground");
    expect(screen.getByRole("button", { name: "Na lista de desejos" }).querySelector("svg")).toHaveClass("lucide-heart");
    expect(screen.getByRole("button", { name: "Na lista de desejos" }).querySelector("svg")).toHaveAttribute("fill", "currentColor");
    expect(toast.success).toHaveBeenCalledWith("Volume adicionado à lista de desejos.");
    fireEvent.click(screen.getByRole("button", { name: "Adicionar à coleção" }));
    expect(screen.getByRole("dialog", { name: "Confirmar alterações na coleção?" })).toHaveTextContent("ele será removido da lista");
    expect(mocks.put).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.put).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar à coleção" }));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(await screen.findByRole("button", { name: "Na coleção", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Na coleção" })).toHaveClass("bg-primary", "text-primary-foreground");
    expect(screen.getByRole("button", { name: "Na coleção" }).querySelector("svg")).toHaveClass("lucide-library-big");
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Volume adicionado à coleção."));
    expect(screen.getByRole("button", { name: "Adicionar à lista de desejos" })).toHaveAttribute("aria-disabled", "true");
    const readingButton = screen.getByRole("button", { name: "Marcar como lido" });
    expect(readingButton.querySelector("svg")).toHaveClass("lucide-book-open");
    expect(readingButton).not.toHaveClass("col-span-2");
    expect(readingButton.previousElementSibling).toBe(screen.getByRole("button", { name: "Adicionar à lista de desejos" }));
    mocks.patch.mockImplementation(async () => {
      persisted = { owned: true, read: true, wished: false };
      return { data: { ...persisted, volumeId: 30 } };
    });
    fireEvent.click(screen.getByRole("button", { name: "Marcar como lido" }));
    expect(await screen.findByRole("button", { name: "Lido", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lido" })).toHaveClass("bg-primary", "text-primary-foreground");
    expect(screen.getByRole("button", { name: "Lido" }).querySelector("svg")).toHaveClass("lucide-book-open");
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Volume marcado como lido."));
    expect(mocks.patch).toHaveBeenCalledWith("/users/me/collection/volumes/30", { read: true });
    mocks.delete.mockImplementation(async () => { persisted = { ...EMPTY }; });
    fireEvent.click(screen.getByRole("button", { name: "Na coleção" }));
    expect(screen.getByRole("dialog", { name: "Confirmar alterações na coleção?" })).toHaveTextContent("estado de leitura");
    fireEvent.click(screen.getByRole("button", { name: "Remover" }));
    expect(await screen.findByRole("button", { name: "Adicionar à coleção", pressed: false })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lido" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar à lista de desejos" })).toBeInTheDocument();
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Volume removido da coleção."));
  });

  it("atualiza estado após conflito sem marcar localmente uma gravação recusada", async () => {
    const config = { headers: new AxiosHeaders() };
    mocks.put.mockRejectedValue(new AxiosError("conflict", "ERR_BAD_RESPONSE", config, undefined, { data: { error: "O Volume já está na Estante." }, status: 409, statusText: "Conflict", headers: new AxiosHeaders(), config }));
    mocks.get.mockResolvedValueOnce({ data: { volume: volume(EMPTY) } }).mockResolvedValue({ data: { volume: volume({ owned: true, read: false, wished: false }) } });
    render(<Page />);
    fireEvent.click(await screen.findByRole("button", { name: "Adicionar à lista de desejos" }));
    expect(await screen.findByRole("button", { name: "Na coleção" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Na lista de desejos" })).not.toBeInTheDocument();
  });

  it("ao receber 401 limpa a sessão e avisa sem redirecionar", async () => {
    const config = { headers: new AxiosHeaders() };
    mocks.put.mockRejectedValue(new AxiosError("expired", "ERR_BAD_RESPONSE", config, undefined, { data: {}, status: 401, statusText: "Unauthorized", headers: new AxiosHeaders(), config }));
    mocks.get.mockImplementation(async (path: string) => {
      if (path === "/auth/me") throw new AxiosError("expired", "ERR_BAD_RESPONSE", config, undefined, { data: {}, status: 401, statusText: "Unauthorized", headers: new AxiosHeaders(), config });
      return { data: { volume: volume(EMPTY) } };
    });
    render(<Page />);
    fireEvent.click(await screen.findByRole("button", { name: "Adicionar à coleção" }));
    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith("Faça login para poder adicionar este volume à sua coleção."));
    expect(screen.getByRole("heading", { name: "Monster volume 1" })).toBeInTheDocument();
    expect(mocks.clearSession).toHaveBeenCalledTimes(1);
  });

  it("remove desejo após confirmação da API", async () => {
    mocks.get.mockResolvedValueOnce({ data: { volume: volume({ owned: false, read: null, wished: true }) } });
    mocks.delete.mockResolvedValue(undefined);
    render(<Page />);
    fireEvent.click(await screen.findByRole("button", { name: "Na lista de desejos" }));
    expect(await screen.findByRole("button", { name: "Adicionar à lista de desejos", pressed: false })).toBeInTheDocument();
    expect(mocks.delete).toHaveBeenCalledWith("/users/me/wishlist/volumes/30");
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Volume removido da lista de desejos."));
  });

  it("avisa ao desmarcar um volume lido", async () => {
    let persisted = { owned: true, read: true, wished: false } as PublicPersonalVolumeState;
    mocks.get.mockImplementation(async () => ({ data: { volume: volume(persisted) } }));
    mocks.patch.mockImplementation(async () => {
      persisted = { ...persisted, read: false };
      return { data: { ...persisted, volumeId: 30 } };
    });
    render(<Page />);
    fireEvent.click(await screen.findByRole("button", { name: "Lido" }));
    expect(await screen.findByRole("button", { name: "Marcar como lido", pressed: false })).toBeInTheDocument();
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Volume marcado como não lido."));
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
    expect(await screen.findByRole("button", { name: "Adicionar à coleção", pressed: false })).toBeInTheDocument();
  });

  it("descarta resposta em voo da conta anterior mesmo se ela chegar por último", async () => {
    const old = deferred<{ data: { volume: ReturnType<typeof volume> } }>();
    mocks.get.mockImplementationOnce(() => old.promise).mockResolvedValue({ data: { volume: volume({ owned: false, read: null, wished: true }) } });
    const view = render(<Page />);
    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(1));
    mocks.auth.user = { id: "account-b", username: "b" };
    view.rerender(<Page />);
    expect(await screen.findByRole("button", { name: "Na lista de desejos" })).toBeInTheDocument();
    await act(async () => { old.resolve({ data: { volume: volume({ owned: true, read: true, wished: false }) } }); });
    expect(screen.getByRole("button", { name: "Na lista de desejos" })).toBeInTheDocument();
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
    expect(await screen.findByRole("button", { name: "Adicionar à coleção" })).toBeInTheDocument();
  });
});
