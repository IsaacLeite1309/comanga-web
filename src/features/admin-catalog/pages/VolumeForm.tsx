import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { VolumeFormActions } from "../components/VolumeFormActions";
import { VolumeStepContent, VolumeStepNavigation } from "../components/VolumeFormSteps";
import { UnsavedChangesPrompt } from "../hooks/useUnsavedChangesWarning";
import { useVolumeFormController } from "../hooks/useVolumeFormController";

const VolumeForm = () => {
  const controller = useVolumeFormController();

  if (controller.loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Carregando formulário.
      </div>
    );
  }

  if (controller.error) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-sm font-semibold text-red-300">
        {controller.error}
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <UnsavedChangesPrompt
        when={controller.hasUnsavedChanges}
        continueLabel={controller.isEditing ? "Continuar editando" : "Continuar cadastrando"}
      />
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <Link
          to={controller.editionPath}
          state={{
            workId: controller.state?.workId,
            editionId: controller.state?.editionId || Number(controller.editionId),
          }}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-input px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {controller.isEditing ? "Editar Volume" : "Novo Volume"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Cadastre os dados físicos, comerciais e editoriais do tomo.
          </p>
        </div>

        <div className="space-y-6">
          <VolumeStepNavigation
            currentStep={controller.currentStep}
            onChange={controller.changeStep}
          />
          <VolumeStepContent
            currentStep={controller.currentStep}
            form={controller.form}
            invalidFields={controller.invalidFields}
            setForm={controller.setForm}
            updateCover={controller.updateCover}
            updateField={controller.updateField}
            updateReleaseDate={controller.updateReleaseDate}
            updateReleasePrecision={controller.updateReleasePrecision}
          />
          <VolumeFormActions
            currentStep={controller.currentStep}
            saving={controller.saving}
            onBack={() => controller.setCurrentStep("details")}
            onContinue={controller.goToMediaStep}
            onReset={controller.resetForm}
            onSave={controller.handleSave}
          />
        </div>
      </div>
    </div>
  );
};

export default VolumeForm;
