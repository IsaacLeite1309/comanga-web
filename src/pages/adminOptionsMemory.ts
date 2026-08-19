let rememberedSelectedCategory = "";
let rememberedNewValue = "";
let rememberedSelectedCountryIds: number[] = [];
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

export function getRememberedAdminOptionsCountryIds() {
  return [...rememberedSelectedCountryIds];
}

export function rememberAdminOptionsCountryIds(countryIds: number[]) {
  rememberedSelectedCountryIds = [...countryIds];
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
  rememberedSelectedCountryIds = [];
  rememberedSearchTerm = "";
  rememberedSelectedForm = "obra";
}
