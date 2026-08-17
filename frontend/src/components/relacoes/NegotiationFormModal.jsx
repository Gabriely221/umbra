// ============================================================
// MODAL DE NEGOCIAÇÃO
// ============================================================
//
// Criação / edição de negociações de uma organização.
//
// Model:
//
// OrganizationNegotiation
// ├── title
// ├── description
// ├── status
// ├── responsibleUserId
// └── dueDate
//
// Este componente NÃO acessa API diretamente.
//
// Fluxo:
//
// NegotiationFormModal
//        ↓
// onSave(payload)
//        ↓
// NegociacoesTab.jsx
//        ↓
// services/api.js
//        ↓
// Express + RBAC
//        ↓
// Sequelize
//
// RESPONSÁVEL:
//
// responsibleUsers = [
//   {
//     id,
//     nome,
//     email
//   }
// ]
//
// A lista é carregada por:
//
// GET /api/organizations/responsible-users
//
// e já vem filtrada pelo backend.
//
// Não existe mais entrada manual de ID.
//
// ============================================================

import React, {
  useEffect,
  useMemo,
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
  Handshake,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Textarea,
} from "@/components/ui/textarea";


// ============================================================
// STATUS
// ============================================================
//
// Deve corresponder exatamente ao ENUM do backend.
//
// ============================================================

const STATUS_OPTIONS = [
  "Pendente",
  "Em andamento",
  "Concluída",
  "Cancelada",
];


// ============================================================
// SELECT - SEM RESPONSÁVEL
// ============================================================

const NO_RESPONSIBLE =
  "__none__";


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// FORM VAZIO
// ------------------------------------------------------------

function createEmptyForm() {

  return {

    title:
      "",

    description:
      "",

    status:
      "Pendente",

    responsibleUserId:
      "",

    dueDate:
      "",

  };

}


// ------------------------------------------------------------
// DATA PARA INPUT DATE
// ------------------------------------------------------------
//
// Preserva o prefixo YYYY-MM-DD para evitar mudanças de dia
// provocadas por timezone.
//
// ------------------------------------------------------------

function normalizeDateInput(
  value
) {

  if (
    !value
  ) {

    return "";

  }


  const text =
    String(
      value
    ).trim();


  const datePrefix =
    text.match(
      /^(\d{4}-\d{2}-\d{2})/
    );


  if (
    datePrefix
  ) {

    return datePrefix[1];

  }


  const date =
    new Date(
      text
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

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
// NEGOCIAÇÃO → FORM
// ------------------------------------------------------------

function normalizeNegotiationForForm(
  negotiation
) {

  if (
    !negotiation
  ) {

    return createEmptyForm();

  }


  const status =
    STATUS_OPTIONS.includes(
      negotiation.status
    )

      ? negotiation.status

      : "Pendente";


  const responsibleUserId =

    negotiation.responsibleUserId ??

    negotiation.responsible_user_id ??

    "";


  return {

    title:
      String(
        negotiation.title ??
        ""
      ),

    description:
      String(
        negotiation.description ??
        ""
      ),

    status,

    responsibleUserId:
      responsibleUserId ===
        null ||
      responsibleUserId ===
        undefined ||
      responsibleUserId ===
        ""

        ? ""

        : String(
            responsibleUserId
          ),

    dueDate:
      normalizeDateInput(

        negotiation.dueDate ??

        negotiation.due_date

      ),

  };

}


// ------------------------------------------------------------
// NORMALIZA USUÁRIOS
// ------------------------------------------------------------

function normalizeResponsibleUsers(
  users
) {

  if (
    !Array.isArray(
      users
    )
  ) {

    return [];

  }


  const result =
    [];


  const usedIds =
    new Set();


  for (
    const user
    of users
  ) {

    const id =
      Number(
        user?.id
      );


    if (
      !Number.isInteger(
        id
      ) ||
      id <=
        0 ||
      usedIds.has(
        id
      )
    ) {

      continue;

    }


    usedIds.add(
      id
    );


    result.push({

      id,

      nome:
        String(

          user?.nome ??

          user?.name ??

          `Usuário #${id}`

        ).trim() ||
        `Usuário #${id}`,

      email:
        String(
          user?.email ??
          ""
        ).trim(),

      currentOnly:
        false,

    });

  }


  return result.sort(
    (
      a,
      b
    ) =>
      a.nome.localeCompare(
        b.nome,
        "pt-BR"
      )
  );

}


// ------------------------------------------------------------
// RESPONSÁVEL ATUAL
// ------------------------------------------------------------
//
// Mesmo que o usuário não apareça mais na lista de usuários
// elegíveis, preservamos a opção atual durante a edição.
//
// Isso é importante para:
//
// - usuário posteriormente desativado;
// - role posteriormente alterada para sem_acesso;
// - registros históricos antigos.
//
// ------------------------------------------------------------

function getCurrentResponsibleUser(
  negotiation
) {

  if (
    !negotiation
  ) {

    return null;

  }


  const user =

    negotiation.responsibleUser ??

    negotiation.responsible_user ??

    null;


  const rawId =

    negotiation.responsibleUserId ??

    negotiation.responsible_user_id ??

    user?.id ??

    null;


  const id =
    Number(
      rawId
    );


  if (
    !Number.isInteger(
      id
    ) ||
    id <=
      0
  ) {

    return null;

  }


  return {

    id,

    nome:
      String(

        user?.nome ??

        user?.name ??

        `Usuário #${id}`

      ).trim() ||
      `Usuário #${id}`,

    email:
      String(
        user?.email ??
        ""
      ).trim(),

    currentOnly:
      true,

  };

}


// ------------------------------------------------------------
// ERRO DOS RESPONSÁVEIS
// ------------------------------------------------------------

function getResponsibleUsersErrorMessage(
  responsibleUsersError
) {

  if (
    !responsibleUsersError
  ) {

    return "";

  }


  if (
    typeof responsibleUsersError ===
    "string"
  ) {

    return responsibleUsersError;

  }


  return (

    responsibleUsersError.message ||

    "Não foi possível carregar os usuários responsáveis."

  );

}


// ------------------------------------------------------------
// VALIDA DATA
// ------------------------------------------------------------

function isValidDateInput(
  value
) {

  const match =
    String(
      value ??
      ""
    ).match(
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


// ============================================================
// COMPONENTE
// ============================================================

export default function NegotiationFormModal({

  open,

  neg,

  onClose,

  onSave,

  onDelete,

  responsibleUsers = [],

  responsibleUsersLoading = false,

  responsibleUsersError = null,

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
  // USUÁRIOS NORMALIZADOS
  // ==========================================================

  const normalizedUsers =
    useMemo(
      () =>
        normalizeResponsibleUsers(
          responsibleUsers
        ),
      [
        responsibleUsers,
      ]
    );


  // ==========================================================
  // RESPONSÁVEL ATUAL
  // ==========================================================

  const currentResponsible =
    useMemo(
      () =>
        getCurrentResponsibleUser(
          neg
        ),
      [
        neg,
      ]
    );


  // ==========================================================
  // OPÇÕES DO SELECT
  // ==========================================================
  //
  // Se o responsável atual não estiver mais na lista de
  // usuários elegíveis, ele é adicionado apenas para preservar
  // a atribuição já existente.
  //
  // ==========================================================

  const responsibleOptions =
    useMemo(
      () => {

        const options =
          [
            ...normalizedUsers,
          ];


        if (
          currentResponsible?.id
        ) {

          const existingIndex =
            options.findIndex(
              (
                user
              ) =>
                user.id ===
                currentResponsible.id
            );


          if (
            existingIndex ===
            -1
          ) {

            options.push(
              currentResponsible
            );

          } else {

            // ------------------------------------------------
            // Se ainda é elegível, não marcamos como currentOnly.
            // ------------------------------------------------

            options[
              existingIndex
            ] = {

              ...options[
                existingIndex
              ],

              currentOnly:
                false,

            };

          }

        }


        return options.sort(
          (
            a,
            b
          ) =>
            a.nome.localeCompare(
              b.nome,
              "pt-BR"
            )
        );

      },
      [
        normalizedUsers,
        currentResponsible,
      ]
    );


  // ==========================================================
  // IDS VÁLIDOS DO SELECT
  // ==========================================================

  const responsibleOptionIds =
    useMemo(
      () =>
        new Set(
          responsibleOptions.map(
            (
              user
            ) =>
              user.id
          )
        ),
      [
        responsibleOptions,
      ]
    );


  // ==========================================================
  // MENSAGEM DE ERRO DA LISTA
  // ==========================================================

  const responsibleUsersErrorMessage =
    getResponsibleUsersErrorMessage(
      responsibleUsersError
    );


  // ==========================================================
  // CARREGA NEGOCIAÇÃO
  // ==========================================================

  useEffect(
    () => {

      if (
        !open
      ) {

        return;

      }


      setForm(
        normalizeNegotiationForForm(
          neg
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
      neg,
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


    onClose?.();

  }


  // ==========================================================
  // VALIDAÇÃO
  // ==========================================================

  function validateForm() {

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

      return "Informe o título da negociação.";

    }


    if (
      title.length >
      200
    ) {

      return "O título deve possuir no máximo 200 caracteres.";

    }


    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    if (
      !STATUS_OPTIONS.includes(
        form.status
      )
    ) {

      return "Status da negociação inválido.";

    }


    // --------------------------------------------------------
    // RESPONSÁVEL
    // --------------------------------------------------------

    if (
      form.responsibleUserId !==
        "" &&
      form.responsibleUserId !==
        null &&
      form.responsibleUserId !==
        undefined
    ) {

      const responsibleUserId =
        Number(
          form.responsibleUserId
        );


      if (
        !Number.isInteger(
          responsibleUserId
        ) ||
        responsibleUserId <=
          0
      ) {

        return "O usuário responsável informado é inválido.";

      }


      // ------------------------------------------------------
      // O ID precisa corresponder a uma opção recebida pela
      // aplicação ou ao responsável atual preservado.
      //
      // O backend continua validando novamente.
      // ------------------------------------------------------

      if (
        !responsibleOptionIds.has(
          responsibleUserId
        )
      ) {

        return "O usuário responsável selecionado não está disponível.";

      }

    }


    // --------------------------------------------------------
    // DATA
    // --------------------------------------------------------

    if (
      form.dueDate &&
      !isValidDateInput(
        form.dueDate
      )
    ) {

      return "O prazo informado é inválido.";

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
        "Não foi possível salvar a negociação."
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

    const payload = {

      title:
        String(
          form.title
        ).trim(),

      description:
        String(
          form.description ??
          ""
        ).trim() ||
        null,

      status:
        form.status,

      responsibleUserId:
        form.responsibleUserId ===
          "" ||
        form.responsibleUserId ===
          null ||
        form.responsibleUserId ===
          undefined

          ? null

          : Number(
              form.responsibleUserId
            ),

      dueDate:
        form.dueDate ||
        null,

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
        "[NegotiationFormModal] erro ao salvar:",
        saveError
      );


      setError(

        saveError?.message ||

        "Não foi possível salvar a negociação."

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
      !neg?.id
    ) {

      return;

    }


    if (
      typeof onDelete !==
      "function"
    ) {

      setError(
        "Não foi possível excluir a negociação."
      );


      return;

    }


    const title =
      String(
        neg.title ??
        "esta negociação"
      ).trim();


    const confirmed =
      window.confirm(
        `Tem certeza que deseja remover "${title}"?`
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
        neg.id
      );

    } catch (
      deleteError
    ) {

      console.error(
        "[NegotiationFormModal] erro ao excluir:",
        deleteError
      );


      setError(

        deleteError?.message ||

        "Não foi possível excluir a negociação."

      );

    } finally {

      setSaving(
        false
      );

    }

  }


  // ==========================================================
  // SELECT DE RESPONSÁVEL BLOQUEADO?
  // ==========================================================
  //
  // Durante loading não permitimos alteração.
  //
  // Em caso de erro:
  //
  // - se há responsável atual, permitimos preservá-lo ou
  //   removê-lo;
  //
  // - se não há responsável atual, não existe outra opção real
  //   disponível para selecionar.
  //
  // ==========================================================

  const responsibleSelectDisabled =

    saving ||

    responsibleUsersLoading ||

    (
      Boolean(
        responsibleUsersErrorMessage
      ) &&
      !currentResponsible?.id
    );


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

            aria-labelledby="negotiation-modal-title"

            className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-2xl"

          >


            {/* =================================================
                HEADER
                ================================================= */}

            <div className="flex items-center justify-between px-6 py-4 border-b border-border">

              <div className="flex items-center gap-3">

                <Handshake className="w-5 h-5 text-muted-foreground" />


                <h2
                  id="negotiation-modal-title"
                  className="font-heading text-lg font-bold tracking-[0.1em] text-primary"
                >

                  {
                    neg
                      ? "EDITAR NEGOCIAÇÃO"
                      : "NOVA NEGOCIAÇÃO"
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

                  maxLength={
                    200
                  }

                  placeholder="Ex: Acordo comercial, Trégua..."

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

                  placeholder="Detalhes da negociação..."

                  rows={
                    3
                  }

                  className="bg-background border-border text-primary font-body resize-none"

                />

              </div>


              {/* =================================================
                  RESPONSÁVEL
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  RESPONSÁVEL

                </Label>


                <Select

                  value={
                    form.responsibleUserId

                      ? String(
                          form.responsibleUserId
                        )

                      : NO_RESPONSIBLE
                  }

                  onValueChange={(
                    value
                  ) =>
                    set(
                      "responsibleUserId",

                      value ===
                        NO_RESPONSIBLE

                        ? ""

                        : value
                    )
                  }

                  disabled={
                    responsibleSelectDisabled
                  }

                >

                  <SelectTrigger className="bg-background border-border text-primary font-body">

                    <SelectValue placeholder="Selecione um responsável" />

                  </SelectTrigger>


                  <SelectContent>

                    <SelectItem
                      value={
                        NO_RESPONSIBLE
                      }
                    >

                      Sem responsável

                    </SelectItem>


                    {responsibleOptions.map(
                      (
                        user
                      ) => (

                        <SelectItem

                          key={
                            user.id
                          }

                          value={
                            String(
                              user.id
                            )
                          }

                        >

                          {user.nome}

                          {
                            user.email
                              ? ` — ${user.email}`
                              : ""
                          }

                          {
                            user.currentOnly
                              ? " — responsável atual"
                              : ""
                          }

                        </SelectItem>

                      )
                    )}

                  </SelectContent>

                </Select>


                {/* =============================================
                    CARREGANDO
                    ============================================= */}

                {responsibleUsersLoading && (

                  <p className="text-[9px] text-muted-foreground">

                    Carregando usuários disponíveis...

                  </p>

                )}


                {/* =============================================
                    ERRO AO CARREGAR
                    ============================================= */}

                {!responsibleUsersLoading &&
                responsibleUsersErrorMessage && (

                  <p className="text-[9px] text-red-400 leading-relaxed">

                    {responsibleUsersErrorMessage}

                    {
                      currentResponsible?.id
                        ? " O responsável atual pode ser preservado ou removido."
                        : ""
                    }

                  </p>

                )}


                {/* =============================================
                    NENHUM USUÁRIO ELEGÍVEL
                    ============================================= */}

                {!responsibleUsersLoading &&
                !responsibleUsersErrorMessage &&
                normalizedUsers.length ===
                  0 && (

                  <p className="text-[9px] text-muted-foreground">

                    Nenhum usuário elegível está disponível para novas atribuições.

                  </p>

                )}


                {/* =============================================
                    RESPONSÁVEL ANTIGO
                    ============================================= */}

                {!responsibleUsersLoading &&
                !responsibleUsersErrorMessage &&
                currentResponsible?.id &&
                !normalizedUsers.some(
                  (
                    user
                  ) =>
                    user.id ===
                    currentResponsible.id
                ) && (

                  <p className="text-[9px] text-amber-400/80 leading-relaxed">

                    O responsável atual não está disponível para novas atribuições, mas pode ser preservado neste registro.

                  </p>

                )}

              </div>


              {/* =================================================
                  PRAZO
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  PRAZO

                </Label>


                <Input

                  type="date"

                  value={
                    form.dueDate
                  }

                  onChange={(
                    event
                  ) =>
                    set(
                      "dueDate",
                      event.target.value
                    )
                  }

                  disabled={
                    saving
                  }

                  className="bg-background border-border text-primary font-body"

                />

              </div>


              {/* =================================================
                  STATUS
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  STATUS

                </Label>


                <Select

                  value={
                    form.status
                  }

                  onValueChange={(
                    value
                  ) =>
                    set(
                      "status",
                      value
                    )
                  }

                  disabled={
                    saving
                  }

                >

                  <SelectTrigger className="bg-background border-border text-primary font-heading tracking-wider text-sm">

                    <SelectValue />

                  </SelectTrigger>


                  <SelectContent>

                    {STATUS_OPTIONS.map(
                      (
                        status
                      ) => (

                        <SelectItem

                          key={
                            status
                          }

                          value={
                            status
                          }

                          className="font-heading tracking-wide"

                        >

                          {status}

                        </SelectItem>

                      )
                    )}

                  </SelectContent>

                </Select>

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

              {neg ? (

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