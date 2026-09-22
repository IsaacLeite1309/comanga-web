type RememberedUserManagementFilters = {
  searchTerm: string;
  role: string;
  status: string;
};

let rememberedFilters: RememberedUserManagementFilters = {
  searchTerm: "",
  role: "Todos",
  status: "Todos",
};

export function getRememberedUserManagementFilters() {
  return rememberedFilters;
}

export function rememberUserManagementRole(role: string) {
  rememberedFilters = {
    ...rememberedFilters,
    role,
  };
}

export function rememberUserManagementSearchTerm(searchTerm: string) {
  rememberedFilters = {
    ...rememberedFilters,
    searchTerm,
  };
}

export function rememberUserManagementStatus(status: string) {
  rememberedFilters = {
    ...rememberedFilters,
    status,
  };
}

export function resetUserManagementMemoryForTests() {
  rememberedFilters = {
    searchTerm: "",
    role: "Todos",
    status: "Todos",
  };
}
