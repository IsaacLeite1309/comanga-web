import { Plus, Trash2 } from 'lucide-react';
import { MultiSelect as MultiSelectDropdown } from '@/components/forms/MultiSelect';
import { SelectField } from '@/components/forms/FormFields';
import { isAuthorRoleDisabled, NATIVE_AUTHOR_ROLE_OPTIONS } from '../domain/workOptions';

import { errorMessage, type ControllerProps } from './newMangaSectionShared';

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
          <div key={author.authorId || `novo-autor-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
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
                const reordered = controller.toggleAuthorRole(index, String(role));
                controller.clearInvalidField(`authors.${index}.roles`);
                return reordered;
              }}
              onOpen={() => controller.clearInvalidField(`authors.${index}.roles`)}
              required
              invalid={controller.isInvalidField(`authors.${index}.roles`)}
              errorMessage={errorMessage(controller, `authors.${index}.roles`)}
              searchable
              maxVisibleItems={7}
            />
            <div className="flex items-center self-start pt-[34px]">
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
