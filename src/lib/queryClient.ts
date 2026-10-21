import { QueryClient } from "@tanstack/react-query";

export const PUBLIC_CATALOG_QUERY_ROOT = ["public-catalog"] as const;
export const PERSONAL_LIBRARY_QUERY_ROOT = ["personal-library"] as const;
export const PUBLIC_CATALOG_STALE_TIME_MS = 2 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: PUBLIC_CATALOG_STALE_TIME_MS,
      gcTime: 30 * 60 * 1000,
      retry: 1,
    },
  },
});

export function invalidatePublicCatalog() {
  void queryClient.invalidateQueries({ queryKey: PUBLIC_CATALOG_QUERY_ROOT });
}
