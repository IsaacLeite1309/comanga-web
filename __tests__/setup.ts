import "@testing-library/jest-dom";
import { vi } from "vitest";

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
