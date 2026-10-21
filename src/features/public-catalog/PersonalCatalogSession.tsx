import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { subscribePersonalLibraryUpdates } from "@/features/personal-library";
import { LoadingState } from "@/components/shared/AsyncState";
import { PUBLIC_CATALOG_QUERY_ROOT } from "@/lib/queryClient";

export function PersonalCatalogSession({ children }: { children: ReactNode }) {
  const { loading } = useAuth();
  const queryClient = useQueryClient();
  useEffect(() => subscribePersonalLibraryUpdates(() => {
    void queryClient.invalidateQueries({ queryKey: PUBLIC_CATALOG_QUERY_ROOT });
  }), [queryClient]);
  if (loading) return <LoadingState message="Carregando catálogo..." fullPage />;
  return children;
}
