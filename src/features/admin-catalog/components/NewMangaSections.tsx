import { Loader2, RotateCcw, Save } from 'lucide-react';
import { AdminCatalogBreadcrumb } from './AdminCatalogBreadcrumb';

import type { ControllerProps } from './newMangaSectionShared';

export { IdentificationStep } from './NewMangaIdentificationStep';
export { MediaStep } from './NewMangaMediaStep';
export { AuthorsStep } from './NewMangaAuthorsStep';
export { PublicationStep } from './NewMangaPublicationStep';

export function NewMangaHeader({ isEditMode, returnPath, workId, title }: {
  isEditMode: boolean;
  returnPath: string;
  workId?: string;
  title: string;
}) {
  return (
    <div>
      {isEditMode ? (
        <AdminCatalogBreadcrumb backTo={returnPath} backState={{ workId: workId ? Number(workId) : undefined }} items={[{ label: "Gerenciar mangás", to: "/admin/gerenciar-mangas" }, { label: `Editar ${title || "Obra"}` }]} />
      ) : (
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Novo mangá</h1>
      )}
      <p className="mt-2 text-sm text-muted-foreground">
        {isEditMode
          ? "Atualize os dados da Obra matriz do catálogo."
          : "Cadastre a Obra matriz do catálogo. Edições e volumes serão vinculados a ela nas próximas etapas."}
      </p>
    </div>
  );
}

export function NewMangaSteps({ controller }: ControllerProps) {
  return (
    <div className="grid grid-cols-4 gap-2 md:gap-3 md:[&>button>span:last-child]:!whitespace-nowrap md:[&>button>span:last-child]:!text-sm">
      <button
        type="button"
        onClick={() => controller.setCurrentStep("identification")}
        className={`rounded-xl border px-3 py-3 text-left transition-colors ${
          controller.currentStep === "identification"
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground hover:border-primary"
        }`}
      >
        <span className="block text-center text-xs font-bold uppercase tracking-wide opacity-80 md:text-left">Etapa 1</span>
        <span className="hidden text-base font-bold md:block">Identificação</span>
      </button>
      <button
        type="button"
        onClick={controller.goToAuthorsStep}
        className={`rounded-xl border px-3 py-3 text-left transition-colors ${
          controller.currentStep === "authors"
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground hover:border-primary"
        }`}
      >
        <span className="block text-center text-xs font-bold uppercase tracking-wide opacity-80 md:text-left">Etapa 2</span>
        <span className="hidden text-base font-bold md:block">Autoria</span>
      </button>
      <button
        type="button"
        onClick={controller.openPublicationStep}
        className={`rounded-xl border px-3 py-3 text-left transition-colors ${
          controller.currentStep === "publication"
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground hover:border-primary"
        }`}
      >
        <span className="block text-center text-xs font-bold uppercase tracking-wide opacity-80 md:text-left">Etapa 3</span>
        <span className="hidden whitespace-nowrap text-base font-bold md:block">Publicação original e classificação</span>
      </button>
      <button
        type="button"
        onClick={controller.openMediaStep}
        className={`rounded-xl border px-3 py-3 text-left transition-colors ${
          controller.currentStep === "media"
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground hover:border-primary"
        }`}
      >
        <span className="block text-center text-xs font-bold uppercase tracking-wide opacity-80 md:text-left">Etapa 4</span>
        <span className="hidden text-base font-bold md:block">Capa e sinopse</span>
      </button>
    </div>
  );
}

export function NewMangaActions({ controller }: ControllerProps) {
  const goBack = () => controller.setCurrentStep(
    controller.currentStep === "media" ? "publication" : controller.currentStep === "publication" ? "authors" : "identification"
  );
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={controller.resetForm}
        disabled={controller.saving}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-input px-5 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-44"
      >
        <RotateCcw className="h-4 w-4" />
        Limpar formulário
      </button>
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row">
        {controller.currentStep !== "identification" && (
          <button
            type="button"
            onClick={goBack}
            disabled={controller.saving}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-input px-5 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-32"
          >
            Voltar
          </button>
        )}
        {controller.currentStep === "media" ? (
          <button
            key="save-work"
            type="submit"
            disabled={controller.saving || Boolean(controller.optionsError)}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto sm:min-w-44"
          >
            {controller.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </button>
        ) : (
          <button
            key="continue-work-form"
            type="button"
            onClick={controller.currentStep === "identification"
              ? controller.goToAuthorsStep
              : controller.currentStep === "authors"
                ? controller.goToPublicationStep
                : controller.goToMediaStep}
            disabled={controller.saving || Boolean(controller.optionsError)}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto sm:min-w-44"
          >
            Continuar
          </button>
        )}
      </div>
    </div>
  );
}
