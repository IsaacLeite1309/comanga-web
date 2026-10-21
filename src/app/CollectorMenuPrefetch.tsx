import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { getPublicCatalogOptions, listPublicCalendar, listPublicEditions, listPublicWorks, prefetchListedEditions, usePublicCatalogScope } from "@/features/public-catalog";
import { collectionQueryPrefix, listCollection, listWishlist, subscribePersonalLibraryUpdates, wishlistQueryPrefix } from "@/features/personal-library";
import { PERSONAL_LIBRARY_QUERY_ROOT, PUBLIC_CATALOG_QUERY_ROOT } from "@/lib/queryClient";

export function CollectorMenuPrefetch() {
  const queryClient = useQueryClient();
  const scope = usePublicCatalogScope();
  const { isAuthenticated, activeProfile, loading } = useAuth();
  const collector = !loading && activeProfile !== "Administrador";

  useEffect(() => {
    if (!collector) return;
    const timer = window.setTimeout(() => {
      const workQuery = { sortBy: "title" as const, order: "ASC" as const, page: 1, limit: 24 };
      const editionQuery = { sortBy: "title" as const, order: "ASC" as const, page: 1, limit: 24 };
      const calendarQuery = { order: "ASC" as const, page: 1, limit: 24 };
      void Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "options"],
          queryFn: getPublicCatalogOptions,
        }),
        queryClient.prefetchQuery({
          queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "works", workQuery],
          queryFn: () => listPublicWorks(workQuery),
        }),
        queryClient.fetchQuery({
          queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "editions", editionQuery],
          queryFn: () => listPublicEditions(editionQuery),
        }).then((response) => prefetchListedEditions(queryClient, scope, response.editions.map((edition) => ({
          workSlug: edition.work.slug,
          editionNumber: edition.chronologicalNumber,
        })))),
        queryClient.prefetchQuery({
          queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "calendar", calendarQuery, ""],
          queryFn: () => listPublicCalendar(calendarQuery),
        }),
        ...(isAuthenticated ? [
          queryClient.prefetchQuery({
            queryKey: [...collectionQueryPrefix(scope[0], "", "", ""), 1],
            queryFn: () => listCollection(1),
          }),
          queryClient.prefetchQuery({
            queryKey: [...wishlistQueryPrefix(scope[0], "", "", "ASC"), 1],
            queryFn: () => listWishlist(1, { order: "ASC" }),
          }),
        ] : []),
      ]);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [activeProfile, collector, isAuthenticated, queryClient, scope]);

  useEffect(() => {
    if (!collector || !isAuthenticated) return;
    return subscribePersonalLibraryUpdates(() => {
      void queryClient.invalidateQueries({ queryKey: PERSONAL_LIBRARY_QUERY_ROOT });
      void queryClient.prefetchQuery({
        queryKey: [...collectionQueryPrefix(scope[0], "", "", ""), 1],
        queryFn: () => listCollection(1),
      });
      void queryClient.prefetchQuery({
        queryKey: [...wishlistQueryPrefix(scope[0], "", "", "ASC"), 1],
        queryFn: () => listWishlist(1, { order: "ASC" }),
      });
    });
  }, [collector, isAuthenticated, queryClient, scope]);

  return null;
}
