import { useEffect } from "react";
import { toast } from "sonner";

export function useCatalogErrorToast(error: string, _retry: () => void, id: string) {
  useEffect(() => {
    if (!error) return;
    toast.error(`${error} Tente novamente em instantes.`, {
      id: `catalog-error-${id}`,
    });
  }, [error, id]);
}
