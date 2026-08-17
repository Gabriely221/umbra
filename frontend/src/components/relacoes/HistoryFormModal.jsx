// ============================================================
// MODAL DE HISTÓRICO DA ORGANIZAÇÃO
// ============================================================
//
// Responsável por:
//
// - criar registro histórico
// - editar registro histórico
// - excluir registro histórico
//
// Contrato com o backend:
//
// {
//   title,
//   description,
//   date,
//   responsible
// }
//
// IMPORTANTE:
//
// "responsible" neste model é TEXTO LIVRE.
//
// Não confundir com:
//
// OrganizationNegotiation.responsibleUserId
//
// Este componente NÃO acessa API diretamente.
//
// Fluxo:
//
// HistoryFormModal
//       ↓
// onSave(payload)
//       ↓
// HistoricoTab.jsx
//       ↓
// services/api.js
//       ↓
// Express + RBAC
//       ↓
// organizationController
//       ↓
// Sequelize / MySQL
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
  History,
  Save,
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


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// DATA LOCAL DE HOJE
// ------------------------------------------------------------
//
// Não usamos:
//
// new Date().toISOString().slice(0, 10)
//
// porque toISOString() converte para UTC.
//
// Dependendo do fuso/horário, isso pode produzir uma data
// diferente da data local do usuário.
//
// ------------------------------------------------------------

function getTodayLocalDate() {

  const date =
    new Date();


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() +
      1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


// ------------------------------------------------------------
// FORM VAZIO
// ------------------------------------------------------------

function createEmptyForm() {

  return {

    date:
      getTodayLocalDate(),

    title:
      "",

    description:
      "",

    responsible:
      "",

  };

}


// ------------------------------------------------------------
// DATA PARA INPUT DATE
// ------------------------------------------------------------
//
// Aceita:
//
// 2026-08-16
//
// 2026-08-16T00:00:00.000Z
//
// e preserva diretamente:
//
// 2026-08-16
//
// antes de qualquer conversão de timezone.
//
// ------------------------------------------------------------

function normalizeDateInput(
  value
) {

  if (
    !value
  ) {

    return getTodayLocalDate();

  }


  const text =
    String(
      value
    ).trim();


  // ----------------------------------------------------------
  // Captura prefixo YYYY-MM-DD.
  // ----------------------------------------------------------

  const datePrefix =
    text.match(
      /^(\d{4}-\d{2}-\d{2})/
    );


  if (
    datePrefix
  ) {

    return datePrefix[1];

  }


  // ----------------------------------------------------------
  // Compatibilidade com outros formatos antigos.
  // ----------------------------------------------------------

  const date =
    new Date(
      text
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return getTodayLocalDate();

  }


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() +
      1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


// ------------------------------------------------------------
// VALIDA DATA YYYY-MM-DD
// ------------------------------------------------------------

function isValidDateInput(
  value
) {

  const text =
    String(
      value ??
      ""
    ).trim();


  const match =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );


  if (
    !match
  ) {

    return false;

  }


  const year =
    Number(
      match[1]
    );


  const month =
    Number(
      match[2]
    );


  const day =
    Number(
      match[3]
    );


  const date =
    new Date(
      year,
      month -
      1,
      day
    );


  return (
    date.getFullYear() ===
      year &&
    date.getMonth() ===
      month -
      1 &&
    date.getDate() ===
      day
  );

}


// ------------------------------------------------------------
// EVENTO → FORM
// ------------------------------------------------------------

function normalizeEventForForm(
  event
) {

  if (
    !event
  ) {

    return createEmptyForm();

  }


  return {

    date:
      normalizeDateInput(

        event.date ??

        event.eventDate ??

        event.event_date

      ),

    title:
      String(
        event.title ??
        ""
      ),

    description:
      String(
        event.description ??
        ""
      ),

    responsible:
      String(

        event.responsible ??

        event.responsibleName ??

        event.responsible_name ??

        ""

      ),

  };

}


// ------------------------------------------------------------
// TEXTO OPCIONAL
// ------------------------------------------------------------

function normalizeOptionalText(
  value
) {

  const text =
    String(
      value ??
      ""
    ).trim();


  return (
    text ||
    null
  );

}


// ============================================================
// COMPONENTE
// ============================================================

export default function HistoryFormModal({

  open,

  event,

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
      createEmptyForm
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
  // CARREGA REGISTRO
  // ==========================================================

  useEffect(
    () => {

      if (
        !open
      ) {

        return;

      }


      setForm(
        normalizeEventForForm(
          event
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
      event,
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


    setError(
      ""
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
  // VALIDAR
  // ==========================================================

  function validateForm() {

    const title =
      String(
        form.title ??
        ""
      ).trim();


    if (
      !title
    ) {

      return "Informe o título do registro.";

    }


    if (
      !form.date
    ) {

      return "Informe a data do acontecimento.";

    }


    if (
      !isValidDateInput(
        form.date
      )
    ) {

      return "A data informada é inválida.";

    }


    return null;

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


    if (
      typeof onSave !==
      "function"
    ) {

      setError(
        "Não foi possível salvar o registro."
      );


      return;

    }


    const validationError =
      validateForm();


    if (
      validationError
    ) {

      setError(
        validationError
      );


      return;

    }


    // ========================================================
    // PAYLOAD EXPLÍCITO
    // ========================================================
    //
    // Somente os campos aceitos pelo OrganizationHistory.
    //
    // ========================================================

    const payload = {

      title:
        String(
          form.title
        ).trim(),

      description:
        normalizeOptionalText(
          form.description
        ),

      date:
        form.date,

      responsible:
        normalizeOptionalText(
          form.responsible
        ),

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
      saveError
    ) {

      console.error(
        "[HistoryFormModal] erro ao salvar:",
        saveError
      );


      setError(

        saveError?.message ||

        "Não foi possível salvar o registro."

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
      !event?.id
    ) {

      return;

    }


    if (
      typeof onDelete !==
      "function"
    ) {

      setError(
        "Não foi possível excluir o registro."
      );


      return;

    }


    const title =
      String(
        event.title ??
        "este registro"
      ).trim();


    const confirmed =
      window.confirm(
        `Tem certeza que deseja remover "${title}" do histórico?`
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
        event.id
      );

    } catch (
      deleteError
    ) {

      console.error(
        "[HistoryFormModal] erro ao excluir:",
        deleteError
      );


      setError(

        deleteError?.message ||

        "Não foi possível excluir o registro."

      );

    } finally {

      setSaving(
        false
      );

    }

  }


  // ==========================================================
  // PODE SALVAR
  // ==========================================================

  const canSubmit =
    !saving &&
    Boolean(
      String(
        form.title ??
        ""
      ).trim()
    ) &&
    Boolean(
      form.date
    );


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

            role="dialog"

            aria-modal="true"

            aria-labelledby="history-modal-title"

            className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-2xl"

          >


            {/* =================================================
                HEADER
                ================================================= */}

            <div className="flex items-center justify-between px-6 py-4 border-b border-border">

              <div className="flex items-center gap-3">

                <History className="w-5 h-5 text-muted-foreground" />


                <h2
                  id="history-modal-title"
                  className="font-heading text-lg font-bold tracking-[0.1em] text-primary"
                >

                  {
                    event
                      ? "EDITAR REGISTRO"
                      : "NOVO REGISTRO"
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
                FORM
                ================================================= */}

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">


              {/* =================================================
                  DATA + RESPONSÁVEL
                  ================================================= */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">


                {/* =============================================
                    DATA
                    ============================================= */}

                <div className="space-y-1.5">

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                    DATA *

                  </Label>


                  <Input

                    type="date"

                    value={
                      form.date
                    }

                    onChange={(
                      inputEvent
                    ) =>
                      set(
                        "date",
                        inputEvent.target.value
                      )
                    }

                    disabled={
                      saving
                    }

                    className="bg-background border-border text-primary font-body"

                  />

                </div>


                {/* =============================================
                    RESPONSÁVEL
                    ============================================= */}

                <div className="space-y-1.5">

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                    RESPONSÁVEL

                  </Label>


                  <Input

                    value={
                      form.responsible
                    }

                    onChange={(
                      inputEvent
                    ) =>
                      set(
                        "responsible",
                        inputEvent.target.value
                      )
                    }

                    disabled={
                      saving
                    }

                    placeholder="Quem esteve envolvido"

                    className="bg-background border-border text-primary font-body"

                  />

                </div>

              </div>


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
                    inputEvent
                  ) =>
                    set(
                      "title",
                      inputEvent.target.value
                    )
                  }

                  disabled={
                    saving
                  }

                  placeholder="Ex: Reunião realizada"

                  className="bg-background border-border text-primary font-body"

                  autoFocus

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
                    inputEvent
                  ) =>
                    set(
                      "description",
                      inputEvent.target.value
                    )
                  }

                  disabled={
                    saving
                  }

                  placeholder="Detalhes do acontecimento..."

                  rows={
                    4
                  }

                  className="bg-background border-border text-primary font-body resize-none"

                />

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

              {event ? (

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

                  className="font-heading text-xs tracking-wider border-border"

                >

                  CANCELAR

                </Button>


                <Button

                  size="sm"

                  onClick={
                    handleSave
                  }

                  disabled={
                    !canSubmit
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