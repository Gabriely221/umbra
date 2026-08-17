// ============================================================
// ABA "HISTÓRICO" DA ORGANIZAÇÃO
// ============================================================
//
// Exibe os acontecimentos registrados para uma organização.
//
// Operações:
//
// - visualizar
// - criar
// - editar
// - excluir
//
// Fluxo:
//
// HistoricoTab
//      ↓
// services/api.js
//      ↓
// Express
//      ↓
// RBAC
//      ↓
// organizationController
//      ↓
// Sequelize
//      ↓
// MySQL
//
// O histórico narrativo é uma entidade própria:
//
// OrganizationHistory
//
// Este componente NÃO:
// - acessa Base44
// - acessa API diretamente fora de services/api.js
// - implementa auditoria pelo navegador
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
  Calendar,
  History,
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

import HistoryFormModal
  from "@/components/relacoes/HistoryFormModal";


// ============================================================
// API
// ============================================================

import {
  createOrganizationHistory,
  deleteOrganizationHistory,
  getOrganizationHistory,
  updateOrganizationHistory,
} from "@/services/api";


// ============================================================
// NORMALIZA RESPOSTA
// ============================================================
//
// O controller atual responde:
//
// {
//   history: [...]
// }
//
// Também aceitamos diretamente:
//
// [...]
//
// para compatibilidade com eventual normalização feita em
// services/api.js.
//
// ============================================================

function normalizeHistoryResponse(
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
      response?.history
    )
  ) {

    return response.history;

  }


  return [];

}


// ============================================================
// NORMALIZA DATA DO EVENTO
// ============================================================

function getEventDate(
  event
) {

  return (

    event?.date ??

    event?.eventDate ??

    event?.event_date ??

    null

  );

}


// ============================================================
// FORMATA DATA
// ============================================================
//
// Evitamos:
//
// new Date("2026-08-16")
//
// como única estratégia, pois uma data pura pode sofrer
// alteração de dia dependendo do timezone.
//
// ============================================================

function formatEventDate(
  value
) {

  if (
    !value
  ) {

    return "Data não informada";

  }


  const text =
    String(
      value
    ).trim();


  // ----------------------------------------------------------
  // YYYY-MM-DD
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
  // OUTROS FORMATOS / TIMESTAMP
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

    return "Data inválida";

  }


  return date.toLocaleDateString(
    "pt-BR"
  );

}


// ============================================================
// RESPONSÁVEL
// ============================================================
//
// No model/controller atual:
//
// responsible
//
// é um campo textual do histórico.
//
// Mantemos aliases antigos apenas para leitura.
//
// ============================================================

function getResponsibleName(
  event
) {

  const responsible =

    event?.responsible ??

    event?.responsibleName ??

    event?.responsible_name ??

    null;


  if (
    responsible
  ) {

    return String(
      responsible
    ).trim() ||
    null;

  }


  // ----------------------------------------------------------
  // Compatibilidade temporária com dados antigos que
  // eventualmente tenham usuário associado na resposta.
  // ----------------------------------------------------------

  const legacyName =

    event?.usuario?.nome ??

    event?.Usuario?.nome ??

    null;


  return legacyName
    ? String(
        legacyName
      ).trim() ||
      null
    : null;

}


// ============================================================
// COMPONENTE
// ============================================================

export default function HistoricoTab({

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
  // QUERY CLIENT
  // ==========================================================

  const queryClient =
    useQueryClient();


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
    editingEvent,
    setEditingEvent,
  ] =
    useState(
      null
    );


  // ==========================================================
  // CONSULTA
  // ==========================================================

  const {

    data:
      historyResponse,

    isLoading,

    isError,

    error,

  } =
    useQuery({

      queryKey: [
        "org-history",
        organizationId,
      ],

      queryFn:
        () =>
          getOrganizationHistory(
            organizationId
          ),

      enabled:
        Boolean(
          organizationId
        ),

    });


  // ==========================================================
  // HISTÓRICO NORMALIZADO
  // ==========================================================

  const events =
    useMemo(
      () =>
        normalizeHistoryResponse(
          historyResponse
        ),
      [
        historyResponse,
      ]
    );


  // ==========================================================
  // INVALIDAR CACHE
  // ==========================================================
  //
  // GET /organizations/:id também inclui histórico.
  //
  // Por isso invalidamos:
  //
  // - consulta específica da aba
  // - detalhe geral da organização
  //
  // ==========================================================

  async function invalidateHistory() {

    if (
      !organizationId
    ) {

      return;

    }


    await Promise.all([

      queryClient.invalidateQueries({

        queryKey: [
          "org-history",
          organizationId,
        ],

      }),


      queryClient.invalidateQueries({

        queryKey: [
          "organization",
          organizationId,
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


          return createOrganizationHistory(
            organizationId,
            form
          );

        },

      onSuccess:
        async () => {

          await invalidateHistory();

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
              "Registro histórico inválido."
            );

          }


          return updateOrganizationHistory(
            organizationId,
            id,
            data
          );

        },

      onSuccess:
        async () => {

          await invalidateHistory();

        },

    });


  // ==========================================================
  // EXCLUIR
  // ==========================================================

  const deleteMutation =
    useMutation({

      mutationFn:
        (
          historyId
        ) => {

          if (
            !organizationId
          ) {

            throw new Error(
              "Organização inválida."
            );

          }


          if (
            !historyId
          ) {

            throw new Error(
              "Registro histórico inválido."
            );

          }


          return deleteOrganizationHistory(
            organizationId,
            historyId
          );

        },

      onSuccess:
        async () => {

          await invalidateHistory();

        },

    });


  // ==========================================================
  // SALVANDO
  // ==========================================================

  const saving =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;


  // ==========================================================
  // ABRIR NOVO
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


    setEditingEvent(
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
    event
  ) {

    if (
      !canEdit ||
      !event?.id
    ) {

      return;

    }


    createMutation.reset();

    updateMutation.reset();

    deleteMutation.reset();


    setEditingEvent(
      event
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
      saving
    ) {

      return;

    }


    setModalOpen(
      false
    );


    setEditingEvent(
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
        "Você não possui permissão para editar o histórico."
      );

    }


    if (
      editingEvent?.id
    ) {

      await updateMutation.mutateAsync({

        id:
          editingEvent.id,

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


    setEditingEvent(
      null
    );

  }


  // ==========================================================
  // EXCLUIR
  // ==========================================================

  async function handleDelete(
    historyId
  ) {

    if (
      !canEdit
    ) {

      throw new Error(
        "Você não possui permissão para excluir registros do histórico."
      );

    }


    if (
      !historyId
    ) {

      throw new Error(
        "Registro histórico inválido."
      );

    }


    await deleteMutation.mutateAsync(
      historyId
    );


    setModalOpen(
      false
    );


    setEditingEvent(
      null
    );

  }


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
          NOVO REGISTRO
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

            NOVO REGISTRO

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
           ERRO
           =================================================== */

        <div className="text-center py-12">

          <History className="w-8 h-8 mx-auto mb-3 text-red-400/60" />


          <p className="text-sm text-red-400">

            {
              error?.message ||
              "Não foi possível carregar o histórico."
            }

          </p>

        </div>

      ) : events.length ===
        0 ? (

        /* ===================================================
           VAZIO
           =================================================== */

        <div className="text-center py-12">

          <History className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />


          <p className="text-sm text-muted-foreground">

            Nenhum registro no histórico.

          </p>

        </div>

      ) : (

        /* ===================================================
           TIMELINE
           =================================================== */

        <div className="relative pl-6">


          {/* ==================================================
              LINHA
              ================================================== */}

          <div className="absolute left-2 top-2 bottom-2 w-[1px] bg-border" />


          <div className="space-y-6">

            {events.map(
              (
                event,
                index
              ) => {

                const eventDate =
                  getEventDate(
                    event
                  );


                const responsible =
                  getResponsibleName(
                    event
                  );


                const title =
                  String(
                    event?.title ??
                    ""
                  ).trim() ||
                  "Registro sem título";


                return (

                  <motion.div

                    key={
                      event.id
                    }

                    initial={{
                      opacity:
                        0,

                      x:
                        -20,
                    }}

                    animate={{
                      opacity:
                        1,

                      x:
                        0,
                    }}

                    transition={{
                      delay:
                        index *
                        0.05,
                    }}

                    className="relative"

                  >


                    {/* =========================================
                        PONTO
                        ========================================= */}

                    <div className="absolute -left-[18px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card" />


                    {/* =========================================
                        CARD
                        ========================================= */}

                    <div className="bg-background/50 border border-border rounded-lg p-4 group hover:border-primary/20 transition-all relative">


                      {/* =======================================
                          EDITAR
                          ======================================= */}

                      {canEdit && (

                        <button

                          type="button"

                          onClick={() =>
                            openEdit(
                              event
                            )
                          }

                          disabled={
                            saving
                          }

                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-muted-foreground hover:text-primary disabled:opacity-30 absolute top-3 right-3"

                          title="Editar histórico"

                          aria-label={`Editar registro ${title}`}

                        >

                          <Pencil className="w-3.5 h-3.5" />

                        </button>

                      )}


                      {/* =======================================
                          META
                          ======================================= */}

                      <div className="flex flex-wrap items-center gap-3 mb-2 text-[10px] font-heading tracking-wider text-muted-foreground/60">


                        {/* DATA */}

                        <span className="flex items-center gap-1">

                          <Calendar className="w-3 h-3 shrink-0" />

                          {formatEventDate(
                            eventDate
                          )}

                        </span>


                        {/* RESPONSÁVEL */}

                        {responsible && (

                          <span className="flex items-center gap-1">

                            <User className="w-3 h-3 shrink-0" />

                            {responsible}

                          </span>

                        )}

                      </div>


                      {/* =======================================
                          TÍTULO
                          ======================================= */}

                      <h4 className="font-heading text-sm font-semibold tracking-wide text-primary mb-1 pr-6">

                        {title}

                      </h4>


                      {/* =======================================
                          DESCRIÇÃO
                          ======================================= */}

                      {event?.description && (

                        <p className="text-sm text-muted-foreground font-body leading-relaxed whitespace-pre-wrap break-words">

                          {event.description}

                        </p>

                      )}

                    </div>

                  </motion.div>

                );

              }
            )}

          </div>

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

        <HistoryFormModal

          open={
            modalOpen
          }

          event={
            editingEvent
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