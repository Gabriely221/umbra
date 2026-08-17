// ============================================================
// CARD DE ORGANIZAÇÃO
// ============================================================
//
// Componente exclusivamente visual.
//
// NÃO acessa:
//
// - API
// - Base44
// - banco de dados
// - RBAC
//
// A página Relacoes.jsx decide:
//
// - quem pode editar
// - quem pode excluir
// - quem pode reordenar
//
// O componente recebe callbacks:
//
// onEdit(organization)
// onDelete(organizationId)
// onReorder(organization, direction)
//
// NAVEGAÇÃO:
//
// /relacoes/:id
//
// ============================================================

import React from "react";


// ============================================================
// ANIMAÇÕES
// ============================================================

import {
  motion,
} from "framer-motion";


// ============================================================
// NAVEGAÇÃO
// ============================================================

import {
  useNavigate,
} from "react-router-dom";


// ============================================================
// ÍCONES
// ============================================================

import {
  ChevronDown,
  ChevronUp,
  EyeOff,
  MapPin,
  Pencil,
  Shield,
  Trash2,
  Users,
} from "lucide-react";


// ============================================================
// COMPONENTES
// ============================================================

import StatusBadge
  from "@/components/relacoes/StatusBadge";


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// BOOLEAN
// ------------------------------------------------------------
//
// O backend atual retorna boolean real, mas aceitamos alguns
// formatos legados para evitar erro visual durante a migração.
//
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
// CONFIANÇA
// ------------------------------------------------------------

function getTrustLevel(
  organization
) {

  const rawTrust =
    Number(

      organization?.trustLevel ??

      organization?.trust_level ??

      50

    );


  if (
    !Number.isFinite(
      rawTrust
    )
  ) {

    return 50;

  }


  return Math.min(
    100,
    Math.max(
      0,
      rawTrust
    )
  );

}


// ------------------------------------------------------------
// ESPECIALIDADE
// ------------------------------------------------------------

function getSpecialty(
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
// QUANTIDADE DE MEMBROS
// ------------------------------------------------------------

function getMemberCount(
  organization
) {

  const value =

    organization?.memberCount ??

    organization?.member_count ??

    null;


  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {

    return null;

  }


  const number =
    Number(
      value
    );


  return Number.isFinite(
    number
  )
    ? number
    : null;

}


// ============================================================
// COMPONENTE
// ============================================================

export default function OrganizationCard({

  org,

  index = 0,

  onEdit,

  onDelete,

  onReorder,

  canReorder = false,

  isFirst = false,

  isLast = false,

}) {

  // ==========================================================
  // NAVEGAÇÃO
  // ==========================================================

  const navigate =
    useNavigate();


  // ==========================================================
  // DADOS NORMALIZADOS
  // ==========================================================

  const organizationId =
    org?.id ??
    null;


  const organizationName =
    String(
      org?.name ??
      ""
    ).trim();


  const specialty =
    getSpecialty(
      org
    );


  const trust =
    getTrustLevel(
      org
    );


  const memberCount =
    getMemberCount(
      org
    );


  const isActive =
    normalizeBoolean(

      org?.isActive ??

      org?.is_active,

      true

    );


  // ==========================================================
  // FLAGS DE AÇÃO
  // ==========================================================

  const canEdit =
    typeof onEdit ===
    "function";


  const canDelete =
    typeof onDelete ===
    "function";


  // ----------------------------------------------------------
  // Só exibimos reordenação quando existe callback real.
  //
  // Atualmente Relacoes.jsx passa canReorder, mas ainda não
  // implementa onReorder. Isso evita botões mortos na UI.
  // ----------------------------------------------------------

  const canActuallyReorder =
    canReorder &&
    typeof onReorder ===
      "function";


  const hasActions =
    canEdit ||
    canDelete ||
    canActuallyReorder;


  // ==========================================================
  // ABRIR ORGANIZAÇÃO
  // ==========================================================

  function handleOpen() {

    if (
      !organizationId
    ) {

      return;

    }


    // --------------------------------------------------------
    // Rota canônica da área de Relações.
    // --------------------------------------------------------

    navigate(
      `/relacoes/${organizationId}`
    );

  }


  // ==========================================================
  // TECLADO DO CARD
  // ==========================================================

  function handleCardKeyDown(
    event
  ) {

    if (
      event.target !==
      event.currentTarget
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


      handleOpen();

    }

  }


  // ==========================================================
  // EDITAR
  // ==========================================================

  function handleEdit(
    event
  ) {

    event.stopPropagation();


    if (
      !canEdit
    ) {

      return;

    }


    onEdit(
      org
    );

  }


  // ==========================================================
  // EXCLUIR
  // ==========================================================

  function handleDelete(
    event
  ) {

    event.stopPropagation();


    if (
      !canDelete ||
      !organizationId
    ) {

      return;

    }


    const confirmed =
      window.confirm(
        `Tem certeza que deseja excluir "${organizationName || "esta organização"}"?`
      );


    if (
      !confirmed
    ) {

      return;

    }


    // --------------------------------------------------------
    // Relacoes.jsx espera o ID, não o objeto inteiro.
    // --------------------------------------------------------

    onDelete(
      organizationId
    );

  }


  // ==========================================================
  // REORDENAR
  // ==========================================================

  function handleReorder(
    event,
    direction
  ) {

    event.stopPropagation();


    if (
      !canActuallyReorder
    ) {

      return;

    }


    if (
      direction !==
        -1 &&
      direction !==
        1
    ) {

      return;

    }


    onReorder(
      org,
      direction
    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <motion.div

      initial={{
        opacity:
          0,

        y:
          30,
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
          0.06,

        duration:
          0.5,
      }}

      onClick={
        handleOpen
      }

      onKeyDown={
        handleCardKeyDown
      }

      role="link"

      tabIndex={
        0
      }

      aria-label={`Abrir ${
        organizationName ||
        "organização"
      }`}

      className={`bg-card border rounded-lg p-5 group hover:border-primary/20 transition-all duration-500 cursor-pointer h-full relative focus:outline-none focus:ring-2 focus:ring-primary/40 ${
        !isActive
          ? "border-border/50 opacity-60"
          : "border-border"
      }`}

    >


      {/* ====================================================
          INATIVA
          ==================================================== */}

      {!isActive && (

        <div className="absolute top-4 left-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground z-10">

          <EyeOff className="w-3 h-3" />


          <span className="font-heading text-[8px] tracking-wider">

            INATIVA

          </span>

        </div>

      )}


      {/* ====================================================
          AÇÕES
          ==================================================== */}

      {hasActions && (

        <div className="absolute top-4 right-4 flex items-center gap-1 z-10">


          {/* ==================================================
              REORDENAR
              ================================================== */}

          {canActuallyReorder && (

            <>


              {/* MOVER PARA CIMA */}

              <button

                type="button"

                onClick={(
                  event
                ) =>
                  handleReorder(
                    event,
                    -1
                  )
                }

                disabled={
                  isFirst
                }

                className="p-1 rounded text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"

                title="Mover para cima"

                aria-label={`Mover ${
                  organizationName ||
                  "organização"
                } para cima`}

              >

                <ChevronUp className="w-4 h-4" />

              </button>


              {/* MOVER PARA BAIXO */}

              <button

                type="button"

                onClick={(
                  event
                ) =>
                  handleReorder(
                    event,
                    1
                  )
                }

                disabled={
                  isLast
                }

                className="p-1 rounded text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"

                title="Mover para baixo"

                aria-label={`Mover ${
                  organizationName ||
                  "organização"
                } para baixo`}

              >

                <ChevronDown className="w-4 h-4" />

              </button>

            </>

          )}


          {/* ==================================================
              EDITAR
              ================================================== */}

          {canEdit && (

            <button

              type="button"

              onClick={
                handleEdit
              }

              className="p-1 rounded text-muted-foreground hover:text-primary transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"

              title="Editar"

              aria-label={`Editar ${
                organizationName ||
                "organização"
              }`}

            >

              <Pencil className="w-4 h-4" />

            </button>

          )}


          {/* ==================================================
              EXCLUIR
              ================================================== */}

          {canDelete && (

            <button

              type="button"

              onClick={
                handleDelete
              }

              className="p-1 rounded text-muted-foreground hover:text-red-400 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"

              title="Excluir"

              aria-label={`Excluir ${
                organizationName ||
                "organização"
              }`}

            >

              <Trash2 className="w-4 h-4" />

            </button>

          )}

        </div>

      )}


      {/* ====================================================
          NOME
          ==================================================== */}

      <h3
        className={`font-heading text-lg font-semibold tracking-wide text-primary mb-3 ${
          hasActions
            ? "pr-28"
            : ""
        } ${
          !isActive
            ? "pt-7"
            : ""
        }`}
      >

        {
          organizationName ||
          "Organização sem nome"
        }

      </h3>


      {/* ====================================================
          STATUS
          ==================================================== */}

      <div className="mb-4">

        <StatusBadge

          status={
            org?.status
          }

        />

      </div>


      {/* ====================================================
          INFORMAÇÕES
          ==================================================== */}

      <div className="space-y-1.5 text-xs text-muted-foreground font-body">


        {/* ==================================================
            LÍDER
            ================================================== */}

        {org?.leader && (

          <p>

            <span className="text-muted-foreground/60">

              Líder:

            </span>

            {" "}

            {org.leader}

          </p>

        )}


        {/* ==================================================
            CIDADE
            ================================================== */}

        {org?.city && (

          <p className="flex items-center gap-1.5">

            <MapPin className="w-3 h-3 shrink-0" />

            <span>

              {org.city}

            </span>

          </p>

        )}


        {/* ==================================================
            MEMBROS
            ================================================== */}

        {memberCount !==
          null && (

          <p className="flex items-center gap-1.5">

            <Users className="w-3 h-3 shrink-0" />

            <span>

              ~{memberCount} membros

            </span>

          </p>

        )}


        {/* ==================================================
            ESPECIALIDADE
            ================================================== */}

        <p className="flex items-center gap-1.5">

          <Shield className="w-3 h-3 shrink-0" />

          <span>

            {specialty}

          </span>

        </p>

      </div>


      {/* ====================================================
          CONFIANÇA
          ==================================================== */}

      <div className="mt-4 pt-4 border-t border-border/50">

        <div className="flex items-center justify-between mb-1">

          <span className="font-heading text-[9px] tracking-[0.2em] text-muted-foreground/60">

            CONFIANÇA

          </span>


          <span className="font-heading text-xs text-primary">

            {trust}%

          </span>

        </div>


        <div className="h-1 bg-muted rounded-full overflow-hidden">

          <div

            className="h-full bg-primary rounded-full transition-all duration-500"

            style={{
              width:
                `${trust}%`,
            }}

          />

        </div>

      </div>

    </motion.div>

  );

}