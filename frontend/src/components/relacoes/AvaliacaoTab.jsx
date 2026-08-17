// ============================================================
// ABA "AVALIAÇÃO" DA ORGANIZAÇÃO
// ============================================================
//
// Exibe e permite editar a avaliação qualitativa da relação.
//
// Indicadores:
//
// - Cumpre acordos
// - Confiança
// - Comunicação
// - Organização
// - Estabilidade
// - Risco
//
// Notas:
//
// 1 a 5 = avaliação válida
// 0      = ainda não avaliado
//
// Persistência:
//
// Organization.evaluation
//
// {
//   cumpre_acordos: 1..5 | 0,
//   confianca: 1..5 | 0,
//   comunicacao: 1..5 | 0,
//   organizacao: 1..5 | 0,
//   estabilidade: 1..5 | 0,
//   risco: 1..5 | 0
// }
//
// Este componente NÃO acessa API diretamente.
//
// Fluxo:
//
// AvaliacaoTab
//      ↓
// onUpdate({ evaluation })
//      ↓
// OrganizationDetail.jsx
//      ↓
// services/api.js
//      ↓
// PUT /api/organizations/:id
//      ↓
// Express + RBAC
//      ↓
// Sequelize / MySQL
//
// ============================================================

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";


// ============================================================
// ÍCONES
// ============================================================

import {
  Save,
  Star,
} from "lucide-react";


// ============================================================
// UI
// ============================================================

import {
  Button,
} from "@/components/ui/button";


// ============================================================
// INDICADORES
// ============================================================
//
// inverse = true:
//
// Quanto maior a nota, pior o indicador.
//
// Atualmente isso se aplica apenas a "risco".
//
// ============================================================

const INDICATORS = [

  {
    key:
      "cumpre_acordos",

    label:
      "CUMPRE ACORDOS",
  },

  {
    key:
      "confianca",

    label:
      "CONFIANÇA",
  },

  {
    key:
      "comunicacao",

    label:
      "COMUNICAÇÃO",
  },

  {
    key:
      "organizacao",

    label:
      "ORGANIZAÇÃO",
  },

  {
    key:
      "estabilidade",

    label:
      "ESTABILIDADE",
  },

  {
    key:
      "risco",

    label:
      "RISCO",

    inverse:
      true,
  },

];


// ============================================================
// CRIA AVALIAÇÃO VAZIA
// ============================================================
//
// Usamos função em vez de objeto compartilhado para evitar
// reutilização acidental da mesma referência.
//
// ============================================================

function createEmptyRatings() {

  return {

    cumpre_acordos:
      0,

    confianca:
      0,

    comunicacao:
      0,

    organizacao:
      0,

    estabilidade:
      0,

    risco:
      0,

  };

}


// ============================================================
// NORMALIZA NOTA
// ============================================================
//
// Valores válidos:
//
// 0 = não avaliado
// 1..5 = avaliação
//
// ============================================================

function normalizeRating(
  value
) {

  const numeric =
    Number(
      value
    );


  if (
    !Number.isFinite(
      numeric
    )
  ) {

    return 0;

  }


  return Math.min(
    5,
    Math.max(
      0,
      Math.round(
        numeric
      )
    )
  );

}


// ============================================================
// VERIFICA OBJETO SIMPLES
// ============================================================

function isPlainObject(
  value
) {

  return (
    value !==
      null &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  );

}


// ============================================================
// MONTA FORMATO CANÔNICO
// ============================================================
//
// Somente os seis indicadores conhecidos são preservados.
//
// Nenhuma propriedade arbitrária vinda do banco ou de JSON
// legado é copiada para o estado.
//
// ============================================================

function buildCanonicalEvaluation(
  value
) {

  const source =
    isPlainObject(
      value
    )
      ? value
      : {};


  const result =
    createEmptyRatings();


  for (
    const indicator
    of INDICATORS
  ) {

    result[
      indicator.key
    ] =
      normalizeRating(
        source[
          indicator.key
        ]
      );

  }


  return result;

}


// ============================================================
// NORMALIZA AVALIAÇÃO
// ============================================================
//
// Aceita temporariamente:
//
// - objeto JSON
// - JSON string legado
//
// ============================================================

function normalizeEvaluation(
  value
) {

  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {

    return createEmptyRatings();

  }


  // ----------------------------------------------------------
  // OBJETO
  // ----------------------------------------------------------

  if (
    isPlainObject(
      value
    )
  ) {

    return buildCanonicalEvaluation(
      value
    );

  }


  // ----------------------------------------------------------
  // JSON STRING LEGADO
  // ----------------------------------------------------------

  if (
    typeof value ===
    "string"
  ) {

    try {

      const parsed =
        JSON.parse(
          value
        );


      if (
        isPlainObject(
          parsed
        )
      ) {

        return buildCanonicalEvaluation(
          parsed
        );

      }

    } catch (
      parseError
    ) {

      console.warn(
        "[AvaliacaoTab] avaliação legada inválida:",
        parseError
      );

    }

  }


  return createEmptyRatings();

}


// ============================================================
// COMPONENTE
// ============================================================

export default function AvaliacaoTab({

  org,

  canEdit = false,

  onUpdate,

}) {

  // ==========================================================
  // NOTAS
  // ==========================================================

  const [
    ratings,
    setRatings,
  ] =
    useState(
      createEmptyRatings
    );


  // ==========================================================
  // SALVANDO
  // ==========================================================

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );


  // ==========================================================
  // ERRO
  // ==========================================================

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );


  // ==========================================================
  // CARREGA AVALIAÇÃO
  // ==========================================================

  useEffect(
    () => {

      const evaluation =

        org?.evaluation ??

        org?.evaluations ??

        null;


      setRatings(
        normalizeEvaluation(
          evaluation
        )
      );


      setSaving(
        false
      );


      setError(
        ""
      );

    },
    [
      org,
    ]
  );


  // ==========================================================
  // ALTERAR NOTA
  // ==========================================================

  function setRating(
    key,
    value
  ) {

    if (
      !canEdit ||
      saving
    ) {

      return;

    }


    const indicatorExists =
      INDICATORS.some(
        (
          indicator
        ) =>
          indicator.key ===
          key
      );


    if (
      !indicatorExists
    ) {

      return;

    }


    const normalized =
      normalizeRating(
        value
      );


    // --------------------------------------------------------
    // Clique na estrela já selecionada:
    //
    // Mantemos a nota.
    //
    // Não usamos toggle para zero, pois zero representa
    // "não avaliado", não uma nota efetiva.
    // --------------------------------------------------------

    setRatings(
      (
        current
      ) => ({

        ...current,

        [key]:
          normalized,

      })
    );


    setError(
      ""
    );

  }


  // ==========================================================
  // AVALIAÇÃO CANÔNICA
  // ==========================================================

  const normalizedRatings =
    useMemo(
      () =>
        buildCanonicalEvaluation(
          ratings
        ),
      [
        ratings,
      ]
    );


  // ==========================================================
  // QUANTIDADE AVALIADA
  // ==========================================================

  const ratedIndicators =
    useMemo(
      () =>
        INDICATORS.filter(
          (
            indicator
          ) =>
            normalizedRatings[
              indicator.key
            ] >
            0
        ).length,
      [
        normalizedRatings,
      ]
    );


  // ==========================================================
  // SALVAR
  // ==========================================================

  async function handleSave() {

    if (
      saving
    ) {

      return;

    }


    if (
      !canEdit
    ) {

      setError(
        "Você não possui permissão para editar esta avaliação."
      );


      return;

    }


    if (
      typeof onUpdate !==
      "function"
    ) {

      setError(
        "Não foi possível salvar a avaliação."
      );


      return;

    }


    setSaving(
      true
    );


    setError(
      ""
    );


    try {

      // ======================================================
      // PAYLOAD EXPLÍCITO
      // ======================================================
      //
      // O Organization.evaluation recebe um objeto JSON.
      //
      // Não enviamos outros campos da organização.
      //
      // ======================================================

      await onUpdate({

        evaluation:
          normalizedRatings,

      });


      setRatings(
        normalizedRatings
      );

    } catch (
      saveError
    ) {

      console.error(
        "[AvaliacaoTab] erro ao salvar:",
        saveError
      );


      setError(

        saveError?.message ||

        "Não foi possível salvar a avaliação."

      );

    } finally {

      setSaving(
        false
      );

    }

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="space-y-6">


      {/* ======================================================
          DESCRIÇÃO
          ====================================================== */}

      <div className="text-center">

        <p className="text-xs text-muted-foreground/60 font-body">

          Avaliação qualitativa da relação — notas de 1 a 5 estrelas

        </p>


        <p className="text-[10px] text-muted-foreground/40 font-body mt-1">

          {
            ratedIndicators
          } de {
            INDICATORS.length
          } indicadores avaliados

        </p>

      </div>


      {/* ======================================================
          INDICADORES
          ====================================================== */}

      {INDICATORS.map(
        ({
          key,
          label,
          inverse,
        }) => {

          const value =
            normalizedRatings[
              key
            ];


          const percentage =
            (
              value /
              5
            ) *
            100;


          return (

            <div
              key={
                key
              }
            >


              {/* =================================================
                  CABEÇALHO
                  ================================================= */}

              <div className="flex items-center justify-between gap-4 mb-2">

                <span className="font-heading text-[10px] tracking-[0.15em] text-muted-foreground">

                  {label}


                  {inverse && (

                    <span className="text-orange-400/60 ml-1">

                      (↑ = maior risco)

                    </span>

                  )}

                </span>


                {/* =================================================
                    EDIÇÃO
                    ================================================= */}

                {canEdit ? (

                  <div
                    className="flex gap-1"
                    role="radiogroup"
                    aria-label={label}
                  >

                    {[
                      1,
                      2,
                      3,
                      4,
                      5,
                    ].map(
                      (
                        number
                      ) => (

                        <button

                          key={
                            number
                          }

                          type="button"

                          onClick={() =>
                            setRating(
                              key,
                              number
                            )
                          }

                          disabled={
                            saving
                          }

                          role="radio"

                          aria-checked={
                            value ===
                            number
                          }

                          aria-label={`${label}: ${number} de 5`}

                          title={`${number} de 5`}

                          className="transition-transform hover:scale-110 focus:outline-none focus:ring-1 focus:ring-primary rounded-sm disabled:opacity-50 disabled:hover:scale-100"

                        >

                          <Star

                            className={`w-4 h-4 ${
                              number <=
                              value

                                ? "fill-primary text-primary"

                                : "text-muted-foreground/30"
                            }`}

                          />

                        </button>

                      )
                    )}

                  </div>

                ) : (

                  /* ===============================================
                     VISUALIZAÇÃO
                     =============================================== */

                  <div
                    className="flex items-center gap-2"
                    aria-label={`${label}: ${
                      value > 0
                        ? `${value} de 5`
                        : "não avaliado"
                    }`}
                  >

                    <div className="flex gap-0.5">

                      {[
                        1,
                        2,
                        3,
                        4,
                        5,
                      ].map(
                        (
                          number
                        ) => (

                          <Star

                            key={
                              number
                            }

                            className={`w-3.5 h-3.5 ${
                              number <=
                              value

                                ? "fill-primary text-primary"

                                : "text-muted-foreground/20"
                            }`}

                          />

                        )
                      )}

                    </div>


                    {value ===
                      0 && (

                      <span className="text-[9px] text-muted-foreground/40">

                        —

                      </span>

                    )}

                  </div>

                )}

              </div>


              {/* =================================================
                  BARRA
                  ================================================= */}

              <div className="h-1.5 bg-muted rounded-full overflow-hidden">

                <div

                  className={`h-full rounded-full transition-all duration-500 ${
                    inverse &&
                    value >=
                      4

                      ? "bg-orange-500"

                      : "bg-primary"
                  }`}

                  style={{
                    width:
                      `${percentage}%`,
                  }}

                />

              </div>

            </div>

          );

        }
      )}


      {/* ======================================================
          ERRO
          ====================================================== */}

      {error && (

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">

          <p className="text-xs text-red-400 leading-relaxed">

            {error}

          </p>

        </div>

      )}


      {/* ======================================================
          SALVAR
          ====================================================== */}

      {canEdit && (

        <div className="flex justify-end pt-2">

          <Button

            onClick={
              handleSave
            }

            disabled={
              saving
            }

            className="font-heading text-xs tracking-wider bg-primary text-primary-foreground"

          >

            {saving ? (

              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />

            ) : (

              <>

                <Save className="w-4 h-4 mr-2" />

                SALVAR AVALIAÇÃO

              </>

            )}

          </Button>

        </div>

      )}

    </div>

  );

}