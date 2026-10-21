import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PERSONAL_LIBRARY_QUERY_ROOT } from "@/lib/queryClient";

type FilterUpdate<T> = Partial<T> | ((current: T) => Partial<T>);

export function useCachedLibraryFilters<T extends object>(userId: string, menu: "collection" | "wishlist", defaults: T) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => [...PERSONAL_LIBRARY_QUERY_ROOT, userId, `${menu}-filters`] as const, [menu, userId]);
  const query = useQuery<T>({
    queryKey,
    queryFn: async () => defaults,
    initialData: () => queryClient.getQueryData<T>(queryKey) ?? defaults,
    enabled: false,
    staleTime: Infinity,
  });
  const update = useCallback((changes: FilterUpdate<T>) => {
    queryClient.setQueryData<T>(queryKey, current => {
      const value = current ?? defaults;
      const patch = typeof changes === "function" ? changes(value) : changes;
      return { ...value, ...patch };
    });
  }, [defaults, queryClient, queryKey]);
  return [query.data ?? defaults, update] as const;
}
