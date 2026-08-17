// ============================================================
// BADGE DE STATUS DE RELAÇÃO
// ============================================================
//
// Componente exclusivamente visual.
//
// NÃO acessa:
// - API
// - Base44
// - banco de dados
// - RBAC
//
// Recebe apenas:
//
// status
// size
//
// e renderiza o respectivo badge.
//
// ============================================================

import React from "react";


// ============================================================
// CONFIGURAÇÃO DOS STATUS
// ============================================================
//
// Cada status possui:
//
// dot   -> cor do indicador
// badge -> estilo do badge
//
// ============================================================

export const statusConfig = {

  Aliada: {

    dot:
      "bg-green-500",

    badge:
      "bg-green-500/15 text-green-400 border-green-500/30",

  },


  Parceira: {

    dot:
      "bg-blue-500",

    badge:
      "bg-blue-500/15 text-blue-400 border-blue-500/30",

  },


  Neutra: {

    dot:
      "bg-zinc-500",

    badge:
      "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",

  },


  "Em observação": {

    dot:
      "bg-yellow-500",

    badge:
      "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",

  },


  Hostil: {

    dot:
      "bg-orange-500",

    badge:
      "bg-orange-500/15 text-orange-400 border-orange-500/30",

  },


  Inimiga: {

    dot:
      "bg-red-500",

    badge:
      "bg-red-500/15 text-red-400 border-red-500/30",

  },

};


// ============================================================
// STATUS PADRÃO
// ============================================================
//
// Caso venha:
//
// null
// undefined
// valor desconhecido
//
// usamos "Neutra" visualmente.
// ============================================================

const DEFAULT_STATUS =
  "Neutra";


// ============================================================
// COMPONENTE
// ============================================================

export default function StatusBadge({

  status,

  size =
    "sm",

}) {

  // ==========================================================
  // NORMALIZAÇÃO
  // ==========================================================

  const normalizedStatus =
    statusConfig[
      status
    ]

      ? status

      : DEFAULT_STATUS;


  // ==========================================================
  // CONFIGURAÇÃO
  // ==========================================================

  const config =
    statusConfig[
      normalizedStatus
    ];


  // ==========================================================
  // TAMANHO
  // ==========================================================

  const sizeClass =
    size ===
    "lg"

      ? "text-xs px-2.5 py-1"

      : "text-[10px] px-2 py-0.5";


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <span

      className={`inline-flex items-center gap-1.5 font-heading tracking-[0.15em] border rounded ${config.badge} ${sizeClass}`}

    >

      {/* ====================================================
          INDICADOR
          ==================================================== */}

      <span

        className={`w-1.5 h-1.5 rounded-full ${config.dot}`}

      />


      {/* ====================================================
          TEXTO
          ==================================================== */}

      {
        normalizedStatus
      }

    </span>

  );
}