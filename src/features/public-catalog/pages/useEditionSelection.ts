import { useCallback, useEffect, useRef, useState } from "react";
import { getPublicEditionDetails } from "../publicCatalogService";
import { getCompleteCollectionEdition, syncCollectionEdition, syncWishlist, type CollectionEditionResponse } from "@/features/personal-library";
import { getApiError } from "@/lib/apiError";

export function useEditionSelection(slug: string, editionNumber: number, mode: string) {
  const [data, setData] = useState<CollectionEditionResponse | null>(null);
  const [initialIds, setInitialIds] = useState(new Set<number>());
  const [selectedIds, setSelectedIds] = useState(new Set<number>());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const version = useRef(0);
  const accept = useCallback((result: CollectionEditionResponse) => {
    const ids = new Set(result.volumes.filter((volume) => mode === "estante" ? volume.owned : volume.wished).map(({ id }) => id));
    setData(result); setInitialIds(ids); setSelectedIds(new Set(ids));
  }, [mode]);
  useEffect(() => {
    const current = ++version.current;
    const active = () => version.current === current;
    setLoading(true); setError(""); setData(null); setMessage("");
    async function load() {
      if (!slug || !Number.isInteger(editionNumber) || editionNumber <= 0 || !["estante", "desejos"].includes(mode)) throw new Error("invalid");
      const result = await getPublicEditionDetails(slug, editionNumber, { page: 1, limit: 1 });
      if (result.edition.work.slug !== slug || result.edition.chronologicalNumber !== editionNumber) throw new Error("invalid");
      if (!active()) return;
      const personal = await getCompleteCollectionEdition(result.edition.id);
      if (active()) accept(personal);
    }
    load().catch((failure) => { if (active()) setError(getApiError(failure, "Não foi possível carregar a seleção de Volumes.")); })
      .finally(() => { if (active()) setLoading(false); });
    return () => { version.current = current + 1; };
  }, [slug, editionNumber, mode, retry, accept]);
  async function save() {
    if (!data || saving) return false;
    const delta = {
      addVolumeIds: [...selectedIds].filter((id) => !initialIds.has(id)),
      removeVolumeIds: [...initialIds].filter((id) => !selectedIds.has(id)),
    };
    if (mode === "estante" && delta.addVolumeIds.length + delta.removeVolumeIds.length > 100) {
      setMessage("Altere até 100 Volumes por vez para salvar a coleção em uma única operação."); return false;
    }
    const current = version.current;
    const active = () => current === version.current;
    setSaving(true); setMessage("");
    let failure: unknown;
    try {
      if (mode === "estante") await syncCollectionEdition(data.edition.id, delta);
      else failure = (await syncWishlist(delta, active))[0];
    } catch (requestError) { failure = requestError; }
    if (!active()) return false;
    try {
      const result = await getCompleteCollectionEdition(data.edition.id);
      if (!active()) return false;
      accept(result);
      setMessage(failure ? getApiError(failure, "Algumas alterações não foram salvas. Confira a seleção atualizada e tente novamente.") : "Seleção salva com sucesso.");
    } catch (refreshError) {
      if (!active()) return false;
      setData(null); setError(getApiError(refreshError, "Não foi possível confirmar a seleção salva. Recarregue antes de continuar."));
      failure = refreshError;
    } finally { if (active()) setSaving(false); }
    return !failure && active();
  }
  const hasChanges = selectedIds.size !== initialIds.size || [...selectedIds].some((id) => !initialIds.has(id));
  return { data, selectedIds, setSelectedIds, loading, saving, error, message, hasChanges, save, reload: () => setRetry((value) => value + 1) };
}
