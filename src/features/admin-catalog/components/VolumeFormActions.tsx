import { Loader2, RotateCcw, Save } from "lucide-react";
import type { RememberedVolumeStep } from "../pages/volumeDraftMemory";

interface VolumeFormActionsProps {
  currentStep: RememberedVolumeStep;
  saving: boolean;
  onBack: () => void;
  onContinue: () => void;
  onReset: () => void;
  onSave: () => void;
}

export function VolumeFormActions({ currentStep, saving, onBack, onContinue, onReset, onSave }: VolumeFormActionsProps) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onReset}
        disabled={saving}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-input px-5 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-44"
      >
        <RotateCcw className="h-4 w-4" />
        Limpar formulário
      </button>
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row">
        {currentStep === "media" && (
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-input px-5 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-32"
          >
            Voltar
          </button>
        )}
        {currentStep === "details" ? (
          <button
            type="button"
            onClick={onContinue}
            disabled={saving}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto sm:min-w-40"
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto sm:min-w-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </button>
        )}
      </div>
    </div>
  );
}
