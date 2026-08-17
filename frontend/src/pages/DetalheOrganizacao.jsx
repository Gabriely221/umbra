// ============================================================
// DETALHE DE ORGANIZAÇÃO
// ============================================================
//
// RBAC:
//
// visualizar_relacoes
// → pode visualizar organizações autorizadas pelo backend.
//
// gerenciar_relacoes
// → pode visualizar qualquer organização.
// → pode editar.
// → pode excluir.
// → pode gerenciar histórico e negociações.
//
// IMPORTANTE:
//
// O backend continua sendo a autoridade para:
//
// - isActive
// - allowedCargos
//
// O frontend NÃO recalcula essas regras.
//
// ROTA CANÔNICA:
//
// /relacoes/:id
//
// ============================================================

import React, {
  useMemo,
  useState,
} from "react";


// ============================================================
// NAVEGAÇÃO
// ============================================================

import {
  useNavigate,
  useParams,
} from "react-router-dom";


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
  ArrowLeft,
  Building2,
  EyeOff,
  Pencil,
  ShieldX,
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

import StatusBadge
  from "@/components/relacoes/StatusBadge";

import OrganizationFormModal
  from "@/components/relacoes/OrganizationFormModal";

import FichaTab
  from "@/components/relacoes/FichaTab";

import HistoricoTab
  from "@/components/relacoes/HistoricoTab";

import NegociacoesTab
  from "@/components/relacoes/NegociacoesTab";

import AvaliacaoTab
  from "@/components/relacoes/AvaliacaoTab";


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
  deleteOrganization,
  getOrganization,
  updateOrganization,
} from "@/services/api";


// ============================================================
// ABAS
// ============================================================

const TABS = [

  {
    key:
      "ficha",

    label:
      "FICHA",
  },

  {
    key:
      "historico",

    label:
      "HISTÓRICO",
  },

  {
    key:
      "negociacoes",

    label:
      "NEGOCIAÇÕES",
  },

  {
    key:
      "avaliacao",

    label:
      "AVALIAÇÃO",
  },

];


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// BOOLEAN
// ------------------------------------------------------------

function normalizeBoolean(
  value,
  fallback = true
) {

  if (
    value ===
      undefined ||
    value ===
      null
  ) {

    return fallback;

  }


  if (
    typeof value ===
    "boolean"
  ) {

    return value;

  }


  if (
    typeof value ===
    "number"
  ) {

    return value !==
      0;

  }


  if (
    typeof value ===
    "string"
  ) {

    const normalized =
      value
        .trim()
        .toLowerCase();


    if (
      [
        "false",
        "0",
        "não",
        "nao",
        "no",
      ].includes(
        normalized
      )
    ) {

      return false;

    }


    if (
      [
        "true",
        "1",
        "sim",
        "yes",
      ].includes(
        normalized
      )
    ) {

      return true;

    }

  }


  return fallback;

}


// ------------------------------------------------------------
// ESPECIALIDADE
// ------------------------------------------------------------

function getOrganizationSpecialty(
  organization
) {

  const specialty =
    String(
      organization?.specialty ??
      ""
    ).trim();


  if (
    specialty ===
    "Outra"
  ) {

    return (

      String(

        organization?.customSpecialty ??

        organization?.custom_specialty ??

        ""

      ).trim() ||

      "Outra"

    );

  }


  return (
    specialty ||
    "Não informado"
  );

}


// ------------------------------------------------------------
// SUB-LÍDER
// ------------------------------------------------------------

function getSubLeader(
  organization
) {

  return String(

    organization?.subLeader ??

    organization?.sub_leader ??

    ""

  ).trim();

}


// ============================================================
// COMPONENTE
// ============================================================

export default function OrganizationDetail() {

  // ==========================================================
  // ROTA
  // ==========================================================

  const {
    id,
  } =
    useParams();


  const navigate =
    useNavigate();


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
      "visualizar_relacoes",
      "gerenciar_relacoes",
    ]);


  const canEdit =
    can(
      "gerenciar_relacoes"
    );


  // ==========================================================
  // QUERY CLIENT
  // ==========================================================

  const queryClient =
    useQueryClient();


  // ==========================================================
  // ABAS
  // ==========================================================

  const [
    activeTab,
    setActiveTab,
  ] =
    useState(
      "ficha"
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


  // ==========================================================
  // BUSCA
  // ==========================================================
  //
  // GET /api/organizations/:id
  //
  // O backend:
  //
  // visualizar_relacoes
  // → verifica isActive.
  // → verifica allowedCargos.
  //
  // gerenciar_relacoes
  // → acessa qualquer organização.
  //
  // ==========================================================

  const {

    data:
      org,

    isLoading,

    isError,

    error,

  } =
    useQuery({

      queryKey: [
        "organization",
        id,
      ],

      queryFn:
        () =>
          getOrganization(
            id
          ),

      enabled:
        canView &&
        Boolean(
          id
        ),

    });


  // ==========================================================
  // DADOS NORMALIZADOS
  // ==========================================================

  const specialty =
    useMemo(
      () =>
        getOrganizationSpecialty(
          org
        ),
      [
        org,
      ]
    );


  const subLeader =
    useMemo(
      () =>
        getSubLeader(
          org
        ),
      [
        org,
      ]
    );


  const isActive =
    normalizeBoolean(

      org?.isActive ??

      org?.is_active,

      true

    );


  // ==========================================================
  // VOLTAR
  // ==========================================================

  function goBack() {

    navigate(
      "/relacoes"
    );

  }


  // ==========================================================
  // INVALIDAR ORGANIZAÇÃO
  // ==========================================================

  async function invalidateOrganization() {

    await Promise.all([

      queryClient.invalidateQueries({

        queryKey: [
          "organization",
          id,
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
  // ATUALIZAR
  // ==========================================================

  async function handleUpdate(
    data
  ) {

    if (
      !canEdit
    ) {

      throw new Error(
        "Você não possui permissão para editar esta organização."
      );

    }


    if (
      !id
    ) {

      throw new Error(
        "Organização inválida."
      );

    }


    await updateOrganization(
      id,
      data
    );


    await invalidateOrganization();

  }


  // ==========================================================
  // EXCLUIR
  // ==========================================================

  async function handleDelete(
    organizationId
  ) {

    if (
      !canEdit
    ) {

      throw new Error(
        "Você não possui permissão para excluir esta organização."
      );

    }


    if (
      !organizationId
    ) {

      throw new Error(
        "Organização inválida."
      );

    }


    await deleteOrganization(
      organizationId
    );


    await queryClient.invalidateQueries({

      queryKey: [
        "organizations",
      ],

    });


    navigate(
      "/relacoes",
      {
        replace:
          true,
      }
    );

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

          <ShieldX className="w-12 h-12 mx-auto mb-4 text-red-400" />


          <h1 className="font-heading text-2xl font-bold tracking-[0.15em] text-red-400 mb-2">

            ACESSO NEGADO

          </h1>


          <p className="text-muted-foreground text-sm">

            Você não possui permissão para visualizar ou gerenciar relações externas.

          </p>

        </div>

      </div>

    );

  }


  // ==========================================================
  // ID AUSENTE
  // ==========================================================

  if (
    !id
  ) {

    return (

      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">

        <Building2 className="w-10 h-10 text-muted-foreground/40" />


        <p className="text-muted-foreground text-sm">

          Organização inválida.

        </p>


        <Button
          variant="outline"
          onClick={
            goBack
          }
        >

          Voltar

        </Button>

      </div>

    );

  }


  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    isLoading
  ) {

    return (

      <div className="min-h-screen flex items-center justify-center">

        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />

      </div>

    );

  }


  // ==========================================================
  // ERRO / NÃO ENCONTRADO
  // ==========================================================
  //
  // O backend também usa 404 quando a organização existe,
  // mas o usuário não possui acesso a ela.
  //
  // Portanto não tentamos diferenciar:
  //
  // inexistente
  // vs
  // restrita
  //
  // ==========================================================

  if (
    isError ||
    !org
  ) {

    return (

      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">

        <Building2 className="w-10 h-10 text-muted-foreground/40" />


        <p className="text-muted-foreground text-sm text-center">

          {
            error?.status ===
              404 ||
            error?.response?.status ===
              404

              ? "Organização não encontrada."

              : error?.message ||
                "Não foi possível carregar a organização."
          }

        </p>


        <Button

          variant="outline"

          onClick={
            goBack
          }

        >

          Voltar

        </Button>

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
            VOLTAR
            ==================================================== */}

        <button

          type="button"

          onClick={
            goBack
          }

          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"

        >

          <ArrowLeft className="w-4 h-4" />


          <span className="font-heading text-[10px] tracking-[0.2em]">

            VOLTAR

          </span>

        </button>


        {/* ====================================================
            CABEÇALHO
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

          className={`bg-card border rounded-lg p-6 mb-6 ${
            isActive
              ? "border-border"
              : "border-border/50"
          }`}

        >

          <div className="flex items-start justify-between gap-4 mb-4">


            {/* ==================================================
                IDENTIDADE
                ================================================== */}

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">

                <Building2 className="w-6 h-6 text-primary" />

              </div>


              <div>

                <div className="flex flex-wrap items-center gap-2">

                  <h1 className="font-heading text-2xl font-bold tracking-wide text-primary">

                    {
                      org.name ||
                      "Organização"
                    }

                  </h1>


                  {!isActive && (

                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground">

                      <EyeOff className="w-3 h-3" />


                      <span className="font-heading text-[8px] tracking-wider">

                        INATIVA

                      </span>

                    </div>

                  )}

                </div>


                <div className="mt-2">

                  <StatusBadge

                    status={
                      org.status
                    }

                    size="lg"

                  />

                </div>

              </div>

            </div>


            {/* ==================================================
                EDITAR
                ================================================== */}

            {canEdit && (

              <Button

                variant="outline"

                size="sm"

                onClick={() =>
                  setModalOpen(
                    true
                  )
                }

                className="font-heading text-xs tracking-wider border-border shrink-0"

              >

                <Pencil className="w-3.5 h-3.5 mr-2" />

                EDITAR

              </Button>

            )}

          </div>


          {/* ==================================================
              INFORMAÇÕES
              ================================================== */}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">


            {/* LÍDER */}

            {org.leader && (

              <div>

                <p className="font-heading text-[9px] tracking-[0.2em] text-muted-foreground/60 mb-0.5">

                  LÍDER

                </p>


                <p className="text-sm text-primary font-body">

                  {org.leader}

                </p>

              </div>

            )}


            {/* SUB-LÍDER */}

            {subLeader && (

              <div>

                <p className="font-heading text-[9px] tracking-[0.2em] text-muted-foreground/60 mb-0.5">

                  SUB-LÍDER

                </p>


                <p className="text-sm text-primary font-body">

                  {subLeader}

                </p>

              </div>

            )}


            {/* CIDADE */}

            {org.city && (

              <div>

                <p className="font-heading text-[9px] tracking-[0.2em] text-muted-foreground/60 mb-0.5">

                  CIDADE

                </p>


                <p className="text-sm text-primary font-body">

                  {org.city}

                </p>

              </div>

            )}


            {/* ESPECIALIDADE */}

            <div>

              <p className="font-heading text-[9px] tracking-[0.2em] text-muted-foreground/60 mb-0.5">

                ESPECIALIDADE

              </p>


              <p className="text-sm text-primary font-body">

                {specialty}

              </p>

            </div>

          </div>

        </motion.div>


        {/* ====================================================
            ABAS
            ==================================================== */}

        <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">

          {TABS.map(
            (
              tab
            ) => (

              <button

                key={
                  tab.key
                }

                type="button"

                onClick={() =>
                  setActiveTab(
                    tab.key
                  )
                }

                className={`px-4 py-3 font-heading text-[10px] tracking-[0.2em] transition-colors border-b-2 -mb-px whitespace-nowrap ${
                  activeTab ===
                  tab.key

                    ? "text-primary border-primary"

                    : "text-muted-foreground border-transparent hover:text-primary"
                }`}

              >

                {tab.label}

              </button>

            )
          )}

        </div>


        {/* ====================================================
            CONTEÚDO
            ==================================================== */}

        <div className="bg-card border border-border rounded-lg p-6">


          {/* ==================================================
              FICHA
              ================================================== */}

          {activeTab ===
            "ficha" && (

            <FichaTab

              org={
                org
              }

              canEdit={
                canEdit
              }

              onUpdate={
                handleUpdate
              }

            />

          )}


          {/* ==================================================
              HISTÓRICO
              ================================================== */}

          {activeTab ===
            "historico" && (

            <HistoricoTab

              org={
                org
              }

              canEdit={
                canEdit
              }

            />

          )}


          {/* ==================================================
              NEGOCIAÇÕES
              ================================================== */}

          {activeTab ===
            "negociacoes" && (

            <NegociacoesTab

              org={
                org
              }

              canEdit={
                canEdit
              }

            />

          )}


          {/* ==================================================
              AVALIAÇÃO
              ================================================== */}

          {activeTab ===
            "avaliacao" && (

            <AvaliacaoTab

              org={
                org
              }

              canEdit={
                canEdit
              }

              onUpdate={
                handleUpdate
              }

            />

          )}

        </div>

      </div>


      {/* ======================================================
          MODAL
          ====================================================== */}

      {canEdit && (

        <OrganizationFormModal

          open={
            modalOpen
          }

          org={
            org
          }

          onClose={() =>
            setModalOpen(
              false
            )
          }

          onSave={
            async (
              form
            ) => {

              await handleUpdate(
                form
              );


              setModalOpen(
                false
              );

            }
          }

          onDelete={
            handleDelete
          }

        />

      )}

    </div>

  );

}