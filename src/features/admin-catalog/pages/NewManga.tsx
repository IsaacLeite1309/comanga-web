import { Loader2 } from "lucide-react";
import { UnsavedChangesPrompt } from "../hooks/useUnsavedChangesWarning";
import {
  AuthorsStep,
  IdentificationStep,
  MediaStep,
  NewMangaActions,
  NewMangaHeader,
  NewMangaSteps,
  PublicationStep,
} from "./NewMangaSections";
import { useNewMangaForm } from "./useNewMangaForm";
import type { NewMangaMode } from "./newMangaTypes";

export type { AuthorField } from "./newMangaTypes";

type NewMangaProps = {
  mode?: NewMangaMode;
  workId?: string;
  returnPath?: string;
};

const NewManga = ({ mode = "create", workId, returnPath = "/admin/gerenciar-mangas" }: NewMangaProps) => {
  const controller = useNewMangaForm(mode, workId);
  const isEditMode = mode === "edit";

  if (controller.loadingOptions) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        {isEditMode ? "Carregando dados da Obra..." : "Carregando formulário..."}
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <UnsavedChangesPrompt
        when={controller.hasUnsavedChanges}
        continueLabel={isEditMode ? "Continuar editando" : "Continuar cadastrando"}
      />
      <form
        ref={controller.formRef}
        onSubmit={controller.handleSubmit}
        onKeyDownCapture={controller.handleFormKeyDown}
        className="mx-auto w-full max-w-6xl space-y-6"
      >
        <NewMangaHeader
          isEditMode={isEditMode}
          returnPath={returnPath}
          workId={workId}
          title={controller.draft.title}
        />
        <NewMangaSteps controller={controller} />
        {controller.currentStep === "identification" && <IdentificationStep controller={controller} />}
        {controller.currentStep === "authors" && <AuthorsStep controller={controller} />}
        {controller.currentStep === "publication" && <PublicationStep controller={controller} />}
        {controller.currentStep === "media" && <MediaStep controller={controller} />}
        <NewMangaActions controller={controller} />
      </form>
    </div>
  );
};

export default NewManga;
