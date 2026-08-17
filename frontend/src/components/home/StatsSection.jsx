// ============================================================
// SEÇÃO DE ESTATÍSTICAS DA HOME
// ============================================================
//
// Exibe:
//
// - membros ativos
// - links disponíveis
// - atalho para relações externas
//
// DADOS:
//
// activeMembers
// linkCount
//
// são fornecidos pela Home.jsx através de:
//
// GET /api/home/stats
//
// AUTORIZAÇÃO:
//
// Os números podem ser exibidos para qualquer usuário com:
//
// visualizar_inicio
//
// Porém os cards somente funcionam como links quando o usuário
// possui acesso ao módulo correspondente.
//
// Isso evita direcionar o usuário para uma página que o
// ProtectedRoute bloquearia logo em seguida.
//
// ============================================================

import React from "react";


// ============================================================
// REACT ROUTER
// ============================================================

import {
  Link,
} from "react-router-dom";


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
  Globe,
  Link2,
  Users,
} from "lucide-react";


// ============================================================
// RBAC
// ============================================================

import {
  usePermissions,
} from "@/hooks/usePermissions";


// ============================================================
// COMPONENTE
// ============================================================

export default function StatsSection({
  activeMembers = 0,
  linkCount = 0,
  isLoading = false,
  isError = false,
}) {

  // ==========================================================
  // RBAC
  // ==========================================================

  const {
    can,
    canAny,
  } =
    usePermissions();


  // ==========================================================
  // ACESSO AOS MÓDULOS
  // ==========================================================

  const canAccessMembers =
    typeof canAny ===
      "function"

      ? canAny([
          "visualizar_membros",
          "gerenciar_membros",
        ])

      : (
          can(
            "visualizar_membros"
          ) ||
          can(
            "gerenciar_membros"
          )
        );


  const canAccessLinks =
    typeof canAny ===
      "function"

      ? canAny([
          "visualizar_links",
          "gerenciar_links",
        ])

      : (
          can(
            "visualizar_links"
          ) ||
          can(
            "gerenciar_links"
          )
        );


  const canAccessRelations =
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


  // ==========================================================
  // NORMALIZAÇÃO
  // ==========================================================

  const members =
    Number.isFinite(
      Number(
        activeMembers
      )
    )
      ? Number(
          activeMembers
        )
      : 0;


  const links =
    Number.isFinite(
      Number(
        linkCount
      )
    )
      ? Number(
          linkCount
        )
      : 0;


  // ==========================================================
  // VALORES VISUAIS
  // ==========================================================
  //
  // Durante loading ou erro:
  //
  // mostramos "—".
  //
  // Isso evita representar:
  //
  // carregando = 0
  //
  // ou:
  //
  // erro = 0
  //
  // ==========================================================

  const membersDisplay =
    isLoading ||
    isError
      ? "—"
      : members;


  const linksDisplay =
    isLoading ||
    isError
      ? "—"
      : links;


  // ==========================================================
  // CARD DE MEMBROS
  // ==========================================================

  const membersCard = (

    <motion.div

      initial={{
        opacity:
          0,

        y:
          30,
      }}

      whileInView={{
        opacity:
          1,

        y:
          0,
      }}

      viewport={{
        once:
          true,
      }}

      transition={{
        delay:
          0,

        duration:
          0.6,
      }}

      className={[
        "bg-card",
        "border",
        "border-border",
        "rounded-lg",
        "p-6",
        "flex",
        "items-center",
        "gap-5",
        "transition-all",
        "duration-500",

        canAccessMembers
          ? "group hover:border-primary/30 cursor-pointer"
          : "opacity-80 cursor-default",
      ].join(
        " "
      )}

    >

      {/* ======================================================
          ÍCONE
          ====================================================== */}

      <div
        className={[
          "w-12",
          "h-12",
          "rounded-full",
          "bg-primary/10",
          "flex",
          "items-center",
          "justify-center",
          "flex-shrink-0",
          "transition-colors",

          canAccessMembers
            ? "group-hover:bg-primary/20"
            : "",
        ].join(
          " "
        )}
      >

        <Users
          className="w-5 h-5 text-primary"
          aria-hidden="true"
        />

      </div>


      {/* ======================================================
          VALOR
          ====================================================== */}

      <div>

        <p className="font-heading text-4xl font-bold text-primary leading-none">

          {membersDisplay}

        </p>


        <p className="font-heading text-[10px] tracking-[0.3em] text-muted-foreground mt-1">

          MEMBROS ATIVOS

        </p>

      </div>

    </motion.div>

  );


  // ==========================================================
  // CARD DE LINKS
  // ==========================================================

  const linksCard = (

    <motion.div

      initial={{
        opacity:
          0,

        y:
          30,
      }}

      whileInView={{
        opacity:
          1,

        y:
          0,
      }}

      viewport={{
        once:
          true,
      }}

      transition={{
        delay:
          0.1,

        duration:
          0.6,
      }}

      className={[
        "bg-card",
        "border",
        "border-border",
        "rounded-lg",
        "p-6",
        "flex",
        "items-center",
        "gap-5",
        "transition-all",
        "duration-500",

        canAccessLinks
          ? "group hover:border-primary/30 cursor-pointer"
          : "opacity-80 cursor-default",
      ].join(
        " "
      )}

    >

      {/* ======================================================
          ÍCONE
          ====================================================== */}

      <div
        className={[
          "w-12",
          "h-12",
          "rounded-full",
          "bg-primary/10",
          "flex",
          "items-center",
          "justify-center",
          "flex-shrink-0",
          "transition-colors",

          canAccessLinks
            ? "group-hover:bg-primary/20"
            : "",
        ].join(
          " "
        )}
      >

        <Link2
          className="w-5 h-5 text-primary"
          aria-hidden="true"
        />

      </div>


      {/* ======================================================
          VALOR
          ====================================================== */}

      <div>

        <p className="font-heading text-4xl font-bold text-primary leading-none">

          {linksDisplay}

        </p>


        <p className="font-heading text-[10px] tracking-[0.3em] text-muted-foreground mt-1">

          LINKS DISPONÍVEIS

        </p>

      </div>

    </motion.div>

  );


  // ==========================================================
  // CARD DE RELAÇÕES
  // ==========================================================

  const relationsCard = (

    <div

      className={[
        "bg-card",
        "border",
        "border-border",
        "rounded-lg",
        "p-6",
        "transition-all",
        "duration-500",

        canAccessRelations
          ? "group hover:border-primary/30 cursor-pointer"
          : "opacity-80 cursor-default",
      ].join(
        " "
      )}

    >

      {/* ======================================================
          CABEÇALHO
          ====================================================== */}

      <div className="flex items-center gap-2 mb-3">

        <Globe

          className={[
            "w-4",
            "h-4",
            "text-muted-foreground",
            "transition-colors",

            canAccessRelations
              ? "group-hover:text-primary"
              : "",
          ].join(
            " "
          )}

          aria-hidden="true"

        />


        <span className="font-heading text-[10px] tracking-[0.3em] text-muted-foreground">

          RELAÇÕES EXTERNAS

        </span>

      </div>


      {/* ======================================================
          TÍTULO
          ====================================================== */}

      <p className="font-heading text-base font-semibold tracking-wide text-primary">

        Inteligência Institucional

      </p>


      {/* ======================================================
          DESCRIÇÃO
          ====================================================== */}

      <p className="text-sm text-muted-foreground mt-1 font-body leading-relaxed">

        Gestão completa das relações da Cartel com organizações externas — aliados, parceiros, negociações e histórico.

      </p>

    </div>

  );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <section className="py-16 px-4">

      <div className="max-w-5xl mx-auto space-y-4">


        {/* ====================================================
            ESTATÍSTICAS
            ==================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">


          {/* ==================================================
              MEMBROS
              ================================================== */}

          {canAccessMembers ? (

            <Link
              to="/membros"
              className="block"
            >

              {membersCard}

            </Link>

          ) : (

            <div
              aria-disabled="true"
            >

              {membersCard}

            </div>

          )}


          {/* ==================================================
              LINKS
              ================================================== */}

          {canAccessLinks ? (

            <Link
              to="/links"
              className="block"
            >

              {linksCard}

            </Link>

          ) : (

            <div
              aria-disabled="true"
            >

              {linksCard}

            </div>

          )}

        </div>


        {/* ====================================================
            RELAÇÕES EXTERNAS
            ==================================================== */}

        <motion.div

          initial={{
            opacity:
              0,

            y:
              30,
          }}

          whileInView={{
            opacity:
              1,

            y:
              0,
          }}

          viewport={{
            once:
              true,
          }}

          transition={{
            delay:
              0.2,

            duration:
              0.6,
          }}

        >

          {canAccessRelations ? (

            <Link
              to="/relacoes"
              className="block"
            >

              {relationsCard}

            </Link>

          ) : (

            <div
              aria-disabled="true"
            >

              {relationsCard}

            </div>

          )}

        </motion.div>

      </div>

    </section>

  );

}