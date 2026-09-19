import { isAxiosError } from "axios";

export function getApiError(error: unknown, fallback: string) {
  if (isAxiosError(error) && typeof error.response?.data?.error === "string") {
    return error.response.data.error;
  }

  return fallback;
}
