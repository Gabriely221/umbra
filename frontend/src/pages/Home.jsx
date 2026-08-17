// ============================================================
// PÁGINA INICIAL
// ============================================================
//
// Arquitetura:
//
// React
//   ↓
// React Query
//   ↓
// services/api.js
//   ↓
// GET /api/home/stats
//   ↓
// Node / Express
//   ↓
// JWT
//   ↓
// visualizar_inicio
//   ↓
// Sequelize
//   ↓
// MySQL
//
// A Home NÃO baixa mais:
//
// - lista completa de membros
// - lista completa de links
//
// apenas para calcular estatísticas.
//
// ============================================================

import React from "react";


// ============================================================
// REACT QUERY
// ============================================================

import {
  useQuery,
} from "@tanstack/react-query";


// ============================================================
// COMPONENTES
// ============================================================

import HeroSection
  from "@/components/home/HeroSection";

import StatsSection
  from "@/components/home/StatsSection";

import QuickLinksSection
  from "@/components/home/QuickLinksSection";


// ============================================================
// API
// ============================================================

import {
  getHomeStats,
} from "@/services/api";


// ============================================================
// VALORES PADRÃO
// ============================================================

const DEFAULT_STATS = {

  activeMembers:
    0,

  linkCount:
    0,

};


// ============================================================
// COMPONENTE
// ============================================================

export default function Home() {

  // ==========================================================
  // ESTATÍSTICAS
  // ==========================================================
  //
  // Uma única query é suficiente para carregar os números da
  // página inicial.
  //
  // O endpoint exige apenas:
  //
  // visualizar_inicio
  //
  // A Home não depende mais das permissões:
  //
  // visualizar_membros
  // visualizar_links
  //
  // ==========================================================

  const {

    data:
      stats = DEFAULT_STATS,

    isLoading,

    isError,

    error,

  } =
    useQuery({

      queryKey: [
        "home-stats",
      ],

      queryFn:
        getHomeStats,

    });


  // ==========================================================
  // NORMALIZAÇÃO
  // ==========================================================
  //
  // services/api.js já normaliza esses valores.
  //
  // Mantemos esta camada defensiva para evitar que um valor
  // inesperado chegue ao componente visual.
  //
  // ==========================================================

  const activeMembers =
    Number.isFinite(
      Number(
        stats?.activeMembers
      )
    )
      ? Number(
          stats.activeMembers
        )
      : 0;


  const linkCount =
    Number.isFinite(
      Number(
        stats?.linkCount
      )
    )
      ? Number(
          stats.linkCount
        )
      : 0;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div>


      {/* ======================================================
          HERO
          ====================================================== */}

      <HeroSection />


      {/* ======================================================
          ERRO DAS ESTATÍSTICAS
          ======================================================
          
          Um erro na consulta das estatísticas não derruba o
          restante da Home.
          
          Diferentemente da implementação anterior, também não
          interpretamos 403 ou falha de rede como "zero
          registros".
          
          ====================================================== */}

      {isError && (

        <div className="max-w-5xl mx-auto px-4 pt-8">

          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center">

            <p className="text-sm text-red-400">

              {
                error?.message ||
                "Não foi possível carregar as estatísticas da página inicial."
              }

            </p>

          </div>

        </div>

      )}


      {/* ======================================================
          ESTATÍSTICAS
          ======================================================
          
          isLoading e isError são enviados para que o
          StatsSection possa representar corretamente os
          estados visuais.
          
          Na próxima etapa revisaremos esse componente.
          
          ====================================================== */}

      <StatsSection

        activeMembers={
          activeMembers
        }

        linkCount={
          linkCount
        }

        isLoading={
          isLoading
        }

        isError={
          isError
        }

      />


      {/* ======================================================
          NAVEGAÇÃO RÁPIDA
          ====================================================== */}

      <QuickLinksSection />

    </div>

  );

}