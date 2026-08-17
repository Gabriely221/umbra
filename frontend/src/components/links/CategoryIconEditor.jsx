// ============================================================
// EDITOR DE ÍCONES DAS CATEGORIAS
// ============================================================
//
// Este componente permite escolher o ícone visual de cada
// categoria de links.
//
// Fluxo:
//
// CategoryIconEditor
//      ↓
// services/api.js
//      ↓
// Express
//      ↓
// RBAC
//      ↓
// Sequelize
//      ↓
// MySQL
//
// REMOVIDO:
// - Base44
// - useCategorias()
// - configuração antiga de sistema
//
// MANTIDO:
// - visual
// - seleção por categoria
// - seleção de ícones
// - getIconComponent()
//
// ============================================================

import React, {
  useMemo,
  useState,
} from "react";


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
  Settings,
  X,
  Save,
  Search,
  Calculator,
  Landmark,
  Zap,
  Crown,
  Shield,
  Star,
  Flame,
  Target,
  Crosshair,
  Eye,
  Briefcase,
  Database,
  Lock,
  Key,
  Globe,
  Map,
  FileText,
  Link2,
  Award,
  Check,
} from "lucide-react";


// ============================================================
// COMPONENTES UI
// ============================================================

import {
  Button,
} from "@/components/ui/button";


// ============================================================
// REACT QUERY
// ============================================================

import {
  useQueryClient,
} from "@tanstack/react-query";


// ============================================================
// API
// ============================================================

import {
  updateLinkCategory,
  createLinkCategory,
} from "../../services/api";


// ============================================================
// ÍCONES DISPONÍVEIS
// ============================================================
//
// A lista continua sendo exatamente a mesma que você possuía.
// ============================================================

export const ALL_ICONS = [

  {
    value:
      "search",

    Icon:
      Search,

    label:
      "Lupa",
  },

  {
    value:
      "calculator",

    Icon:
      Calculator,

    label:
      "Calculadora",
  },

  {
    value:
      "landmark",

    Icon:
      Landmark,

    label:
      "Banco",
  },

  {
    value:
      "zap",

    Icon:
      Zap,

    label:
      "Raio",
  },

  {
    value:
      "crown",

    Icon:
      Crown,

    label:
      "Coroa",
  },

  {
    value:
      "shield",

    Icon:
      Shield,

    label:
      "Escudo",
  },

  {
    value:
      "star",

    Icon:
      Star,

    label:
      "Estrela",
  },

  {
    value:
      "flame",

    Icon:
      Flame,

    label:
      "Chama",
  },

  {
    value:
      "target",

    Icon:
      Target,

    label:
      "Alvo",
  },

  {
    value:
      "crosshair",

    Icon:
      Crosshair,

    label:
      "Mira",
  },

  {
    value:
      "eye",

    Icon:
      Eye,

    label:
      "Olho",
  },

  {
    value:
      "briefcase",

    Icon:
      Briefcase,

    label:
      "Pasta",
  },

  {
    value:
      "database",

    Icon:
      Database,

    label:
      "Base",
  },

  {
    value:
      "lock",

    Icon:
      Lock,

    label:
      "Cadeado",
  },

  {
    value:
      "key",

    Icon:
      Key,

    label:
      "Chave",
  },

  {
    value:
      "globe",

    Icon:
      Globe,

    label:
      "Globo",
  },

  {
    value:
      "map",

    Icon:
      Map,

    label:
      "Mapa",
  },

  {
    value:
      "file",

    Icon:
      FileText,

    label:
      "Arquivo",
  },

  {
    value:
      "link",

    Icon:
      Link2,

    label:
      "Link",
  },

  {
    value:
      "award",

    Icon:
      Award,

    label:
      "Prêmio",
  },

];


// ============================================================
// GET ICON COMPONENT
// ============================================================
//
// Permite fazer:
//
// const Icon = getIconComponent("shield");
//
// Caso o valor não exista, usamos Link2 como fallback.
//
// ============================================================

export function getIconComponent(
  iconValue
) {

  return (

    ALL_ICONS.find(
      (icon) =>
        icon.value ===
        iconValue
    )?.Icon ||

    Link2

  );
}


// ============================================================
// SLUGIFY
// ============================================================
//
// Converte:
//
// "Links Importantes"
// ↓
// "links-importantes"
//
// O slug é necessário pela nova tabela LinkCategory.
// ============================================================

function slugify(
  value
) {

  return (

    String(
      value || ""
    )

      .normalize(
        "NFD"
      )

      .replace(
        /[\u0300-\u036f]/g,
        ""
      )

      .toLowerCase()

      .trim()

      .replace(
        /[^a-z0-9]+/g,
        "-"
      )

      .replace(
        /^-+|-+$/g,
        ""

      )

  );
}


// ============================================================
// COMPONENTE
// ============================================================

export default function CategoryIconEditor({
  categories = [],
  onClose,
}) {

  const queryClient =
    useQueryClient();


  // ==========================================================
  // NOMES DAS CATEGORIAS
  // ==========================================================
  //
  // Antes isso vinha de:
  //
  // useCategorias()
  //
  // Agora utilizamos as categorias reais recebidas pela API.
  // ==========================================================

  const catNames =
    useMemo(
      () => {

        const names =
          categories

            .map(
              (
                category
              ) =>
                category?.name
            )

            .filter(
              Boolean
            );


        // Mantemos o comportamento visual antigo:
        // se não houver categoria, usamos "Geral".
        return (
          names.length >
          0

            ? [
                ...new Set(
                  names
                ),
              ]

            : [
                "Geral",
              ]
        );

      },

      [
        categories,
      ]
    );


  // ==========================================================
  // ESTADO DAS SELEÇÕES
  // ==========================================================
  //
  // Estrutura:
  //
  // {
  //   "Discord": "shield",
  //   "Documentos": "file"
  // }
  // ==========================================================

  const [
    selections,
    setSelections,
  ] =
    useState(
      () => {

        const map =
          {};


        catNames.forEach(
          (
            categoryName
          ) => {

            const existing =
              categories.find(
                (
                  category
                ) =>
                  category?.name ===
                  categoryName
              );


            map[
              categoryName
            ] =
              existing?.icon ||
              "link";

          }
        );


        return map;
      }
    );


  // ==========================================================
  // ESTADO DE SALVAMENTO
  // ==========================================================

  const [
    saving,
    setSaving,
  ] =
    useState(false);


  // ==========================================================
  // CATEGORIA ATIVA
  // ==========================================================

  const [
    activeCategory,
    setActiveCategory,
  ] =
    useState(
      catNames[0] ||
      "Geral"
    );


  // ==========================================================
  // CATEGORIA ATIVA
  // ==========================================================

  const activeCatIcon =
    selections[
      activeCategory
    ] ||
    "link";


  // ==========================================================
  // ALTERAR ÍCONE DA CATEGORIA
  // ==========================================================

  function selectIcon(
    iconValue
  ) {

    setSelections(
      (
        current
      ) => ({

        ...current,

        [activeCategory]:
          iconValue,

      })
    );
  }


  // ==========================================================
  // SALVAR
  // ==========================================================
  //
  // Para categorias já existentes:
  //
  // PUT /api/links/categories/:id
  //
  // Para a situação especial em que a categoria existe na
  // interface mas ainda não existe no banco:
  //
  // POST /api/links/categories
  //
  // Isso mantém a compatibilidade do comportamento antigo.
  // ==========================================================

  async function handleSave() {

    setSaving(
      true
    );


    try {

      for (
        const categoryName
        of catNames
      ) {

        const selectedIcon =
          selections[
            categoryName
          ] ||
          "link";


        const existing =
          categories.find(
            (
              category
            ) =>
              category?.name ===
              categoryName
          );


        // ====================================================
        // CATEGORIA EXISTENTE
        // ====================================================

        if (
          existing
        ) {

          await updateLinkCategory(

            existing.id,

            {

              name:
                existing.name,

              slug:
                existing.slug ||
                slugify(
                  existing.name
                ),

              icon:
                selectedIcon,

            }

          );


          continue;
        }


        // ====================================================
        // CATEGORIA AINDA NÃO EXISTENTE
        // ====================================================
        //
        // Isso normalmente só deve ocorrer para "Geral".
        // ====================================================

        await createLinkCategory({

          name:
            categoryName,

          slug:
            slugify(
              categoryName
            ),

          icon:
            selectedIcon,

        });
      }


      // ======================================================
      // ATUALIZA CACHE
      // ======================================================

      await queryClient.invalidateQueries({

        queryKey:
          [
            "link-categories",
          ],

      });


      // Os links podem carregar os nomes/ícones das categorias.
      await queryClient.invalidateQueries({

        queryKey:
          [
            "links",
          ],

      });


      // Fecha o modal.
      onClose();


    } catch (
      error
    ) {

      console.error(
        "[CategoryIconEditor] erro ao salvar:",
        error
      );


      alert(
        error?.message ||
        "Não foi possível salvar os ícones das categorias."
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

    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">


      {/* ======================================================
          BACKDROP
          ====================================================== */}

      <motion.div

        initial={{
          opacity: 0,
        }}

        animate={{
          opacity: 1,
        }}

        exit={{
          opacity: 0,
        }}

        className="absolute inset-0 bg-black/70 backdrop-blur-sm"

        onClick={
          onClose
        }

      />


      {/* ======================================================
          MODAL
          ====================================================== */}

      <motion.div

        initial={{
          opacity: 0,
          scale: 0.95,
          y: 20,
        }}

        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}

        exit={{
          opacity: 0,
          scale: 0.95,
          y: 20,
        }}

        transition={{
          duration:
            0.25,
        }}

        className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-2xl"

      >


        {/* ====================================================
            HEADER
            ==================================================== */}

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">

          <div className="flex items-center gap-3">

            <Settings
              className="w-5 h-5 text-muted-foreground"
            />

            <h2 className="font-heading text-lg font-bold tracking-[0.1em] text-primary">

              ÍCONES DAS CATEGORIAS

            </h2>

          </div>


          <button

            type="button"

            onClick={
              onClose
            }

            className="text-muted-foreground hover:text-primary transition-colors"

          >

            <X
              className="w-5 h-5"
            />

          </button>

        </div>


        {/* ====================================================
            CORPO
            ==================================================== */}

        <div className="px-6 py-5 space-y-5">


          {/* ==================================================
              ABAS DE CATEGORIA
              ================================================== */}

          <div className="flex flex-wrap gap-2">

            {catNames.map(
              (
                categoryName
              ) => {

                const IconComp =
                  getIconComponent(

                    selections[
                      categoryName
                    ]

                  );


                return (

                  <button

                    key={
                      categoryName
                    }

                    type="button"

                    onClick={() =>
                      setActiveCategory(
                        categoryName
                      )
                    }

                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-heading tracking-wider transition-all ${
                      activeCategory ===
                      categoryName

                        ? "bg-primary text-primary-foreground border-primary"

                        : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                    }`}

                  >

                    <IconComp
                      className="w-3 h-3"
                    />

                    {
                      categoryName
                    }

                  </button>

                );
              }
            )}

          </div>


          {/* ==================================================
              GRID DE ÍCONES
              ================================================== */}

          <div>

            <p className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground mb-3">

              ESCOLHA O ÍCONE PARA{" "}

              <span className="text-primary">

                {
                  activeCategory.toUpperCase()
                }

              </span>

            </p>


            <div className="grid grid-cols-5 gap-2">

              {ALL_ICONS.map(
                ({
                  value,
                  Icon,
                  label,
                }) => {

                  const selected =
                    activeCatIcon ===
                    value;


                  return (

                    <button

                      key={
                        value
                      }

                      type="button"

                      onClick={() =>
                        selectIcon(
                          value
                        )
                      }

                      title={
                        label
                      }

                      className={`relative flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                        selected

                          ? "bg-primary text-primary-foreground border-primary"

                          : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-accent/50"
                      }`}

                    >

                      <Icon
                        className="w-5 h-5"
                      />


                      <span className="text-[8px] font-heading tracking-wide leading-none">

                        {
                          label
                        }

                      </span>


                      {selected && (

                        <Check
                          className="absolute top-1 right-1 w-2.5 h-2.5"
                        />

                      )}

                    </button>

                  );
                }
              )}

            </div>

          </div>

        </div>


        {/* ====================================================
            RODAPÉ
            ==================================================== */}

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-background/50">

          <Button

            variant="outline"

            size="sm"

            onClick={
              onClose
            }

            disabled={
              saving
            }

            className="font-heading text-xs tracking-wider"

          >

            CANCELAR

          </Button>


          <Button

            size="sm"

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

                <Save
                  className="w-4 h-4 mr-2"
                />

                SALVAR

              </>

            )}

          </Button>

        </div>

      </motion.div>

    </div>
  );
}