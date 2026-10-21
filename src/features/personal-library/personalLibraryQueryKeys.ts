import { PERSONAL_LIBRARY_QUERY_ROOT } from "@/lib/queryClient";

export function collectionQueryPrefix(userId: string, term: string, status: string, publisherId: string, order: "ASC" | "DESC" = "ASC") {
  return [...PERSONAL_LIBRARY_QUERY_ROOT, userId, "collection", term, status, publisherId, order] as const;
}

export function wishlistQueryPrefix(userId: string, term: string, publisherId: string, order: "ASC" | "DESC") {
  return [...PERSONAL_LIBRARY_QUERY_ROOT, userId, "wishlist", term, publisherId, order] as const;
}
