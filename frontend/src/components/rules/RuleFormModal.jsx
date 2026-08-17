// ============================================================
// MODAL DE REGRAS
// ============================================================
//
// Responsável apenas pela interface de:
//
// - criar regras
// - editar regras
// - excluir regras
//
// Fluxo:
//
// RuleFormModal
//      ↓
// onSave(payload)
//      ↓
// Rules.jsx
//      ↓
// services/api.js
//      ↓
// Express + RBAC
//      ↓
// Sequelize
//      ↓
// MySQL
//
// AUTORIZAÇÃO:
//
// A página Rules.jsx já exige:
//
// gerenciar_regras
//
// O backend continua sendo a autoridade real.
//
// PADRÃO DE RESTRIÇÃO:
//
// allowed_cargos
//      ↓
// Role.slug[]
//
// Exemplo:
//
// [
//   "lideranca",
//   "administrador"
// ]
//
// ============================================================

import React, {
  useEffect,
  useState,
} from "react";


// ============================================================
// ANIMAÇÕES
// ============================================================

import {
  AnimatePresence,
  motion,
} from "framer-motion";


// ============================================================
// ÍCONES
// ============================================================

import {
  Save,
  ScrollText,
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
  Textarea,
} from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// ============================================================
// ÍCONES DE REGRAS
// ============================================================

import {
  ruleIcons,
} from "@/lib/ruleIcons";


// ============================================================
// SELETOR DE CARGOS
// ============================================================

import CargoSelector
  from "@/components/shared/CargoSelector";


// ============================================================
// PRIORIDADES
// ============================================================

const priorityOptions = [
  "Máxima",
  "Alta",
  "Média",
  "Baixa",
];


// ============================================================
// FORM PADRÃO
// ============================================================

const emptyForm = {

  title:
    "",

  description:
    "",

  priority:
    "Média",

  icon:
    "scroll",

  allowed_cargos:
    [],

  order:
    0,

};


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// ARRAY DE STRINGS
// ------------------------------------------------------------

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


// ------------------------------------------------------------
// NORMALIZA REGRA
// ------------------------------------------------------------
//
// Aceita durante a migração:
//
// allowed_cargos
// allowedRoles
// allowedCargos
//
// O formato interno do formulário continua:
//
// allowed_cargos
//
// ------------------------------------------------------------

function normalizeRule(
  rule
) {

  if (
    !rule
  ) {

    return {

      ...emptyForm,

      allowed_cargos:
        [],

    };

  }


  const allowedRoles =
    normalizeStringArray(

      rule.allowed_cargos ??

      rule.allowedRoles ??

      rule.allowedCargos ??

      []

    );


  const numericOrder =
    Number(
      rule.order
    );


  return {

    title:
      String(
        rule.title ??
        ""
      ),

    description:
      String(
        rule.description ??
        ""
      ),

    priority:
      priorityOptions.includes(
        rule.priority
      )
        ? rule.priority
        : "Média",

    icon:
      String(
        rule.icon ??
        "scroll"
      ) ||
      "scroll",

    allowed_cargos:
      allowedRoles,

    order:
      rule.order ===
        "" ||
      rule.order ===
        null ||
      rule.order ===
        undefined

        ? 0

        : Number.isFinite(
            numericOrder
          )

          ? numericOrder

          : 0,

  };

}


// ============================================================
// COMPONENTE
// ============================================================

export default function RuleFormModal({

  open,

  rule,

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
  // SINCRONIZA REGRA
  // ==========================================================

  useEffect(
    () => {

      if (
        !open
      ) {

        return;

      }


      setForm(
        normalizeRule(
          rule
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
      rule,
      open,
    ]
  );


  // ==========================================================
  // ALTERAR CAMPO
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


    if (
      error
    ) {

      setError(
        ""
      );

    }

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
  // SALVAR
  // ==========================================================

  async function handleSave() {

    if (
      saving
    ) {

      return;

    }


    // --------------------------------------------------------
    // TÍTULO
    // --------------------------------------------------------

    const title =
      String(
        form.title ??
        ""
      ).trim();


    if (
      !title
    ) {

      setError(
        "Informe o título da regra."
      );


      return;

    }


    // --------------------------------------------------------
    // DESCRIÇÃO
    // --------------------------------------------------------

    const description =
      String(
        form.description ??
        ""
      ).trim();


    if (
      !description
    ) {

      setError(
        "Informe a descrição da regra."
      );


      return;

    }


    // --------------------------------------------------------
    // PRIORIDADE
    // --------------------------------------------------------

    const priority =
      priorityOptions.includes(
        form.priority
      )
        ? form.priority
        : "Média";


    // --------------------------------------------------------
    // ORDEM
    // --------------------------------------------------------

    const numericOrder =
      Number(
        form.order
      );


    if (
      form.order !==
        "" &&
      !Number.isFinite(
        numericOrder
      )
    ) {

      setError(
        "Informe uma ordem válida."
      );


      return;

    }


    // --------------------------------------------------------
    // CALLBACK
    // --------------------------------------------------------

    if (
      typeof onSave !==
      "function"
    ) {

      setError(
        "Não foi possível salvar a regra."
      );


      console.error(
        "[RuleFormModal] onSave não informado."
      );


      return;

    }


    // ========================================================
    // PAYLOAD
    // ========================================================
    //
    // Enviamos SOMENTE campos conhecidos pelo controller.
    //
    // CargoSelector já devolve Role.slug[].
    //
    // ========================================================

    const payload = {

      title,

      description,

      priority,

      icon:
        String(
          form.icon ??
          "scroll"
        ).trim() ||
        "scroll",

      allowed_cargos:
        normalizeStringArray(
          form.allowed_cargos
        ),

      order:
        form.order ===
          ""

          ? undefined

          : numericOrder,

    };


    setSaving(
      true
    );


    setError(
      ""
    );


    try {

      await onSave(
        payload
      );

    } catch (
      err
    ) {

      console.error(
        "[RuleFormModal] erro ao salvar:",
        err
      );


      setError(
        err?.message ||
        "Não foi possível salvar a regra."
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
      saving ||
      !rule?.id
    ) {

      return;

    }


    if (
      typeof onDelete !==
      "function"
    ) {

      setError(
        "Não foi possível excluir a regra."
      );


      console.error(
        "[RuleFormModal] onDelete não informado."
      );


      return;

    }


    const confirmed =
      window.confirm(
        `Tem certeza que deseja remover a regra "${rule.title}"?`
      );


    if (
      !confirmed
    ) {

      return;

    }


    setSaving(
      true
    );


    setError(
      ""
    );


    try {

      await onDelete(
        rule.id
      );

    } catch (
      err
    ) {

      console.error(
        "[RuleFormModal] erro ao excluir:",
        err
      );


      setError(
        err?.message ||
        "Não foi possível excluir a regra."
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
              handleClose
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

                <ScrollText className="w-5 h-5 text-muted-foreground" />


                <h2 className="font-heading text-lg font-bold tracking-[0.1em] text-primary">

                  {
                    rule
                      ? "EDITAR REGRA"
                      : "NOVA REGRA"
                  }

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


            {/* =================================================
                FORMULÁRIO
                ================================================= */}

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">


              {/* =================================================
                  TÍTULO
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  TÍTULO *

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

                  disabled={
                    saving
                  }

                  placeholder="Título da regra"

                  className="bg-background border-border text-primary"

                  autoFocus

                />

              </div>


              {/* =================================================
                  DESCRIÇÃO
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  DESCRIÇÃO *

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

                  disabled={
                    saving
                  }

                  placeholder="Descreva a regra em detalhes..."

                  className="bg-background border-border text-primary resize-none"

                  rows={
                    4
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


                <div className="grid grid-cols-6 gap-2">

                  {Object.entries(
                    ruleIcons
                  ).map(
                    (
                      [
                        key,
                        iconData,
                      ]
                    ) => {

                      const Icon =
                        iconData.component;


                      const label =
                        iconData.label;


                      const selected =
                        form.icon ===
                        key;


                      return (

                        <button

                          key={
                            key
                          }

                          type="button"

                          onClick={() =>
                            set(
                              "icon",
                              key
                            )
                          }

                          disabled={
                            saving
                          }

                          aria-pressed={
                            selected
                          }

                          title={
                            label
                          }

                          className={`aspect-square rounded-lg border flex items-center justify-center transition-colors disabled:opacity-50 ${
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

                hint="Se vazio, não há restrição por cargo. Caso preenchido, somente os cargos selecionados poderão visualizar a regra."

              />


              {/* =================================================
                  PRIORIDADE + ORDEM
                  ================================================= */}

              <div className="grid grid-cols-2 gap-3">


                {/* PRIORIDADE */}

                <div className="space-y-1.5">

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                    PRIORIDADE

                  </Label>


                  <Select

                    value={
                      form.priority
                    }

                    onValueChange={(
                      value
                    ) =>
                      set(
                        "priority",
                        value
                      )
                    }

                    disabled={
                      saving
                    }

                  >

                    <SelectTrigger className="bg-background border-border text-primary font-heading text-xs tracking-wide">

                      <SelectValue />

                    </SelectTrigger>


                    <SelectContent>

                      {priorityOptions.map(
                        (
                          priority
                        ) => (

                          <SelectItem

                            key={
                              priority
                            }

                            value={
                              priority
                            }

                            className="font-heading text-xs"

                          >

                            {priority}

                          </SelectItem>

                        )
                      )}

                    </SelectContent>

                  </Select>

                </div>


                {/* ORDEM */}

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
                    ) => {

                      const value =
                        event.target.value;


                      set(
                        "order",

                        value ===
                          ""

                          ? ""

                          : Number(
                              value
                            )
                      );

                    }}

                    disabled={
                      saving
                    }

                    placeholder="1, 2, 3..."

                    className="bg-background border-border text-primary"

                  />

                </div>

              </div>


              {/* =================================================
                  ERRO
                  ================================================= */}

              {error && (

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">

                  <p className="text-xs text-red-400 leading-relaxed">

                    {error}

                  </p>

                </div>

              )}

            </div>


            {/* =================================================
                FOOTER
                ================================================= */}

            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background/50">


              {/* =================================================
                  REMOVER
                  ================================================= */}

              {rule ? (

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
                    handleClose
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
                      form.description ??
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

                      {
                        rule
                          ? "SALVAR"
                          : "ADICIONAR"
                      }

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