import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function CatalogRefreshNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  const retryRef = useRef(onRetry);
  retryRef.current = onRetry;
  useEffect(() => {
    if (!message) return;
    toast.error(`${message} Os dados exibidos podem estar desatualizados.`, {
      id: "catalog-refresh-error",
      action: { label: "Tentar novamente", onClick: () => retryRef.current() },
    });
  }, [message]);
  return null;
}
