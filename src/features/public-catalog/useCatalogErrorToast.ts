import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function useCatalogErrorToast(error: string, retry: () => void, id: string) {
  const retryRef = useRef(retry);
  retryRef.current = retry;
  useEffect(() => {
    if (!error) return;
    toast.error(error, {
      id: `catalog-error-${id}`,
      action: { label: "Tentar novamente", onClick: () => retryRef.current() },
    });
  }, [error, id]);
}
