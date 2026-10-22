import { useEffect } from "react";
import { toast } from "sonner";

export function CatalogRefreshNotice({ message }: { message: string; onRetry: () => void }) {
  useEffect(() => {
    if (!message) return;
    toast.error(`${message} Os dados exibidos podem estar desatualizados. Tente novamente em instantes.`, {
      id: "catalog-refresh-error",
    });
  }, [message]);
  return null;
}
