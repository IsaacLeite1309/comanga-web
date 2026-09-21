import { ArrowLeft, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { MultiSelect as MultiSelectDropdown } from "@/components/forms/MultiSelect";
import { InputField, SelectField, ToggleField, YearSelectField } from "@/components/forms/FormFields";
import { CoverImportField } from "@/features/admin-media";
import type { NavigateFunction } from "react-router-dom";
import {
  isAuthorRoleDisabled,
  NATIVE_AUTHOR_ROLE_OPTIONS,
  NATIVE_COUNTRY_OPTIONS,
  NATIVE_DEMOGRAPHY_OPTIONS,
  NATIVE_ORIGINAL_STATUS_OPTIONS,
} from "../domain/workOptions";
import type { NewMangaController } from "./useNewMangaForm";

type ControllerProps = { controller: NewMangaController };

function errorMessage(controller: NewMangaController, field: string) {
  if (!controller.isInvalidField(field)) return "";
  if (
    field === "originalVolumeCount"
    && controller.draft.originalVolumeCount
    && Number(controller.draft.originalVolumeCount) <= 0
  ) {
    return "Informe um número maior que zero.";
  }
  return "Preencha o campo obrigatório.";
}

export function NewMangaHeader({ isEditMode, returnPath, workId, navigate }: {
  isEditMode: boolean;
  returnPath: string;
  workId?: string;
  navigate: NavigateFunction;
}) {
  return (
    <div>
      {isEditMode ? (
        <button
          type="button"
          onClick={() => navigate(returnPath, { state: { workId: workId ? Number(workId) : undefined } })}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-input px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
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
    <div className="grid grid-cols-3 gap-2 md:gap-3">
      <button
        type="button"
        onClick={() => controller.setCurrentStep("identification")}
        className={`rounded-xl border px-4 py-3 text-left transition-colors ${
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
        className={`rounded-xl border px-4 py-3 text-left transition-colors ${
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
        className={`rounded-xl border px-4 py-3 text-left transition-colors ${
          controller.currentStep === "publication"
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground hover:border-primary"
        }`}
      >
        <span className="block text-center text-xs font-bold uppercase tracking-wide opacity-80 md:text-left">Etapa 3</span>
        <span className="hidden text-base font-bold md:block">Publicação original e classificação</span>
      </button>
    </div>
  );
}

function WorkSynopsisField({ controller }: ControllerProps) {
  const invalid = controller.isInvalidField("synopsis");
  return (
    <div className="md:col-span-2">
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Sinopse da Obra<span className="text-red-400"> *</span>
      </label>
      <textarea
        aria-label="Sinopse da Obra"
        value={controller.draft.synopsis}
        onChange={(event) => {
          controller.updateDraft("synopsis", event.target.value);
          controller.clearInvalidField("synopsis");
        }}
        placeholder="Digite"
        rows={6}
        className={`w-full resize-y rounded-xl border bg-input px-4 py-3 text-base font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground ${
          invalid ? "border-red-500 focus:border-red-500" : "border-border focus:border-primary"
        }`}
      />
      {invalid ? <p className="mt-2 text-sm font-semibold text-red-400">Preencha o campo obrigatório.</p> : null}
    </div>
  );
}

export function IdentificationStep({ controller }: ControllerProps) {
  const { draft } = controller;
  return (
    <section className="grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
      <InputField
        label="Título"
        value={draft.title}
        onChange={(value) => { controller.updateDraft("title", value); controller.clearInvalidField("title"); }}
        required
        invalid={controller.isInvalidField("title")}
        errorMessage={errorMessage(controller, "title")}
        placeholder="Digite"
      />
      <InputField
        label="Título original"
        value={draft.originalTitle}
        onChange={(value) => { controller.updateDraft("originalTitle", value); controller.clearInvalidField("originalTitle"); }}
        required
        invalid={controller.isInvalidField("originalTitle")}
        errorMessage={errorMessage(controller, "originalTitle")}
        placeholder="Digite"
      />
      <InputField
        label="Título romanizado"
        value={draft.romanizedTitle}
        onChange={(value) => { controller.updateDraft("romanizedTitle", value); controller.clearInvalidField("romanizedTitle"); }}
        required
        invalid={controller.isInvalidField("romanizedTitle")}
        errorMessage={errorMessage(controller, "romanizedTitle")}
        placeholder="Digite"
      />
      <SelectField
        label="País de origem"
        value={draft.country}
        onChange={(value) => { controller.updateDraft("country", value); controller.clearInvalidFields(["country", "typeId"]); }}
        onOpen={() => controller.clearInvalidField("country")}
        options={NATIVE_COUNTRY_OPTIONS}
        required
        invalid={controller.isInvalidField("country")}
        errorMessage={errorMessage(controller, "country")}
        searchable
      />
      <SelectField
        label="Tipo de obra"
        value={draft.typeId}
        onChange={(value) => { controller.updateDraft("typeId", value); controller.clearInvalidField("typeId"); }}
        onOpen={() => controller.clearInvalidField("typeId")}
        options={controller.options.workTypes}
        required
        disabled={!draft.country}
        placeholder={draft.country ? "Selecione" : "Selecione o país primeiro"}
        invalid={controller.isInvalidField("typeId")}
        errorMessage={errorMessage(controller, "typeId")}
        searchable
      />
      <WorkSynopsisField controller={controller} />
      <div className="md:col-span-2">
        <CoverImportField
          label="Capa da Obra"
          required
          invalid={controller.isInvalidField("coverAssetId")}
          value={draft.coverAssetId
            ? { assetId: draft.coverAssetId, coverUrl: draft.coverUrl, pending: draft.coverPending }
            : null}
          onChange={(cover) => {
            controller.updateDraft("coverAssetId", cover?.assetId || "");
            controller.updateDraft("coverUrl", cover?.coverUrl || "");
            controller.updateDraft("coverPending", cover?.pending || false);
            controller.clearInvalidField("coverAssetId");
          }}
        />
      </div>
    </section>
  );
}

export function AuthorsStep({ controller }: ControllerProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Autor(es)</h2>
          <p className="text-sm text-muted-foreground">
            Adicione cada autor com seu respectivo papel. Os créditos são ordenados automaticamente pelo papel e, em caso de empate, pelo nome.
          </p>
        </div>
        <button
          type="button"
          onClick={() => controller.updateDraft("authors", [
            ...controller.draft.authors,
            { authorId: "", roles: [] },
          ])}
          aria-label="Adicionar autor"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Autor
        </button>
      </div>
      <div className="space-y-3 md:relative md:space-y-0">
        {controller.draft.authors.map((author, index) => (
          <div key={index} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <SelectField
              label="Autor"
              value={author.authorId}
              onChange={(value) => {
                controller.updateAuthor(index, "authorId", value);
                controller.clearInvalidField(`authors.${index}.authorId`);
              }}
              onOpen={() => controller.clearInvalidField(`authors.${index}.authorId`)}
              options={controller.options.authors}
              required
              invalid={controller.isInvalidField(`authors.${index}.authorId`)}
              errorMessage={errorMessage(controller, `authors.${index}.authorId`)}
              searchable
            />
            <MultiSelectDropdown
              label="Papel"
              options={NATIVE_AUTHOR_ROLE_OPTIONS}
              selectedIds={author.roles}
              isOptionDisabled={(role) => isAuthorRoleDisabled(author.roles, String(role))}
              onToggle={(role) => {
                controller.toggleAuthorRole(index, String(role));
                controller.clearInvalidField(`authors.${index}.roles`);
              }}
              onOpen={() => controller.clearInvalidField(`authors.${index}.roles`)}
              required
              invalid={controller.isInvalidField(`authors.${index}.roles`)}
              errorMessage={errorMessage(controller, `authors.${index}.roles`)}
              searchable
              maxVisibleItems={7}
            />
            <div className="flex items-center self-start pt-7">
              <button
                type="button"
                onClick={() => controller.removeAuthor(index)}
                disabled={controller.draft.authors.length === 1}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-3 text-sm font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 md:w-12"
                aria-label="Remover autor"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PublisherAndMagazineFields({ controller }: ControllerProps) {
  const { draft } = controller;
  return (
    <>
      <MultiSelectDropdown
        label="Editora original"
        options={controller.options.originalPublishers}
        selectedIds={draft.originalPublisherIds}
        onToggle={(id) => {
          controller.toggleNumberValue("originalPublisherIds", Number(id));
          controller.clearInvalidField("originalPublisherIds");
        }}
        onOpen={() => controller.clearInvalidField("originalPublisherIds")}
        disabled={!draft.country}
        disabledMessage="Incompatível"
        required
        invalid={controller.isInvalidField("originalPublisherIds")}
        errorMessage={errorMessage(controller, "originalPublisherIds")}
        searchable
        reorderable
        onMove={(from, to) => controller.moveNumberValues("originalPublisherIds", from, to)}
      />
      <MultiSelectDropdown
        label="Pré-publicação"
        options={controller.options.magazines}
        selectedIds={draft.magazineIds}
        onToggle={(id) => {
          controller.toggleNumberValue("magazineIds", Number(id));
          controller.clearInvalidField("magazineIds");
        }}
        onOpen={() => controller.clearInvalidField("magazineIds")}
        disabled={controller.effectiveDirectRelease}
        emptyMessage={draft.country
          ? `Nenhuma pré-publicação relacionada a ${draft.country}.`
          : "Selecione o país de origem para carregar opções de pré-publicação."}
        disabledMessage="Incompatível"
        required={!controller.effectiveDirectRelease}
        invalid={controller.isInvalidField("magazineIds")}
        errorMessage={errorMessage(controller, "magazineIds")}
        searchable
        reorderable
        onMove={(from, to) => controller.moveNumberValues("magazineIds", from, to)}
      />
    </>
  );
}

function ClassificationFields({ controller }: ControllerProps) {
  const { draft } = controller;
  return (
    <>
      <div className="min-w-0 md:col-start-3 md:row-start-3 md:self-start">
        <ToggleField
          label="Lançamento direto (sem pré-publicação)"
          checked={controller.effectiveDirectRelease}
          disabled={controller.directReleaseBlockedByWorkType}
          onChange={(checked) => {
            controller.updateDraft("directRelease", checked);
            if (checked) {
              controller.updateDraft("demographies", []);
              controller.updateDraft("magazineIds", []);
              controller.clearInvalidFields(["demographies", "magazineIds"]);
            }
          }}
        />
      </div>
      <div className="min-w-0 md:col-start-1 md:row-start-3">
        <MultiSelectDropdown
          label="Demografias"
          options={NATIVE_DEMOGRAPHY_OPTIONS}
          selectedIds={draft.demographies}
          onToggle={(id) => {
            controller.toggleStringValue("demographies", String(id));
            controller.clearInvalidField("demographies");
          }}
          onOpen={() => controller.clearInvalidField("demographies")}
          disabled={controller.demographyDisabled}
          disabledMessage="Incompatível"
          required={!controller.demographyDisabled}
          invalid={controller.isInvalidField("demographies")}
          errorMessage={errorMessage(controller, "demographies")}
          searchable
        />
      </div>
      <div className="min-w-0 space-y-3 md:col-start-2 md:row-start-3">
        <MultiSelectDropdown
          label="Gêneros"
          options={controller.options.genres}
          selectedIds={draft.genreIds}
          onToggle={(id) => {
            controller.toggleNumberValue("genreIds", Number(id));
            controller.clearInvalidField("genreIds");
          }}
          onOpen={() => controller.clearInvalidField("genreIds")}
          required
          invalid={controller.isInvalidField("genreIds")}
          errorMessage={errorMessage(controller, "genreIds")}
          searchable
        />
        <ToggleField
          label="Sinalizar como Conteúdo +18 (Restrito)"
          checked={draft.adultContent}
          onChange={(checked) => controller.updateDraft("adultContent", checked)}
          disabled={controller.hasHentaiGenre}
          className="md:mt-4"
        />
      </div>
    </>
  );
}

export function PublicationStep({ controller }: ControllerProps) {
  const { draft } = controller;
  return (
    <section className="grid min-w-0 gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-3">
      <SelectField
        label="Status de publicação original"
        value={draft.originalPublicationStatus}
        onChange={(value) => {
          controller.updateDraft("originalPublicationStatus", value);
          controller.clearInvalidFields(["originalPublicationStatus", "originalPublicationEndYear", "originalVolumeCount"]);
        }}
        onOpen={() => controller.clearInvalidField("originalPublicationStatus")}
        options={NATIVE_ORIGINAL_STATUS_OPTIONS}
        required
        invalid={controller.isInvalidField("originalPublicationStatus")}
        errorMessage={errorMessage(controller, "originalPublicationStatus")}
        searchable
      />
      <YearSelectField
        label="Início da publicação original"
        value={draft.originalPublicationStartYear}
        onChange={(value) => { controller.updateDraft("originalPublicationStartYear", value); controller.clearInvalidField("originalPublicationStartYear"); }}
        onOpen={() => controller.clearInvalidField("originalPublicationStartYear")}
        required
        invalid={controller.isInvalidField("originalPublicationStartYear")}
        errorMessage={errorMessage(controller, "originalPublicationStartYear")}
        searchable
      />
      <YearSelectField
        label="Fim da publicação original"
        value={draft.originalPublicationEndYear}
        onChange={(value) => { controller.updateDraft("originalPublicationEndYear", value); controller.clearInvalidField("originalPublicationEndYear"); }}
        onOpen={() => controller.clearInvalidField("originalPublicationEndYear")}
        required={!controller.isOpenOriginalPublication}
        disabled={controller.isOpenOriginalPublication}
        invalid={controller.isInvalidField("originalPublicationEndYear")}
        errorMessage={errorMessage(controller, "originalPublicationEndYear")}
        searchable
      />
      <InputField
        label="Número de volumes originais"
        value={draft.originalVolumeCount}
        onChange={(value) => { controller.updateDraft("originalVolumeCount", value); controller.clearInvalidField("originalVolumeCount"); }}
        type="number"
        required={!controller.isOpenOriginalPublication}
        disabled={controller.isOpenOriginalPublication}
        invalid={controller.isInvalidField("originalVolumeCount")}
        errorMessage={errorMessage(controller, "originalVolumeCount")}
        placeholder="Digite"
      />
      <PublisherAndMagazineFields controller={controller} />
      <ClassificationFields controller={controller} />
    </section>
  );
}

export function NewMangaActions({ controller }: ControllerProps) {
  const goBack = () => controller.setCurrentStep(
    controller.currentStep === "publication" ? "authors" : "identification"
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
        {controller.currentStep === "publication" ? (
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
              : controller.goToPublicationStep}
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
