let rememberedSelectedCategory = "";
let rememberedNewValue = "";
let rememberedSearchTerm = "";
let rememberedSelectedForm: "obra" | "edicao" = "obra";

export function getRememberedAdminOptionsForm() {
  return rememberedSelectedForm;
}

export function rememberAdminOptionsForm(form: "obra" | "edicao") {
  rememberedSelectedForm = form;
}

export function getRememberedAdminOptionsCategory() {
  return rememberedSelectedCategory;
}

export function rememberAdminOptionsCategory(categorySlug: string) {
  rememberedSelectedCategory = categorySlug;
}

export function getRememberedAdminOptionsNewValue() {
  return rememberedNewValue;
}

export function rememberAdminOptionsNewValue(value: string) {
  rememberedNewValue = value;
}

export function getRememberedAdminOptionsSearchTerm() {
  return rememberedSearchTerm;
}

export function rememberAdminOptionsSearchTerm(value: string) {
  rememberedSearchTerm = value;
}

export function resetAdminOptionsMemoryForTests() {
  rememberedSelectedCategory = "";
  rememberedNewValue = "";
  rememberedSearchTerm = "";
  rememberedSelectedForm = "obra";
}
