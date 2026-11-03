import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { ADMIN_QUERY_ROOT, queryClient } from "@/lib/queryClient";
import { api } from "./api";

export function adminCachedGet<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return queryClient.fetchQuery({
    queryKey: [...ADMIN_QUERY_ROOT, url, config?.params ?? null],
    queryFn: () => config ? api.get<T>(url, config) : api.get<T>(url),
    staleTime: Infinity,
    retry: false,
  });
}

export function readAdminCachedResponse<T>(url: string, config?: AxiosRequestConfig): AxiosResponse<T> | undefined {
  return queryClient.getQueryData<AxiosResponse<T>>([...ADMIN_QUERY_ROOT, url, config?.params ?? null]);
}
