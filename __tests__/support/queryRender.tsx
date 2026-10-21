import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render as renderLibrary, type RenderOptions } from "@testing-library/react";
import type { ReactNode } from "react";

export function render(ui: ReactNode, options?: RenderOptions) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 2 * 60 * 1000 } },
  });
  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return renderLibrary(ui, { ...options, wrapper: QueryWrapper });
}
