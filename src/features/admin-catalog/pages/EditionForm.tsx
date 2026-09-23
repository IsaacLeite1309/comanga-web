import { Loader2, Save } from "lucide-react";
import { EditionFormFields } from "../components/EditionFormFields";
import { useEditionFormController } from "../hooks/useEditionFormController";
import { UnsavedChangesPrompt } from "../hooks/useUnsavedChangesWarning";
import { AdminCatalogBreadcrumb } from "../components/AdminCatalogBreadcrumb";

const EditionForm = () => {
  const controller = useEditionFormController();

  if (controller.loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Carregando formulário da Edição...
      </div>
    );
  }

  if (controller.error || !controller.options || !controller.workId) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-sm font-semibold text-red-300">
        {controller.error || "Não foi possível carregar o formulário da Edição."}
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <UnsavedChangesPrompt when={controller.hasUnsavedChanges} continueLabel={controller.isEditMode ? "Continuar editando" : "Continuar cadastrando"} />
      <form onSubmit={controller.handleSubmit} className="mx-auto w-full max-w-6xl space-y-6">
        <div>
          <AdminCatalogBreadcrumb backTo={controller.workPath} backState={{ workId: Number(controller.workId) }} items={[{ label: "Gerenciar mangás", to: "/admin/gerenciar-mangas" }, { label: `Edições de ${controller.workTitle || "Obra"}`, to: controller.workPath, state: { workId: Number(controller.workId) } }, { label: controller.isEditMode ? `Editar ${controller.draft.chronologicalNumber}ª edição` : "Nova edição" }]} />
          <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
            {controller.isEditMode ? "Editar Edição" : "Nova Edição"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre os dados físicos da publicação vinculada à Obra selecionada.
          </p>
        </div>

        <EditionFormFields
          draft={controller.draft}
          options={controller.options}
          onChange={controller.updateDraft}
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={controller.saving}
            className="inline-flex h-12 min-w-44 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {controller.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditionForm;
