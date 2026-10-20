import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { Check, Eye, EyeClosed, Heart, LibraryBig } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { addCollectionVolume, addWishlistVolume, removeCollectionVolume, removeWishlistVolume, updateVolumeReading, WishlistToCollectionDialog } from "@/features/personal-library";
import { getApiError } from "@/lib/apiError";
import type { PublicVolumeDetails } from "./publicCatalogTypes";

const BUTTON = "inline-flex min-h-[3.25rem] min-w-0 items-center justify-center gap-2 rounded-full border px-4 py-3 text-base font-bold transition-colors disabled:opacity-60";
const BUTTON_ICON = "h-5 w-5 shrink-0";
const INACTIVE = "border-sidebar-foreground/30 bg-sidebar text-white hover:bg-sidebar-accent";
const ACTIVE = "border-primary bg-primary text-primary-foreground hover:bg-primary/90";
const readingIcon = (read: boolean | null) => read ? Eye : EyeClosed;

export function PersonalVolumeActions({ volume, onRefresh }: { volume: PublicVolumeDetails; onRefresh: () => void }) {
  const { user, clearSession } = useAuth();
  const [busy, setBusy] = useState(false);
  const [confirmingCollection, setConfirmingCollection] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const state = volume.personal ?? { owned: false, read: null, wished: false };
  const CollectionIcon = state.owned ? Check : LibraryBig;

  async function perform(action: () => Promise<unknown>, guestMessage: string, successMessage: string) {
    if (!user) {
      toast.warning(guestMessage);
      return;
    }
    setBusy(true);
    try {
      await action();
      toast.success(successMessage);
      if (mounted.current) onRefresh();
    } catch (error) {
      if (!mounted.current) return;
      if (isAxiosError(error) && error.response?.status === 401) {
        clearSession();
        toast.warning(guestMessage);
      } else {
        toast.error(getApiError(error, "Não foi possível atualizar seu acervo."));
        onRefresh();
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  function handleCollectionClick() {
    if (user && state.wished && !state.owned) {
      setConfirmingCollection(true);
      return;
    }
    void perform(() => state.owned ? removeCollectionVolume(volume.id) : addCollectionVolume(volume.id), "Faça login para poder adicionar este volume à sua coleção.", state.owned ? "Volume removido da coleção." : "Volume adicionado à coleção.");
  }

  const ReadingIcon = readingIcon(state.read);
  return (
    <>
      <button type="button" disabled={busy} aria-pressed={state.owned} className={`${BUTTON} ${state.owned ? ACTIVE : INACTIVE}`} onClick={handleCollectionClick}>
        <CollectionIcon className={BUTTON_ICON} aria-hidden="true" />
        <span className="min-w-0 whitespace-normal break-words">{state.owned ? "Na coleção" : "Adicionar à coleção"}</span>
      </button>
      {state.owned ? (
        <button type="button" disabled={busy} aria-pressed={state.read ?? false} className={`${BUTTON} ${state.read ? ACTIVE : INACTIVE}`} onClick={() => void perform(() => updateVolumeReading(volume.id, !state.read), "Faça login para atualizar sua coleção.", state.read ? "Volume marcado como não lido." : "Volume marcado como lido.")}>
          <ReadingIcon className={BUTTON_ICON} aria-hidden="true" />
          <span className="min-w-0 whitespace-normal break-words">{state.read ? "Lido" : "Marcar como lido"}</span>
        </button>
      ) : (
        <button type="button" disabled={busy} aria-pressed={state.wished} className={`${BUTTON} ${state.wished ? ACTIVE : INACTIVE}`} onClick={() => void perform(() => state.wished ? removeWishlistVolume(volume.id) : addWishlistVolume(volume.id), "Faça login para poder adicionar este volume à sua lista de desejos.", state.wished ? "Volume removido da lista de desejos." : "Volume adicionado à lista de desejos.")}>
          <Heart className={BUTTON_ICON} fill={state.wished ? "currentColor" : "none"} aria-hidden="true" />
          <span className="min-w-0 whitespace-normal break-words">{state.wished ? "Na lista de desejos" : "Adicionar à lista de desejos"}</span>
        </button>
      )}
      {confirmingCollection && <WishlistToCollectionDialog count={1} onCancel={() => setConfirmingCollection(false)} onConfirm={() => {
        setConfirmingCollection(false);
        void perform(() => addCollectionVolume(volume.id), "Faça login para poder adicionar este volume à sua coleção.", "Volume adicionado à coleção.");
      }} />}
    </>
  );
}
