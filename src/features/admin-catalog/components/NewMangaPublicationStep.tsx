import { MultiSelect as MultiSelectDropdown } from '@/components/forms/MultiSelect';
import { SelectField, ToggleField, YearSelectField } from '@/components/forms/FormFields';
import { NATIVE_DEMOGRAPHY_OPTIONS, NATIVE_ORIGINAL_STATUS_OPTIONS } from '../domain/workOptions';

import { errorMessage, type ControllerProps } from './newMangaSectionShared';

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
      <div className="min-w-0 md:col-start-2 md:row-start-3 md:self-start">
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
      <div className="min-w-0 md:col-start-3 md:row-start-2">
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
      <div className="min-w-0 space-y-3 md:col-start-1 md:row-start-3">
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
          controller.clearInvalidFields(["originalPublicationStatus", "originalPublicationEndYear"]);
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
      <PublisherAndMagazineFields controller={controller} />
      <ClassificationFields controller={controller} />
    </section>
  );
}
