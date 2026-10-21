import axios from 'axios';
import { invalidatePublicCatalog } from '@/lib/queryClient';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

api.interceptors.response.use((response) => {
  const method = response.config.method?.toUpperCase();
  const isPersonalLibraryMutation = response.config.url?.includes("/users/me/");
  if (method && !["GET", "HEAD", "OPTIONS"].includes(method) && !isPersonalLibraryMutation) {
    invalidatePublicCatalog();
  }
  return response;
});
