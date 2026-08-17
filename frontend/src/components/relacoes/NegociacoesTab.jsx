// ============================================================
// ABA "NEGOCIAÇÕES" DA ORGANIZAÇÃO
// ============================================================
//
// Exibe e gerencia negociações relacionadas a uma organização.
//
// Fluxo:
//
// NegociacoesTab
//      ↓
// services/api.js
//      ↓
// Express
//      ↓
// JWT + RBAC
//      ↓
// organizationController
//      ↓
// Sequelize / MySQL
//
// PERMISSÕES:
//
// OrganizationDetail informa:
//
// canEdit = gerenciar_relacoes
//
// USUÁRIOS RESPONSÁVEIS:
//
// A lista de responsáveis é obtida por:
//
// GET /api/organizations/responsible-users
//
// Esse endpoint exige:
//
// gerenciar_relacoes
//
// e retorna somente usuários elegíveis para novas atribuições.
//
// O backend continua sendo a autoridade final.
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
  useMutation,
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
  CalendarDays,
  Handshake,
  Pencil,
  Plus,
  User,
} from "lucide-react";


// ============================================================
// UI
// ============================================================

import {
  Button,
} from "@/components/ui/button";


// ============================================================
// MODAL
// ============================================================

import NegotiationFormModal
  from "@/components/relacoes/NegotiationFormModal";


// ============================================================
// API
// ============================================================

import {
  createOrganizationNegotiation,
  deleteOrganizationNegotiation,
  getOrganizationNegotiations,
  getOrganizationResponsibleUsers,
  updateOrganizationNegotiation,
} from "@/services/api";


// ============================================================
// STATUS
// ============================================================
//
// Correspondem exatamente ao ENUM:
//
// OrganizationNegotiation.status
//
// ============================================================

const NEGOTIATION_STATUS_CONFIG = {

  Pendente:
    "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",

  "Em andamento":
    "bg-blue-500/15 text-blue-400 border-blue-500/30",

  Concluída:
    "bg-green-500/15 text-green-400 border-green-500/30",

  Cancelada:
    "bg-red-500/15 text-red-400 border-red-500/30",

};


const UNKNOWN_STATUS_CLASS =
  "bg-muted/50 text-muted-foreground border-border";


// ============================================================
// NORMALIZA RESPOSTA DAS NEGOCIAÇÕES
// ============================================================

function normalizeNegotiationsResponse(
  response
) {

  if (
    Array.isArray(
      response
    )
  ) {

    return response;

  }


  if (
    Array.isArray(
      response?.negotiations
    )
  ) {

    return response.negotiations;

  }


  return [];

}


// ============================================================
// NORMALIZA RESPOSTA DE USUÁRIOS RESPONSÁVEIS
// ============================================================
//
// services/api.js atualmente já normaliza:
//
// {
//   users: [...]
// }
//
// para:
//
// [...]
//
// Mesmo assim mantemos compatibilidade com ambas as formas.
//
// ============================================================

function normalizeResponsibleUsersResponse(
  response
) {

  let users;


  if (
    Array.isArray(
      response
    )
  ) {

    users =
      response;

  } else if (
    Array.isArray(
      response?.users
    )
  ) {

    users =
      response.users;

  } else if (
    Array.isArray(
      response?.usuarios
    )
  ) {

    users =
      response.usuarios;

  } else {

    users =
      [];

  }


  // ==========================================================
  // NORMALIZAÇÃO DEFENSIVA
  // ==========================================================
  //
  // O endpoint deveria retornar somente:
  //
  // {
  //   id,
  //   nome,
  //   email
  // }
  //
  // Ainda assim filtramos IDs inválidos e duplicados.
  //
  // ==========================================================

  const result =
    [];


  const usedIds =
    new Set();


  for (
    const user
    of users
  ) {

    const id =
      Number(
        user?.id
      );


    if (
      !Number.isInteger(
        id
      ) ||
      id <=
        0 ||
      usedIds.has(
        id
      )
    ) {

      continue;

    }


    usedIds.add(
      id
    );


    result.push({

      id,

      nome:
        String(
          user?.nome ??
          user?.name ??
          `Usuário #${id}`
        ).trim(),

      email:
        String(
          user?.email ??
          ""
        ).trim(),

    });

  }


  return result.sort(
    (
      a,
      b
    ) =>
      a.nome.localeCompare(
        b.nome,
        "pt-BR"
      )
  );

}


// ============================================================
// NORMALIZA DATA LIMITE
// ============================================================

function getDueDate(
  negotiation
) {

  return (

    negotiation?.dueDate ??

    negotiation?.due_date ??

    null

  );

}


// ============================================================
// FORMATA DATA
// ============================================================
//
// Tratamos YYYY-MM-DD separadamente para evitar alteração de
// dia por timezone.
//
// ============================================================

function formatDueDate(
  value
) {

  if (
    !value
  ) {

    return null;

  }


  const text =
    String(
      value
    ).trim();


  // ----------------------------------------------------------
  // DATA PURA OU PREFIXO DE ISO
  // ----------------------------------------------------------
  //
  // Também aceitamos:
  //
  // 2026-08-16T00:00:00.000Z
  //
  // preservando 16/08/2026.
  //
  // ----------------------------------------------------------

  const dateOnlyMatch =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );


  if (
    dateOnlyMatch
  ) {

    const [
      ,
      year,
      month,
      day,
    ] =
      dateOnlyMatch;


    return `${day}/${month}/${year}`;

  }


  // ----------------------------------------------------------
  // OUTROS FORMATOS
  // ----------------------------------------------------------

  const date =
    new Date(
      text
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;

  }


  return date.toLocaleDateString(
    "pt-BR"
  );

}


// ============================================================
// RESPONSÁVEL DA NEGOCIAÇÃO
// ============================================================
//
// Formato oficial:
//
// responsibleUser
//
// Compatibilidade:
//
// responsible_user
//
// Também reconhecemos formatos antigos apenas durante a
// migração.
//
// ============================================================

function getResponsibleUser(
  negotiation
) {

  return (

    negotiation?.responsibleUser ??

    negotiation?.responsible_user ??

    negotiation?.Usuario ??

    negotiation?.usuario ??

    null

  );

}


// ============================================================
// NOME DO RESPONSÁVEL
// ============================================================

function getResponsibleName(
  negotiation
) {

  const responsibleUser =
    getResponsibleUser(
      negotiation
    );


  const name =

    responsibleUser?.nome ??

    responsibleUser?.name ??

    negotiation?.responsibleName ??

    negotiation?.responsible ??

    null;


  if (
    !name
  ) {

    return null;

  }


  return (
    String(
      name
    ).trim() ||
    null
  );

}


// ============================================================
// COMPONENTE
// ============================================================

export default function NegociacoesTab({

  org,

  canEdit = false,

}) {

  // ==========================================================
  // ORGANIZAÇÃO
  // ==========================================================

  const organizationId =
    org?.id ??
    null;


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
    editingNeg,
    setEditingNeg,
  ] =
    useState(
      null
    );


  // ==========================================================
  // QUERY CLIENT
  // ==========================================================

  const queryClient =
    useQueryClient();


  // ==========================================================
  // BUSCA NEGOCIAÇÕES
  // ==========================================================

  const {

    data:
      negotiationsResponse,

    isLoading,

    isError,

    error,

  } =
    useQuery({

      queryKey: [
        "org-negotiations",
        organizationId,
      ],

      queryFn:
        () =>
          getOrganizationNegotiations(
            organizationId
          ),

      enabled:
        Boolean(
          organizationId
        ),

    });


  // ==========================================================
  // BUSCA USUÁRIOS RESPONSÁVEIS
  // ==========================================================
  //
  // Essa consulta é administrativa.
  //
  // Portanto somente ocorre quando:
  //
  // canEdit = true
  //
  // Isso corresponde a:
  //
  // gerenciar_relacoes
  //
  // O endpoint não depende da organização específica, portanto
  // sua queryKey também não inclui organizationId.
  //
  // ==========================================================

  const {

    data:
      responsibleUsersResponse,

    isLoading:
      responsibleUsersLoading,

    isError:
      responsibleUsersIsError,

    error:
      responsibleUsersQueryError,

  } =
    useQuery({

      queryKey: [
        "organization-responsible-users",
      ],

      queryFn:
        getOrganizationResponsibleUsers,

      enabled:
        Boolean(
          canEdit &&
          organizationId
        ),

      staleTime:
        60 * 1000,

    });


  // ==========================================================
  // NEGOCIAÇÕES NORMALIZADAS
  // ==========================================================

  const negotiations =
    useMemo(
      () =>
        normalizeNegotiationsResponse(
          negotiationsResponse
        ),
      [
        negotiationsResponse,
      ]
    );


  // ==========================================================
  // USUÁRIOS RESPONSÁVEIS NORMALIZADOS
  // ==========================================================

  const responsibleUsers =
    useMemo(
      () =>
        normalizeResponsibleUsersResponse(
          responsibleUsersResponse
        ),
      [
        responsibleUsersResponse,
      ]
    );


  // ==========================================================
  // ERRO DOS RESPONSÁVEIS
  // ==========================================================

  const responsibleUsersError =
    responsibleUsersIsError

      ? (
          responsibleUsersQueryError ??
          new Error(
            "Não foi possível carregar os usuários responsáveis."
          )
        )

      : null;


  // ==========================================================
  // INVALIDAR CACHE
  // ==========================================================
  //
  // Uma negociação pode alterar informações exibidas em:
  //
  // - aba atual
  // - detalhe da organização
  // - listagem geral
  // - futura estatística "Em negociação"
  //
  // ==========================================================

  async function invalidateNegotiations() {

    if (
      !organizationId
    ) {

      return;

    }


    await Promise.all([

      queryClient.invalidateQueries({

        queryKey: [
          "org-negotiations",
          organizationId,
        ],

      }),


      queryClient.invalidateQueries({

        queryKey: [
          "organization",
          organizationId,
        ],

      }),


      queryClient.invalidateQueries({

        queryKey: [
          "organizations",
        ],

      }),

    ]);

  }


  // ==========================================================
  // CRIAR
  // ==========================================================

  const createMutation =
    useMutation({

      mutationFn:
        (
          form
        ) => {

          if (
            !organizationId
          ) {

            throw new Error(
              "Organização inválida."
            );

          }


          return createOrganizationNegotiation(
            organizationId,
            form
          );

        },

      onSuccess:
        async () => {

          await invalidateNegotiations();

        },

    });


  // ==========================================================
  // ATUALIZAR
  // ==========================================================

  const updateMutation =
    useMutation({

      mutationFn:
        ({
          id,
          data,
        }) => {

          if (
            !organizationId
          ) {

            throw new Error(
              "Organização inválida."
            );

          }


          if (
            !id
          ) {

            throw new Error(
              "Negociação inválida."
            );

          }


          return updateOrganizationNegotiation(
            organizationId,
            id,
            data
          );

        },

      onSuccess:
        async () => {

          await invalidateNegotiations();

        },

    });


  // ==========================================================
  // EXCLUIR
  // ==========================================================

  const deleteMutation =
    useMutation({

      mutationFn:
        (
          negotiationId
        ) => {

          if (
            !organizationId
          ) {

            throw new Error(
              "Organização inválida."
            );

          }


          if (
            !negotiationId
          ) {

            throw new Error(
              "Negociação inválida."
            );

          }


          return deleteOrganizationNegotiation(
            organizationId,
            negotiationId
          );

        },

      onSuccess:
        async () => {

          await invalidateNegotiations();

        },

    });


  // ==========================================================
  // ABRIR NOVA NEGOCIAÇÃO
  // ==========================================================

  function openAdd() {

    if (
      !canEdit
    ) {

      return;

    }


    createMutation.reset();

    updateMutation.reset();

    deleteMutation.reset();


    setEditingNeg(
      null
    );


    setModalOpen(
      true
    );

  }


  // ==========================================================
  // EDITAR
  // ==========================================================

  function openEdit(
    negotiation
  ) {

    if (
      !canEdit ||
      !negotiation?.id
    ) {

      return;

    }


    createMutation.reset();

    updateMutation.reset();

    deleteMutation.reset();


    setEditingNeg(
      negotiation
    );


    setModalOpen(
      true
    );

  }


  // ==========================================================
  // FECHAR MODAL
  // ==========================================================

  function closeModal() {

    if (
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending
    ) {

      return;

    }


    setModalOpen(
      false
    );


    setEditingNeg(
      null
    );

  }


  // ==========================================================
  // SALVAR
  // ==========================================================

  async function handleSave(
    form
  ) {

    if (
      !canEdit
    ) {

      throw new Error(
        "Você não possui permissão para gerenciar negociações."
      );

    }


    if (
      editingNeg?.id
    ) {

      await updateMutation.mutateAsync({

        id:
          editingNeg.id,

        data:
          form,

      });

    } else {

      await createMutation.mutateAsync(
        form
      );

    }


    setModalOpen(
      false
    );


    setEditingNeg(
      null
    );

  }


  // ==========================================================
  // EXCLUIR
  // ==========================================================

  async function handleDelete(
    negotiationId
  ) {

    if (
      !canEdit
    ) {

      throw new Error(
        "Você não possui permissão para excluir negociações."
      );

    }


    if (
      !negotiationId
    ) {

      throw new Error(
        "Negociação inválida."
      );

    }


    await deleteMutation.mutateAsync(
      negotiationId
    );


    setModalOpen(
      false
    );


    setEditingNeg(
      null
    );

  }


  // ==========================================================
  // SALVANDO
  // ==========================================================

  const saving =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;


  // ==========================================================
  // ERRO DE MUTATION
  // ==========================================================

  const mutationError =

    createMutation.error ??

    updateMutation.error ??

    deleteMutation.error ??

    null;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div>


      {/* ====================================================
          NOVA NEGOCIAÇÃO
          ==================================================== */}

      {canEdit && (

        <div className="flex justify-end mb-4">

          <Button

            onClick={
              openAdd
            }

            disabled={
              saving ||
              !organizationId
            }

            className="font-heading text-xs tracking-wider bg-primary text-primary-foreground"

          >

            <Plus className="w-4 h-4 mr-2" />

            NOVA NEGOCIAÇÃO

          </Button>

        </div>

      )}


      {/* ====================================================
          CARREGANDO
          ==================================================== */}

      {isLoading ? (

        <div className="flex justify-center py-12">

          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />

        </div>

      ) : isError ? (

        /* ===================================================
           ERRO DE BUSCA
           =================================================== */

        <div className="text-center py-12">

          <Handshake className="w-8 h-8 mx-auto mb-3 text-red-400/60" />


          <p className="text-sm text-red-400">

            {
              error?.message ||
              "Não foi possível carregar as negociações."
            }

          </p>

        </div>

      ) : negotiations.length ===
        0 ? (

        /* ===================================================
           VAZIO
           =================================================== */

        <div className="text-center py-12">

          <Handshake className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />


          <p className="text-sm text-muted-foreground">

            Nenhuma negociação registrada.

          </p>

        </div>

      ) : (

        /* ===================================================
           LISTA
           =================================================== */

        <div className="space-y-3">

          {negotiations.map(
            (
              negotiation,
              index
            ) => {

              // ===============================================
              // STATUS
              // ===============================================

              const status =
                String(
                  negotiation?.status ??
                  ""
                ).trim();


              const statusClass =
                NEGOTIATION_STATUS_CONFIG[
                  status
                ] ??
                UNKNOWN_STATUS_CLASS;


              // ===============================================
              // TÍTULO
              // ===============================================

              const title =
                String(
                  negotiation?.title ??
                  ""
                ).trim() ||
                "Negociação";


              // ===============================================
              // RESPONSÁVEL
              // ===============================================

              const responsible =
                getResponsibleName(
                  negotiation
                );


              // ===============================================
              // PRAZO
              // ===============================================

              const dueDate =
                formatDueDate(
                  getDueDate(
                    negotiation
                  )
                );


              return (

                <motion.div

                  key={
                    negotiation.id
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

                  className="bg-background/50 border border-border rounded-lg p-4 group hover:border-primary/20 transition-all relative"

                >


                  {/* =========================================
                      EDITAR
                      ========================================= */}

                  {canEdit && (

                    <button

                      type="button"

                      onClick={() =>
                        openEdit(
                          negotiation
                        )
                      }

                      disabled={
                        saving
                      }

                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-muted-foreground hover:text-primary disabled:opacity-30 absolute top-3 right-3"

                      title="Editar negociação"

                      aria-label={`Editar negociação ${title}`}

                    >

                      <Pencil className="w-3.5 h-3.5" />

                    </button>

                  )}


                  {/* =========================================
                      CABEÇALHO
                      ========================================= */}

                  <div className="flex items-start justify-between gap-3 mb-2 pr-8">

                    <h4 className="font-heading text-sm font-semibold tracking-wide text-primary">

                      {title}

                    </h4>


                    {status && (

                      <span
                        className={`text-[9px] font-heading tracking-[0.15em] border rounded px-2 py-0.5 shrink-0 ${statusClass}`}
                      >

                        {status}

                      </span>

                    )}

                  </div>


                  {/* =========================================
                      DESCRIÇÃO
                      ========================================= */}

                  {negotiation?.description && (

                    <p className="text-sm text-muted-foreground font-body leading-relaxed mb-2 whitespace-pre-wrap break-words">

                      {negotiation.description}

                    </p>

                  )}


                  {/* =========================================
                      METADADOS
                      ========================================= */}

                  {(responsible ||
                    dueDate) && (

                    <div className="flex flex-wrap items-center gap-3 mt-3">


                      {/* =====================================
                          RESPONSÁVEL
                          ===================================== */}

                      {responsible && (

                        <p className="flex items-center gap-1.5 text-[10px] font-heading tracking-wider text-muted-foreground/60">

                          <User className="w-3 h-3 shrink-0" />

                          <span>

                            {responsible}

                          </span>

                        </p>

                      )}


                      {/* =====================================
                          PRAZO
                          ===================================== */}

                      {dueDate && (

                        <p className="flex items-center gap-1.5 text-[10px] font-heading tracking-wider text-muted-foreground/60">

                          <CalendarDays className="w-3 h-3 shrink-0" />

                          <span>

                            {dueDate}

                          </span>

                        </p>

                      )}

                    </div>

                  )}

                </motion.div>

              );

            }
          )}

        </div>

      )}


      {/* ====================================================
          ERRO DE MUTATION
          ==================================================== */}

      {mutationError &&
      !modalOpen && (

        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">

          <p className="text-xs text-red-400">

            {
              mutationError?.message ||
              "Não foi possível concluir a operação."
            }

          </p>

        </div>

      )}


      {/* ====================================================
          MODAL
          ==================================================== */}

      {canEdit && (

        <NegotiationFormModal

          open={
            modalOpen
          }

          neg={
            editingNeg
          }

          responsibleUsers={
            responsibleUsers
          }

          responsibleUsersLoading={
            responsibleUsersLoading
          }

          responsibleUsersError={
            responsibleUsersError
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