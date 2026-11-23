import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";
import { clearAdminDraftStorage } from "@/lib/adminDraftStorage";
import { queryClient } from "@/lib/queryClient";

beforeEach(() => {
  // O jsdom não implementa rolagem; a simulação continua permitindo verificar as chamadas.
  Object.defineProperty(window, "scrollTo", { configurable: true, writable: true, value: vi.fn() });
  queryClient.clear();
  clearAdminDraftStorage();
});

// Os testes de tela verificam o estado pendente real; a pausa visual de dois
// segundos é desativada para não exigir relógios em cada interação de filtro.
vi.mock("@/hooks/useMinimumQueryLoading", () => ({
  useMinimumQueryLoading: (_queryKey: string, pending: boolean) => pending,
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
