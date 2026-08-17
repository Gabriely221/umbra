// ============================================================
// EDITOR DE PESSOAS IMPORTANTES
// ============================================================
//
// Permite cadastrar pessoas relevantes de uma organização.
//
// Cada pessoa possui:
//
// {
//   name,
//   role,
//   observations
// }
//
// O backend agora armazena isso diretamente como JSON:
//
// Organization.keyPeople
//
// O componente trabalha internamente com ARRAY.
//
// Compatibilidade:
//
// - Array
// - String JSON antiga
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
  Plus,
  Trash2,
  User,
} from "lucide-react";


// ============================================================
// COMPONENTES UI
// ============================================================

import {
  Input,
} from "@/components/ui/input";

import {
  Textarea,
} from "@/components/ui/textarea";


// ============================================================
// VALOR PADRÃO
// ============================================================

const emptyPerson = {

  name:
    "",

  role:
    "",

  observations:
    "",

};


// ============================================================
// NORMALIZA VALOR
// ============================================================
//
// Aceita:
//
// []
//
// ou:
//
// "[...]"
//
// ============================================================

function normalizePeople(
  value
) {

  // ----------------------------------------------------------
  // Array já pronto.
  // ----------------------------------------------------------

  if (
    Array.isArray(
      value
    )
  ) {

    return value.map(
      (
        person
      ) => ({

        ...emptyPerson,

        ...(person || {}),

      })
    );

  }


  // ----------------------------------------------------------
  // String JSON.
  // ----------------------------------------------------------

  if (
    typeof value ===
    "string"
  ) {

    if (
      !value.trim()
    ) {

      return [];
    }


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

        return parsed.map(
          (
            person
          ) => ({

            ...emptyPerson,

            ...(person || {}),

          })
        );

      }

    } catch (
      error
    ) {

      console.warn(
        "[KeyPeopleEditor] JSON inválido:",
        error
      );

    }

  }


  return [];

}


// ============================================================
// COMPONENTE
// ============================================================

export default function KeyPeopleEditor({
  value,
  onChange,
  canEdit = false,
}) {

  // ==========================================================
  // ESTADO
  // ==========================================================

  const [
    people,
    setPeople,
  ] =
    useState([]);


  // ==========================================================
  // CARREGA DADOS
  // ==========================================================

  useEffect(
    () => {

      setPeople(
        normalizePeople(
          value
        )
      );

    },

    [
      value,
    ]
  );


  // ==========================================================
  // ATUALIZA LISTA
  // ==========================================================

  function update(
    newPeople
  ) {

    const normalized =
      newPeople.map(
        (
          person
        ) => ({

          ...emptyPerson,

          ...person,

        })
      );


    setPeople(
      normalized
    );


    // --------------------------------------------------------
    // IMPORTANTE:
    //
    // Agora enviamos ARRAY, não JSON.stringify().
    // O Organization.evaluation/keyPeople é DataTypes.JSON.
    // --------------------------------------------------------

    onChange?.(
      normalized
    );

  }


  // ==========================================================
  // ADICIONAR
  // ==========================================================

  function addPerson() {

    update([

      ...people,

      {
        ...emptyPerson,
      },

    ]);

  }


  // ==========================================================
  // REMOVER
  // ==========================================================

  function removePerson(
    index
  ) {

    update(

      people.filter(
        (
          _person,
          currentIndex
        ) =>
          currentIndex !==
          index
      )

    );

  }


  // ==========================================================
  // ALTERAR PESSOA
  // ==========================================================

  function setPerson(
    index,
    field,
    value
  ) {

    update(

      people.map(
        (
          person,
          currentIndex
        ) => {

          if (
            currentIndex !==
            index
          ) {

            return person;
          }


          return {

            ...person,

            [field]:
              value,

          };

        }
      )

    );

  }


  // ==========================================================
  // SOMENTE VISUALIZAÇÃO SEM REGISTROS
  // ==========================================================

  if (
    !canEdit &&
    people.length ===
    0
  ) {

    return (

      <p className="text-sm text-muted-foreground font-body">

        Nenhuma pessoa importante registrada.

      </p>

    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="space-y-3">


      {/* ======================================================
          PESSOAS
          ====================================================== */}

      {people.map(
        (
          person,
          index
        ) => (

          <div

            key={
              index
            }

            className="bg-background/50 border border-border/50 rounded-lg p-4 space-y-3"

          >


            {/* =================================================
                EDIÇÃO
                ================================================= */}

            {canEdit ? (

              <>


                {/* =============================================
                    CABEÇALHO
                    ============================================= */}

                <div className="flex items-center justify-between">


                  <div className="flex items-center gap-2">

                    <User
                      className="w-3.5 h-3.5 text-muted-foreground"
                    />


                    <span className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                      PESSOA{" "}
                      {index + 1}

                    </span>

                  </div>


                  {/* BOTÃO REMOVER */}

                  <button

                    type="button"

                    onClick={() =>
                      removePerson(
                        index
                      )
                    }

                    className="text-red-400/70 hover:text-red-400 transition-colors"

                    title="Remover pessoa"

                  >

                    <Trash2
                      className="w-3.5 h-3.5"
                    />

                  </button>

                </div>


                {/* =============================================
                    NOME + CARGO
                    ============================================= */}

                <div className="grid grid-cols-2 gap-2">


                  <Input

                    value={
                      person.name ||
                      ""
                    }

                    onChange={(
                      event
                    ) =>
                      setPerson(
                        index,
                        "name",
                        event.target.value
                      )
                    }

                    placeholder="Nome"

                    className="bg-card border-border text-primary font-body text-sm"

                  />


                  <Input

                    value={
                      person.role ||
                      ""
                    }

                    onChange={(
                      event
                    ) =>
                      setPerson(
                        index,
                        "role",
                        event.target.value
                      )
                    }

                    placeholder="Cargo"

                    className="bg-card border-border text-primary font-body text-sm"

                  />

                </div>


                {/* =============================================
                    OBSERVAÇÕES
                    ============================================= */}

                <Textarea

                  value={
                    person.observations ||
                    ""
                  }

                  onChange={(
                    event
                  ) =>
                    setPerson(
                      index,
                      "observations",
                      event.target.value
                    )
                  }

                  placeholder="Observações..."

                  rows={
                    2
                  }

                  className="bg-card border-border text-primary font-body text-sm resize-none"

                />

              </>


            ) : (


              /* =================================================
                 VISUALIZAÇÃO
                 ================================================= */

              <div>


                {/* NOME */}

                <p className="font-heading text-sm font-semibold text-primary">

                  {
                    person.name ||
                    "—"
                  }

                </p>


                {/* CARGO */}

                {person.role && (

                  <p className="text-xs text-muted-foreground font-heading tracking-wider mt-0.5">

                    {
                      person.role
                    }

                  </p>

                )}


                {/* OBSERVAÇÕES */}

                {person.observations && (

                  <p className="text-sm text-muted-foreground/80 font-body mt-1 whitespace-pre-wrap">

                    {
                      person.observations
                    }

                  </p>

                )}

              </div>

            )}

          </div>

        )

      )}


      {/* ======================================================
          ADICIONAR
          ====================================================== */}

      {canEdit && (

        <button

          type="button"

          onClick={
            addPerson
          }

          className="flex items-center gap-2 text-xs font-heading tracking-wider text-muted-foreground hover:text-primary transition-colors"

        >

          <Plus
            className="w-3.5 h-3.5"
          />

          ADICIONAR PESSOA

        </button>

      )}

    </div>

  );
}