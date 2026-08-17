// ============================================================
// MODAL DE CRIAÇÃO / EDIÇÃO DE LINKS
// ============================================================
//
// Fluxo:
//
// LinkFormModal
//      ↓
// onSave(payload)
//      ↓
// Links.jsx
//      ↓
// services/api.js
//      ↓
// Express / RBAC
//      ↓
// Sequelize
//      ↓
// MySQL
//
// PADRÕES:
//
// allowed_cargos
// → Role.slug[]
//
// allowed_departments
// → Department.nome[]
//
// categories
// → LinkCategory.name[]
//
// ============================================================

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";


// ============================================================
// REACT QUERY
// ============================================================

import {
  useQuery,
} from "@tanstack/react-query";


// ============================================================
// FRAMER MOTION
// ============================================================

import {
  AnimatePresence,
  motion,
} from "framer-motion";


// ============================================================
// ÍCONES
// ============================================================

import {
  Link2,
  Save,
  Star,
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

import {
  Label,
} from "@/components/ui/label";

import {
  Switch,
} from "@/components/ui/switch";

import {
  Textarea,
} from "@/components/ui/textarea";


// ============================================================
// API
// ============================================================

import {
  getLinkCategories,
} from "@/services/api";


// ============================================================
// ÍCONES DE LINKS
// ============================================================

import {
  LINK_ICONS,
} from "@/lib/linkIcons";


// ============================================================
// SELETORES
// ============================================================

import CargoSelector
  from "@/components/shared/CargoSelector";

import DepartmentSelector
  from "@/components/shared/DepartmentSelector";


// ============================================================
// ÍCONE DE CATEGORIA
// ============================================================

import {
  getIconComponent,
} from "./CategoryIconEditor";


// ============================================================
// FORM INICIAL
// ============================================================

const emptyForm = {

  title:
    "",

  url:
    "",

  description:
    "",

  icon:
    "link",

  categories:
    [],

  allowed_departments:
    [],

  allowed_cargos:
    [],

  is_featured:
    false,

  is_active:
    true,

  order:
    0,

};


// ============================================================
// HELPERS
// ============================================================

function normalizeStringArray(
  value
) {

  if (
    !Array.isArray(
      value
    )
  ) {

    return [];

  }


  return [
    ...new Set(

      value

        .map(
          (
            item
          ) =>
            String(
              item ??
              ""
            ).trim()
        )

        .filter(Boolean)

    ),
  ];

}


// ============================================================
// COMPONENTE
// ============================================================

export default function LinkFormModal({

  open,

  link,

  onClose,

  onSave,

  onDelete,

}) {

  // ==========================================================
  // FORM
  // ==========================================================

  const [
    form,
    setForm,
  ] =
    useState(
      emptyForm
    );


  // ==========================================================
  // SALVAMENTO
  // ==========================================================

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );


  // ==========================================================
  // CATEGORIAS
  // ==========================================================

  const {

    data:
      linkCategories = [],

    isLoading:
      categoriesLoading,

    isError:
      categoriesError,

  } =
    useQuery({

      queryKey: [
        "link-categories",
      ],

      // getLinkCategories() já retorna o array.
      queryFn:
        getLinkCategories,

      enabled:
        open,

    });


  // ==========================================================
  // NOMES DAS CATEGORIAS
  // ==========================================================

  const categoryNames =
    useMemo(
      () => {

        const source =
          Array.isArray(
            linkCategories
          )
            ? linkCategories
            : [];


        return source

          .map(
            (
              category
            ) =>
              String(
                category?.name ??
                ""
              ).trim()
          )

          .filter(Boolean);

      },
      [
        linkCategories,
      ]
    );


  // ==========================================================
  // CARREGA LINK NO FORM
  // ==========================================================

  useEffect(
    () => {

      if (
        !open
      ) {

        return;

      }


      // ------------------------------------------------------
      // NOVO
      // ------------------------------------------------------

      if (
        !link
      ) {

        setForm({
          ...emptyForm,

          categories:
            [],

          allowed_departments:
            [],

          allowed_cargos:
            [],
        });


        return;

      }


      // ------------------------------------------------------
      // CATEGORIAS
      // ------------------------------------------------------

      const categories =
        Array.isArray(
          link.categories
        )

          ? link.categories

          : link.category

            ? [
                link.category,
              ]

            : [];


      // ------------------------------------------------------
      // FORM
      // ------------------------------------------------------

      setForm({

        title:
          link.title ??
          "",

        url:
          link.url ??
          "",

        description:
          link.description ??
          "",

        icon:
          link.icon ??
          "link",

        categories:
          normalizeStringArray(
            categories
          ),

        allowed_departments:
          normalizeStringArray(
            link.allowed_departments ??
            link.allowedDepartments ??
            []
          ),

        allowed_cargos:
          normalizeStringArray(
            link.allowed_cargos ??
            link.allowedRoles ??
            []
          ),

        is_active:
          link.is_active !==
            undefined

            ? Boolean(
                link.is_active
              )

            : link.isActive !==
                undefined

              ? Boolean(
                  link.isActive
                )

              : true,

        is_featured:
          link.is_featured !==
            undefined

            ? Boolean(
                link.is_featured
              )

            : link.isFeatured !==
                undefined

              ? Boolean(
                  link.isFeatured
                )

              : false,

        order:
          Number.isFinite(
            Number(
              link.order
            )
          )
            ? Number(
                link.order
              )
            : 0,

      });

    },
    [
      link,
      open,
    ]
  );


  // ==========================================================
  // SET FIELD
  // ==========================================================

  function set(
    field,
    value
  ) {

    setForm(
      (
        current
      ) => ({

        ...current,

        [field]:
          value,

      })
    );

  }


  // ==========================================================
  // TOGGLE CATEGORIA
  // ==========================================================

  function toggleCategory(
    category
  ) {

    setForm(
      (
        current
      ) => {

        const currentCategories =
          normalizeStringArray(
            current.categories
          );


        const exists =
          currentCategories.includes(
            category
          );


        return {

          ...current,

          categories:
            exists

              ? currentCategories.filter(
                  (
                    item
                  ) =>
                    item !==
                    category
                )

              : [
                  ...currentCategories,
                  category,
                ],

        };

      }
    );

  }


  // ==========================================================
  // SALVAR
  // ==========================================================

  async function handleSave() {

    const title =
      String(
        form.title ??
        ""
      ).trim();


    const url =
      String(
        form.url ??
        ""
      ).trim();


    if (
      !title ||
      !url ||
      saving ||
      typeof onSave !==
        "function"
    ) {

      return;

    }


    const numericOrder =
      Number(
        form.order
      );


    const payload = {

      title,

      url,

      description:
        String(
          form.description ??
          ""
        ).trim(),

      icon:
        form.icon ||
        "link",

      categories:
        normalizeStringArray(
          form.categories
        ),

      // ------------------------------------------------------
      // CARGO
      //
      // CargoSelector devolve Role.slug.
      //
      // O backend ainda normaliza valores legados caso algum
      // registro antigo contenha Role.nome.
      // ------------------------------------------------------

      allowed_cargos:
        normalizeStringArray(
          form.allowed_cargos
        ),

      // ------------------------------------------------------
      // DEPARTAMENTO
      //
      // DepartmentSelector devolve Department.nome.
      // ------------------------------------------------------

      allowed_departments:
        normalizeStringArray(
          form.allowed_departments
        ),

      is_featured:
        Boolean(
          form.is_featured
        ),

      is_active:
        Boolean(
          form.is_active
        ),

      order:
        Number.isFinite(
          numericOrder
        )
          ? numericOrder
          : 0,

    };


    setSaving(
      true
    );


    try {

      await onSave(
        payload
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

  async function handleDelete() {

    if (
      !link?.id ||
      saving ||
      typeof onDelete !==
        "function"
    ) {

      return;

    }


    setSaving(
      true
    );


    try {

      await onDelete(
        link.id
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

    <AnimatePresence>

      {open && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">


          {/* ==================================================
              BACKDROP
              ================================================== */}

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
              saving
                ? undefined
                : onClose
            }

          />


          {/* ==================================================
              MODAL
              ================================================== */}

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

            transition={{
              duration:
                0.25,
            }}

            className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-2xl"

          >


            {/* =================================================
                HEADER
                ================================================= */}

            <div className="flex items-center justify-between px-6 py-4 border-b border-border">

              <div className="flex items-center gap-3">

                <Link2 className="w-5 h-5 text-muted-foreground" />


                <h2 className="font-heading text-lg font-bold tracking-[0.1em] text-primary">

                  {
                    link
                      ? "EDITAR LINK"
                      : "NOVO LINK"
                  }

                </h2>

              </div>


              <button

                type="button"

                onClick={
                  onClose
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


            {/* =================================================
                FORM
                ================================================= */}

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">


              {/* =================================================
                  NOME
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  NOME *

                </Label>


                <Input

                  value={
                    form.title
                  }

                  onChange={(
                    event
                  ) =>
                    set(
                      "title",
                      event.target.value
                    )
                  }

                  placeholder="Nome do link"

                  className="bg-background border-border text-primary"

                />

              </div>


              {/* =================================================
                  URL
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  URL *

                </Label>


                <Input

                  value={
                    form.url
                  }

                  onChange={(
                    event
                  ) =>
                    set(
                      "url",
                      event.target.value
                    )
                  }

                  placeholder="https://..."

                  className="bg-background border-border text-primary"

                />

              </div>


              {/* =================================================
                  DESCRIÇÃO
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  DESCRIÇÃO

                </Label>


                <Textarea

                  value={
                    form.description
                  }

                  onChange={(
                    event
                  ) =>
                    set(
                      "description",
                      event.target.value
                    )
                  }

                  placeholder="Breve descrição..."

                  className="bg-background border-border text-primary resize-none"

                  rows={
                    2
                  }

                />

              </div>


              {/* =================================================
                  ÍCONE
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  ÍCONE

                </Label>


                <div className="grid grid-cols-7 gap-1.5">

                  {LINK_ICONS.map(
                    ({
                      value,
                      Icon,
                      label,
                    }) => {

                      const selected =
                        form.icon ===
                        value;


                      return (

                        <button

                          key={
                            value
                          }

                          type="button"

                          onClick={() =>
                            set(
                              "icon",
                              value
                            )
                          }

                          aria-pressed={
                            selected
                          }

                          title={
                            label
                          }

                          className={`flex items-center justify-center p-2 rounded-lg border transition-all ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                          }`}

                        >

                          <Icon className="w-4 h-4" />

                        </button>

                      );

                    }
                  )}

                </div>

              </div>


              {/* =================================================
                  CATEGORIAS
                  ================================================= */}

              {categoriesLoading ? (

                <div className="flex justify-center py-3">

                  <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />

                </div>

              ) : categoriesError ? (

                <p className="text-[11px] text-red-400 italic">

                  Não foi possível carregar as categorias.

                </p>

              ) : categoryNames.length >
                0 ? (

                <div className="space-y-1.5">

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                    CATEGORIAS


                    {form.categories.length >
                      0 && (

                      <span className="text-primary/60">

                        {" "}
                        (
                        {
                          form.categories.length
                        }
                        )

                      </span>

                    )}

                  </Label>


                  <div className="flex flex-wrap gap-2">

                    {categoryNames.map(
                      (
                        category
                      ) => {

                        const categoryRecord =
                          linkCategories.find(
                            (
                              item
                            ) =>
                              item.name ===
                              category
                          );


                        const CategoryIcon =
                          categoryRecord

                            ? getIconComponent(
                                categoryRecord.icon
                              )

                            : Link2;


                        const selected =
                          form.categories.includes(
                            category
                          );


                        return (

                          <button

                            key={
                              category
                            }

                            type="button"

                            onClick={() =>
                              toggleCategory(
                                category
                              )
                            }

                            aria-pressed={
                              selected
                            }

                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-heading tracking-wider transition-colors ${
                              selected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                            }`}

                          >

                            <CategoryIcon className="w-3 h-3" />

                            {category}

                          </button>

                        );

                      }
                    )}

                  </div>

                </div>

              ) : (

                <p className="text-[10px] text-muted-foreground italic">

                  Nenhuma categoria cadastrada.

                </p>

              )}


              {/* =================================================
                  CARGOS
                  ================================================= */}

              <CargoSelector

                selected={
                  form.allowed_cargos
                }

                onChange={(
                  cargos
                ) =>
                  set(
                    "allowed_cargos",
                    cargos
                  )
                }

                label="CARGOS PERMITIDOS"

                hint="Se vazio, o link não possui restrição por cargo."

              />


              {/* =================================================
                  DEPARTAMENTOS
                  ================================================= */}

              <DepartmentSelector

                selected={
                  form.allowed_departments
                }

                onChange={(
                  departments
                ) =>
                  set(
                    "allowed_departments",
                    departments
                  )
                }

                label="DEPARTAMENTOS PERMITIDOS"

                hint="Se vazio, o link não possui restrição por departamento."

              />


              {/* =================================================
                  ATIVO / DESTAQUE
                  ================================================= */}

              <div className="grid grid-cols-2 gap-3">


                {/* ATIVO */}

                <div
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    form.is_active
                      ? "border-primary/50 bg-primary/5"
                      : "border-border bg-background/30"
                  }`}
                >

                  <Switch

                    checked={
                      Boolean(
                        form.is_active
                      )
                    }

                    onCheckedChange={(
                      value
                    ) =>
                      set(
                        "is_active",
                        value
                      )
                    }

                  />


                  <div>

                    <span className="font-heading text-xs tracking-wider text-primary">

                      ATIVO

                    </span>


                    <p className="text-[10px] text-muted-foreground mt-0.5">

                      Inativos só aparecem para quem gerencia links.

                    </p>

                  </div>

                </div>


                {/* DESTAQUE */}

                <div
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    form.is_featured
                      ? "border-yellow-400/50 bg-yellow-400/5"
                      : "border-border bg-background/30"
                  }`}
                >

                  <Switch

                    checked={
                      Boolean(
                        form.is_featured
                      )
                    }

                    onCheckedChange={(
                      value
                    ) =>
                      set(
                        "is_featured",
                        value
                      )
                    }

                  />


                  <div>

                    <span className="font-heading text-xs tracking-wider text-yellow-400 flex items-center gap-1">

                      <Star className="w-3 h-3" />

                      DESTAQUE

                    </span>


                    <p className="text-[10px] text-muted-foreground mt-0.5">

                      Aparece em destaque.

                    </p>

                  </div>

                </div>

              </div>


              {/* =================================================
                  ORDEM
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  ORDEM

                </Label>


                <Input

                  type="number"

                  value={
                    form.order
                  }

                  onChange={(
                    event
                  ) =>
                    set(
                      "order",
                      event.target.value
                    )
                  }

                  placeholder="0"

                  className="bg-background border-border text-primary"

                />

              </div>

            </div>


            {/* =================================================
                FOOTER
                ================================================= */}

            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background/50">


              {/* =================================================
                  EXCLUIR
                  ================================================= */}

              {link ? (

                <Button

                  variant="ghost"

                  size="sm"

                  onClick={
                    handleDelete
                  }

                  disabled={
                    saving
                  }

                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-heading text-xs tracking-wider"

                >

                  <Trash2 className="w-4 h-4 mr-2" />

                  REMOVER

                </Button>

              ) : (

                <div />

              )}


              {/* =================================================
                  AÇÕES
                  ================================================= */}

              <div className="flex gap-2">

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
                    saving ||
                    !String(
                      form.title ??
                      ""
                    ).trim() ||
                    !String(
                      form.url ??
                      ""
                    ).trim()
                  }

                  className="font-heading text-xs tracking-wider bg-primary text-primary-foreground"

                >

                  {saving ? (

                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />

                  ) : (

                    <>

                      <Save className="w-4 h-4 mr-2" />

                      SALVAR

                    </>

                  )}

                </Button>

              </div>

            </div>

          </motion.div>

        </div>

      )}

    </AnimatePresence>

  );

}