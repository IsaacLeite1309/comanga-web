import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { Check, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { addCollectionVolume, addWishlistVolume, removeCollectionVolume, removeWishlistVolume, updateVolumeReading } from "@/features/personal-library";
import { getApiError } from "@/lib/apiError";
import type { PublicVolumeDetails } from "./publicCatalogTypes";

const BUTTON = "inline-flex min-h-[3.25rem] min-w-0 items-center justify-center gap-2 rounded-full border border-sidebar-foreground/30 bg-sidebar px-4 py-3 text-base font-bold text-white transition-colors hover:bg-sidebar-accent disabled:opacity-60";

export function PersonalVolumeActions({ volume, onRefresh }: { volume: PublicVolumeDetails; onRefresh: () => void }) {
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const state = volume.personal ?? { owned: false, read: null, wished: false };

  async function perform(action: () => Promise<unknown>) {
    if (!user) {
      navigate("/entrar", { state: { from: location } });
      return;
    }
    setBusy(true);
    try {
      await action();
      if (mounted.current) onRefresh();
    } catch (error) {
      if (!mounted.current) return;
      if (isAxiosError(error) && error.response?.status === 401) {
        clearSession();
        navigate("/entrar", { state: { from: location } });
      } else {
        toast.error(getApiError(error, "Não foi possível atualizar seu acervo."));
        onRefresh();
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  const CollectionIcon = state.owned ? Check : Plus;
  const WishlistIcon = state.wished ? Check : Plus;
  return (
    <>
      <button type="button" disabled={busy} aria-pressed={state.owned} className={BUTTON} onClick={() => void perform(() => state.owned ? removeCollectionVolume(volume.id) : addCollectionVolume(volume.id))}>
        <CollectionIcon className="h-5 w-5 shrink-0" strokeWidth={3} aria-hidden="true" />
        <span className="min-w-0 whitespace-normal break-words">{state.owned ? "Na coleção" : "Coleção"}</span>
      </button>
      <button type="button" disabled={busy || state.owned} aria-pressed={state.wished} title={state.owned ? "Este Volume já está na sua coleção." : undefined} className={BUTTON} onClick={() => void perform(() => state.wished ? removeWishlistVolume(volume.id) : addWishlistVolume(volume.id))}>
        <WishlistIcon className="h-5 w-5 shrink-0" strokeWidth={3} aria-hidden="true" />
        <span className="min-w-0 whitespace-normal break-words">{state.wished ? "Na Lista de Desejos" : "Lista de Desejos"}</span>
      </button>
      {state.owned ? (
        <button type="button" disabled={busy} aria-pressed={state.read ?? false} className={`${BUTTON} col-span-2`} onClick={() => void perform(() => updateVolumeReading(volume.id, !state.read))}>
          {state.read ? "Lido" : "Marcar como lido"}
        </button>
      ) : null}
    </>
  );
}
