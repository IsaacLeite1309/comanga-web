import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { BookOpen, Heart, LibraryBig, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { api } from "@/services/api";
import { addCollectionVolume, addWishlistVolume, removeCollectionVolume, removeWishlistVolume, updateVolumeReading, CollectionChangeDialog } from "@/features/personal-library";
import type { PersonalVolumeState } from "@/features/personal-library";
import { getApiError } from "@/lib/apiError";
import { usePublicCatalogScope } from "@/features/public-catalog/usePublicCatalogScope";
import { publicVolumeLabel } from "./publicCatalogFormatters";
import { updatePersonalVolumeCache } from "./updatePersonalVolumeCache";
import type { PublicVolumeDetails } from "./publicCatalogTypes";

const BUTTON = "inline-flex min-h-[3.25rem] min-w-0 items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold disabled:opacity-60";
const BUTTON_ICON = "h-5 w-5 shrink-0";
const INACTIVE = "border-sidebar-foreground/30 bg-sidebar text-white hover:bg-sidebar-accent";
const ACTIVE = "border-primary bg-primary text-primary-foreground hover:bg-primary/90";
const PENDING = "border-secondary bg-secondary text-secondary-foreground";

type VolumeState = Pick<PersonalVolumeState, "owned" | "read" | "wished">;
type ActionButtonProps = { state: VolumeState; busy: boolean; busyAction: string; onClick: () => void };

function CollectionButton({ state, busy, busyAction, onClick }: ActionButtonProps) {
  const pending = busy && busyAction.includes("coleção");
  return (
    <button type="button" disabled={busy} aria-pressed={state.owned} className={`${BUTTON} ${pending ? PENDING : state.owned ? ACTIVE : INACTIVE}`} onClick={onClick}>
      {pending ? <LoaderCircle className={`${BUTTON_ICON} animate-spin`} aria-hidden="true" /> : <LibraryBig className={BUTTON_ICON} fill={state.owned ? "currentColor" : "none"} aria-hidden="true" />}
      <span className="min-w-0 whitespace-normal break-words">{pending ? busyAction : state.owned ? "Na coleção" : "Adicionar à coleção"}</span>
    </button>
  );
}

function ReadingButton({ state, busy, busyAction, onClick }: ActionButtonProps) {
  const pending = busy && busyAction.includes("leitura");
  return (
    <button type="button" disabled={busy} aria-disabled={!state.owned} aria-pressed={state.read ?? false} className={`${BUTTON} ${!state.owned ? "cursor-not-allowed opacity-60" : ""} ${pending ? PENDING : state.read ? ACTIVE : INACTIVE}`} onClick={onClick}>
      {pending ? <LoaderCircle className={`${BUTTON_ICON} animate-spin`} aria-hidden="true" /> : <BookOpen className={BUTTON_ICON} fill={state.read ? "currentColor" : "none"} aria-hidden="true" />}
      <span className="min-w-0 whitespace-normal break-words">{pending ? busyAction : state.read ? "Lido" : "Marcar como lido"}</span>
    </button>
  );
}

function WishlistButton({ state, busy, busyAction, onClick }: ActionButtonProps) {
  const pending = busy && busyAction.includes("desejos");
  return (
    <button type="button" disabled={busy} aria-disabled={state.owned} aria-pressed={state.wished} className={`${BUTTON} ${state.owned ? "cursor-not-allowed opacity-60" : ""} ${pending ? PENDING : state.wished ? ACTIVE : INACTIVE}`} onClick={onClick}>
      {pending ? <LoaderCircle className={`${BUTTON_ICON} animate-spin`} aria-hidden="true" /> : <Heart className={BUTTON_ICON} fill={state.wished ? "currentColor" : "none"} aria-hidden="true" />}
      <span className="min-w-0 whitespace-normal break-words">{pending ? busyAction : state.wished ? "Na lista de desejos" : "Adicionar à lista de desejos"}</span>
    </button>
  );
}

function confirmedPersonalState(result: unknown, fallback: PersonalVolumeState): PersonalVolumeState {
  if (!result || typeof result !== "object") return fallback;
  const state = result as Partial<PersonalVolumeState>;
  if (typeof state.owned !== "boolean" || typeof state.wished !== "boolean") return fallback;
  if (typeof state.read !== "boolean" && state.read !== null) return fallback;
  return state as PersonalVolumeState;
}

async function handleActionError(error: unknown, guestMessage: string, clearSession: () => void, onRefresh: () => void) {
  if (!isAxiosError(error) || error.response?.status !== 401) {
    toast.error(getApiError(error, "Não foi possível atualizar seu acervo."));
    onRefresh();
    return;
  }
  try {
    await api.get("/auth/me");
    toast.error("A sessão continua ativa, mas a ação foi recusada. Tente novamente.");
    onRefresh();
  } catch (sessionError) {
    if (isAxiosError(sessionError) && sessionError.response?.status === 401) {
      clearSession();
      toast.warning(guestMessage);
    } else {
      toast.error("Não foi possível confirmar a sessão. Tente novamente.");
    }
  }
}

export function PersonalVolumeActions({ volume, onRefresh }: { volume: PublicVolumeDetails; onRefresh: () => void }) {
  const { user, clearSession } = useAuth();
  const queryClient = useQueryClient();
  const scope = usePublicCatalogScope();
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [confirmingCollection, setConfirmingCollection] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const state = volume.personal ?? { owned: false, read: null, wished: false };

  async function perform(action: () => Promise<unknown>, guestMessage: string, successMessage: string, pendingMessage: string, nextState: PersonalVolumeState) {
    if (!user) {
      toast.warning(guestMessage);
      return;
    }
    setBusy(true);
    setBusyAction(pendingMessage);
    try {
      const result = await action();
      if (mounted.current) {
        const confirmedState = confirmedPersonalState(result, nextState);
        updatePersonalVolumeCache(queryClient, scope, {
          workSlug: volume.edition.work.slug,
          editionId: volume.edition.id,
          editionNumber: volume.edition.chronologicalNumber,
          volumeId: volume.id,
          volumeNumber: volume.number,
          previous: state,
          next: { owned: confirmedState.owned, read: confirmedState.read, wished: confirmedState.wished },
        });
      }
      toast.success(successMessage);
    } catch (error) {
      if (!mounted.current) return;
      await handleActionError(error, guestMessage, clearSession, onRefresh);
    } finally {
      if (mounted.current) {
        setBusy(false);
        setBusyAction("");
      }
    }
  }

  function handleCollectionClick() {
    if (user && ((state.wished && !state.owned) || (state.owned && state.read))) {
      setConfirmingCollection(true);
      return;
    }
    submitCollectionChange();
  }

  function submitCollectionChange() {
    const nextState: PersonalVolumeState = state.owned
      ? { volumeId: volume.id, owned: false, read: null, wished: state.wished }
      : { volumeId: volume.id, owned: true, read: false, wished: false };
    void perform(
      () => state.owned ? removeCollectionVolume(volume.id) : addCollectionVolume(volume.id),
      "Faça login para poder adicionar este volume à sua coleção.",
      state.owned ? "Volume removido da coleção." : "Volume adicionado à coleção.",
      state.owned ? "Removendo da coleção…" : "Adicionando à coleção…",
      nextState,
    );
  }

  function handleReadingClick() {
    if (!state.owned) {
      toast.warning("Adicione o volume à coleção para poder marcá-lo como lido.");
      return;
    }
    void perform(
      () => updateVolumeReading(volume.id, !state.read),
      "Faça login para atualizar sua coleção.",
      state.read ? "Volume marcado como não lido." : "Volume marcado como lido.",
      "Atualizando leitura…",
      { volumeId: volume.id, owned: true, read: !state.read, wished: state.wished },
    );
  }

  function handleWishlistClick() {
    if (state.owned) {
      toast.warning("Remova o volume da coleção para adicioná-lo à lista de desejos.");
      return;
    }
    void perform(
      () => state.wished ? removeWishlistVolume(volume.id) : addWishlistVolume(volume.id),
      "Faça login para poder adicionar este volume à sua lista de desejos.",
      state.wished ? "Volume removido da lista de desejos." : "Volume adicionado à lista de desejos.",
      state.wished ? "Removendo da lista de desejos…" : "Adicionando à lista de desejos…",
      { volumeId: volume.id, owned: false, read: null, wished: !state.wished },
    );
  }

  return (
    <>
      <CollectionButton state={state} busy={busy} busyAction={busyAction} onClick={handleCollectionClick} />
      <WishlistButton state={state} busy={busy} busyAction={busyAction} onClick={handleWishlistClick} />
      <ReadingButton state={state} busy={busy} busyAction={busyAction} onClick={handleReadingClick} />
      {confirmingCollection && <CollectionChangeDialog
        wishlistVolumes={state.wished && !state.owned ? [publicVolumeLabel(volume)] : []}
        readVolumes={state.owned && state.read ? [publicVolumeLabel(volume)] : []}
        confirmLabel={state.owned ? "Remover" : "Adicionar"}
        onCancel={() => setConfirmingCollection(false)}
        onConfirm={() => {
          setConfirmingCollection(false);
          submitCollectionChange();
        }} />}
    </>
  );
}
