// ============================================================
// MODAL DE ORGANIZAÇÃO / RELAÇÕES EXTERNAS
// ============================================================
//
// Responsável por:
//
// - criar organização
// - editar organização
// - excluir organização
//
// Este componente NÃO acessa a API diretamente.
//
// Fluxo:
//
// OrganizationFormModal
//        ↓
// onSave(payload)
//        ↓
// Relacoes.jsx
//        ↓
// services/api.js
//        ↓
// Express + RBAC
//        ↓
// Sequelize
//        ↓
// MySQL
//
// RESTRIÇÃO DE VISIBILIDADE:
//
// allowed_cargos = Role.slug[]
//
// [] = sem restrição adicional por cargo.
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
  AlertCircle,
  Building2,
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
  Switch,
} from "@/components/ui/switch";


// ============================================================
// CARGOS
// ============================================================

import CargoSelector
  from "@/components/shared/CargoSelector";


// ============================================================
// CONSTANTES
// ============================================================

const SPECIALTY_OPTIONS = [
  "Informação",
  "Guerra",
  "Comércio",
  "Segurança",
  "Drogas",
  "Outra",
];


const STATUS_OPTIONS = [
  "Aliada",
  "Parceira",
  "Neutra",
  "Em observação",
  "Hostil",
  "Inimiga",
];


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
// BOOLEAN
// ------------------------------------------------------------

function normalizeBoolean(
  value,
  fallback = true
) {

  if (
    value ===
      undefined ||
    value ===
      null
  ) {

    return fallback;

  }


  if (
    typeof value ===
    "boolean"
  ) {

    return value;

  }


  if (
    typeof value ===
    "number"
  ) {

    if (
      value ===
      1
    ) {

      return true;

    }


    if (
      value ===
      0
    ) {

      return false;

    }

  }


  if (
    typeof value ===
    "string"
  ) {

    const normalized =
      value
        .trim()
        .toLowerCase();


    if (
      [
        "true",
        "1",
        "sim",
        "yes",
      ].includes(
        normalized
      )
    ) {

      return true;

    }


    if (
      [
        "false",
        "0",
        "não",
        "nao",
        "no",
      ].includes(
        normalized
      )
    ) {

      return false;

    }

  }


  return fallback;

}


// ------------------------------------------------------------
// FORM VAZIO
// ------------------------------------------------------------

function createEmptyForm() {

  return {

    name:
      "",

    leader:
      "",

    sub_leader:
      "",

    city:
      "",

    member_count:
      "",

    specialty:
      "Informação",

    custom_specialty:
      "",

    status:
      "Neutra",

    allowed_cargos:
      [],

    is_active:
      true,

  };

}


// ------------------------------------------------------------
// NORMALIZA ORGANIZAÇÃO PARA O FORM
// ------------------------------------------------------------

function normalizeOrganizationForForm(
  org
) {

  if (
    !org
  ) {

    return createEmptyForm();

  }


  const specialty =
    SPECIALTY_OPTIONS.includes(
      org.specialty
    )
      ? org.specialty
      : "Informação";


  const status =
    STATUS_OPTIONS.includes(
      org.status
    )
      ? org.status
      : "Neutra";


  const memberCount =

    org.member_count ??

    org.memberCount ??

    "";


  return {

    name:
      String(
        org.name ??
        ""
      ),

    leader:
      String(
        org.leader ??
        ""
      ),

    sub_leader:
      String(

        org.sub_leader ??

        org.subLeader ??

        ""

      ),

    city:
      String(
        org.city ??
        ""
      ),

    member_count:
      memberCount ===
        null

        ? ""

        : String(
            memberCount
          ),

    specialty,

    custom_specialty:
      String(

        org.custom_specialty ??

        org.customSpecialty ??

        ""

      ),

    status,

    allowed_cargos:
      normalizeStringArray(

        org.allowed_cargos ??

        org.allowedCargos ??

        org.allowedRoles ??

        []

      ),

    is_active:
      normalizeBoolean(

        org.is_active ??

        org.isActive,

        true

      ),

  };

}


// ============================================================
// COMPONENTE
// ============================================================

export default function OrganizationFormModal({

  open,

  org,

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
  // CARREGA ORGANIZAÇÃO
  // ==========================================================

  useEffect(
    () => {

      if (
        !open
      ) {

        return;

      }


      setForm(
        normalizeOrganizationForForm(
          org
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
  // ALTERAR ESPECIALIDADE
  // ==========================================================

  function handleSpecialtyChange(
    value
  ) {

    if (
      !SPECIALTY_OPTIONS.includes(
        value
      )
    ) {

      return;

    }


    setForm(
      (
        current
      ) => ({

        ...current,

        specialty:
          value,

        // ----------------------------------------------------
        // Evita manter uma especialidade customizada escondida
        // quando o usuário troca "Outra" por uma opção padrão.
        // ----------------------------------------------------

        custom_specialty:
          value ===
          "Outra"

            ? current.custom_specialty

            : "",

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
  // VALIDAÇÃO
  // ==========================================================

  function validateForm() {

    const name =
      String(
        form.name ??
        ""
      ).trim();


    if (
      !name
    ) {

      return "O nome da organização é obrigatório.";

    }


    if (
      name.length >
      200
    ) {

      return "O nome deve possuir no máximo 200 caracteres.";

    }


    const leader =
      String(
        form.leader ??
        ""
      ).trim();


    if (
      leader.length >
      150
    ) {

      return "O nome do líder deve possuir no máximo 150 caracteres.";

    }


    const subLeader =
      String(
        form.sub_leader ??
        ""
      ).trim();


    if (
      subLeader.length >
      150
    ) {

      return "O nome do sub-líder deve possuir no máximo 150 caracteres.";

    }


    const city =
      String(
        form.city ??
        ""
      ).trim();


    if (
      city.length >
      100
    ) {

      return "A cidade deve possuir no máximo 100 caracteres.";

    }


    if (
      !SPECIALTY_OPTIONS.includes(
        form.specialty
      )
    ) {

      return "Especialidade inválida.";

    }


    if (
      !STATUS_OPTIONS.includes(
        form.status
      )
    ) {

      return "Status da relação inválido.";

    }


    const customSpecialty =
      String(
        form.custom_specialty ??
        ""
      ).trim();


    if (
      customSpecialty.length >
      200
    ) {

      return "A especialidade personalizada deve possuir no máximo 200 caracteres.";

    }


    // --------------------------------------------------------
    // QUANTIDADE DE MEMBROS
    // --------------------------------------------------------

    if (
      form.member_count !==
        "" &&
      form.member_count !==
        null &&
      form.member_count !==
        undefined
    ) {

      const memberCount =
        Number(
          form.member_count
        );


      if (
        !Number.isInteger(
          memberCount
        ) ||
        memberCount <
          0
      ) {

        return "A quantidade de membros deve ser um número inteiro maior ou igual a zero.";

      }

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
        "Não foi possível salvar a organização."
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
    // NORMALIZAÇÃO
    // ========================================================

    const name =
      String(
        form.name
      ).trim();


    const leader =
      String(
        form.leader ??
        ""
      ).trim();


    const subLeader =
      String(
        form.sub_leader ??
        ""
      ).trim();


    const city =
      String(
        form.city ??
        ""
      ).trim();


    const customSpecialty =
      String(
        form.custom_specialty ??
        ""
      ).trim();


    const memberCount =
      form.member_count ===
        "" ||
      form.member_count ===
        null ||
      form.member_count ===
        undefined

        ? null

        : Number(
            form.member_count
          );


    // ========================================================
    // PAYLOAD EXPLÍCITO
    // ========================================================
    //
    // Não usamos:
    //
    // ...form
    //
    // para evitar enviar propriedades inesperadas ao backend.
    //
    // ========================================================

    const payload = {

      name,

      leader:
        leader ||
        null,

      sub_leader:
        subLeader ||
        null,

      city:
        city ||
        null,

      member_count:
        memberCount,

      specialty:
        form.specialty,

      custom_specialty:
        form.specialty ===
          "Outra"

          ? (
              customSpecialty ||
              null
            )

          : null,

      status:
        form.status,

      allowed_cargos:
        normalizeStringArray(
          form.allowed_cargos
        ),

      is_active:
        Boolean(
          form.is_active
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
        "[OrganizationFormModal] erro ao salvar:",
        saveError
      );


      setError(

        saveError?.message ||

        "Erro ao salvar a organização. Tente novamente."

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
      !org?.id
    ) {

      return;

    }


    if (
      typeof onDelete !==
      "function"
    ) {

      setError(
        "Não foi possível excluir a organização."
      );


      return;

    }


    const organizationName =
      String(
        org.name ??
        "esta organização"
      );


    const confirmed =
      window.confirm(
        `Tem certeza que deseja remover a organização "${organizationName}"?`
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
        org.id
      );

    } catch (
      deleteError
    ) {

      console.error(
        "[OrganizationFormModal] erro ao excluir:",
        deleteError
      );


      setError(

        deleteError?.message ||

        "Erro ao excluir a organização. Tente novamente."

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
        form.name ??
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

            className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-2xl"

          >


            {/* =================================================
                HEADER
                ================================================= */}

            <div className="flex items-center justify-between px-6 py-4 border-b border-border">

              <div className="flex items-center gap-3">

                <Building2 className="w-5 h-5 text-muted-foreground" />


                <h2 className="font-heading text-lg font-bold tracking-[0.1em] text-primary">

                  {
                    org
                      ? "EDITAR ORGANIZAÇÃO"
                      : "NOVA ORGANIZAÇÃO"
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
                  NOME
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  NOME *

                </Label>


                <Input

                  value={
                    form.name
                  }

                  onChange={(
                    event
                  ) =>
                    set(
                      "name",
                      event.target.value
                    )
                  }

                  disabled={
                    saving
                  }

                  maxLength={
                    200
                  }

                  placeholder="Nome da organização"

                  className="bg-background border-border text-primary font-body"

                />

              </div>


              {/* =================================================
                  LÍDER
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  LÍDER

                </Label>


                <Input

                  value={
                    form.leader
                  }

                  onChange={(
                    event
                  ) =>
                    set(
                      "leader",
                      event.target.value
                    )
                  }

                  disabled={
                    saving
                  }

                  maxLength={
                    150
                  }

                  placeholder="Nome do líder"

                  className="bg-background border-border text-primary font-body"

                />

              </div>


              {/* =================================================
                  SUB-LÍDER
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  SUB-LÍDER

                </Label>


                <Input

                  value={
                    form.sub_leader
                  }

                  onChange={(
                    event
                  ) =>
                    set(
                      "sub_leader",
                      event.target.value
                    )
                  }

                  disabled={
                    saving
                  }

                  maxLength={
                    150
                  }

                  placeholder="Nome do sub-líder"

                  className="bg-background border-border text-primary font-body"

                />

              </div>


              {/* =================================================
                  CIDADE + MEMBROS
                  ================================================= */}

              <div className="grid grid-cols-2 gap-3">


                {/* CIDADE */}

                <div className="space-y-1.5">

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                    CIDADE

                  </Label>


                  <Input

                    value={
                      form.city
                    }

                    onChange={(
                      event
                    ) =>
                      set(
                        "city",
                        event.target.value
                      )
                    }

                    disabled={
                      saving
                    }

                    maxLength={
                      100
                    }

                    placeholder="Cidade"

                    className="bg-background border-border text-primary font-body"

                  />

                </div>


                {/* MEMBROS */}

                <div className="space-y-1.5">

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                    Nº DE MEMBROS

                  </Label>


                  <Input

                    type="number"

                    min={
                      0
                    }

                    step={
                      1
                    }

                    value={
                      form.member_count
                    }

                    onChange={(
                      event
                    ) =>
                      set(
                        "member_count",
                        event.target.value
                      )
                    }

                    disabled={
                      saving
                    }

                    placeholder="Desconhecido"

                    className="bg-background border-border text-primary font-body"

                  />

                </div>

              </div>


              {/* =================================================
                  ESPECIALIDADE
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  ESPECIALIDADE

                </Label>


                <Select

                  value={
                    form.specialty
                  }

                  onValueChange={
                    handleSpecialtyChange
                  }

                  disabled={
                    saving
                  }

                >

                  <SelectTrigger className="bg-background border-border text-primary font-heading tracking-wider text-sm">

                    <SelectValue />

                  </SelectTrigger>


                  <SelectContent>

                    {SPECIALTY_OPTIONS.map(
                      (
                        specialty
                      ) => (

                        <SelectItem

                          key={
                            specialty
                          }

                          value={
                            specialty
                          }

                          className="font-heading tracking-wide"

                        >

                          {specialty}

                        </SelectItem>

                      )
                    )}

                  </SelectContent>

                </Select>

              </div>


              {/* =================================================
                  ESPECIALIDADE PERSONALIZADA
                  ================================================= */}

              {form.specialty ===
                "Outra" && (

                <div className="space-y-1.5">

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                    ESPECIALIDADE PERSONALIZADA

                  </Label>


                  <Input

                    value={
                      form.custom_specialty
                    }

                    onChange={(
                      event
                    ) =>
                      set(
                        "custom_specialty",
                        event.target.value
                      )
                    }

                    disabled={
                      saving
                    }

                    maxLength={
                      200
                    }

                    placeholder="Digite a especialidade..."

                    className="bg-background border-border text-primary font-body"

                  />

                </div>

              )}


              {/* =================================================
                  STATUS
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  STATUS DA RELAÇÃO

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
                  CARGOS PERMITIDOS
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

                hint="Se vazio, não há restrição adicional por cargo. Se preenchido, apenas os cargos selecionados poderão visualizar."

              />


              {/* =================================================
                  ATIVA / INATIVA
                  ================================================= */}

              <div className="flex items-center justify-between pt-2">

                <div>

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                    ORGANIZAÇÃO ATIVA

                  </Label>


                  <p className="text-[10px] text-muted-foreground mt-1">

                    Organizações inativas ficam visíveis apenas para quem pode gerenciar relações.

                  </p>

                </div>


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
                      Boolean(
                        value
                      )
                    )
                  }

                  disabled={
                    saving
                  }

                />

              </div>


              {/* =================================================
                  ERRO
                  ================================================= */}

              {error && (

                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3">

                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />


                  <p className="text-xs text-red-400 font-body leading-relaxed">

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
                  EXCLUIR
                  ================================================= */}

              {org ? (

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

                      {
                        org
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