// ============================================================
// PÁGINA DE ADMINISTRAÇÃO
// ============================================================
//
// Central administrativa:
//
// - Usuários
// - Cargos / Roles
// - Permissões
//
// Backend:
//
// React
//   ↓
// services/api.js
//   ↓
// Express
//   ↓
// JWT / RBAC
//   ↓
// Sequelize
//   ↓
// MySQL
//
// ============================================================

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Shield,
  Users,
  KeyRound,
  Plus,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Save,
  X,
  Check,
  Lock,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Textarea,
} from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  usePermissions,
} from "@/hooks/usePermissions";

import {
  useAuth,
} from "@/context/AuthContext";

import {
  getUsuarios,
  getRoles,
  getPermissions,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  createRole,
  updateRole,
} from "@/services/api";


// ============================================================
// ABAS
// ============================================================

const TABS = [
  {
    id: "usuarios",
    label: "USUÁRIOS",
    icon: Users,
  },
  {
    id: "cargos",
    label: "CARGOS",
    icon: Shield,
  },
  {
    id: "permissoes",
    label: "PERMISSÕES",
    icon: KeyRound,
  },
];


// ============================================================
// FORMULÁRIO PADRÃO DE ROLE
// ============================================================

const EMPTY_ROLE = {
  nome: "",
  slug: "",
  descricao: "",
  hierarchyOrder: 99,
  tierLevel: 5,
  permissionIds: [],
};


// ============================================================
// HELPERS
// ============================================================

function getRoleName(
  role
) {
  return (
    role?.nome ||
    role?.name ||
    role?.slug ||
    "Sem cargo"
  );
}


function getPermissionList(
  role
) {
  if (
    Array.isArray(
      role?.Permissions
    )
  ) {
    return role.Permissions;
  }

  if (
    Array.isArray(
      role?.permissions
    )
  ) {
    return role.permissions;
  }

  return [];
}


function getPermissionId(
  permission
) {
  return (
    permission?.id ??
    permission?.permissionId ??
    null
  );
}


function normalizeId(
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "";
  }

  return String(value);
}


function normalizeBoolean(
  value
) {
  return value !== false;
}


function normalizePermissionIds(
  values = []
) {
  return values
    .map((value) => {
      const number =
        Number(value);

      return Number.isNaN(number)
        ? value
        : number;
    })
    .filter(
      (value) =>
        value !== "" &&
        value !== null &&
        value !== undefined
    );
}


// ============================================================
// COMPONENTE
// ============================================================

export default function Administracao() {

  // ==========================================================
  // AUTH / RBAC
  // ==========================================================

  const {
    user: currentUser,
  } =
    useAuth();


  const {
    can,
  } =
    usePermissions();


  const canManageUsers =
    can(
      "gerenciar_usuarios"
    );


  const canManageRoles =
    can(
      "gerenciar_roles"
    );


  // A lista de cargos também é necessária para administrar
  // usuários.
  const canLoadRoles =
    canManageUsers ||
    canManageRoles;


  // ==========================================================
  // ABA ATIVA
  // ==========================================================

  const [
    activeTab,
    setActiveTab,
  ] =
    useState(
      canManageUsers
        ? "usuarios"
        : "cargos"
    );


  useEffect(
    () => {

      if (
        activeTab === "usuarios" &&
        !canManageUsers
      ) {
        setActiveTab(
          canManageRoles
            ? "cargos"
            : "usuarios"
        );

        return;
      }


      if (
        (
          activeTab === "cargos" ||
          activeTab === "permissoes"
        ) &&
        !canManageRoles
      ) {
        setActiveTab(
          canManageUsers
            ? "usuarios"
            : "cargos"
        );
      }

    },
    [
      activeTab,
      canManageUsers,
      canManageRoles,
    ]
  );


  // ==========================================================
  // QUERY CLIENT
  // ==========================================================

  const queryClient =
    useQueryClient();


  // ==========================================================
  // BUSCA DE USUÁRIO
  // ==========================================================

  const [
    userSearch,
    setUserSearch,
  ] =
    useState("");


  // ==========================================================
  // MODAL / ROLE
  // ==========================================================

  const [
    roleFormOpen,
    setRoleFormOpen,
  ] =
    useState(false);


  const [
    editingRole,
    setEditingRole,
  ] =
    useState(null);


  const [
    roleForm,
    setRoleForm,
  ] =
    useState({
      ...EMPTY_ROLE,
    });


  const [
    savingRole,
    setSavingRole,
  ] =
    useState(false);


  const [
    roleError,
    setRoleError,
  ] =
    useState("");


  // ==========================================================
  // USUÁRIOS
  // ==========================================================

  const {
    data: usuarios = [],
    isLoading: usersLoading,
    isError: usersError,
    error: usersErrorObject,
  } =
    useQuery({
      queryKey: [
        "all-users",
      ],

      queryFn:
        getUsuarios,

      enabled:
        canManageUsers,
    });


  // ==========================================================
  // ROLES
  // ==========================================================

  const {
    data: roles = [],
    isLoading: rolesLoading,
    isError: rolesError,
    error: rolesErrorObject,
  } =
    useQuery({
      queryKey: [
        "roles",
      ],

      queryFn:
        getRoles,

      enabled:
        canLoadRoles,
    });


  // ==========================================================
  // PERMISSÕES
  // ==========================================================

  const {
    data: permissions = [],
    isLoading: permissionsLoading,
    isError: permissionsError,
    error: permissionsErrorObject,
  } =
    useQuery({
      queryKey: [
        "permissions",
      ],

      queryFn:
        getPermissions,

      enabled:
        canManageRoles,
    });


  // ==========================================================
  // USUÁRIOS FILTRADOS
  // ==========================================================

  const filteredUsers =
    useMemo(
      () => {

        const search =
          userSearch
            .trim()
            .toLowerCase();


        if (
          !search
        ) {
          return usuarios;
        }


        return usuarios.filter(
          (usuario) => {

            const role =
              usuario?.Role ||
              usuario?.role ||
              null;


            const nome =
              String(
                usuario?.nome ||
                ""
              ).toLowerCase();


            const email =
              String(
                usuario?.email ||
                ""
              ).toLowerCase();


            const roleName =
              getRoleName(
                role
              ).toLowerCase();


            return (
              nome.includes(search) ||
              email.includes(search) ||
              roleName.includes(search)
            );
          }
        );

      },
      [
        usuarios,
        userSearch,
      ]
    );


  // ==========================================================
  // ABRIR NOVO ROLE
  // ==========================================================

  function openNewRole() {

    setEditingRole(
      null
    );

    setRoleForm({
      ...EMPTY_ROLE,
      permissionIds: [],
    });

    setRoleError("");

    setRoleFormOpen(
      true
    );
  }


  // ==========================================================
  // ABRIR EDIÇÃO DE ROLE
  // ==========================================================

  function openEditRole(
    role
  ) {

    const permissionIds =
      getPermissionList(
        role
      )
        .map(
          (permission) =>
            normalizeId(
              getPermissionId(
                permission
              )
            )
        )
        .filter(Boolean);


    setEditingRole(
      role
    );


    setRoleForm({
      nome:
        role?.nome ||
        role?.name ||
        "",

      slug:
        role?.slug ||
        "",

      descricao:
        role?.descricao ||
        role?.description ||
        "",

      hierarchyOrder:
        role?.hierarchyOrder ??
        role?.hierarchy_order ??
        99,

      tierLevel:
        role?.tierLevel ??
        role?.tier_level ??
        5,

      permissionIds,
    });


    setRoleError("");

    setRoleFormOpen(
      true
    );
  }


  // ==========================================================
  // FECHAR MODAL
  // ==========================================================

  function closeRoleForm() {

    if (
      savingRole
    ) {
      return;
    }


    setRoleFormOpen(
      false
    );

    setEditingRole(
      null
    );

    setRoleError("");
  }


  // ==========================================================
  // ALTERAR CAMPO DO ROLE
  // ==========================================================

  function setRoleField(
    field,
    value
  ) {

    setRoleForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }


  // ==========================================================
  // TOGGLE PERMISSÃO
  // ==========================================================

  function togglePermission(
    permissionId
  ) {

    const normalized =
      normalizeId(
        permissionId
      );


    if (
      !normalized
    ) {
      return;
    }


    setRoleForm(
      (current) => {

        const selected =
          new Set(
            current.permissionIds ||
            []
          );


        if (
          selected.has(
            normalized
          )
        ) {
          selected.delete(
            normalized
          );
        } else {
          selected.add(
            normalized
          );
        }


        return {
          ...current,
          permissionIds: [
            ...selected,
          ],
        };
      }
    );
  }


  // ==========================================================
  // SALVAR ROLE
  // ==========================================================

  async function handleSaveRole() {

    const nome =
      roleForm.nome.trim();

    const slug =
      roleForm.slug
        .trim()
        .toLowerCase();


    if (
      !nome
    ) {
      setRoleError(
        "Informe o nome do cargo."
      );

      return;
    }


    if (
      !slug
    ) {
      setRoleError(
        "Informe o slug do cargo."
      );

      return;
    }


    const hierarchyOrder =
      Number(
        roleForm.hierarchyOrder
      );


    const tierLevel =
      Number(
        roleForm.tierLevel
      );


    if (
      !Number.isFinite(
        hierarchyOrder
      )
    ) {
      setRoleError(
        "A hierarquia informada é inválida."
      );

      return;
    }


    if (
      !Number.isFinite(
        tierLevel
      )
    ) {
      setRoleError(
        "O tier informado é inválido."
      );

      return;
    }


    setSavingRole(
      true
    );

    setRoleError("");


    try {

      const payload = {
        nome,
        slug,

        descricao:
          roleForm.descricao
            .trim() ||
          null,

        hierarchyOrder,

        tierLevel,

        permissionIds:
          normalizePermissionIds(
            roleForm.permissionIds
          ),
      };


      if (
        editingRole
      ) {
        await updateRole(
          editingRole.id,
          payload
        );
      } else {
        await createRole(
          payload
        );
      }


      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "roles",
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "permissions",
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "all-users",
          ],
        }),
      ]);


      setRoleFormOpen(
        false
      );

      setEditingRole(
        null
      );

      setRoleError("");

    } catch (
      error
    ) {

      console.error(
        "[Administracao] erro ao salvar role:",
        error
      );


      setRoleError(
        error?.message ||
        "Não foi possível salvar o cargo."
      );

    } finally {

      setSavingRole(
        false
      );
    }
  }


  // ==========================================================
  // ALTERAR STATUS DE USUÁRIO
  // ==========================================================

  async function handleUserStatus(
    usuario
  ) {

    if (
      !canManageUsers
    ) {
      return;
    }


    const isCurrentUser =
      String(
        usuario?.id
      ) ===
      String(
        currentUser?.id
      );


    if (
      isCurrentUser
    ) {
      return;
    }


    const currentStatus =
      normalizeBoolean(
        usuario?.ativo
      );


    try {

      await updateUserStatus(
        usuario.id,
        !currentStatus
      );


      await queryClient.invalidateQueries({
        queryKey: [
          "all-users",
        ],
      });

    } catch (
      error
    ) {

      console.error(
        "[Administracao] erro ao alterar status:",
        error
      );


      window.alert(
        error?.message ||
        "Não foi possível alterar o status do usuário."
      );
    }
  }


  // ==========================================================
  // ALTERAR ROLE DO USUÁRIO
  // ==========================================================

  async function handleUserRoleChange(
    usuarioId,
    newRoleId
  ) {

    if (
      !canManageUsers
    ) {
      return;
    }


    const parsedRoleId =
      Number(
        newRoleId
      );


    if (
      !parsedRoleId
    ) {
      return;
    }


    try {

      await updateUserRole(
        usuarioId,
        parsedRoleId
      );


      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "all-users",
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "membros",
          ],
        }),
      ]);

    } catch (
      error
    ) {

      console.error(
        "[Administracao] erro ao alterar cargo:",
        error
      );


      window.alert(
        error?.message ||
        "Não foi possível alterar o cargo."
      );
    }
  }


  // ==========================================================
  // EXCLUIR USUÁRIO
  // ==========================================================

  async function handleDeleteUser(
    usuario
  ) {

    if (
      !canManageUsers
    ) {
      return;
    }


    const isCurrentUser =
      String(
        usuario?.id
      ) ===
      String(
        currentUser?.id
      );


    if (
      isCurrentUser
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        `Excluir o usuário "${usuario?.nome || usuario?.email}"? Esta ação não pode ser desfeita.`
      );


    if (
      !confirmed
    ) {
      return;
    }


    try {

      await deleteUser(
        usuario.id
      );


      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "all-users",
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "membros",
          ],
        }),
      ]);

    } catch (
      error
    ) {

      console.error(
        "[Administracao] erro ao excluir usuário:",
        error
      );


      window.alert(
        error?.message ||
        "Não foi possível excluir o usuário."
      );
    }
  }


  // ==========================================================
  // SEM PERMISSÃO
  // ==========================================================

  if (
    !canManageUsers &&
    !canManageRoles
  ) {

    return (
      <div className="min-h-screen px-4 py-16">
        <div className="max-w-3xl mx-auto">

          <div className="bg-card border border-border rounded-xl p-8 text-center">

            <Lock
              className="w-10 h-10 mx-auto mb-4 text-muted-foreground"
            />

            <h1 className="font-heading text-2xl font-bold tracking-[0.15em] text-primary mb-3">
              ACESSO NEGADO
            </h1>

            <p className="text-sm text-muted-foreground">
              Você não possui permissão para acessar a administração do sistema.
            </p>

          </div>

        </div>
      </div>
    );
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen px-4 py-16">

      <div className="max-w-6xl mx-auto">


        {/* ====================================================
            HEADER
            ==================================================== */}

        <div className="mb-8">

          <div className="flex items-center gap-3 mb-3">

            <Shield
              className="w-7 h-7 text-primary"
            />

            <div>

              <p className="font-heading text-[10px] tracking-[0.3em] text-muted-foreground">
                — PAINEL ADMINISTRATIVO
              </p>

              <h1 className="font-heading text-3xl font-bold tracking-[0.15em] text-primary">
                ADMINISTRAÇÃO
              </h1>

            </div>

          </div>


          <div className="w-full h-[1px] bg-border" />


          <p className="text-sm text-muted-foreground mt-4">
            Gerencie usuários, cargos e permissões do sistema.
          </p>

        </div>


        {/* ====================================================
            ABAS
            ==================================================== */}

        <div className="grid grid-cols-3 gap-2 p-1 bg-card border border-border rounded-xl mb-8">

          {TABS.map(
            (tab) => {

              const Icon =
                tab.icon;


              const disabled =
                (
                  tab.id === "usuarios" &&
                  !canManageUsers
                )
                ||
                (
                  (
                    tab.id === "cargos" ||
                    tab.id === "permissoes"
                  ) &&
                  !canManageRoles
                );


              return (
                <button

                  key={
                    tab.id
                  }

                  type="button"

                  disabled={
                    disabled
                  }

                  onClick={() => {
                    if (
                      !disabled
                    ) {
                      setActiveTab(
                        tab.id
                      );
                    }
                  }}

                  className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-heading text-[10px] tracking-[0.2em] transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary hover:bg-background"
                  } ${
                    disabled
                      ? "opacity-30 cursor-not-allowed"
                      : ""
                  }`}

                >

                  <Icon
                    className="w-4 h-4"
                  />

                  {tab.label}

                </button>
              );
            }
          )}

        </div>


        {/* ====================================================
            USUÁRIOS
            ==================================================== */}

        {activeTab === "usuarios" &&
        canManageUsers && (

          <section>

            <div className="flex flex-col sm:flex-row gap-3 justify-between mb-5">

              <div>

                <h2 className="font-heading text-lg font-bold tracking-[0.12em] text-primary">
                  USUÁRIOS
                </h2>

                <p className="text-xs text-muted-foreground mt-1">
                  Gerencie contas, cargos e estado de acesso.
                </p>

              </div>


              <Input

                value={
                  userSearch
                }

                onChange={(event) =>
                  setUserSearch(
                    event.target.value
                  )
                }

                placeholder="Buscar usuário..."

                className="sm:max-w-xs bg-card border-border"

              />

            </div>


            {rolesError && (

              <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">

                <p className="text-xs text-yellow-400">
                  Não foi possível carregar a lista de cargos:{" "}
                  {
                    rolesErrorObject?.message ||
                    "erro desconhecido"
                  }
                </p>

              </div>

            )}


            {usersLoading ? (

              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
              </div>

            ) : usersError ? (

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">

                <p className="text-sm text-red-400">
                  {
                    usersErrorObject?.message ||
                    "Erro ao carregar usuários."
                  }
                </p>

              </div>

            ) : filteredUsers.length === 0 ? (

              <div className="bg-card border border-border rounded-xl p-8 text-center">

                <Users
                  className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50"
                />

                <p className="text-sm text-muted-foreground">
                  Nenhum usuário encontrado.
                </p>

              </div>

            ) : (

              <div className="space-y-3">

                {filteredUsers.map(
                  (usuario) => {

                    const role =
                      usuario?.Role ||
                      usuario?.role ||
                      null;


                    const member =
                      usuario?.Membro ||
                      usuario?.membro ||
                      null;


                    const isCurrentUser =
                      String(
                        usuario?.id
                      ) ===
                      String(
                        currentUser?.id
                      );


                    const isActive =
                      normalizeBoolean(
                        usuario?.ativo
                      );


                    return (
                      <div

                        key={
                          usuario.id
                        }

                        className="bg-card border border-border rounded-xl p-5"

                      >

                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">


                          {/* IDENTIDADE */}

                          <div className="flex-1 min-w-0">

                            <div className="flex items-center gap-2 flex-wrap">

                              <h3 className="font-heading text-sm font-bold tracking-wide text-primary">
                                {
                                  usuario.nome ||
                                  "Sem nome"
                                }
                              </h3>


                              {isCurrentUser && (

                                <span className="text-[8px] font-heading tracking-wider px-2 py-0.5 rounded-full border border-primary/30 text-primary">
                                  VOCÊ
                                </span>

                              )}


                              {!isActive && (

                                <span className="text-[8px] font-heading tracking-wider px-2 py-0.5 rounded-full border border-red-500/30 text-red-400">
                                  INATIVO
                                </span>

                              )}

                            </div>


                            <p className="text-xs text-muted-foreground mt-1">
                              {usuario.email}
                            </p>


                            {member && (

                              <p className="text-[10px] text-muted-foreground/60 mt-1">
                                Perfil de membro:{" "}
                                {
                                  member.codinome ||
                                  member.codename ||
                                  "sem codinome"
                                }
                              </p>

                            )}

                          </div>


                          {/* ROLE */}

                          <div className="w-full lg:w-48">

                            <Label className="font-heading text-[9px] tracking-[0.2em] text-muted-foreground">
                              CARGO
                            </Label>


                            <Select

                              value={
                                role?.id
                                  ? String(
                                      role.id
                                    )
                                  : ""
                              }

                              onValueChange={(value) =>
                                handleUserRoleChange(
                                  usuario.id,
                                  value
                                )
                              }

                              disabled={
                                rolesLoading ||
                                rolesError ||
                                roles.length === 0
                              }

                            >

                              <SelectTrigger className="mt-1 bg-background border-border text-primary text-xs">

                                <SelectValue
                                  placeholder={
                                    rolesLoading
                                      ? "Carregando..."
                                      : "Sem cargo"
                                  }
                                />

                              </SelectTrigger>


                              <SelectContent>

                                {roles.map(
                                  (item) => (

                                    <SelectItem

                                      key={
                                        item.id
                                      }

                                      value={
                                        String(
                                          item.id
                                        )
                                      }

                                    >
                                      {
                                        getRoleName(
                                          item
                                        )
                                      }
                                    </SelectItem>

                                  )
                                )}

                              </SelectContent>

                            </Select>

                          </div>


                          {/* AÇÕES */}

                          <div className="flex items-center gap-2">

                            <Button

                              variant="outline"

                              size="sm"

                              onClick={() =>
                                handleUserStatus(
                                  usuario
                                )
                              }

                              disabled={
                                isCurrentUser
                              }

                              className="font-heading text-[9px] tracking-wider"

                            >

                              {isActive ? (
                                <>
                                  <PowerOff
                                    className="w-3.5 h-3.5 mr-1.5"
                                  />
                                  DESATIVAR
                                </>
                              ) : (
                                <>
                                  <Power
                                    className="w-3.5 h-3.5 mr-1.5"
                                  />
                                  ATIVAR
                                </>
                              )}

                            </Button>


                            <Button

                              variant="outline"

                              size="sm"

                              onClick={() =>
                                handleDeleteUser(
                                  usuario
                                )
                              }

                              disabled={
                                isCurrentUser
                              }

                              className="font-heading text-[9px] tracking-wider border-red-500/30 text-red-400 hover:bg-red-500/10"

                            >

                              <Trash2
                                className="w-3.5 h-3.5 mr-1.5"
                              />

                              EXCLUIR

                            </Button>

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </section>

        )}


        {/* ====================================================
            CARGOS
            ==================================================== */}

        {activeTab === "cargos" &&
        canManageRoles && (

          <section>

            <div className="flex items-center justify-between mb-5">

              <div>

                <h2 className="font-heading text-lg font-bold tracking-[0.12em] text-primary">
                  CARGOS / ROLES
                </h2>

                <p className="text-xs text-muted-foreground mt-1">
                  Configure a hierarquia e as permissões de cada cargo.
                </p>

              </div>


              <Button
                onClick={
                  openNewRole
                }
                className="font-heading text-[10px] tracking-wider"
              >
                <Plus
                  className="w-4 h-4 mr-1.5"
                />

                NOVO CARGO
              </Button>

            </div>


            {rolesLoading ? (

              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
              </div>

            ) : rolesError ? (

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">

                <p className="text-sm text-red-400">
                  {
                    rolesErrorObject?.message ||
                    "Erro ao carregar cargos."
                  }
                </p>

              </div>

            ) : roles.length === 0 ? (

              <div className="bg-card border border-border rounded-xl p-8 text-center">

                <Shield
                  className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50"
                />

                <p className="text-sm text-muted-foreground">
                  Nenhum cargo cadastrado.
                </p>

              </div>

            ) : (

              <div className="space-y-3">

                {roles.map(
                  (role) => {

                    const rolePermissions =
                      getPermissionList(
                        role
                      );


                    return (
                      <div

                        key={
                          role.id
                        }

                        className="bg-card border border-border rounded-xl p-5"

                      >

                        <div className="flex flex-col md:flex-row md:items-start gap-4">

                          <div className="flex-1">

                            <div className="flex items-center gap-2">

                              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">

                                <Shield
                                  className="w-4 h-4 text-primary"
                                />

                              </div>


                              <div>

                                <h3 className="font-heading text-sm font-bold tracking-wide text-primary">
                                  {
                                    getRoleName(
                                      role
                                    )
                                  }
                                </h3>

                                <p className="text-[10px] text-muted-foreground">
                                  {role.slug}
                                </p>

                              </div>

                            </div>


                            {(
                              role.descricao ||
                              role.description
                            ) && (

                              <p className="text-xs text-muted-foreground mt-3">
                                {
                                  role.descricao ||
                                  role.description
                                }
                              </p>

                            )}


                            <div className="flex flex-wrap gap-2 mt-3">

                              <span className="text-[9px] font-heading tracking-wider border border-border rounded px-2 py-1 text-muted-foreground">
                                HIERARQUIA:{" "}
                                {
                                  role.hierarchyOrder ??
                                  role.hierarchy_order ??
                                  99
                                }
                              </span>


                              <span className="text-[9px] font-heading tracking-wider border border-border rounded px-2 py-1 text-muted-foreground">
                                TIER:{" "}
                                {
                                  role.tierLevel ??
                                  role.tier_level ??
                                  5
                                }
                              </span>


                              <span className="text-[9px] font-heading tracking-wider border border-primary/20 rounded px-2 py-1 text-primary">
                                {rolePermissions.length} PERMISSÕES
                              </span>

                            </div>


                            {rolePermissions.length > 0 && (

                              <div className="flex flex-wrap gap-1.5 mt-3">

                                {rolePermissions.map(
                                  (permission) => (

                                    <span

                                      key={
                                        getPermissionId(
                                          permission
                                        )
                                      }

                                      className="text-[9px] rounded border border-border bg-background px-2 py-1 text-muted-foreground"

                                    >
                                      {
                                        permission.nome ||
                                        permission.name ||
                                        permission.slug
                                      }
                                    </span>

                                  )
                                )}

                              </div>

                            )}

                          </div>


                          <Button

                            variant="outline"

                            size="sm"

                            onClick={() =>
                              openEditRole(
                                role
                              )
                            }

                            className="font-heading text-[9px] tracking-wider"

                          >
                            <Pencil
                              className="w-3.5 h-3.5 mr-1.5"
                            />

                            EDITAR
                          </Button>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </section>

        )}


        {/* ====================================================
            PERMISSÕES
            ==================================================== */}

        {activeTab === "permissoes" &&
        canManageRoles && (

          <section>

            <div className="mb-5">

              <h2 className="font-heading text-lg font-bold tracking-[0.12em] text-primary">
                PERMISSÕES
              </h2>

              <p className="text-xs text-muted-foreground mt-1">
                Catálogo de permissões disponíveis no sistema RBAC.
              </p>

            </div>


            {permissionsLoading ? (

              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
              </div>

            ) : permissionsError ? (

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">

                <p className="text-sm text-red-400">
                  {
                    permissionsErrorObject?.message ||
                    "Erro ao carregar permissões."
                  }
                </p>

              </div>

            ) : permissions.length === 0 ? (

              <div className="bg-card border border-border rounded-xl p-8 text-center">

                <KeyRound
                  className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50"
                />

                <p className="text-sm text-muted-foreground">
                  Nenhuma permissão cadastrada.
                </p>

              </div>

            ) : (

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                {permissions.map(
                  (permission) => (

                    <div

                      key={
                        getPermissionId(
                          permission
                        )
                      }

                      className="bg-card border border-border rounded-xl p-4"

                    >

                      <div className="flex items-start gap-3">

                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">

                          <KeyRound
                            className="w-4 h-4 text-primary"
                          />

                        </div>


                        <div className="min-w-0">

                          <p className="font-heading text-xs font-semibold tracking-wide text-primary">
                            {
                              permission.nome ||
                              permission.name ||
                              "Permissão"
                            }
                          </p>

                          <p className="text-[10px] text-primary/60 font-mono mt-1 break-all">
                            {permission.slug}
                          </p>


                          {(
                            permission.descricao ||
                            permission.description
                          ) && (

                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                              {
                                permission.descricao ||
                                permission.description
                              }
                            </p>

                          )}

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        )}

      </div>


      {/* ======================================================
          MODAL DE ROLE
          ====================================================== */}

      {roleFormOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={
              closeRoleForm
            }
          />


          <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-xl overflow-hidden shadow-2xl">


            {/* HEADER */}

            <div className="flex items-center justify-between px-6 py-4 border-b border-border">

              <div>

                <p className="font-heading text-[10px] tracking-[0.25em] text-muted-foreground">
                  — CONFIGURAÇÃO DE CARGO
                </p>

                <h2 className="font-heading text-lg font-bold tracking-[0.1em] text-primary mt-1">
                  {
                    editingRole
                      ? "EDITAR CARGO"
                      : "NOVO CARGO"
                  }
                </h2>

              </div>


              <button

                type="button"

                onClick={
                  closeRoleForm
                }

                disabled={
                  savingRole
                }

                className="text-muted-foreground hover:text-primary disabled:opacity-50"

              >
                <X
                  className="w-5 h-5"
                />
              </button>

            </div>


            {/* CONTEÚDO */}

            <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">


              {/* NOME */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">
                  NOME *
                </Label>

                <Input

                  value={
                    roleForm.nome
                  }

                  onChange={(event) =>
                    setRoleField(
                      "nome",
                      event.target.value
                    )
                  }

                  placeholder="Ex: Gerência"

                  disabled={
                    savingRole
                  }

                  className="bg-background border-border text-primary"

                />

              </div>


              {/* SLUG */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">
                  SLUG *
                </Label>

                <Input

                  value={
                    roleForm.slug
                  }

                  onChange={(event) =>
                    setRoleField(
                      "slug",
                      event.target.value
                    )
                  }

                  placeholder="ex: gerencia"

                  disabled={
                    savingRole ||
                    Boolean(
                      editingRole?.isSystem ??
                      editingRole?.is_system
                    )
                  }

                  className="bg-background border-border text-primary"

                />

              </div>


              {/* DESCRIÇÃO */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">
                  DESCRIÇÃO
                </Label>

                <Textarea

                  value={
                    roleForm.descricao
                  }

                  onChange={(event) =>
                    setRoleField(
                      "descricao",
                      event.target.value
                    )
                  }

                  rows={3}

                  placeholder="Descreva a função deste cargo..."

                  disabled={
                    savingRole
                  }

                  className="bg-background border-border text-primary resize-none"

                />

              </div>


              {/* HIERARQUIA + TIER */}

              <div className="grid grid-cols-2 gap-3">

                <div className="space-y-1.5">

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">
                    HIERARQUIA
                  </Label>

                  <Input

                    type="number"

                    value={
                      roleForm.hierarchyOrder
                    }

                    onChange={(event) =>
                      setRoleField(
                        "hierarchyOrder",
                        event.target.value
                      )
                    }

                    disabled={
                      savingRole
                    }

                    className="bg-background border-border text-primary"

                  />

                </div>


                <div className="space-y-1.5">

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">
                    TIER
                  </Label>

                  <Input

                    type="number"

                    value={
                      roleForm.tierLevel
                    }

                    onChange={(event) =>
                      setRoleField(
                        "tierLevel",
                        event.target.value
                      )
                    }

                    disabled={
                      savingRole
                    }

                    className="bg-background border-border text-primary"

                  />

                </div>

              </div>


              {/* PERMISSÕES */}

              <div className="space-y-2">

                <div className="flex items-center justify-between">

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">
                    PERMISSÕES DO CARGO
                  </Label>

                  <span className="text-[10px] text-primary/60">
                    {
                      roleForm.permissionIds?.length ||
                      0
                    } selecionadas
                  </span>

                </div>


                {permissionsLoading ? (

                  <div className="flex justify-center py-5">
                    <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
                  </div>

                ) : (

                  <div className="space-y-1.5">

                    {permissions.map(
                      (permission) => {

                        const permissionId =
                          normalizeId(
                            getPermissionId(
                              permission
                            )
                          );


                        const selected =
                          roleForm.permissionIds.includes(
                            permissionId
                          );


                        return (
                          <button

                            key={
                              permissionId ||
                              permission.slug
                            }

                            type="button"

                            onClick={() =>
                              togglePermission(
                                permissionId
                              )
                            }

                            disabled={
                              savingRole
                            }

                            className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                              selected
                                ? "bg-primary/10 border-primary/40"
                                : "bg-background border-border hover:border-primary/30"
                            }`}

                          >

                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                selected
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-border"
                              }`}
                            >
                              {selected && (
                                <Check
                                  className="w-3.5 h-3.5"
                                />
                              )}
                            </div>


                            <div className="min-w-0">

                              <p className="font-heading text-xs text-primary">
                                {
                                  permission.nome ||
                                  permission.name ||
                                  permission.slug
                                }
                              </p>

                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {permission.slug}
                              </p>

                            </div>

                          </button>
                        );
                      }
                    )}

                  </div>

                )}

              </div>


              {/* ERRO */}

              {roleError && (

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">

                  <p className="text-xs text-red-400">
                    {roleError}
                  </p>

                </div>

              )}

            </div>


            {/* FOOTER */}

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-background/50">

              <Button

                variant="outline"

                onClick={
                  closeRoleForm
                }

                disabled={
                  savingRole
                }

                className="font-heading text-[10px] tracking-wider"

              >
                CANCELAR
              </Button>


              <Button

                onClick={
                  handleSaveRole
                }

                disabled={
                  savingRole ||
                  permissionsLoading
                }

                className="font-heading text-[10px] tracking-wider bg-primary text-primary-foreground"

              >

                {savingRole ? (

                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />

                ) : (

                  <>
                    <Save
                      className="w-3.5 h-3.5 mr-1.5"
                    />
                    SALVAR
                  </>

                )}

              </Button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}