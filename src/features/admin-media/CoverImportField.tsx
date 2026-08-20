import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { getApiError } from "@/lib/apiError";
import { adminMediaService } from "./adminMediaService";

export interface CoverSelection {
  assetId: string;
  coverUrl: string;
  pending: boolean;
}

interface CoverImportFieldProps {
  label: string;
  value: CoverSelection | null;
  onChange: (value: CoverSelection | null) => void;
  required?: boolean;
  invalid?: boolean;
}

export function CoverImportField({
  label,
  value,
  onChange,
  required = false,
  invalid = false,
}: CoverImportFieldProps) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<"replace" | "remove" | null>(null);

  function requestImportCover() {
    if (busyRef.current) return;
    if (!sourceUrl.trim()) {
      setError("Informe a URL HTTPS de origem da capa.");
      return;
    }
    if (value) {
      setConfirmation("replace");
      return;
    }
    void importCover();
  }

  async function importCover() {
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const imported = await adminMediaService.importCover(sourceUrl.trim());
      if (value?.pending) {
        await adminMediaService.deletePendingCover(value.assetId).catch(() => undefined);
      }
      onChange({
        assetId: imported.id,
        coverUrl: imported.coverUrl,
        pending: true,
      });
      setSourceUrl("");
    } catch (importError) {
      setError(getApiError(importError, importError instanceof Error ? importError.message : "Não foi possível importar a capa."));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function requestRemoveCover() {
    if (!value || busyRef.current) return;
    setConfirmation("remove");
  }

  async function removeCover() {
    if (!value || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      if (value.pending) await adminMediaService.deletePendingCover(value.assetId);
      onChange(null);
    } catch (removeError) {
      setError(getApiError(removeError, "Não foi possível remover a capa."));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function confirmAction() {
    const action = confirmation;
    setConfirmation(null);
    if (action === "replace") void importCover();
    if (action === "remove") void removeCover();
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}{required && <span className="text-red-400"> *</span>}
      </span>
      <div className="grid gap-3 sm:grid-cols-[96px_1fr] sm:items-start">
        <div className="flex aspect-[2/3] w-24 items-center justify-center overflow-hidden rounded-xl border border-border bg-input text-center text-xs font-bold uppercase text-muted-foreground">
          {value?.coverUrl ? (
            <img
              src={value.coverUrl}
              alt={`Prévia interna da ${label}`}
              className="h-full w-full object-cover"
            />
          ) : (
            "Sem capa"
          )}
        </div>
        <div className="space-y-2">
          <input
            type="url"
            inputMode="url"
            aria-label={`URL de origem da ${label}`}
            value={sourceUrl}
            disabled={busy}
            onChange={(event) => {
              setSourceUrl(event.target.value);
              setError("");
            }}
            placeholder="https://origem.exemplo/capa.jpg"
            className={`h-12 w-full rounded-xl border bg-input px-3 text-base text-foreground outline-none transition-colors focus:ring-2 ${
              invalid ? "border-red-500 focus:ring-red-500/30" : "border-border focus:border-primary focus:ring-primary/40"
            }`}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={requestImportCover}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {value ? "Substituir capa" : "Importar capa"}
            </button>
            {value && (
              <button
                type="button"
                disabled={busy}
                onClick={requestRemoveCover}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-500/60 px-3 text-sm font-bold text-red-300 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Remover capa
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            A URL é usada somente para importar. A imagem exibida será armazenada pelo CoMangá.
          </p>
          {(error || invalid) && (
            <p role="alert" className="text-sm font-semibold text-red-400">
              {error || "Importe uma capa válida antes de continuar."}
            </p>
          )}
        </div>
      </div>
      <ConfirmationDialog
        open={confirmation !== null}
        title={confirmation === "remove" ? "Remover capa?" : "Substituir capa?"}
        description={confirmation === "remove"
          ? "A capa deixará de fazer parte deste cadastro. Confirme para continuar."
          : "A capa atual será substituída pela nova imagem importada. Confirme para continuar."}
        confirmLabel={confirmation === "remove" ? "Confirmar remoção" : "Confirmar substituição"}
        destructive={confirmation === "remove"}
        onCancel={() => setConfirmation(null)}
        onConfirm={confirmAction}
      />
    </div>
  );
}
