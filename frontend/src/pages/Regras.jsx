// ============================================================
// PÁGINA DE REGRAS
// ============================================================
//
// RBAC:
//
// visualizar_regras
// → pode visualizar as regras autorizadas pelo backend.
//
// gerenciar_regras
// → pode visualizar todas as regras.
// → pode criar.
// → pode editar.
// → pode excluir.
//
// IMPORTANTE:
//
// A filtragem por Rule.allowedRoles pertence ao backend.
//
// O frontend NÃO deve recalcular autorização por cargo.
//
// ============================================================

import React, {
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
// MOTION
// ============================================================

import {
  motion,
} from "framer-motion";


// ============================================================
// ÍCONES
// ============================================================

import {
  Plus,
  ScrollText,
  Shield,
} from "lucide-react";


// ============================================================
// UI
// ============================================================

import {
  Button,
} from "@/components/ui/button";


// ============================================================
// COMPONENTES
// ============================================================

import RuleFormModal
  from "@/components/rules/RuleFormModal";


// ============================================================
// UTILS
// ============================================================

import {
  getRuleIcon,
} from "@/lib/ruleIcons";


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
  createRule,
  deleteRule,
  getRules,
  updateRule,
} from "@/services/api";


// ============================================================
// PRIORIDADES
// ============================================================

const priorityConfig = {

  Máxima: {

    ring:
      "border-primary",

    iconBg:
      "bg-primary text-primary-foreground",

    label:
      "text-primary",

    bar:
      "bg-primary",

  },


  Alta: {

    ring:
      "border-primary/60",

    iconBg:
      "bg-primary/20 text-primary",

    label:
      "text-primary/80",

    bar:
      "bg-primary/70",

  },


  Média: {

    ring:
      "border-border",

    iconBg:
      "bg-secondary text-secondary-foreground",

    label:
      "text-muted-foreground",

    bar:
      "bg-muted-foreground/50",

  },


  Baixa: {

    ring:
      "border-border/60",

    iconBg:
      "bg-muted text-muted-foreground",

    label:
      "text-muted-foreground/60",

    bar:
      "bg-muted-foreground/30",

  },

};


const priorityOrder = {

  Máxima:
    0,

  Alta:
    1,

  Média:
    2,

  Baixa:
    3,

};


// ============================================================
// COMPONENTE
// ============================================================

export default function Rules() {

  // ==========================================================
  // RBAC
  // ==========================================================

  const {
    can,
    canAny,
  } =
    usePermissions();


  const canView =
    canAny([
      "visualizar_regras",
      "gerenciar_regras",
    ]);


  const canEdit =
    can(
      "gerenciar_regras"
    );


  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(
      false
    );


  const [
    editingRule,
    setEditingRule,
  ] =
    useState(
      null
    );


  const queryClient =
    useQueryClient();


  // ==========================================================
  // DADOS
  // ==========================================================
  //
  // GET /api/rules já aplica:
  //
  // visualizar_regras
  // → apenas regras autorizadas por allowedRoles.
  //
  // gerenciar_regras
  // → todas as regras.
  //
  // Portanto não fazemos filtro de autorização no frontend.
  //
  // ==========================================================

  const {

    data:
      rules = [],

    isLoading,

    isError,

    error,

  } =
    useQuery({

      queryKey: [
        "rules",
      ],

      queryFn:
        getRules,

      enabled:
        canView,

    });


  // ==========================================================
  // NORMALIZA LISTA
  // ==========================================================

  const ruleList =
    Array.isArray(
      rules
    )
      ? rules
      : [];


  // ==========================================================
  // ORDENAÇÃO
  // ==========================================================

  const sorted =
    [
      ...ruleList,
    ].sort(
      (
        a,
        b
      ) => {

        const priority =
          (
            priorityOrder[
              a.priority
            ] ??
            99
          ) -
          (
            priorityOrder[
              b.priority
            ] ??
            99
          );


        if (
          priority !==
          0
        ) {

          return priority;

        }


        return (
          (
            a.order ??
            999
          ) -
          (
            b.order ??
            999
          )
        );

      }
    );


  // ==========================================================
  // ABRIR NOVA
  // ==========================================================

  function openAdd() {

    if (
      !canEdit
    ) {

      return;

    }


    setEditingRule(
      null
    );


    setModalOpen(
      true
    );

  }


  // ==========================================================
  // ABRIR EDIÇÃO
  // ==========================================================

  function openEdit(
    rule
  ) {

    if (
      !canEdit
    ) {

      return;

    }


    setEditingRule(
      rule
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


    setEditingRule(
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

      alert(
        "Você não possui permissão para gerenciar regras."
      );


      return;

    }


    if (
      editingRule
    ) {

      await updateRule(
        editingRule.id,
        form
      );

    } else {

      await createRule(
        form
      );

    }


    await queryClient.invalidateQueries({

      queryKey: [
        "rules",
      ],

    });


    closeModal();

  }


  // ==========================================================
  // EXCLUIR
  // ==========================================================

  async function handleDelete(
    id
  ) {

    if (
      !canEdit
    ) {

      alert(
        "Você não possui permissão para excluir regras."
      );


      return;

    }


    await deleteRule(
      id
    );


    await queryClient.invalidateQueries({

      queryKey: [
        "rules",
      ],

    });


    closeModal();

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

          <Shield
            className="w-12 h-12 mx-auto mb-4 text-red-400"
          />


          <h1 className="font-heading text-2xl font-bold tracking-[0.15em] text-red-400 mb-2">

            ACESSO NEGADO

          </h1>


          <p className="text-muted-foreground text-sm">

            Você não possui permissão para visualizar ou gerenciar as regras.

          </p>

        </div>

      </div>

    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="min-h-screen px-4 py-16">

      <div className="max-w-3xl mx-auto">


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

          <ScrollText
            className="w-8 h-8 mx-auto mb-4 text-muted-foreground"
          />


          <h1 className="font-heading text-4xl font-bold tracking-[0.15em] text-primary mb-2">

            REGRAS

          </h1>


          <div className="w-16 h-[1px] bg-primary/30 mx-auto mb-4" />


          <p className="text-muted-foreground text-sm">

            O código que nos guia. Sem exceções.

          </p>


          {/* ==================================================
              NOVA REGRA
              ================================================== */}

          {canEdit && (

            <Button

              onClick={
                openAdd
              }

              className="mt-6 font-heading text-xs tracking-[0.15em] bg-primary text-primary-foreground hover:bg-primary/90"

            >

              <Plus className="w-4 h-4 mr-2" />

              NOVA REGRA

            </Button>

          )}

        </motion.div>


        {/* ====================================================
            CONTEÚDO
            ==================================================== */}

        {isLoading ? (

          <div className="flex justify-center py-20">

            <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />

          </div>

        ) : isError ? (

          <div className="text-center py-20">

            <p className="text-red-400 text-sm">

              {
                error?.message ||
                "Não foi possível carregar as regras."
              }

            </p>

          </div>

        ) : sorted.length ===
          0 ? (

          <div className="text-center py-20">

            <p className="text-muted-foreground text-sm">

              {
                canEdit
                  ? "Nenhuma regra cadastrada."
                  : "Nenhuma regra disponível para seu acesso."
              }

            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {sorted.map(
              (
                rule,
                index
              ) => {

                // =============================================
                // CONFIGURAÇÃO VISUAL
                // =============================================

                const config =
                  priorityConfig[
                    rule.priority
                  ] ||
                  priorityConfig[
                    "Média"
                  ];


                const Icon =
                  getRuleIcon(
                    rule.icon
                  );


                return (

                  <motion.div

                    key={
                      rule.id
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
                        0.08,

                      duration:
                        0.5,
                    }}

                    className={`bg-card border ${config.ring} rounded-lg overflow-hidden hover:border-primary/40 transition-all duration-500 ${
                      canEdit
                        ? "cursor-pointer"
                        : ""
                    }`}

                    onClick={() => {

                      if (
                        canEdit
                      ) {

                        openEdit(
                          rule
                        );

                      }

                    }}

                    role={
                      canEdit
                        ? "button"
                        : undefined
                    }

                    tabIndex={
                      canEdit
                        ? 0
                        : undefined
                    }

                    onKeyDown={(
                      event
                    ) => {

                      if (
                        !canEdit
                      ) {

                        return;

                      }


                      if (
                        event.key ===
                          "Enter" ||
                        event.key ===
                          " "
                      ) {

                        event.preventDefault();


                        openEdit(
                          rule
                        );

                      }

                    }}

                  >


                    {/* ========================================
                        BARRA DE PRIORIDADE
                        ======================================== */}

                    <div
                      className={`h-1 ${config.bar}`}
                    />


                    <div className="p-6">

                      <div className="flex items-start gap-4">


                        {/* ====================================
                            ÍCONE
                            ==================================== */}

                        <div
                          className={`w-11 h-11 rounded-lg ${config.iconBg} flex items-center justify-center flex-shrink-0`}
                        >

                          <Icon className="w-5 h-5" />

                        </div>


                        {/* ====================================
                            CONTEÚDO
                            ==================================== */}

                        <div className="flex-1 min-w-0">

                          <div className="flex items-center gap-3 mb-2 flex-wrap">


                            {/* NUMERAÇÃO */}

                            <span className="font-heading text-[10px] text-muted-foreground/40 tracking-widest">

                              {
                                String(
                                  index +
                                  1
                                ).padStart(
                                  2,
                                  "0"
                                )
                              }

                            </span>


                            {/* TÍTULO */}

                            <h3 className="font-heading text-base font-semibold tracking-wide text-primary">

                              {rule.title}

                            </h3>


                            {/* PRIORIDADE */}

                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-heading tracking-[0.15em] border ${config.ring} ${config.label}`}
                            >

                              {
                                rule.priority
                                  ?.toUpperCase()
                              }

                            </span>

                          </div>


                          {/* DESCRIÇÃO */}

                          <p className="text-sm text-muted-foreground leading-relaxed">

                            {rule.description}

                          </p>


                          {/* ==================================
                              RESTRIÇÕES
                              ==================================
                              
                              Só mostramos para quem administra.
                              
                              Essas informações são administrativas
                              e não fazem parte da decisão de acesso
                              do frontend.
                              ================================== */}

                          {canEdit &&
                            Array.isArray(
                              rule.allowed_cargos
                            ) &&
                            rule.allowed_cargos.length >
                              0 && (

                            <p className="mt-3 text-[10px] text-muted-foreground/50 font-heading tracking-wider">

                              CARGOS:{" "}

                              {
                                rule.allowed_cargos.join(
                                  ", "
                                )
                              }

                            </p>

                          )}

                        </div>

                      </div>

                    </div>

                  </motion.div>

                );

              }
            )}

          </div>

        )}

      </div>


      {/* ======================================================
          MODAL
          ====================================================== */}

      {canEdit && (

        <RuleFormModal

          open={
            modalOpen
          }

          rule={
            editingRule
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