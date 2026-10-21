import { InputField, SelectField } from '@/components/forms/FormFields';
import { NATIVE_COUNTRY_OPTIONS } from '../domain/workOptions';

import { errorMessage, type ControllerProps } from './newMangaSectionShared';

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

export { WorkSynopsisField };

export function IdentificationStep({ controller }: ControllerProps) {
  const { draft } = controller;
  return (
    <section className="grid gap-4 rounded-xl border border-border bg-card p-4">
      <div>
        <InputField label="Título" value={draft.title} onChange={(value) => { controller.updateDraft("title", value); controller.clearInvalidField("title"); }} required invalid={controller.isInvalidField("title")} errorMessage={errorMessage(controller, "title")} placeholder="Digite" />
      </div>
      <div>
        <InputField label="Título original" value={draft.originalTitle} onChange={(value) => { controller.updateDraft("originalTitle", value); controller.clearInvalidField("originalTitle"); }} required invalid={controller.isInvalidField("originalTitle")} errorMessage={errorMessage(controller, "originalTitle")} placeholder="Digite" />
      </div>
      <div>
        <InputField label="Título romanizado" value={draft.romanizedTitle} onChange={(value) => { controller.updateDraft("romanizedTitle", value); controller.clearInvalidField("romanizedTitle"); }} required invalid={controller.isInvalidField("romanizedTitle")} errorMessage={errorMessage(controller, "romanizedTitle")} placeholder="Digite" />
      </div>
      <div className="grid gap-4 md:w-1/2 md:grid-cols-2">
        <SelectField label="País de origem" value={draft.country} onChange={(value) => { controller.updateDraft("country", value); controller.clearInvalidFields(["country", "typeId"]); }} onOpen={() => controller.clearInvalidField("country")} options={NATIVE_COUNTRY_OPTIONS} required invalid={controller.isInvalidField("country")} errorMessage={errorMessage(controller, "country")} searchable />
        <SelectField label="Tipo de obra" value={draft.typeId} onChange={(value) => { controller.updateDraft("typeId", value); controller.clearInvalidField("typeId"); }} onOpen={() => controller.clearInvalidField("typeId")} options={controller.options.workTypes} required disabled={!draft.country} placeholder={draft.country ? "Selecione" : "Selecione o país primeiro"} invalid={controller.isInvalidField("typeId")} errorMessage={errorMessage(controller, "typeId")} searchable />
      </div>
    </section>
  );
}
