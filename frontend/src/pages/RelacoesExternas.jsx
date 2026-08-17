// ============================================================
// RELAÇÕES EXTERNAS
// ============================================================
//
// Página principal do módulo de Relações.
//
// AUTORIZAÇÃO:
//
// visualizar_relacoes
// OU
// gerenciar_relacoes
//
// O backend continua sendo a autoridade para determinar quais
// organizações realmente podem ser visualizadas.
//
// ESTATÍSTICA "EM NEGOCIAÇÃO":
//
// Uma organização é considerada em negociação quando possui
// pelo menos uma negociação:
//
// - Pendente
// - Em andamento
//
// Essa informação já vem agregada pelo backend.
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
  Building2,
  Filter,
  Globe,
  Plus,
  Search,
  ShieldX,
} from "lucide-react";


// ============================================================
// UI
// ============================================================

import {
  Button,
} from "@/components/ui/button";

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

import OrganizationCard
  from "@/components/relacoes/OrganizationCard";

import OrganizationFormModal
  from "@/components/relacoes/OrganizationFormModal";


// ============================================================
// RBAC
// ============================================================

import {
  usePermissions,
} from "@/hooks/usePermissions";


// ============================================================
// API
// ============================================================

import {
  createOrganization,
  deleteOrganization,
  getOrganizations,
  updateOrganization,
} from "@/services/api";


// ============================================================
// STATUS
// ============================================================

const STATUS_OPTIONS = [
  "Aliada",
  "Parceira",
  "Neutra",
  "Em observação",
  "Hostil",
  "Inimiga",
];


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// ORGANIZAÇÃO EM NEGOCIAÇÃO
// ------------------------------------------------------------
//
// Formato canônico:
//
// emNegociacao
//
// Mantemos aliases enquanto concluímos a migração.
//
// ------------------------------------------------------------

function hasOpenNegotiation(
  organization
) {

  return Boolean(

    organization?.emNegociacao ??

    organization?.em_negociacao ??

    organization?.hasOpenNegotiation ??

    organization?.has_open_negotiation ??

    false

  );

}


// ------------------------------------------------------------
// NORMALIZA ORDER
// ------------------------------------------------------------

function getOrganizationOrder(
  organization
) {

  const value =
    Number(
      organization?.order
    );


  return Number.isFinite(
    value
  )
    ? value
    : 999;

}


// ============================================================
// COMPONENTE
// ============================================================

export default function RelacoesExternas() {

  // ==========================================================
  // RBAC
  // ==========================================================

  const {
    can,
    canAny,
  } =
    usePermissions();


  const canView =
    typeof canAny ===
      "function"

      ? canAny([
          "visualizar_relacoes",
          "gerenciar_relacoes",
        ])

      : (
          can(
            "visualizar_relacoes"
          ) ||
          can(
            "gerenciar_relacoes"
          )
        );


  const canManage =
    can(
      "gerenciar_relacoes"
    );


  // ==========================================================
  // FILTROS
  // ==========================================================

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState(
      "all"
    );


  const [
    cityFilter,
    setCityFilter,
  ] =
    useState(
      "all"
    );


  // ==========================================================
  // MODAL
  // ==========================================================

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(
      false
    );


  const [
    editingOrg,
    setEditingOrg,
  ] =
    useState(
      null
    );


  // ==========================================================
  // ERRO DE OPERAÇÃO
  // ==========================================================

  const [
    operationError,
    setOperationError,
  ] =
    useState(
      ""
    );


  // ==========================================================
  // QUERY CLIENT
  // ==========================================================

  const queryClient =
    useQueryClient();


  // ==========================================================
  // ORGANIZAÇÕES
  // ==========================================================

  const {

    data:
      organizationsResponse,

    isLoading,

    isError,

    error,

  } =
    useQuery({

      queryKey: [
        "organizations",
      ],

      queryFn:
        getOrganizations,

      enabled:
        canView,

    });


  // ==========================================================
  // NORMALIZA ORGANIZAÇÕES
  // ==========================================================

  const organizations =
    useMemo(
      () => {

        if (
          Array.isArray(
            organizationsResponse
          )
        ) {

          return organizationsResponse;

        }


        if (
          Array.isArray(
            organizationsResponse?.organizations
          )
        ) {

          return organizationsResponse.organizations;

        }


        return [];

      },
      [
        organizationsResponse,
      ]
    );


  // ==========================================================
  // ESTATÍSTICAS
  // ==========================================================
  //
  // Não calculamos autorização aqui.
  //
  // organizations já contém somente os registros que o
  // backend autorizou para o usuário atual.
  //
  // ==========================================================

  const stats =
    useMemo(
      () => ({

        total:
          organizations.length,

        aliadas:
          organizations.filter(
            (
              organization
            ) =>
              organization?.status ===
              "Aliada"
          ).length,

        parceiras:
          organizations.filter(
            (
              organization
            ) =>
              organization?.status ===
              "Parceira"
          ).length,

        emNegociacao:
          organizations.filter(
            hasOpenNegotiation
          ).length,

        observacao:
          organizations.filter(
            (
              organization
            ) =>
              organization?.status ===
              "Em observação"
          ).length,

        hostis:
          organizations.filter(
            (
              organization
            ) =>
              organization?.status ===
                "Hostil" ||
              organization?.status ===
                "Inimiga"
          ).length,

      }),
      [
        organizations,
      ]
    );


  // ==========================================================
  // CIDADES
  // ==========================================================

  const cities =
    useMemo(
      () =>
        [
          ...new Set(

            organizations

              .map(
                (
                  organization
                ) =>
                  String(
                    organization?.city ??
                    ""
                  ).trim()
              )

              .filter(
                Boolean
              )

          ),
        ].sort(
          (
            a,
            b
          ) =>
            a.localeCompare(
              b,
              "pt-BR"
            )
        ),
      [
        organizations,
      ]
    );


  // ==========================================================
  // FILTRAGEM + ORDENAÇÃO
  // ==========================================================

  const sortedFiltered =
    useMemo(
      () => {

        const q =
          String(
            search ??
            ""
          )
            .toLocaleLowerCase(
              "pt-BR"
            )
            .trim();


        return organizations

          // --------------------------------------------------
          // BUSCA
          // --------------------------------------------------

          .filter(
            (
              organization
            ) => {

              if (
                !q
              ) {

                return true;

              }


              const name =
                String(
                  organization?.name ??
                  ""
                ).toLocaleLowerCase(
                  "pt-BR"
                );


              const leader =
                String(
                  organization?.leader ??
                  ""
                ).toLocaleLowerCase(
                  "pt-BR"
                );


              return (
                name.includes(
                  q
                ) ||
                leader.includes(
                  q
                )
              );

            }
          )


          // --------------------------------------------------
          // STATUS
          // --------------------------------------------------

          .filter(
            (
              organization
            ) =>
              statusFilter ===
                "all" ||
              organization?.status ===
                statusFilter
          )


          // --------------------------------------------------
          // CIDADE
          // --------------------------------------------------

          .filter(
            (
              organization
            ) =>
              cityFilter ===
                "all" ||
              organization?.city ===
                cityFilter
          )


          // --------------------------------------------------
          // ORDENAÇÃO
          // --------------------------------------------------

          .sort(
            (
              a,
              b
            ) => {

              const orderDifference =
                getOrganizationOrder(
                  a
                ) -
                getOrganizationOrder(
                  b
                );


              if (
                orderDifference !==
                0
              ) {

                return orderDifference;

              }


              return String(
                a?.name ??
                ""
              ).localeCompare(
                String(
                  b?.name ??
                  ""
                ),
                "pt-BR"
              );

            }
          );

      },
      [
        organizations,
        search,
        statusFilter,
        cityFilter,
      ]
    );


  // ==========================================================
  // ABRIR MODAL DE CRIAÇÃO
  // ==========================================================

  function openAdd() {

    if (
      !canManage
    ) {

      return;

    }


    setOperationError(
      ""
    );


    setEditingOrg(
      null
    );


    setModalOpen(
      true
    );

  }


  // ==========================================================
  // ABRIR MODAL DE EDIÇÃO
  // ==========================================================

  function openEdit(
    organization
  ) {

    if (
      !canManage ||
      !organization?.id
    ) {

      return;

    }


    setOperationError(
      ""
    );


    setEditingOrg(
      organization
    );


    setModalOpen(
      true
    );

  }


  // ==========================================================
  // FECHAR MODAL
  // ==========================================================

  function closeModal() {

    setModalOpen(
      false
    );


    setEditingOrg(
      null
    );

  }


  // ==========================================================
  // INVALIDAR LISTAGEM
  // ==========================================================

  async function invalidateOrganizations() {

    await queryClient.invalidateQueries({

      queryKey: [
        "organizations",
      ],

    });

  }


  // ==========================================================
  // SALVAR
  // ==========================================================

  async function handleSave(
    form
  ) {

    if (
      !canManage
    ) {

      throw new Error(
        "Você não possui permissão para gerenciar relações."
      );

    }


    setOperationError(
      ""
    );


    try {

      if (
        editingOrg?.id
      ) {

        await updateOrganization(
          editingOrg.id,
          form
        );

      } else {

        // ----------------------------------------------------
        // Não forçamos order = 0.
        //
        // O backend/model continua responsável pelo valor
        // padrão quando order não for informado.
        // ----------------------------------------------------

        await createOrganization(
          form
        );

      }


      await invalidateOrganizations();


      closeModal();

    } catch (
      saveError
    ) {

      console.error(
        "[RelacoesExternas] erro ao salvar organização:",
        saveError
      );


      setOperationError(

        saveError?.message ||

        "Não foi possível salvar a organização."

      );


      throw saveError;

    }

  }


  // ==========================================================
  // EXCLUIR
  // ==========================================================

  async function handleDelete(
    id
  ) {

    if (
      !canManage
    ) {

      throw new Error(
        "Você não possui permissão para excluir organizações."
      );

    }


    if (
      !id
    ) {

      throw new Error(
        "Organização inválida."
      );

    }


    setOperationError(
      ""
    );


    try {

      await deleteOrganization(
        id
      );


      await invalidateOrganizations();


      closeModal();

    } catch (
      deleteError
    ) {

      console.error(
        "[RelacoesExternas] erro ao excluir organização:",
        deleteError
      );


      setOperationError(

        deleteError?.message ||

        "Não foi possível excluir a organização."

      );


      throw deleteError;

    }

  }


  // ==========================================================
  // ACESSO NEGADO
  // ==========================================================

  if (
    !canView
  ) {

    return (

      <div className="min-h-screen flex items-center justify-center px-4">

        <div className="text-center">

          <ShieldX
            className="w-12 h-12 mx-auto mb-4 text-red-400"
            aria-hidden="true"
          />


          <h1 className="font-heading text-2xl font-bold tracking-[0.15em] text-red-400 mb-2">

            ACESSO NEGADO

          </h1>


          <p className="text-muted-foreground text-sm">

            Você não possui permissão para acessar esta área.

          </p>

        </div>

      </div>

    );

  }


  // ==========================================================
  // CARDS DE ESTATÍSTICA
  // ==========================================================

  const statCards = [

    {
      label:
        "TOTAL",

      value:
        stats.total,

      color:
        "text-primary",
    },

    {
      label:
        "ALIANÇAS ATIVAS",

      value:
        stats.aliadas,

      color:
        "text-green-400",
    },

    {
      label:
        "PARCERIAS",

      value:
        stats.parceiras,

      color:
        "text-blue-400",
    },

    {
      label:
        "EM NEGOCIAÇÃO",

      value:
        stats.emNegociacao,

      color:
        "text-yellow-400",
    },

    {
      label:
        "EM OBSERVAÇÃO",

      value:
        stats.observacao,

      color:
        "text-orange-400",
    },

    {
      label:
        "HOSTIS",

      value:
        stats.hostis,

      color:
        "text-red-400",
    },

  ];


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
            opacity:
              0,

            y:
              20,
          }}

          animate={{
            opacity:
              1,

            y:
              0,
          }}

          className="text-center mb-12"

        >

          <Globe
            className="w-8 h-8 mx-auto mb-4 text-muted-foreground"
            aria-hidden="true"
          />


          <h1 className="font-heading text-4xl font-bold tracking-[0.15em] text-primary mb-2">

            RELAÇÕES EXTERNAS

          </h1>


          <div className="w-16 h-[1px] bg-primary/30 mx-auto mb-4" />


          <p className="text-muted-foreground text-sm">

            Inteligência institucional — gestão de relações com organizações externas

          </p>


          {canManage && (

            <Button

              onClick={
                openAdd
              }

              className="mt-6 font-heading text-xs tracking-[0.15em] bg-primary text-primary-foreground hover:bg-primary/90"

            >

              <Plus
                className="w-4 h-4 mr-2"
                aria-hidden="true"
              />

              ADICIONAR FAMÍLIA

            </Button>

          )}

        </motion.div>


        {/* ====================================================
            ESTATÍSTICAS
            ==================================================== */}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">

          {statCards.map(
            (
              stat,
              index
            ) => (

              <motion.div

                key={
                  stat.label
                }

                initial={{
                  opacity:
                    0,

                  y:
                    20,
                }}

                animate={{
                  opacity:
                    1,

                  y:
                    0,
                }}

                transition={{
                  delay:
                    index *
                    0.05,
                }}

                className="bg-card border border-border rounded-lg p-4 text-center"

              >

                <p
                  className={`font-heading text-3xl font-bold ${stat.color}`}
                >

                  {
                    isLoading
                      ? "—"
                      : stat.value
                  }

                </p>


                <p className="font-heading text-[9px] tracking-[0.2em] text-muted-foreground mt-1">

                  {stat.label}

                </p>

              </motion.div>

            )
          )}

        </div>


        {/* ====================================================
            ERRO DA LISTAGEM
            ==================================================== */}

        {isError && (

          <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">

            <p className="text-sm text-red-400">

              {
                error?.message ||
                "Não foi possível carregar as organizações."
              }

            </p>

          </div>

        )}


        {/* ====================================================
            ERRO DE OPERAÇÃO
            ==================================================== */}

        {operationError &&
        !modalOpen && (

          <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">

            <p className="text-sm text-red-400">

              {operationError}

            </p>

          </div>

        )}


        {/* ====================================================
            FILTROS
            ==================================================== */}

        <div className="mb-8">

          <div className="relative max-w-sm mx-auto mb-4">

            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
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

              placeholder="Buscar por nome ou líder..."

              className="pl-9 bg-card border-border font-body text-sm"

            />

          </div>


          <div className="flex flex-wrap items-center gap-3 justify-center">

            <Filter
              className="w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />


            {/* ================================================
                STATUS
                ================================================ */}

            <Select

              value={
                statusFilter
              }

              onValueChange={
                setStatusFilter
              }

            >

              <SelectTrigger className="w-40 bg-card border-border font-heading text-xs tracking-wider">

                <SelectValue />

              </SelectTrigger>


              <SelectContent>

                <SelectItem
                  value="all"
                >

                  Todos os Status

                </SelectItem>


                {STATUS_OPTIONS.map(
                  (
                    status
                  ) => (

                    <SelectItem

                      key={
                        status
                      }

                      value={
                        status
                      }

                    >

                      {status}

                    </SelectItem>

                  )
                )}

              </SelectContent>

            </Select>


            {/* ================================================
                CIDADE
                ================================================ */}

            <Select

              value={
                cityFilter
              }

              onValueChange={
                setCityFilter
              }

            >

              <SelectTrigger className="w-40 bg-card border-border font-heading text-xs tracking-wider">

                <SelectValue />

              </SelectTrigger>


              <SelectContent>

                <SelectItem
                  value="all"
                >

                  Todas as Cidades

                </SelectItem>


                {cities.map(
                  (
                    city
                  ) => (

                    <SelectItem

                      key={
                        city
                      }

                      value={
                        city
                      }

                    >

                      {city}

                    </SelectItem>

                  )
                )}

              </SelectContent>

            </Select>

          </div>

        </div>


        {/* ====================================================
            LISTAGEM
            ==================================================== */}

        {isLoading ? (

          <div className="flex justify-center py-20">

            <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />

          </div>

        ) : isError ? (

          <div className="text-center py-20">

            <Building2
              className="w-8 h-8 mx-auto mb-3 text-red-400/50"
              aria-hidden="true"
            />


            <p className="text-sm text-muted-foreground">

              Não foi possível exibir as organizações.

            </p>

          </div>

        ) : sortedFiltered.length ===
          0 ? (

          <div className="text-center py-20">

            <Building2
              className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40"
              aria-hidden="true"
            />


            <p className="text-sm text-muted-foreground">

              Nenhuma organização encontrada.

            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {sortedFiltered.map(
              (
                organization,
                index
              ) => (

                <OrganizationCard

                  key={
                    organization.id
                  }

                  org={
                    organization
                  }

                  index={
                    index
                  }

                  onEdit={
                    canManage
                      ? openEdit
                      : null
                  }

                  onDelete={
                    canManage
                      ? handleDelete
                      : null
                  }

                />

              )
            )}

          </div>

        )}

      </div>


      {/* ======================================================
          MODAL
          ====================================================== */}

      {canManage && (

        <OrganizationFormModal

          open={
            modalOpen
          }

          org={
            editingOrg
          }

          onClose={
            closeModal
          }

          onSave={
            handleSave
          }

          onDelete={
            handleDelete
          }

        />

      )}

    </div>

  );

}