// ============================================================
// ROTA PROTEGIDA
// ============================================================
//
// Camada de proteção da interface.
//
// Verifica:
//
// 1. carregamento da autenticação
// 2. usuário autenticado
// 3. acesso geral ao sistema
// 4. permissão individual
// 5. conjunto OR de permissões
// 6. conjunto AND de permissões
//
// IMPORTANTE:
//
// Esta proteção melhora a UX e impede renderização indevida
// no frontend.
//
// A autoridade REAL continua sendo:
//
// JWT + RBAC no backend.
//
// ============================================================

import React from "react";


// ============================================================
// ROUTER
// ============================================================

import {
  Navigate,
  useLocation,
} from "react-router-dom";


// ============================================================
// AUTH
// ============================================================

import {
  useAuth,
} from "@/context/AuthContext";


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// NORMALIZA LISTA DE PERMISSÕES
// ------------------------------------------------------------

function normalizePermissions(
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
// OBTÉM SLUG DO CARGO
// ------------------------------------------------------------
//
// Aceitamos algumas formas temporariamente durante a migração:
//
// usuario.Role.slug
// usuario.role.slug
// usuario.roleSlug
// usuario.role_slug
//
// Se role for uma string, também aceitamos:
//
// usuario.role = "membro"
//
// ------------------------------------------------------------

function getRoleSlug(
  usuario
) {

  const role =

    usuario?.Role ??

    usuario?.role ??

    null;


  if (
    typeof role ===
    "string"
  ) {

    return role
      .trim()
      .toLowerCase();

  }


  return String(

    role?.slug ??

    usuario?.roleSlug ??

    usuario?.role_slug ??

    ""

  )
    .trim()
    .toLowerCase();

}


// ============================================================
// TELA DE ACESSO NEGADO
// ============================================================
//
// Evitamos redirecionar cegamente para "/".
//
// Um usuário pode possuir acesso a determinada área e não ter
// visualizar_inicio.
//
// Redirecioná-lo para "/" poderia criar uma navegação ruim ou
// até um ciclo de autorização.
//
// ============================================================

function AccessDenied() {

  return (

    <div className="min-h-screen flex items-center justify-center px-4">

      <div className="text-center max-w-md">

        <h1 className="font-heading text-2xl font-bold tracking-[0.15em] text-red-400 mb-2">

          ACESSO NEGADO

        </h1>


        <p className="text-muted-foreground text-sm">

          Você não possui a permissão necessária para acessar esta área.

        </p>

      </div>

    </div>

  );

}


// ============================================================
// COMPONENTE
// ============================================================
//
// PROPS:
//
// permission
// → exige uma permissão específica.
//
// anyPermissions
// → exige PELO MENOS UMA.
//
// allPermissions
// → exige TODAS.
//
// allowWithoutSystemAccess
// → permite uma rota autenticada mesmo sem acessar_sistema.
//
// A rota /aguardando já recebe tratamento especial para evitar
// loop durante a transição do App.jsx.
//
// ============================================================

export default function ProtectedRoute({

  children,

  permission = null,

  anyPermissions = [],

  allPermissions = [],

  allowWithoutSystemAccess = false,

}) {

  // ==========================================================
  // LOCALIZAÇÃO
  // ==========================================================

  const location =
    useLocation();


  // ==========================================================
  // AUTH
  // ==========================================================

  const {

    usuario,

    loading,

    hasPermission,

    hasAnyPermission,

    hasAllPermissions,

  } =
    useAuth();


  // ==========================================================
  // CARREGAMENTO
  // ==========================================================
  //
  // Enquanto /me ou a restauração da sessão estiver em curso,
  // não tomamos nenhuma decisão de redirecionamento.
  //
  // ==========================================================

  if (
    loading
  ) {

    return (

      <div className="min-h-screen flex items-center justify-center">

        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />

      </div>

    );

  }


  // ==========================================================
  // NÃO AUTENTICADO
  // ==========================================================

  if (
    !usuario
  ) {

    return (

      <Navigate

        to="/login"

        replace

        state={{
          from:
            location,
        }}

      />

    );

  }


  // ==========================================================
  // ACESSO GERAL AO SISTEMA
  // ==========================================================
  //
  // Regra:
  //
  // role = sem_acesso
  //
  // OU
  //
  // não possui acessar_sistema
  //
  //        ↓
  //
  // /aguardando
  //
  // A única exceção é a própria tela /aguardando ou uma rota
  // explicitamente marcada com allowWithoutSystemAccess.
  //
  // ==========================================================

  const roleSlug =
    getRoleSlug(
      usuario
    );


  const isSemAcesso =
    roleSlug ===
    "sem_acesso";


  const hasSystemAccess =
    typeof hasPermission ===
      "function" &&
    hasPermission(
      "acessar_sistema"
    );


  const isWaitingRoute =
    location.pathname ===
    "/aguardando";


  const canBypassSystemAccess =
    allowWithoutSystemAccess ||
    isWaitingRoute;


  if (
    !canBypassSystemAccess &&
    (
      isSemAcesso ||
      !hasSystemAccess
    )
  ) {

    return (

      <Navigate
        to="/aguardando"
        replace
      />

    );

  }


  // ==========================================================
  // USUÁRIO JÁ LIBERADO NA TELA DE AGUARDANDO
  // ==========================================================
  //
  // Se o usuário recebeu acesso enquanto ainda estava com uma
  // URL antiga/favorita em /aguardando, não faz sentido
  // mantê-lo preso nessa tela.
  //
  // ==========================================================

  if (
    isWaitingRoute &&
    !isSemAcesso &&
    hasSystemAccess
  ) {

    return (

      <Navigate
        to="/"
        replace
      />

    );

  }


  // ==========================================================
  // PERMISSÃO INDIVIDUAL
  // ==========================================================

  const requiredPermission =
    String(
      permission ??
      ""
    ).trim();


  if (
    requiredPermission &&
    (
      typeof hasPermission !==
        "function" ||
      !hasPermission(
        requiredPermission
      )
    )
  ) {

    return (
      <AccessDenied />
    );

  }


  // ==========================================================
  // PERMISSÕES OR
  // ==========================================================
  //
  // Exemplo:
  //
  // anyPermissions={[
  //   "visualizar_relacoes",
  //   "gerenciar_relacoes",
  // ]}
  //
  // Basta possuir uma delas.
  //
  // ==========================================================

  const requiredAny =
    normalizePermissions(
      anyPermissions
    );


  if (
    requiredAny.length >
    0
  ) {

    const allowed =
      typeof hasAnyPermission ===
        "function"

        ? hasAnyPermission(
            requiredAny
          )

        : requiredAny.some(
            (
              permissionSlug
            ) =>
              typeof hasPermission ===
                "function" &&
              hasPermission(
                permissionSlug
              )
          );


    if (
      !allowed
    ) {

      return (
        <AccessDenied />
      );

    }

  }


  // ==========================================================
  // PERMISSÕES AND
  // ==========================================================
  //
  // Exemplo:
  //
  // allPermissions={[
  //   "visualizar_x",
  //   "gerenciar_x",
  // ]}
  //
  // O usuário precisa possuir todas.
  //
  // ==========================================================

  const requiredAll =
    normalizePermissions(
      allPermissions
    );


  if (
    requiredAll.length >
    0
  ) {

    const allowed =
      typeof hasAllPermissions ===
        "function"

        ? hasAllPermissions(
            requiredAll
          )

        : requiredAll.every(
            (
              permissionSlug
            ) =>
              typeof hasPermission ===
                "function" &&
              hasPermission(
                permissionSlug
              )
          );


    if (
      !allowed
    ) {

      return (
        <AccessDenied />
      );

    }

  }


  // ==========================================================
  // AUTORIZADO
  // ==========================================================

  return children;

}