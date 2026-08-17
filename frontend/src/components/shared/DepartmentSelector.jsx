// ============================================================
// SELETOR DE DEPARTAMENTOS
// ============================================================
//
// Catálogo:
//
// Department
//   ├── id
//   ├── nome
//   ├── slug
//   ├── descricao
//   ├── ativo
//   └── ordem
//
// Valores selecionados:
//
// [
//   "Inteligência",
//   "Operações"
// ]
//
// IMPORTANTE:
//
// Durante esta etapa da migração armazenamos NOMES nos campos
// JSON existentes.
//
// Não migramos ainda para IDs ou slugs.
//
// ============================================================

import React, {
  useMemo,
} from "react";


// ============================================================
// REACT QUERY
// ============================================================

import {
  useQuery,
} from "@tanstack/react-query";


// ============================================================
// ÍCONES
// ============================================================

import {
  Check,
} from "lucide-react";


// ============================================================
// UI
// ============================================================

import {
  Label,
} from "@/components/ui/label";


// ============================================================
// API
// ============================================================

import {
  getDepartments,
} from "@/services/api";


// ============================================================
// HELPERS
// ============================================================

function normalizeDepartment(
  department
) {

  // ----------------------------------------------------------
  // FORMATO ANTIGO
  // ----------------------------------------------------------
  //
  // "Inteligência"
  //
  // ----------------------------------------------------------

  if (
    typeof department ===
    "string"
  ) {

    const name =
      department.trim();


    if (
      !name
    ) {

      return null;

    }


    return {
      id:
        name,

      name,

      slug:
        null,

      active:
        true,

      order:
        99,
    };

  }


  // ----------------------------------------------------------
  // FORMATO NOVO
  // ----------------------------------------------------------

  if (
    !department ||
    typeof department !==
      "object"
  ) {

    return null;

  }


  const name =
    String(
      department.nome ??
      department.name ??
      ""
    ).trim();


  if (
    !name
  ) {

    return null;

  }


  return {

    id:
      department.id ??
      department.slug ??
      name,

    name,

    slug:
      department.slug ??
      null,

    active:
      department.ativo ??
      department.active ??
      true,

    order:
      Number(
        department.ordem ??
        department.order ??
        99
      ),

  };

}


// ============================================================
// COMPONENTE
// ============================================================

export default function DepartmentSelector({

  selected = [],

  onChange,

  label =
    "DEPARTAMENTOS PERMITIDOS",

  hint =
    "Se vazio, todos os departamentos podem visualizar.",

}) {

  // ==========================================================
  // NORMALIZA SELEÇÃO
  // ==========================================================

  const selectedDepartments =
    Array.isArray(
      selected
    )
      ? selected
      : [];


  // ==========================================================
  // CONSULTA
  // ==========================================================

  const {
    data:
      response,

    isLoading,

    isError,

    error,
  } =
    useQuery({

      queryKey: [
        "departments",
      ],

      queryFn:
        getDepartments,

    });


  // ==========================================================
  // NORMALIZA RESPOSTA
  // ==========================================================

  const normalizedDepartments =
    useMemo(
      () => {

        const departments =
          Array.isArray(
            response
          )

            ? response

            : response?.departments ??
              [];


        return departments

          .map(
            normalizeDepartment
          )

          .filter(Boolean)

          // --------------------------------------------------
          // Departamentos desativados não devem ser oferecidos
          // para novas seleções.
          // --------------------------------------------------

          .filter(
            (
              department
            ) =>
              department.active
          )

          // --------------------------------------------------
          // ORDEM ADMINISTRATIVA
          // --------------------------------------------------

          .sort(
            (
              a,
              b
            ) => {

              if (
                a.order !==
                b.order
              ) {

                return (
                  a.order -
                  b.order
                );

              }


              return a.name.localeCompare(
                b.name,
                "pt-BR"
              );

            }
          );

      },
      [
        response,
      ]
    );


  // ==========================================================
  // ALTERAR SELEÇÃO
  // ==========================================================

  function toggle(
    departmentName
  ) {

    if (
      typeof onChange !==
      "function"
    ) {

      return;

    }


    // --------------------------------------------------------
    // REMOVE
    // --------------------------------------------------------

    if (
      selectedDepartments.includes(
        departmentName
      )
    ) {

      onChange(

        selectedDepartments.filter(
          (
            department
          ) =>
            department !==
            departmentName
        )

      );


      return;

    }


    // --------------------------------------------------------
    // ADICIONA
    // --------------------------------------------------------

    onChange([
      ...selectedDepartments,
      departmentName,
    ]);

  }


  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    isLoading
  ) {

    return (

      <div className="space-y-1.5">

        <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

          {label}

        </Label>


        <p className="text-[11px] text-muted-foreground italic">

          Carregando departamentos...

        </p>

      </div>

    );

  }


  // ==========================================================
  // ERRO
  // ==========================================================

  if (
    isError
  ) {

    return (

      <div className="space-y-1.5">

        <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

          {label}

        </Label>


        <p className="text-[11px] text-red-400 italic">

          {
            error?.message ||
            "Não foi possível carregar os departamentos."
          }

        </p>

      </div>

    );

  }


  // ==========================================================
  // CATÁLOGO VAZIO
  // ==========================================================

  if (
    normalizedDepartments.length ===
    0
  ) {

    return (

      <div className="space-y-1.5">

        <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

          {label}

        </Label>


        <p className="text-[11px] text-muted-foreground italic">

          Nenhum departamento cadastrado.

        </p>

      </div>

    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="space-y-1.5">


      {/* ======================================================
          LABEL
          ====================================================== */}

      <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

        {label}


        {selectedDepartments.length >
          0 && (

          <span className="text-primary/60">

            {" "}
            (
            {
              selectedDepartments.length
            }
            )

          </span>

        )}

      </Label>


      {/* ======================================================
          OPÇÕES
          ====================================================== */}

      <div className="flex flex-wrap gap-2">

        {normalizedDepartments.map(
          (
            department
          ) => {

            const isSelected =
              selectedDepartments.includes(
                department.name
              );


            return (

              <button

                key={
                  department.id
                }

                type="button"

                onClick={() =>
                  toggle(
                    department.name
                  )
                }

                aria-pressed={
                  isSelected
                }

                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-heading tracking-wider transition-colors ${
                  isSelected

                    ? "bg-primary text-primary-foreground border-primary"

                    : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                }`}

              >

                {isSelected && (

                  <Check
                    className="w-3 h-3"
                  />

                )}


                {department.name}

              </button>

            );

          }
        )}

      </div>


      {/* ======================================================
          HINT
          ====================================================== */}

      {hint && (

        <p className="text-[10px] text-muted-foreground">

          {hint}

        </p>

      )}

    </div>

  );

}