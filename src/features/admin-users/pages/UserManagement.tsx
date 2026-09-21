import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ, Check, ChevronDown, Loader2, Search, ShieldAlert } from "lucide-react";
import { isAxiosError } from "axios";
import { api } from "@/services/api";
import { useAuth } from "@/features/auth";
import { toast } from "sonner";
import { useDropdown } from "@/hooks/useDropdown";
import {
  getRememberedUserManagementFilters,
  rememberUserManagementRole,
  rememberUserManagementSearchTerm,
  rememberUserManagementStatus,
} from "../userManagementMemory";

type UserRole = "Administrador" | "Usuário Padrão";
type UserStatus = "Pendente" | "Ativada" | "Bloqueada";
type SortOrder = "ASC" | "DESC";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  /** Campo derivado da atribuição Administrador, mantido para compatibilidade. */
  role: UserRole;
  /** Perfis que a conta possui; o perfil padrão nunca é removido. */
  profiles: UserRole[];
  status: UserStatus;
}

interface UsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ROLE_OPTIONS: Array<"Todos" | UserRole> = ["Todos", "Administrador", "Usuário Padrão"];
const STATUS_OPTIONS: Array<"Todos" | UserStatus> = ["Todos", "Pendente", "Ativada", "Bloqueada"];
const USERS_PAGE_SIZE = 8;

interface FilterDropdownProps<T extends string> {
  label: string;
  value: T;
  options: T[];
  getOptionLabel: (option: T) => string;
  onChange: (value: T) => void;
}

function FilterDropdown<T extends string>({
  label,
  value,
  options,
  getOptionLabel,
  onChange,
}: FilterDropdownProps<T>) {
  const { isOpen, closeDropdown, toggleDropdown, rootProps } = useDropdown();

  function selectOption(option: T) {
    onChange(option);
    closeDropdown();
  }

  return (
    <div {...rootProps} className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-input px-3 text-left text-base font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/40"
        aria-expanded={isOpen}
        aria-label={label}
      >
        <span className="truncate">{getOptionLabel(value)}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-full overflow-hidden rounded-lg border border-primary bg-background shadow-2xl">
          {options.map((option) => {
            const selected = option === value;

            return (
              <button
                key={option}
                type="button"
                onClick={() => selectOption(option)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-base font-semibold transition-colors ${
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                <span>{getOptionLabel(option)}</span>
                {selected && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getStatusClassName(status: UserStatus): string {
  const statusStyles: Record<UserStatus, string> = {
    Ativada: "border border-green-500/30 bg-green-500/15 text-green-300",
    Pendente: "border border-yellow-500/30 bg-yellow-500/15 text-yellow-300",
    Bloqueada: "border border-red-500/30 bg-red-500/15 text-red-300",
  };

  return statusStyles[status];
}

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  total: number;
  currentCount: number;
  onPrevious: () => void;
  onNext: () => void;
}

function PaginationControls({
  page,
  totalPages,
  total,
  currentCount,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        Exibindo {currentCount} de {total} usuários
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={page <= 1}
          className="rounded-lg border border-border bg-input px-3 py-2 font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-foreground"
        >
          Anterior
        </button>
        <span className="min-w-16 text-center font-semibold text-foreground">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="rounded-lg border border-border bg-input px-3 py-2 font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-foreground"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}

interface RoleDropdownProps {
  label: string;
  value: UserRole;
  disabled: boolean;
  onChange: (value: UserRole) => void;
}

function RoleDropdown({ label, value, disabled, onChange }: RoleDropdownProps) {
  const { isOpen, closeDropdown, toggleDropdown, rootProps } = useDropdown();
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 160 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const options: UserRole[] = ["Administrador", "Usuário Padrão"];

  function toggleMenu() {
    if (disabled) return;

    const rect = buttonRef.current?.getBoundingClientRect();

    if (rect) {
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }

    toggleDropdown();
  }

  function selectOption(option: UserRole) {
    onChange(option);
    closeDropdown();
  }

  return (
    <div {...rootProps}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={toggleMenu}
        className="flex h-10 w-40 items-center justify-between gap-3 rounded-lg border border-border bg-input px-3 text-left text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
        aria-expanded={isOpen}
        aria-label={label}
      >
        <span className="truncate">{value}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && !disabled && (
        <div
          className="fixed z-50 overflow-hidden rounded-lg border border-primary bg-background shadow-2xl"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
          }}
        >
          {options.map((option) => {
            const selected = option === value;

            return (
              <button
                key={option}
                type="button"
                onClick={() => selectOption(option)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold transition-colors ${
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                <span>{option}</span>
                {selected && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface UserFiltersProps {
  searchTerm: string;
  roleFilter: "Todos" | UserRole;
  statusFilter: "Todos" | UserStatus;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: "Todos" | UserRole) => void;
  onStatusChange: (value: "Todos" | UserStatus) => void;
}

function UserFilters(props: UserFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
      <label className="relative block">
        <span className="sr-only">Buscar usuário ou e-mail</span>
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={props.searchTerm}
          onChange={(event) => props.onSearchChange(event.target.value)}
          placeholder="Buscar por usuário ou e-mail"
          className="h-12 w-full rounded-xl border border-border bg-input pl-11 pr-4 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </label>
      <FilterDropdown
        label="Filtrar por nível de acesso"
        value={props.roleFilter}
        options={ROLE_OPTIONS}
        getOptionLabel={(role) => role === "Todos" ? "Todos os níveis" : role}
        onChange={props.onRoleChange}
      />
      <FilterDropdown
        label="Filtrar por status"
        value={props.statusFilter}
        options={STATUS_OPTIONS}
        getOptionLabel={(status) => status === "Todos" ? "Todos os status" : status}
        onChange={props.onStatusChange}
      />
    </div>
  );
}

interface UserRowProps {
  user: AdminUser;
  currentUserId?: string;
  updatingUserId: string | null;
  onRoleChange: (user: AdminUser, role: UserRole) => void;
}

function MobileUserCard({ user, currentUserId, updatingUserId, onRoleChange }: UserRowProps) {
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Usuário</p>
          <p className="break-words text-base font-bold text-foreground">{user.username}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">E-mail</p>
          <p className="break-all text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Nível de Acesso</p>
          <div className="mt-2">
            <RoleDropdown
              label={`Nível de acesso de ${user.username}`}
              value={user.role}
              disabled={user.id === currentUserId || updatingUserId === user.id}
              onChange={(role) => onRoleChange(user, role)}
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Status</p>
          <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClassName(user.status)}`}>{user.status}</span>
        </div>
      </div>
    </article>
  );
}

function DesktopUserRow({ user, currentUserId, updatingUserId, onRoleChange }: UserRowProps) {
  return (
    <tr className="text-sm text-foreground">
      <td className="px-4 py-3 font-semibold">{user.username}</td>
      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
      <td className="px-4 py-3">
        <div className="w-40">
          <RoleDropdown
            label={`Nível de acesso de ${user.username}`}
            value={user.role}
            disabled={user.id === currentUserId || updatingUserId === user.id}
            onChange={(role) => onRoleChange(user, role)}
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClassName(user.status)}`}>{user.status}</span>
      </td>
    </tr>
  );
}

interface UsersViewProps {
  users: AdminUser[];
  currentUserId?: string;
  updatingUserId: string | null;
  loading: boolean;
  error: string;
  showPagination: boolean;
  page: number;
  totalPages: number;
  total: number;
  onRoleChange: (user: AdminUser, role: UserRole) => void;
  onPrevious: () => void;
  onNext: () => void;
}

function MobileUsersView(props: UsersViewProps) {
  return (
    <div className="space-y-3 md:hidden">
      {props.loading && (
        <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Carregando usuários...
          </span>
        </div>
      )}
      {!props.loading && props.error && (
        <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-red-400">
          <span className="inline-flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            {props.error}
          </span>
        </div>
      )}
      {!props.loading && !props.error && props.users.length === 0 && (
        <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-muted-foreground">
          Nenhum usuário encontrado com os filtros aplicados.
        </div>
      )}
      {!props.loading && !props.error && props.users.map((user) => (
        <MobileUserCard
          key={user.id}
          user={user}
          currentUserId={props.currentUserId}
          updatingUserId={props.updatingUserId}
          onRoleChange={props.onRoleChange}
        />
      ))}
      {props.showPagination && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <PaginationControls
            page={props.page}
            totalPages={props.totalPages}
            total={props.total}
            currentCount={props.users.length}
            onPrevious={props.onPrevious}
            onNext={props.onNext}
          />
        </div>
      )}
    </div>
  );
}

function DesktopUsersView(props: UsersViewProps & { order: SortOrder; onToggleOrder: () => void }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={props.onToggleOrder}
                  className="inline-flex items-center gap-2 font-bold text-muted-foreground"
                >
                  USUÁRIO
                  {props.order === "ASC" ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
                </button>
              </th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Nível de Acesso</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {props.loading && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    Carregando usuários...
                  </span>
                </td>
              </tr>
            )}
            {!props.loading && props.error && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-red-400">
                  <span className="inline-flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    {props.error}
                  </span>
                </td>
              </tr>
            )}
            {!props.loading && !props.error && props.users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum usuário encontrado com os filtros aplicados.
                </td>
              </tr>
            )}
            {!props.loading && !props.error && props.users.map((user) => (
              <DesktopUserRow
                key={user.id}
                user={user}
                currentUserId={props.currentUserId}
                updatingUserId={props.updatingUserId}
                onRoleChange={props.onRoleChange}
              />
            ))}
          </tbody>
        </table>
      </div>
      {props.showPagination && (
        <PaginationControls
          page={props.page}
          totalPages={props.totalPages}
          total={props.total}
          currentCount={props.users.length}
          onPrevious={props.onPrevious}
          onNext={props.onNext}
        />
      )}
    </div>
  );
}

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const rememberedFilters = getRememberedUserManagementFilters();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState(rememberedFilters.searchTerm);
  const [debouncedTerm, setDebouncedTerm] = useState(rememberedFilters.searchTerm.trim());
  const [roleFilter, setRoleFilter] = useState<"Todos" | UserRole>(rememberedFilters.role as "Todos" | UserRole);
  const [statusFilter, setStatusFilter] = useState<"Todos" | UserStatus>(rememberedFilters.status as "Todos" | UserStatus);
  const [order, setOrder] = useState<SortOrder>("ASC");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: USERS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedTerm, roleFilter, statusFilter, order]);

  const params = useMemo(() => ({
    ...(debouncedTerm ? { term: debouncedTerm } : {}),
    ...(roleFilter !== "Todos" ? { role: roleFilter } : {}),
    ...(statusFilter !== "Todos" ? { status: statusFilter } : {}),
    order,
    page,
    limit: USERS_PAGE_SIZE,
  }), [debouncedTerm, roleFilter, statusFilter, order, page]);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get<UsersResponse>("/admin/users", { params });
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      } catch (requestError) {
        if (isAxiosError(requestError) && requestError.response?.status === 403) {
          setError("Acesso negado: você não possui permissão para gerenciar usuários.");
        } else {
          setError("Erro ao carregar usuários.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [params]);

  async function handleRoleChange(targetUser: AdminUser, newRole: UserRole) {
    const previousUsers = users;
    const grantsAdmin = newRole === "Administrador";
    const nextProfiles: UserRole[] = grantsAdmin
      ? ["Administrador", "Usuário Padrão"]
      : ["Usuário Padrão"];
    setUsers((current) => current.map((item) => (
      item.id === targetUser.id ? { ...item, role: newRole, profiles: nextProfiles } : item
    )));
    setUpdatingUserId(targetUser.id);

    try {
      const response = await api.patch<{ user: AdminUser }>(`/admin/users/${targetUser.id}/role`, {
        role: newRole,
      });
      setUsers((current) => current.map((item) => (
        item.id === targetUser.id ? response.data.user : item
      )));
      toast.success(grantsAdmin
        ? `Perfil Administrador concedido a ${targetUser.username}.`
        : `Perfil Administrador removido de ${targetUser.username}.`);
    } catch (requestError) {
      setUsers(previousUsers);

      if (isAxiosError(requestError) && requestError.response?.data?.error) {
        toast.error(requestError.response.data.error);
      } else {
        toast.error("Erro ao atualizar o perfil de acesso.");
      }
    } finally {
      setUpdatingUserId(null);
    }
  }

  function toggleOrder() {
    setOrder((current) => current === "ASC" ? "DESC" : "ASC");
  }

  function handleRoleFilterChange(role: "Todos" | UserRole) {
    rememberUserManagementRole(role);
    setRoleFilter(role);
  }

  function handleSearchTermChange(term: string) {
    rememberUserManagementSearchTerm(term);
    setSearchTerm(term);
  }

  function handleStatusFilterChange(status: "Todos" | UserStatus) {
    rememberUserManagementStatus(status);
    setStatusFilter(status);
  }

  const totalPages = Math.max(1, pagination.totalPages);
  const showPagination = !loading && !error && users.length > 0;
  const viewProps: UsersViewProps = {
    users,
    currentUserId: currentUser?.id,
    updatingUserId,
    loading,
    error,
    showPagination,
    page,
    totalPages,
    total: pagination.total,
    onRoleChange: handleRoleChange,
    onPrevious: () => setPage((current) => Math.max(1, current - 1)),
    onNext: () => setPage((current) => Math.min(totalPages, current + 1)),
  };

  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Gerenciar Usuários</h1>
          <p className="mt-2 max-w-full text-sm text-muted-foreground">
            Consulte contas cadastradas, filtre resultados e altere níveis de acesso.
          </p>
        </div>
        <UserFilters
          searchTerm={searchTerm}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onSearchChange={handleSearchTermChange}
          onRoleChange={handleRoleFilterChange}
          onStatusChange={handleStatusFilterChange}
        />
        <MobileUsersView {...viewProps} />
        <DesktopUsersView {...viewProps} order={order} onToggleOrder={toggleOrder} />
      </div>
    </div>
  );
};

export default UserManagement;
