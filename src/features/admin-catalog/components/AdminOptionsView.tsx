import { KeyboardEvent } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Edit3,
  Loader2,
  Lock,
  Plus,
  Save,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X
} from "lucide-react";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { AdminOptionsPageModel } from "../hooks/useAdminOptionsPage";
import { DomainOptionValue, FORM_OPTIONS, OptionCategory } from "../pages/adminOptionsModel";

interface CategoryDropdownProps {
  label: string;
  value: string;
  options: OptionCategory[];
  onChange: (value: string) => void;
  emptyMessage?: string;
}

function CategoryDropdown(props: CategoryDropdownProps) {
  return (
    <SearchableSelect
      ariaLabel={props.label}
      value={props.value}
      options={props.options.map((option) => ({ value: option.slug, label: option.name }))}
      onChange={props.onChange}
      emptyMessage={props.emptyMessage || "Nenhuma categoria encontrada."}
      placeholder="Selecione"
      maxVisibleItems={7}
    />
  );
}

function CountryChoices({ countries, selectedIds, onToggle }: {
  countries: DomainOptionValue[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {countries.map((country) => {
        const selected = selectedIds.includes(country.id);
        return (
          <button
            key={country.id}
            type="button"
            onClick={() => onToggle(country.id)}
            className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-input text-foreground hover:border-primary"
            }`}
          >
            {country.label}
          </button>
        );
      })}
    </div>
  );
}

function CountryField({ model }: { model: AdminOptionsPageModel }) {
  if (!model.countryDependent) return null;
  let content = <p className="mt-2 text-sm text-muted-foreground">Carregando países...</p>;

  if (model.countryError) {
    content = <p className="mt-2 text-sm text-red-400">{model.countryError}</p>;
  } else if (!model.countryLoading && model.countryOptions.length === 0) {
    content = (
      <p className="mt-2 text-sm text-muted-foreground">
        Cadastre países de origem antes de relacionar valores.
      </p>
    );
  } else if (!model.countryLoading) {
    content = (
      <CountryChoices
        countries={model.countryOptions}
        selectedIds={model.selectedCountryIds}
        onToggle={model.toggleNewValueCountry}
      />
    );
  }

  return (
    <div className="sm:col-span-2">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        País de origem relacionado
      </p>
      {content}
    </div>
  );
}

function NewOptionForm({ model }: { model: AdminOptionsPageModel }) {
  if (model.systemManagedCategory) {
    return (
      <div className="flex min-w-0 items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground sm:col-span-2 xl:col-span-1">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          {model.currentCategory
            ? `Os valores de ${model.currentCategory.name} são controlados pelo sistema.`
            : "Os valores dessa lista são controlados pelo sistema."}
          {" "}
          Não é possível criar, renomear ou excluir; use os botões da lista para ativar ou desativar cada valor.
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex min-w-0 flex-col gap-2 sm:col-span-2 sm:grid sm:grid-cols-[minmax(0,1fr)_150px] sm:items-start xl:col-span-1"
      onSubmit={model.handleCreate}
    >
      <label className="min-w-0 flex-1">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Novo valor</span>
        <input
          value={model.newValue}
          onChange={(event) => model.changeNewValue(event.target.value)}
          disabled={!model.selectedCategory}
          placeholder={model.currentCategory
            ? `Adicionar em ${model.currentCategory.name}`
            : "Selecione uma categoria"}
          className={`mt-2 h-12 w-full rounded-xl border bg-input px-3 text-base text-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/40 ${
            model.newValueError
              ? "border-red-500 focus:border-red-500"
              : "border-border focus:border-primary"
          }`}
        />
        {model.newValueError && (
          <span className="mt-1 ml-1 block text-xs text-red-500">{model.newValueError}</span>
        )}
      </label>
      <div className="sm:pt-[30px]">
        <button
          type="submit"
          disabled={model.saving || !model.selectedCategory}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {model.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Adicionar
        </button>
      </div>
      <CountryField model={model} />
    </form>
  );
}

function AdminOptionsControls({ model }: { model: AdminOptionsPageModel }) {
  return (
    <section className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 xl:grid-cols-[150px_260px_minmax(0,1fr)]">
      <div className="min-w-0">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Formulário</span>
        <CategoryDropdown
          label="Selecionar formulário"
          value={model.selectedForm}
          options={FORM_OPTIONS}
          onChange={model.changeForm}
          emptyMessage="Nenhum formulário encontrado."
        />
      </div>
      <div className="min-w-0">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Categoria</span>
        <CategoryDropdown
          label="Selecionar categoria"
          value={model.selectedCategory}
          options={model.categoryOptions}
          onChange={model.changeCategory}
        />
      </div>
      <NewOptionForm model={model} />
    </section>
  );
}

function OptionsToolbar({ model }: { model: AdminOptionsPageModel }) {
  const SortIcon = model.order === "ASC" ? ArrowDownAZ : ArrowUpAZ;
  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => model.setOrder((current) => current === "ASC" ? "DESC" : "ASC")}
          disabled={!model.selectedCategory}
          className="inline-flex items-center gap-2 text-base font-bold text-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={model.order === "ASC" ? "Ordenar valores de Z-A" : "Ordenar valores de A-Z"}
        >
          {model.currentCategory?.name || "Selecione uma categoria"}
          <SortIcon className="h-4 w-4" />
        </button>
      </div>
      <label className="relative block sm:w-80">
        <span className="sr-only">Pesquisar valores</span>
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={model.searchTerm}
          onChange={(event) => model.changeSearchTerm(event.target.value)}
          disabled={!model.selectedCategory}
          placeholder="Pesquisar valores desta categoria"
          className="h-11 w-full rounded-xl border border-border bg-input pl-11 pr-4 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </label>
    </div>
  );
}

function EmptyOptions({ model }: { model: AdminOptionsPageModel }) {
  if (!model.selectedCategory) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="font-bold text-foreground">Selecione uma categoria</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha uma lista para consultar e gerenciar os valores cadastrados.
        </p>
      </div>
    );
  }
  if (model.loading) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Carregando opções...
      </div>
    );
  }
  if (model.error) return <div className="px-4 py-10 text-center text-red-400">{model.error}</div>;
  if (model.values.length > 0) return null;
  return (
    <div className="px-4 py-10 text-center">
      <p className="font-bold text-foreground">
        {model.debouncedSearchTerm ? "Nenhum valor encontrado" : "Nenhum valor cadastrado"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {model.debouncedSearchTerm
          ? "Tente ajustar o termo pesquisado."
          : "Adicione o primeiro valor para esta categoria."}
      </p>
    </div>
  );
}

function OptionEditor({ model, value }: { model: AdminOptionsPageModel; value: DomainOptionValue }) {
  const saving = model.savingEditId === value.id;
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !saving) {
      event.preventDefault();
      void model.saveEditing(value);
    }
  }
  return (
    <div className="space-y-3">
      <input
        value={model.editingValue}
        onChange={(event) => model.setEditingValue(event.target.value)}
        onKeyDown={handleKeyDown}
        className="h-10 w-full rounded-lg border border-border bg-input px-3 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/40"
        aria-label={`Editar ${value.label}`}
      />
      {model.countryDependent && model.countryOptions.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            País de origem relacionado
          </p>
          <CountryChoices
            countries={model.countryOptions}
            selectedIds={model.editingCountryIds}
            onToggle={model.toggleEditingCountry}
          />
        </div>
      )}
    </div>
  );
}

// Valor controlado pelo sistema: a única ação permitida é ativar ou desativar.
function OptionActiveToggle({ model, value }: { model: AdminOptionsPageModel; value: DomainOptionValue }) {
  const active = value.active !== false;
  const toggling = model.togglingId === value.id;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`${active ? "Desativar" : "Ativar"} ${value.label}`}
      disabled={toggling}
      onClick={() => void model.toggleActive(value)}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-60"
    >
      {toggling
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
      {active ? "Desativar" : "Ativar"}
    </button>
  );
}

function OptionActions({ model, value }: { model: AdminOptionsPageModel; value: DomainOptionValue }) {
  const editing = model.editingId === value.id;
  const saving = model.savingEditId === value.id;
  const deleting = model.deletingId === value.id;
  if (model.systemManagedCategory) {
    return <OptionActiveToggle model={model} value={value} />;
  }
  if (editing) {
    return (
      <>
        <button
          type="button"
          onClick={() => void model.saveEditing(value)}
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
        <button
          type="button"
          onClick={model.cancelEditing}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 text-sm font-bold text-foreground hover:bg-muted"
          aria-label="Cancelar edição"
        >
          <X className="h-4 w-4" />
        </button>
      </>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={() => model.startEditing(value)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-bold text-foreground hover:bg-muted"
      >
        <Edit3 className="h-4 w-4" />
        Editar
      </button>
      <button
        type="button"
        disabled={deleting}
        onClick={() => model.setPendingDeleteValue(value)}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-500 px-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"
      >
        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Excluir
      </button>
    </>
  );
}

function OptionRow({ model, value }: { model: AdminOptionsPageModel; value: DomainOptionValue }) {
  const editing = model.editingId === value.id;
  return (
    <div className={`flex flex-col gap-3 px-4 py-3 sm:flex-row ${editing ? "sm:items-start" : "sm:items-center"}`}>
      <div className="min-w-0 flex-1">
        {editing ? <OptionEditor model={model} value={value} /> : (
          <div>
            <p className="break-words text-base font-semibold text-foreground">
              {value.label}
              {value.active === false && (
                <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-xs font-bold uppercase text-muted-foreground">
                  Desativado
                </span>
              )}
            </p>
            {model.countryDependent && value.depends_on && value.depends_on.length > 0 && (
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                Países: {value.depends_on.map((dependency) => dependency.label).join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
      <div className={`flex items-center gap-2 ${editing ? "sm:pt-0" : ""}`}>
        <OptionActions model={model} value={value} />
      </div>
    </div>
  );
}

function OptionsPagination({ model }: { model: AdminOptionsPageModel }) {
  const totalPages = Math.max(1, model.pagination.totalPages);
  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>Exibindo {model.values.length} de {model.pagination.total} valores</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => model.setPage((current) => Math.max(1, current - 1))}
          disabled={model.page === 1}
          className="h-9 rounded-lg border border-border px-3 font-bold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="font-semibold text-foreground">{model.page} / {totalPages}</span>
        <button
          type="button"
          onClick={() => model.setPage((current) => Math.min(totalPages, current + 1))}
          disabled={model.page === totalPages}
          className="h-9 rounded-lg border border-border px-3 font-bold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}

function OptionsPanel({ model }: { model: AdminOptionsPageModel }) {
  const showValues = model.selectedCategory && !model.loading && !model.error && model.values.length > 0;
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <OptionsToolbar model={model} />
      <EmptyOptions model={model} />
      {showValues && (
        <>
          <div className="divide-y divide-border">
            {model.values.map((value) => <OptionRow key={value.id} model={model} value={value} />)}
          </div>
          <OptionsPagination model={model} />
        </>
      )}
    </section>
  );
}

function DeleteOptionDialog({ model }: { model: AdminOptionsPageModel }) {
  const value = model.pendingDeleteValue;
  if (!value) return null;
  const deleting = model.deletingId === value.id;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-foreground">Excluir valor</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tem certeza que deseja excluir "{value.label}"? Esta ação não poderá ser desfeita.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => model.setPendingDeleteValue(null)}
            disabled={deleting}
            className="h-11 rounded-lg border border-border px-4 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void model.confirmDeleteValue()}
            disabled={deleting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminOptionsView({ model }: { model: AdminOptionsPageModel }) {
  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Gerenciar Opções</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Mantenha as listas padronizadas usadas no cadastro de obras, edições e volumes.
            <br />
            {model.selectedCategory === "formatos-fisicos"
              ? "Em Formato, vírgulas fazem parte do valor e não separam cadastros múltiplos."
              : "Para adicionar mais de um valor ao mesmo tempo, separe os novos valores por vírgulas."}
          </p>
        </div>
        <AdminOptionsControls model={model} />
        <OptionsPanel model={model} />
      </div>
      <DeleteOptionDialog model={model} />
    </div>
  );
}
