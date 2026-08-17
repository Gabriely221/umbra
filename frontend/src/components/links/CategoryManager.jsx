// ============================================================
// GERENCIADOR DE CATEGORIAS DE LINKS
// ============================================================
//
// Fluxo:
//
// CategoryManager
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
// PERMISSÃO:
//
// gerenciar_links
//
// A página controla a exibição do componente.
// O backend continua sendo a autoridade real.
//
// ============================================================

import React, {
  useEffect,
  useState,
} from "react";


// ============================================================
// FRAMER MOTION
// ============================================================

import {
  motion,
} from "framer-motion";


// ============================================================
// ÍCONES
// ============================================================

import {
  Check,
  Pencil,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-react";


// ============================================================
// UI
// ============================================================

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";


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
  createLinkCategory,
  deleteLinkCategory,
  updateLinkCategory,
} from "@/services/api";


// ============================================================
// ÍCONES DE CATEGORIA
// ============================================================

import {
  getIconComponent,
} from "./CategoryIconEditor";


// ============================================================
// ÍCONES DISPONÍVEIS
// ============================================================

const ALL_ICONS = [

  "search",
  "calculator",
  "landmark",
  "zap",
  "crown",
  "shield",
  "star",
  "flame",
  "target",
  "crosshair",
  "eye",
  "briefcase",
  "database",
  "lock",
  "key",
  "globe",
  "map",
  "file",
  "link",
  "award",

];


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// SLUG
// ------------------------------------------------------------

function slugify(
  value
) {

  return String(
    value ??
    ""
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
    );

}


// ------------------------------------------------------------
// NORMALIZA RETORNO DA API
// ------------------------------------------------------------
//
// Aceita:
//
// {
//   message: "...",
//   category: {...}
// }
//
// ou:
//
// {
//   id,
//   name,
//   ...
// }
//
// Isso deixa o componente compatível independentemente de o
// services/api.js desembrulhar ou não a resposta.
//
// ------------------------------------------------------------

function unwrapCategory(
  response
) {

  return (
    response?.category ||
    response ||
    null
  );

}


// ------------------------------------------------------------
// NORMALIZA CATEGORIA LOCAL
// ------------------------------------------------------------

function normalizeCategory(
  category
) {

  if (
    !category ||
    typeof category !==
      "object"
  ) {

    return null;

  }


  const id =
    category.id;


  const name =
    String(
      category.name ??
      ""
    ).trim();


  if (
    !id ||
    !name
  ) {

    return null;

  }


  const icon =
    String(
      category.icon ??
      "link"
    ).trim() ||
    "link";


  return {

    ...category,

    id,

    name,

    icon,

    _editing:
      false,

    _tempName:
      name,

    _tempIcon:
      icon,

  };

}


// ============================================================
// COMPONENTE
// ============================================================

export default function CategoryManager({

  categories = [],

  onClose,

}) {

  const queryClient =
    useQueryClient();


  // ==========================================================
  // CATEGORIAS LOCAIS
  // ==========================================================

  const [
    items,
    setItems,
  ] =
    useState(
      []
    );


  // ==========================================================
  // NOVA CATEGORIA
  // ==========================================================

  const [
    newName,
    setNewName,
  ] =
    useState(
      ""
    );


  const [
    newIcon,
    setNewIcon,
  ] =
    useState(
      "link"
    );


  // ==========================================================
  // OPERAÇÃO EM ANDAMENTO
  // ==========================================================

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );


  // ==========================================================
  // SINCRONIZA PROP
  // ==========================================================

  useEffect(
    () => {

      const normalized =
        Array.isArray(
          categories
        )
          ? categories
              .map(
                normalizeCategory
              )
              .filter(Boolean)
          : [];


      setItems(
        normalized
      );

    },
    [
      categories,
    ]
  );


  // ==========================================================
  // INVALIDA CACHE
  // ==========================================================

  function invalidateCategories() {

    queryClient.invalidateQueries({

      queryKey: [
        "link-categories",
      ],

    });


    // --------------------------------------------------------
    // Os links retornam category.name.
    //
    // Ao renomear/excluir uma categoria, a listagem de Links
    // também precisa ser atualizada.
    // --------------------------------------------------------

    queryClient.invalidateQueries({

      queryKey: [
        "links",
      ],

    });

  }


  // ==========================================================
  // VERIFICA DUPLICIDADE LOCAL
  // ==========================================================

  function hasDuplicateName(
    name,
    ignoreId = null
  ) {

    const normalized =
      String(
        name ??
        ""
      )
        .trim()
        .toLocaleLowerCase(
          "pt-BR"
        );


    return items.some(
      (
        item
      ) =>
        item.id !==
          ignoreId &&
        String(
          item.name ??
          ""
        )
          .trim()
          .toLocaleLowerCase(
            "pt-BR"
          ) ===
          normalized
    );

  }


  // ==========================================================
  // CRIAR CATEGORIA
  // ==========================================================

  async function handleAddCategory() {

    const trimmedName =
      String(
        newName ??
        ""
      ).trim();


    if (
      !trimmedName ||
      saving
    ) {

      return;

    }


    // --------------------------------------------------------
    // DUPLICIDADE VISUAL
    // --------------------------------------------------------

    if (
      hasDuplicateName(
        trimmedName
      )
    ) {

      alert(
        "Já existe uma categoria com esse nome."
      );


      return;

    }


    const slug =
      slugify(
        trimmedName
      );


    if (
      !slug
    ) {

      alert(
        "Não foi possível gerar um slug válido para essa categoria."
      );


      return;

    }


    setSaving(
      true
    );


    try {

      const response =
        await createLinkCategory({

          name:
            trimmedName,

          slug,

          icon:
            newIcon ||
            "link",

          order:
            items.length +
            1,

        });


      const created =
        unwrapCategory(
          response
        );


      const normalizedCreated =
        normalizeCategory(
          created
        );


      if (
        normalizedCreated
      ) {

        setItems(
          (
            previous
          ) => [

            ...previous,

            normalizedCreated,

          ]
        );

      }


      // ------------------------------------------------------
      // LIMPA FORM
      // ------------------------------------------------------

      setNewName(
        ""
      );


      setNewIcon(
        "link"
      );


      // ------------------------------------------------------
      // ATUALIZA QUERIES
      // ------------------------------------------------------

      invalidateCategories();

    } catch (
      error
    ) {

      console.error(
        "[CategoryManager] erro ao criar categoria:",
        error
      );


      alert(
        error?.message ||
        "Não foi possível criar a categoria."
      );

    } finally {

      setSaving(
        false
      );

    }

  }


  // ==========================================================
  // SALVAR EDIÇÃO
  // ==========================================================

  async function handleSaveEdit(
    item
  ) {

    if (
      saving
    ) {

      return;

    }


    const trimmedName =
      String(
        item?._tempName ??
        ""
      ).trim();


    if (
      !trimmedName
    ) {

      alert(
        "O nome da categoria não pode ficar vazio."
      );


      return;

    }


    // --------------------------------------------------------
    // DUPLICIDADE LOCAL
    // --------------------------------------------------------

    if (
      hasDuplicateName(
        trimmedName,
        item.id
      )
    ) {

      alert(
        "Já existe outra categoria com esse nome."
      );


      return;

    }


    const slug =
      slugify(
        trimmedName
      );


    if (
      !slug
    ) {

      alert(
        "Não foi possível gerar um slug válido."
      );


      return;

    }


    setSaving(
      true
    );


    try {

      const response =
        await updateLinkCategory(

          item.id,

          {

            name:
              trimmedName,

            slug,

            icon:
              item._tempIcon ||
              "link",

          }

        );


      const updated =
        unwrapCategory(
          response
        );


      // ======================================================
      // ATUALIZA LOCALMENTE
      // ======================================================

      setItems(
        (
          previous
        ) =>
          previous.map(
            (
              category
            ) => {

              if (
                category.id !==
                item.id
              ) {

                return category;

              }


              const updatedName =
                String(
                  updated?.name ??
                  trimmedName
                ).trim();


              const updatedIcon =
                String(
                  updated?.icon ??
                  item._tempIcon ??
                  "link"
                ).trim() ||
                "link";


              return {

                ...category,

                ...(
                  updated &&
                  typeof updated ===
                    "object"
                    ? updated
                    : {}
                ),

                name:
                  updatedName,

                icon:
                  updatedIcon,

                _editing:
                  false,

                _tempName:
                  updatedName,

                _tempIcon:
                  updatedIcon,

              };

            }
          )
      );


      invalidateCategories();

    } catch (
      error
    ) {

      console.error(
        "[CategoryManager] erro ao editar categoria:",
        error
      );


      alert(
        error?.message ||
        "Não foi possível atualizar a categoria."
      );

    } finally {

      setSaving(
        false
      );

    }

  }


  // ==========================================================
  // EXCLUIR
  // ==========================================================

  async function handleDelete(
    item
  ) {

    if (
      saving ||
      !item?.id
    ) {

      return;

    }


    const confirmed =
      window.confirm(
        `Excluir a categoria "${item.name}"? Os links associados continuarão existindo, mas deixarão de pertencer a essa categoria.`
      );


    if (
      !confirmed
    ) {

      return;

    }


    setSaving(
      true
    );


    try {

      await deleteLinkCategory(
        item.id
      );


      // ------------------------------------------------------
      // REMOVE LOCALMENTE
      // ------------------------------------------------------

      setItems(
        (
          previous
        ) =>
          previous.filter(
            (
              category
            ) =>
              category.id !==
              item.id
          )
      );


      invalidateCategories();

    } catch (
      error
    ) {

      console.error(
        "[CategoryManager] erro ao excluir categoria:",
        error
      );


      alert(
        error?.message ||
        "Não foi possível excluir a categoria."
      );

    } finally {

      setSaving(
        false
      );

    }

  }


  // ==========================================================
  // INICIAR / CANCELAR EDIÇÃO
  // ==========================================================

  function setEditing(
    id,
    editing
  ) {

    if (
      saving
    ) {

      return;

    }


    setItems(
      (
        previous
      ) =>
        previous.map(
          (
            item
          ) => {

            if (
              item.id !==
              id
            ) {

              return item;

            }


            // ------------------------------------------------
            // ENTRANDO EM EDIÇÃO
            // ------------------------------------------------

            if (
              editing
            ) {

              return {

                ...item,

                _editing:
                  true,

                _tempName:
                  item.name,

                _tempIcon:
                  item.icon ||
                  "link",

              };

            }


            // ------------------------------------------------
            // CANCELANDO
            // ------------------------------------------------

            return {

              ...item,

              _editing:
                false,

              _tempName:
                item.name,

              _tempIcon:
                item.icon ||
                "link",

            };

          }
        )
    );

  }


  // ==========================================================
  // VALOR TEMPORÁRIO
  // ==========================================================

  function updateTemp(
    id,
    field,
    value
  ) {

    setItems(
      (
        previous
      ) =>
        previous.map(
          (
            item
          ) =>
            item.id ===
              id

              ? {

                  ...item,

                  [field]:
                    value,

                }

              : item
        )
    );

  }


  // ==========================================================
  // FECHAR
  // ==========================================================

  function handleClose() {

    if (
      saving
    ) {

      return;

    }


    if (
      typeof onClose ===
      "function"
    ) {

      onClose();

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
          opacity:
            0,
        }}

        animate={{
          opacity:
            1,
        }}

        exit={{
          opacity:
            0,
        }}

        className="absolute inset-0 bg-black/70 backdrop-blur-sm"

        onClick={
          handleClose
        }

      />


      {/* ======================================================
          MODAL
          ====================================================== */}

      <motion.div

        initial={{
          opacity:
            0,

          scale:
            0.95,

          y:
            20,
        }}

        animate={{
          opacity:
            1,

          scale:
            1,

          y:
            0,
        }}

        exit={{
          opacity:
            0,

          scale:
            0.95,

          y:
            20,
        }}

        className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"

      >


        {/* ====================================================
            HEADER
            ==================================================== */}

        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">

          <div className="flex items-center gap-3">

            <Settings className="w-5 h-5 text-muted-foreground" />


            <h2 className="font-heading text-lg font-bold tracking-[0.1em] text-primary">

              GERENCIAR CATEGORIAS

            </h2>

          </div>


          <button

            type="button"

            onClick={
              handleClose
            }

            disabled={
              saving
            }

            aria-label="Fechar"

            className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"

          >

            <X className="w-5 h-5" />

          </button>

        </div>


        {/* ====================================================
            CONTEÚDO
            ==================================================== */}

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-3">


          {/* ==================================================
              EXISTENTES
              ================================================== */}

          {items.length ===
            0 ? (

            <div className="text-center py-8">

              <p className="text-sm text-muted-foreground">

                Nenhuma categoria cadastrada.

              </p>

            </div>

          ) : (

            items.map(
              (
                item
              ) => {

                const IconComp =
                  getIconComponent(

                    item._editing

                      ? item._tempIcon

                      : item.icon

                  );


                return (

                  <div

                    key={
                      item.id
                    }

                    className="bg-background border border-border rounded-xl p-3"

                  >


                    {/* ========================================
                        EDIÇÃO
                        ======================================== */}

                    {item._editing ? (

                      <div className="space-y-3">


                        {/* NOME */}

                        <Input

                          value={
                            item._tempName
                          }

                          onChange={(
                            event
                          ) =>
                            updateTemp(
                              item.id,
                              "_tempName",
                              event.target.value
                            )
                          }

                          disabled={
                            saving
                          }

                          className="font-heading text-sm"

                          placeholder="Nome da categoria"

                        />


                        {/* ÍCONE */}

                        <div>

                          <p className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground mb-2">

                            ÍCONE

                          </p>


                          <div className="grid grid-cols-7 gap-1.5">

                            {ALL_ICONS.map(
                              (
                                value
                              ) => {

                                const Icon =
                                  getIconComponent(
                                    value
                                  );


                                const selected =
                                  item._tempIcon ===
                                  value;


                                return (

                                  <button

                                    key={
                                      value
                                    }

                                    type="button"

                                    onClick={() =>
                                      updateTemp(
                                        item.id,
                                        "_tempIcon",
                                        value
                                      )
                                    }

                                    disabled={
                                      saving
                                    }

                                    aria-pressed={
                                      selected
                                    }

                                    className={`flex items-center justify-center p-2 rounded-lg border transition-all disabled:opacity-50 ${
                                      selected

                                        ? "bg-primary text-primary-foreground border-primary"

                                        : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                                    }`}

                                    title={
                                      value
                                    }

                                  >

                                    <Icon className="w-4 h-4" />

                                  </button>

                                );

                              }
                            )}

                          </div>

                        </div>


                        {/* AÇÕES */}

                        <div className="flex gap-2">

                          <Button

                            size="sm"

                            onClick={() =>
                              handleSaveEdit(
                                item
                              )
                            }

                            disabled={
                              saving ||
                              !String(
                                item._tempName ??
                                ""
                              ).trim()
                            }

                            className="font-heading text-xs tracking-wider flex-1"

                          >

                            <Check className="w-3.5 h-3.5 mr-1" />

                            SALVAR

                          </Button>


                          <Button

                            size="sm"

                            variant="outline"

                            onClick={() =>
                              setEditing(
                                item.id,
                                false
                              )
                            }

                            disabled={
                              saving
                            }

                            className="font-heading text-xs tracking-wider"

                          >

                            CANCELAR

                          </Button>

                        </div>

                      </div>

                    ) : (


                      /* ======================================
                         VISUALIZAÇÃO
                         ====================================== */

                      <div className="flex items-center gap-3">


                        {/* ÍCONE */}

                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">

                          <IconComp className="w-4 h-4 text-primary" />

                        </div>


                        {/* NOME */}

                        <span className="font-heading text-sm tracking-wider text-primary flex-1">

                          {item.name}

                        </span>


                        {/* EDITAR */}

                        <button

                          type="button"

                          onClick={() =>
                            setEditing(
                              item.id,
                              true
                            )
                          }

                          disabled={
                            saving
                          }

                          className="p-1.5 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"

                          title="Editar categoria"

                        >

                          <Pencil className="w-3.5 h-3.5" />

                        </button>


                        {/* EXCLUIR */}

                        <button

                          type="button"

                          onClick={() =>
                            handleDelete(
                              item
                            )
                          }

                          disabled={
                            saving
                          }

                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"

                          title="Excluir categoria"

                        >

                          <Trash2 className="w-3.5 h-3.5" />

                        </button>

                      </div>

                    )}

                  </div>

                );

              }
            )

          )}


          {/* ==================================================
              NOVA CATEGORIA
              ================================================== */}

          <div className="border border-dashed border-border rounded-xl p-4 space-y-3 mt-4">

            <p className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

              NOVA CATEGORIA

            </p>


            {/* NOME */}

            <Input

              value={
                newName
              }

              onChange={(
                event
              ) =>
                setNewName(
                  event.target.value
                )
              }

              placeholder="Nome da nova categoria..."

              className="font-heading text-sm"

              disabled={
                saving
              }

              onKeyDown={(
                event
              ) => {

                if (
                  event.key ===
                  "Enter"
                ) {

                  event.preventDefault();


                  handleAddCategory();

                }

              }}

            />


            {/* ÍCONE */}

            <div>

              <p className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground mb-2">

                ÍCONE

              </p>


              <div className="grid grid-cols-7 gap-1.5">

                {ALL_ICONS.map(
                  (
                    value
                  ) => {

                    const Icon =
                      getIconComponent(
                        value
                      );


                    const selected =
                      newIcon ===
                      value;


                    return (

                      <button

                        key={
                          value
                        }

                        type="button"

                        onClick={() =>
                          setNewIcon(
                            value
                          )
                        }

                        disabled={
                          saving
                        }

                        aria-pressed={
                          selected
                        }

                        className={`flex items-center justify-center p-2 rounded-lg border transition-all disabled:opacity-50 ${
                          selected

                            ? "bg-primary text-primary-foreground border-primary"

                            : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                        }`}

                        title={
                          value
                        }

                      >

                        <Icon className="w-4 h-4" />

                      </button>

                    );

                  }
                )}

              </div>

            </div>


            {/* ADICIONAR */}

            <Button

              size="sm"

              onClick={
                handleAddCategory
              }

              disabled={
                !String(
                  newName ??
                  ""
                ).trim() ||
                saving
              }

              className="font-heading text-xs tracking-wider w-full"

            >

              {saving ? (

                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />

              ) : (

                <>

                  <Plus className="w-3.5 h-3.5 mr-1" />

                  ADICIONAR CATEGORIA

                </>

              )}

            </Button>

          </div>

        </div>


        {/* ====================================================
            FOOTER
            ==================================================== */}

        <div className="flex justify-end px-6 py-4 border-t border-border flex-shrink-0">

          <Button

            variant="outline"

            size="sm"

            onClick={
              handleClose
            }

            disabled={
              saving
            }

            className="font-heading text-xs tracking-wider"

          >

            FECHAR

          </Button>

        </div>

      </motion.div>

    </div>

  );

}