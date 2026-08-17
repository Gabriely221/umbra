// ============================================================
// ABA "FICHA" DA ORGANIZAÇÃO
// ============================================================
//
// Exibe e permite editar informações estratégicas:
//
// - nível de confiança
// - observações
// - objetivos
// - oportunidades
// - alertas
// - pessoas importantes
//
// Este componente NÃO acessa API diretamente.
//
// Fluxo:
//
// FichaTab
//    ↓
// onUpdate(payload)
//    ↓
// OrganizationDetail.jsx
//    ↓
// services/api.js
//    ↓
// Express / RBAC
//    ↓
// Sequelize / MySQL
//
// FORMATO CANÔNICO:
//
// key_people
// → enviado ao backend como Array.
//
// O KeyPeopleEditor pode continuar trabalhando internamente
// com JSON string durante a migração.
//
// ============================================================

import React, {
  useEffect,
  useState,
} from "react";


// ============================================================
// ÍCONES
// ============================================================

import {
  AlertTriangle,
  FileText,
  Lightbulb,
  Save,
  Target,
  Users,
} from "lucide-react";


// ============================================================
// UI
// ============================================================

import {
  Button,
} from "@/components/ui/button";

import {
  Label,
} from "@/components/ui/label";

import {
  Textarea,
} from "@/components/ui/textarea";


// ============================================================
// PESSOAS IMPORTANTES
// ============================================================

import KeyPeopleEditor
  from "@/components/relacoes/KeyPeopleEditor";


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// FORM VAZIO
// ------------------------------------------------------------

function createEmptyForm() {

  return {

    observations:
      "",

    trust_level:
      50,

    objectives:
      "",

    opportunities:
      "",

    alerts:
      "",

    key_people:
      "[]",

  };

}


// ------------------------------------------------------------
// CONFIANÇA
// ------------------------------------------------------------
//
// Organization.trustLevel é INTEGER de 0 a 100.
//
// ============================================================

function normalizeTrust(
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

    return 50;

  }


  const integer =
    Math.round(
      numeric
    );


  return Math.min(
    100,
    Math.max(
      0,
      integer
    )
  );

}


// ------------------------------------------------------------
// KEY PEOPLE → STRING PARA O EDITOR
// ------------------------------------------------------------
//
// O KeyPeopleEditor atualmente trabalha com JSON string.
//
// Aceitamos:
//
// [
//   ...
// ]
//
// ou:
//
// "[...]"
//
// ============================================================

function normalizeKeyPeopleForEditor(
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

    return "[]";

  }


  if (
    Array.isArray(
      value
    )
  ) {

    try {

      return JSON.stringify(
        value
      );

    } catch {

      return "[]";

    }

  }


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
        Array.isArray(
          parsed
        )
      ) {

        return JSON.stringify(
          parsed
        );

      }

    } catch {

      // Mantemos tratamento seguro abaixo.

    }

  }


  return "[]";

}


// ------------------------------------------------------------
// KEY PEOPLE → ARRAY PARA API
// ------------------------------------------------------------
//
// Não enviamos string JSON ao backend.
//
// O formato oficial passa a ser:
//
// [
//   {
//     name,
//     role
//   }
// ]
//
// ============================================================

function parseKeyPeopleForApi(
  value
) {

  let parsed;


  if (
    Array.isArray(
      value
    )
  ) {

    parsed =
      value;

  } else if (
    typeof value ===
    "string"
  ) {

    try {

      parsed =
        JSON.parse(
          value
        );

    } catch {

      throw new Error(
        "A lista de pessoas importantes contém dados inválidos."
      );

    }

  } else if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {

    parsed =
      [];

  } else {

    throw new Error(
      "A lista de pessoas importantes é inválida."
    );

  }


  if (
    !Array.isArray(
      parsed
    )
  ) {

    throw new Error(
      "A lista de pessoas importantes deve ser uma lista."
    );

  }


  return parsed

    .map(
      (
        person
      ) => {

        if (
          !person ||
          typeof person !==
            "object" ||
          Array.isArray(
            person
          )
        ) {

          return null;

        }


        const name =
          String(
            person.name ??
            ""
          ).trim();


        const role =
          String(
            person.role ??
            ""
          ).trim();


        if (
          !name &&
          !role
        ) {

          return null;

        }


        return {

          name:
            name ||
            null,

          role:
            role ||
            null,

        };

      }
    )

    .filter(Boolean);

}


// ------------------------------------------------------------
// ORGANIZAÇÃO → FORM
// ------------------------------------------------------------

function normalizeOrganizationForForm(
  organization
) {

  if (
    !organization
  ) {

    return createEmptyForm();

  }


  return {

    observations:
      String(

        organization.observations ??

        organization.observations_text ??

        ""

      ),

    trust_level:
      normalizeTrust(

        organization.trustLevel ??

        organization.trust_level ??

        50

      ),

    objectives:
      String(
        organization.objectives ??
        ""
      ),

    opportunities:
      String(
        organization.opportunities ??
        ""
      ),

    alerts:
      String(
        organization.alerts ??
        ""
      ),

    key_people:
      normalizeKeyPeopleForEditor(

        organization.keyPeople ??

        organization.key_people

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

export default function FichaTab({

  org,

  canEdit = false,

  onUpdate,

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
        "Você não possui permissão para editar esta ficha."
      );


      return;

    }


    if (
      typeof onUpdate !==
      "function"
    ) {

      setError(
        "Não foi possível salvar a ficha."
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
      // KEY PEOPLE
      // ======================================================

      const keyPeople =
        parseKeyPeopleForApi(
          form.key_people
        );


      // ======================================================
      // PAYLOAD EXPLÍCITO
      // ======================================================
      //
      // Não usamos:
      //
      // ...form
      //
      // Assim somente campos pertencentes à ficha são enviados.
      //
      // ======================================================

      const payload = {

        trust_level:
          normalizeTrust(
            form.trust_level
          ),

        observations:
          normalizeOptionalText(
            form.observations
          ),

        objectives:
          normalizeOptionalText(
            form.objectives
          ),

        opportunities:
          normalizeOptionalText(
            form.opportunities
          ),

        alerts:
          normalizeOptionalText(
            form.alerts
          ),

        key_people:
          keyPeople,

      };


      await onUpdate(
        payload
      );

    } catch (
      saveError
    ) {

      console.error(
        "[FichaTab] erro ao salvar:",
        saveError
      );


      setError(

        saveError?.message ||

        "Não foi possível salvar a ficha."

      );

    } finally {

      setSaving(
        false
      );

    }

  }


  // ==========================================================
  // RENDER DE CAMPO
  // ==========================================================

  function renderField(
    Icon,
    label,
    field,
    placeholder
  ) {

    const value =
      String(
        form[field] ??
        ""
      );


    return (

      <div className="space-y-1.5">

        <Label className="flex items-center gap-2 font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

          <Icon className="w-3.5 h-3.5 shrink-0" />

          {label}

        </Label>


        {canEdit ? (

          <Textarea

            value={
              value
            }

            onChange={(
              event
            ) =>
              set(
                field,
                event.target.value
              )
            }

            disabled={
              saving
            }

            placeholder={
              placeholder
            }

            rows={
              3
            }

            className="bg-background border-border text-primary font-body resize-none"

          />

        ) : (

          <p className="text-sm text-muted-foreground font-body leading-relaxed bg-background/30 border border-border/30 rounded-lg p-3 min-h-[2rem] whitespace-pre-wrap break-words">

            {
              value.trim() ||
              "—"
            }

          </p>

        )}

      </div>

    );

  }


  // ==========================================================
  // TRUST
  // ==========================================================

  const trust =
    normalizeTrust(
      form.trust_level
    );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="space-y-6">


      {/* ======================================================
          NÍVEL DE CONFIANÇA
          ====================================================== */}

      <div className="space-y-2">

        <div className="flex items-center justify-between">

          <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

            NÍVEL DE CONFIANÇA

          </Label>


          <span className="font-heading text-lg font-bold text-primary">

            {trust}%

          </span>

        </div>


        {canEdit ? (

          <input

            type="range"

            min={
              0
            }

            max={
              100
            }

            step={
              1
            }

            value={
              trust
            }

            onChange={(
              event
            ) =>
              set(
                "trust_level",
                Number(
                  event.target.value
                )
              )
            }

            disabled={
              saving
            }

            aria-label="Nível de confiança"

            className="w-full accent-primary disabled:opacity-50"

          />

        ) : (

          <div className="h-2 bg-muted rounded-full overflow-hidden">

            <div

              className="h-full bg-primary rounded-full transition-all duration-500"

              style={{
                width:
                  `${trust}%`,
              }}

            />

          </div>

        )}

      </div>


      {/* ======================================================
          OBSERVAÇÕES
          ====================================================== */}

      {renderField(

        FileText,

        "OBSERVAÇÕES GERAIS",

        "observations",

        "Observações sobre a organização..."

      )}


      {/* ======================================================
          OBJETIVOS
          ====================================================== */}

      {renderField(

        Target,

        "OBJETIVOS DA RELAÇÃO",

        "objectives",

        "Quais são os objetivos desta relação..."

      )}


      {/* ======================================================
          OPORTUNIDADES
          ====================================================== */}

      {renderField(

        Lightbulb,

        "OPORTUNIDADES IDENTIFICADAS",

        "opportunities",

        "Oportunidades identificadas..."

      )}


      {/* ======================================================
          ALERTAS
          ====================================================== */}

      {renderField(

        AlertTriangle,

        "ALERTAS IMPORTANTES",

        "alerts",

        "Alertas e pontos de atenção..."

      )}


      {/* ======================================================
          PESSOAS IMPORTANTES
          ====================================================== */}

      <div className="space-y-2">

        <Label className="flex items-center gap-2 font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

          <Users className="w-3.5 h-3.5 shrink-0" />

          PESSOAS IMPORTANTES

        </Label>


        <KeyPeopleEditor

          value={
            form.key_people
          }

          onChange={(
            value
          ) =>
            set(
              "key_people",
              value
            )
          }

          canEdit={
            canEdit &&
            !saving
          }

        />

      </div>


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

                SALVAR FICHA

              </>

            )}

          </Button>

        </div>

      )}

    </div>

  );

}