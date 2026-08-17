// ============================================================
// SELETOR DE CARGOS / ROLES
// ============================================================
//
// PADRÃO OFICIAL:
//
// Role.id
//   → identidade do banco
//
// Role.nome
//   → apresentação visual
//
// Role.slug
//   → valor persistido nas restrições JSON
//
// Exemplo:
//
// allowed_cargos: [
//   "administrador",
//   "lideranca"
// ]
//
// IMPORTANTE:
//
// Durante a migração este componente também reconhece valores
// antigos contendo Role.nome.
//
// Porém toda nova alteração devolve SLUGS.
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
  getRoles,
} from "@/services/api";


// ============================================================
// RBAC
// ============================================================

import {
  usePermissions,
} from "@/hooks/usePermissions";


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// NORMALIZA SELEÇÃO
// ------------------------------------------------------------

function normalizeSelected(
  selected
) {

  if (
    !Array.isArray(
      selected
    )
  ) {

    return [];

  }


  return [

    ...new Set(

      selected

        .map(
          (
            value
          ) =>
            String(
              value ||
              ""
            ).trim()
        )

        .filter(Boolean)

    ),

  ];

}


// ------------------------------------------------------------
// NORMALIZA ROLE
// ------------------------------------------------------------

function normalizeRole(
  role
) {

  if (
    !role ||
    typeof role !==
      "object"
  ) {

    return null;

  }


  const id =
    role.id ??
    null;


  const nome =
    String(
      role.nome ??
      role.name ??
      ""
    ).trim();


  const slug =
    String(
      role.slug ??
      ""
    )
      .trim()
      .toLowerCase();


  if (
    !nome ||
    !slug
  ) {

    return null;

  }


  return {

    id,

    nome,

    slug,

    hierarchyOrder:
      Number(
        role.hierarchyOrder ??
        role.hierarchy_order ??
        99
      ),

    tierLevel:
      Number(
        role.tierLevel ??
        role.tier_level ??
        99
      ),

    isSystem:
      Boolean(
        role.isSystem ??
        role.is_system ??
        false
      ),

  };

}


// ============================================================
// COMPONENTE
// ============================================================

export default function CargoSelector({

  selected = [],

  onChange,

  label =
    "CARGOS PERMITIDOS",

  hint =
    "Se vazio, todos os cargos podem visualizar.",

}) {

  // ==========================================================
  // RBAC
  // ==========================================================

  const {
    canAny,
  } =
    usePermissions();


  // ==========================================================
  // PODE CONSULTAR ROLES
  // ==========================================================
  //
  // Deve acompanhar exatamente o RBAC do backend:
  //
  // visualizar_roles
  // OU
  // gerenciar_usuarios
  // OU
  // gerenciar_roles
  //
  // ==========================================================

  const canViewRoles =
    canAny([
      "visualizar_roles",
      "gerenciar_usuarios",
      "gerenciar_roles",
    ]);


  // ==========================================================
  // SELEÇÃO NORMALIZADA
  // ==========================================================

  const selectedValues =
    useMemo(
      () =>
        normalizeSelected(
          selected
        ),
      [
        selected,
      ]
    );


  // ==========================================================
  // CARREGA ROLES
  // ==========================================================

  const {
    data:
      rolesResponse = [],

    isLoading,

    isError,

    error,
  } =
    useQuery({

      queryKey: [
        "roles",
      ],

      // ------------------------------------------------------
      // getRoles() JÁ RETORNA O ARRAY.
      // ------------------------------------------------------

      queryFn:
        getRoles,

      enabled:
        canViewRoles,

    });


  // ==========================================================
  // NORMALIZA E ORDENA
  // ==========================================================

  const roles =
    useMemo(
      () => {

        const source =
          Array.isArray(
            rolesResponse
          )
            ? rolesResponse
            : [];


        return source

          .map(
            normalizeRole
          )

          .filter(Boolean)

          // --------------------------------------------------
          // "sem_acesso" não é um público de conteúdo.
          //
          // É um estado de aprovação da conta.
          // --------------------------------------------------

          .filter(
            (
              role
            ) =>
              role.slug !==
              "sem_acesso"
          )

          .sort(
            (
              a,
              b
            ) => {

              if (
                a.hierarchyOrder !==
                b.hierarchyOrder
              ) {

                return (
                  a.hierarchyOrder -
                  b.hierarchyOrder
                );

              }


              return a.nome.localeCompare(
                b.nome,
                "pt-BR"
              );

            }
          );

      },
      [
        rolesResponse,
      ]
    );


  // ==========================================================
  // VERIFICA SE ROLE ESTÁ SELECIONADA
  // ==========================================================
  //
  // Durante a migração aceitamos:
  //
  // "lideranca"  ← novo padrão
  //
  // ou:
  //
  // "Liderança"  ← formato legado
  //
  // ==========================================================

  function isRoleSelected(
    role
  ) {

    return (
      selectedValues.includes(
        role.slug
      ) ||
      selectedValues.includes(
        role.nome
      )
    );

  }


  // ==========================================================
  // TOGGLE
  // ==========================================================

  function toggle(
    role
  ) {

    if (
      typeof onChange !==
      "function"
    ) {

      return;

    }


    const selected =
      isRoleSelected(
        role
      );


    // --------------------------------------------------------
    // REMOVE
    // --------------------------------------------------------
    //
    // Remove tanto slug quanto nome legado.
    //
    // --------------------------------------------------------

    if (
      selected
    ) {

      onChange(

        selectedValues.filter(
          (
            value
          ) =>
            value !==
              role.slug &&
            value !==
              role.nome
        )

      );


      return;

    }


    // --------------------------------------------------------
    // ADICIONA
    // --------------------------------------------------------
    //
    // Antes de adicionar, normalizamos todos os valores que
    // correspondem a roles conhecidas para SLUG.
    //
    // --------------------------------------------------------

    const normalizedCurrent =
      selectedValues.map(
        (
          value
        ) => {

          const matchingRole =
            roles.find(
              (
                item
              ) =>
                item.slug ===
                  value ||
                item.nome ===
                  value
            );


          return (
            matchingRole?.slug ||
            value
          );

        }
      );


    onChange([

      ...new Set([
        ...normalizedCurrent,
        role.slug,
      ]),

    ]);

  }


  // ==========================================================
  // SEM PERMISSÃO
  // ==========================================================

  if (
    !canViewRoles
  ) {

    return (

      <div className="space-y-1.5">

        <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

          {label}

        </Label>


        <p className="text-[11px] text-muted-foreground italic">

          Você não possui permissão para consultar os cargos do sistema.

        </p>

      </div>

    );

  }


  // ==========================================================
  // CARREGANDO
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

          Carregando cargos...

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
            "Não foi possível carregar os cargos."
          }

        </p>

      </div>

    );

  }


  // ==========================================================
  // NENHUM ROLE
  // ==========================================================

  if (
    roles.length ===
    0
  ) {

    return (

      <div className="space-y-1.5">

        <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

          {label}

        </Label>


        <p className="text-[11px] text-muted-foreground italic">

          Nenhum cargo disponível.

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


        {selectedValues.length >
          0 && (

          <span className="text-primary/60">

            {" "}
            (
            {
              selectedValues.length
            }
            )

          </span>

        )}

      </Label>


      {/* ======================================================
          ROLES
          ====================================================== */}

      <div className="flex flex-wrap gap-2">

        {roles.map(
          (
            role
          ) => {

            const isSelected =
              isRoleSelected(
                role
              );


            return (

              <button

                key={
                  role.id ??
                  role.slug
                }

                type="button"

                onClick={() =>
                  toggle(
                    role
                  )
                }

                aria-pressed={
                  isSelected
                }

                title={
                  role.slug
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


                {role.nome}

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