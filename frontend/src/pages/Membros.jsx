// ============================================================
// PÁGINA DE MEMBROS
// ============================================================
//
// Responsabilidades:
//
// - listar membros
// - pesquisar
// - filtrar por cargo
// - filtrar por status
// - filtrar por departamento
// - agrupar por hierarquia
// - abrir edição administrativa
//
// IMPORTANTE:
//
// Membro.id  !== Usuario.id
//
// membro.id
//   → usado nas operações do perfil Membro
//
// membro.usuarioId
//   → usado nas operações administrativas de Usuario
//
// ============================================================

import React, {
  useMemo,
  useState,
} from "react";


// ============================================================
// REACT QUERY
// ============================================================

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";


// ============================================================
// ANIMAÇÕES
// ============================================================

import {
  motion,
} from "framer-motion";


// ============================================================
// ÍCONES
// ============================================================

import {
  Users,
  Filter,
  Search,
} from "lucide-react";


// ============================================================
// UI
// ============================================================

import {
  Input,
} from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// ============================================================
// COMPONENTES
// ============================================================

import MemberCard
  from "@/components/members/MemberCard";

import UserEditModal
  from "@/components/users/UserEditModal";


// ============================================================
// PERMISSÕES
// ============================================================

import {
  usePermissions,
} from "@/hooks/usePermissions";


// ============================================================
// API
// ============================================================

import {
  getMembros,
} from "@/services/api";


// ============================================================
// ESTILOS DA HIERARQUIA
// ============================================================

const tierStyle = {

  1: {
    bar:
      "bg-primary",

    text:
      "text-primary",

    badge:
      "border-primary/40 text-primary/80",
  },

  2: {
    bar:
      "bg-white/60",

    text:
      "text-white/80",

    badge:
      "border-white/30 text-white/60",
  },

  3: {
    bar:
      "bg-white/40",

    text:
      "text-white/60",

    badge:
      "border-white/20 text-white/40",
  },

  4: {
    bar:
      "bg-white/25",

    text:
      "text-white/50",

    badge:
      "border-white/15 text-white/35",
  },

  5: {
    bar:
      "bg-white/15",

    text:
      "text-muted-foreground",

    badge:
      "border-border text-muted-foreground",
  },

  6: {
    bar:
      "bg-white/8",

    text:
      "text-muted-foreground/60",

    badge:
      "border-border/50 text-muted-foreground/50",
  },

};


// ============================================================
// HELPERS
// ============================================================

// ------------------------------------------------------------
// ROLE DO MEMBRO
// ------------------------------------------------------------

function getMemberRole(
  member
) {

  return (
    member?.role ||
    member?.Role ||
    null
  );

}


// ------------------------------------------------------------
// NOME DO MEMBRO
// ------------------------------------------------------------

function getMemberName(
  member
) {

  return (

    member?.nome ||

    member?.name ||

    member?.full_name ||

    "Sem nome"

  );

}


// ------------------------------------------------------------
// DEPARTAMENTOS
// ------------------------------------------------------------

function getMemberDepartments(
  member
) {

  if (
    Array.isArray(
      member?.departamentos
    )
  ) {

    return member.departamentos;

  }


  if (
    Array.isArray(
      member?.departments
    )
  ) {

    return member.departments;

  }


  return [];

}


// ------------------------------------------------------------
// STATUS
// ------------------------------------------------------------

function getMemberStatus(
  member
) {

  return (
    member?.status ||
    "Ativo"
  );

}


// ------------------------------------------------------------
// NOME DO ROLE
// ------------------------------------------------------------

function getRoleName(
  role
) {

  return (
    role?.nome ||
    role?.name ||
    role?.slug ||
    "Outros"
  );

}


// ------------------------------------------------------------
// HIERARQUIA
// ------------------------------------------------------------

function getRoleHierarchy(
  role
) {

  return (
    role?.hierarchyOrder ??
    role?.hierarchy_order ??
    99
  );

}


// ------------------------------------------------------------
// TIER
// ------------------------------------------------------------

function getRoleTier(
  role
) {

  return (
    role?.tierLevel ??
    role?.tier_level ??
    5
  );

}


// ============================================================
// COMPONENTE
// ============================================================

export default function Members() {

  // ==========================================================
  // PERMISSÕES
  // ==========================================================

  const {
    can,
    canAny,
  } =
    usePermissions();


  const canManageMembers =
    can(
      "gerenciar_membros"
    );


  const canManageUsers =
    can(
      "gerenciar_usuarios"
    );


  // ----------------------------------------------------------
  // O modal pode ser aberto por quem administra:
  //
  // - dados do Membro
  // OU
  // - dados do Usuario
  //
  // Dentro do UserEditModal cada área será protegida
  // separadamente.
  // ----------------------------------------------------------

  const canOpenEditor =
    canAny([
      "gerenciar_membros",
      "gerenciar_usuarios",
    ]);


  // ==========================================================
  // FILTROS
  // ==========================================================

  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    roleFilter,
    setRoleFilter,
  ] =
    useState("all");


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("all");


  const [
    departmentFilter,
    setDepartmentFilter,
  ] =
    useState("all");


  // ==========================================================
  // MODAL
  // ==========================================================

  const [
    editingUser,
    setEditingUser,
  ] =
    useState(null);


  // ==========================================================
  // QUERY CLIENT
  // ==========================================================

  const queryClient =
    useQueryClient();


  // ==========================================================
  // MEMBROS
  // ==========================================================

  const {
    data:
      membros = [],

    isLoading,

    isError,

    error,
  } =
    useQuery({

      queryKey:
        [
          "membros",
        ],

      queryFn:
        getMembros,

    });


  // ==========================================================
  // CARGOS DISPONÍVEIS NOS MEMBROS
  // ==========================================================

  const cargos =
    useMemo(
      () => {

        const map =
          new Map();


        membros.forEach(
          (
            membro
          ) => {

            const role =
              getMemberRole(
                membro
              );


            if (
              !role
            ) {

              return;

            }


            const key =
              role.id ??
              role.slug ??
              getRoleName(
                role
              );


            map.set(
              key,
              role
            );

          }
        );


        return [
          ...map.values(),
        ].sort(
          (
            a,
            b
          ) =>
            getRoleHierarchy(
              a
            ) -
            getRoleHierarchy(
              b
            )
        );

      },
      [
        membros,
      ]
    );


  // ==========================================================
  // DEPARTAMENTOS EXISTENTES
  // ==========================================================

  const departments =
    useMemo(
      () => {

        const values =
          membros.flatMap(
            (
              membro
            ) =>
              getMemberDepartments(
                membro
              )
          );


        return [
          ...new Set(
            values
          ),
        ].sort(
          (
            a,
            b
          ) =>
            String(
              a
            ).localeCompare(
              String(
                b
              ),
              "pt-BR"
            )
        );

      },
      [
        membros,
      ]
    );


  // ==========================================================
  // MEMBROS FILTRADOS
  // ==========================================================

  const filtered =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        return [
          ...membros,
        ]

          // ----------------------------------------------------
          // BUSCA
          // ----------------------------------------------------

          .filter(
            (
              membro
            ) => {

              if (
                !query
              ) {

                return true;

              }


              const role =
                getMemberRole(
                  membro
                );


              const name =
                getMemberName(
                  membro
                );


              const roleName =
                getRoleName(
                  role
                );


              const codename =
                membro?.codinome ||
                membro?.codename ||
                "";


              return (

                name
                  .toLowerCase()
                  .includes(
                    query
                  )

                ||

                roleName
                  .toLowerCase()
                  .includes(
                    query
                  )

                ||

                codename
                  .toLowerCase()
                  .includes(
                    query
                  )

              );

            }
          )


          // ----------------------------------------------------
          // CARGO
          // ----------------------------------------------------

          .filter(
            (
              membro
            ) => {

              if (
                roleFilter ===
                "all"
              ) {

                return true;

              }


              const role =
                getMemberRole(
                  membro
                );


              return (
                getRoleName(
                  role
                ) ===
                roleFilter
              );

            }
          )


          // ----------------------------------------------------
          // STATUS
          // ----------------------------------------------------

          .filter(
            (
              membro
            ) => {

              if (
                statusFilter ===
                "all"
              ) {

                return true;

              }


              return (
                getMemberStatus(
                  membro
                ) ===
                statusFilter
              );

            }
          )


          // ----------------------------------------------------
          // DEPARTAMENTO
          // ----------------------------------------------------

          .filter(
            (
              membro
            ) => {

              if (
                departmentFilter ===
                "all"
              ) {

                return true;

              }


              return getMemberDepartments(
                membro
              ).includes(
                departmentFilter
              );

            }
          )


          // ----------------------------------------------------
          // ORDENAÇÃO
          // ----------------------------------------------------

          .sort(
            (
              a,
              b
            ) => {

              const roleA =
                getMemberRole(
                  a
                );


              const roleB =
                getMemberRole(
                  b
                );


              const hierarchyA =
                getRoleHierarchy(
                  roleA
                );


              const hierarchyB =
                getRoleHierarchy(
                  roleB
                );


              if (
                hierarchyA !==
                hierarchyB
              ) {

                return (
                  hierarchyA -
                  hierarchyB
                );

              }


              return getMemberName(
                a
              ).localeCompare(
                getMemberName(
                  b
                ),
                "pt-BR"
              );

            }
          );

      },
      [
        membros,
        search,
        roleFilter,
        statusFilter,
        departmentFilter,
      ]
    );


  // ==========================================================
  // GRUPOS POR CARGO
  // ==========================================================

  const groups =
    useMemo(
      () => {

        const map =
          new Map();


        filtered.forEach(
          (
            membro
          ) => {

            const role =
              getMemberRole(
                membro
              );


            const roleName =
              getRoleName(
                role
              );


            const groupKey =
              role?.id ??
              role?.slug ??
              roleName;


            if (
              !map.has(
                groupKey
              )
            ) {

              map.set(
                groupKey,
                {

                  key:
                    groupKey,

                  name:
                    roleName,

                  level:
                    getRoleTier(
                      role
                    ),

                  order:
                    getRoleHierarchy(
                      role
                    ),

                  members:
                    [],

                }
              );

            }


            map
              .get(
                groupKey
              )
              .members
              .push(
                membro
              );

          }
        );


        return [
          ...map.values(),
        ].sort(
          (
            a,
            b
          ) =>
            a.order -
            b.order
        );

      },
      [
        filtered,
      ]
    );


  // ==========================================================
  // CONVERSÃO PARA MEMBER CARD
  // ==========================================================

  function toCard(
    membro
  ) {

    const role =
      getMemberRole(
        membro
      );


    return {

      // -------------------------------------------------------
      // Membro.id
      // -------------------------------------------------------

      id:
        membro?.id,


      // -------------------------------------------------------
      // Usuario.id
      // -------------------------------------------------------

      user_id:
        membro?.usuarioId,

      usuarioId:
        membro?.usuarioId,


      // -------------------------------------------------------
      // Dados visuais
      // -------------------------------------------------------

      name:
        getMemberName(
          membro
        ),

      role:
        getRoleName(
          role
        ),

      codename:
        membro?.codinome ||
        membro?.codename ||
        null,

      avatar_url:
        membro?.avatarUrl ||
        membro?.avatar_url ||
        null,

      bio:
        membro?.bio ||
        null,

      status:
        getMemberStatus(
          membro
        ),

      departments:
        getMemberDepartments(
          membro
        ),

    };

  }


  // ==========================================================
  // ABRIR EDIÇÃO
  // ==========================================================

  function openEdit(
    membro
  ) {

    if (
      !canOpenEditor
    ) {

      return;

    }


    const role =
      getMemberRole(
        membro
      );


    const departments =
      getMemberDepartments(
        membro
      );


    setEditingUser({

      // ======================================================
      // USUARIO.ID
      // ======================================================
      //
      // Usado por:
      //
      // updateUser()
      // updateUserRole()
      // updateUserStatus()
      // deleteUser()
      // UserLink
      //
      // ======================================================

      id:
        membro?.usuarioId,

      user_id:
        membro?.usuarioId,

      usuarioId:
        membro?.usuarioId,


      // ======================================================
      // MEMBRO.ID
      // ======================================================
      //
      // Usado exclusivamente por:
      //
      // updateMembro()
      //
      // ======================================================

      membroId:
        membro?.id,


      // ======================================================
      // USUÁRIO
      // ======================================================

      full_name:
        getMemberName(
          membro
        ),

      nome:
        getMemberName(
          membro
        ),

      email:
        membro?.email ||
        "",


      // ======================================================
      // ROLE
      // ======================================================

      cargo:
        getRoleName(
          role
        ),

      role,

      roleId:
        role?.id ||
        null,


      // ======================================================
      // PERFIL DO MEMBRO
      // ======================================================

      departments,

      departamentos:
        departments,

      status:
        getMemberStatus(
          membro
        ),

      codinome:
        membro?.codinome ||
        membro?.codename ||
        "",

      codename:
        membro?.codinome ||
        membro?.codename ||
        "",

      avatarUrl:
        membro?.avatarUrl ||
        membro?.avatar_url ||
        null,

      avatar_url:
        membro?.avatarUrl ||
        membro?.avatar_url ||
        null,

      bio:
        membro?.bio ||
        null,

    });

  }


  // ==========================================================
  // APÓS SALVAR
  // ==========================================================

  function handleUserSaved() {

    queryClient.invalidateQueries({

      queryKey:
        [
          "membros",
        ],

    });


    queryClient.invalidateQueries({

      queryKey:
        [
          "all-users",
        ],

    });


    setEditingUser(
      null
    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="min-h-screen px-4 py-16">

      <div className="max-w-5xl mx-auto">


        {/* ====================================================
            HEADER
            ==================================================== */}

        <motion.div

          initial={{
            opacity: 0,
            y: 20,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          className="text-center mb-12"

        >

          <Users
            className="w-8 h-8 mx-auto mb-4 text-muted-foreground"
          />


          <h1 className="font-heading text-4xl font-bold tracking-[0.15em] text-primary mb-2">

            MEMBROS

          </h1>


          <div className="w-16 h-[1px] bg-primary/30 mx-auto mb-4" />


          <p className="text-muted-foreground text-sm">

            Os pilares da família Cartel

          </p>

        </motion.div>


        {/* ====================================================
            FILTROS
            ==================================================== */}

        <div className="mb-8">


          {/* BUSCA */}

          <div className="relative max-w-sm mx-auto mb-6">

            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            />


            <Input

              value={
                search
              }

              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }

              placeholder="Buscar por nome, codinome ou cargo..."

              className="pl-9 bg-card border-border font-body text-sm"

            />

          </div>


          {/* CARGO + STATUS */}

          <div className="flex flex-wrap items-center gap-3 mb-6 justify-center">

            <Filter
              className="w-4 h-4 text-muted-foreground"
            />


            <Select

              value={
                roleFilter
              }

              onValueChange={
                setRoleFilter
              }

            >

              <SelectTrigger className="w-40 bg-card border-border font-heading text-xs tracking-wider">

                <SelectValue
                  placeholder="Cargo"
                />

              </SelectTrigger>


              <SelectContent>

                <SelectItem
                  value="all"
                >

                  Todos os Cargos

                </SelectItem>


                {cargos.map(
                  (
                    cargo
                  ) => {

                    const roleName =
                      getRoleName(
                        cargo
                      );


                    return (

                      <SelectItem

                        key={
                          cargo.id ||
                          cargo.slug ||
                          roleName
                        }

                        value={
                          roleName
                        }

                      >

                        {roleName}

                      </SelectItem>

                    );

                  }
                )}

              </SelectContent>

            </Select>


            <Select

              value={
                statusFilter
              }

              onValueChange={
                setStatusFilter
              }

            >

              <SelectTrigger className="w-36 bg-card border-border font-heading text-xs tracking-wider">

                <SelectValue
                  placeholder="Status"
                />

              </SelectTrigger>


              <SelectContent>

                <SelectItem
                  value="all"
                >
                  Todos
                </SelectItem>

                <SelectItem
                  value="Ativo"
                >
                  Ativo
                </SelectItem>

                <SelectItem
                  value="Inativo"
                >
                  Inativo
                </SelectItem>

                <SelectItem
                  value="Afastado"
                >
                  Afastado
                </SelectItem>

              </SelectContent>

            </Select>

          </div>


          {/* DEPARTAMENTOS */}

          {departments.length > 0 && (

            <div className="flex flex-wrap justify-center gap-3">

              <motion.button

                type="button"

                whileHover={{
                  scale: 1.05,
                }}

                onClick={() =>
                  setDepartmentFilter(
                    "all"
                  )
                }

                className={`px-4 py-2 rounded-lg border text-sm font-heading tracking-wider transition-colors ${
                  departmentFilter ===
                  "all"

                    ? "bg-primary text-primary-foreground border-primary"

                    : "bg-card border-border hover:bg-accent"
                }`}

              >

                Todos

              </motion.button>


              {departments.map(
                (
                  department
                ) => (

                  <motion.button

                    key={
                      department
                    }

                    type="button"

                    whileHover={{
                      scale: 1.05,
                    }}

                    onClick={() =>
                      setDepartmentFilter(
                        department
                      )
                    }

                    className={`px-4 py-2 rounded-lg border text-sm font-heading tracking-wider transition-colors ${
                      departmentFilter ===
                      department

                        ? "bg-primary text-primary-foreground border-primary"

                        : "bg-card border-border hover:bg-accent"
                    }`}

                  >

                    {department}

                  </motion.button>

                )
              )}

            </div>

          )}

        </div>


        {/* ====================================================
            ERRO / LOADING / VAZIO
            ==================================================== */}

        {isError ? (

          <div className="text-center py-20">

            <p className="text-red-400 text-sm">

              {
                error?.message ||
                "Não foi possível carregar os membros."
              }

            </p>

          </div>

        ) : isLoading ? (

          <div className="flex justify-center py-20">

            <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />

          </div>

        ) : filtered.length ===
          0 ? (

          <div className="text-center py-20">

            <p className="text-muted-foreground text-sm">

              Nenhum membro encontrado.

            </p>

          </div>

        ) : (

          /* ==================================================
             GRUPOS
             ================================================== */

          <div className="space-y-10">

            {groups.map(
              (
                group,
                groupIndex
              ) => {

                const style =
                  tierStyle[
                    group.level
                  ] ||
                  tierStyle[5];


                return (

                  <motion.div

                    key={
                      group.key
                    }

                    initial={{
                      opacity: 0,
                      y: 20,
                    }}

                    animate={{
                      opacity: 1,
                      y: 0,
                    }}

                    transition={{
                      delay:
                        groupIndex *
                        0.05,
                    }}

                  >

                    {/* CABEÇALHO DO GRUPO */}

                    <div className="flex items-center gap-3 mb-4">

                      <div
                        className={`w-1 h-6 rounded-full ${style.bar}`}
                      />


                      <span
                        className={`font-heading text-[11px] tracking-[0.3em] ${style.text}`}
                      >

                        {group.name}

                      </span>


                      <div className="flex-1 h-[1px] bg-border/40" />


                      <span
                        className={`font-heading text-[9px] tracking-[0.2em] border rounded px-1.5 py-0.5 ${style.badge}`}
                      >

                        {group.members.length}

                      </span>

                    </div>


                    {/* CARDS */}

                    <div className="grid grid-cols-1 gap-3 pl-4">

                      {group.members.map(
                        (
                          membro,
                          index
                        ) => (

                          <MemberCard

                            key={
                              membro?.id
                            }

                            member={
                              toCard(
                                membro
                              )
                            }

                            index={
                              index
                            }

                            onEdit={
                              canOpenEditor

                                ? () =>
                                    openEdit(
                                      membro
                                    )

                                : null
                            }

                          />

                        )
                      )}

                    </div>

                  </motion.div>

                );

              }
            )}

          </div>

        )}

      </div>


      {/* ======================================================
          MODAL DE EDIÇÃO
          ====================================================== */}

      {editingUser && (

        <UserEditModal

          user={
            editingUser
          }

          onClose={() =>
            setEditingUser(
              null
            )
          }

          onSaved={
            handleUserSaved
          }

        />

      )}

    </div>

  );

}