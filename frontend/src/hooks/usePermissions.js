// ============================================================
// HOOK DE PERMISSÕES - RBAC
// ============================================================
//
// Fonte da verdade:
//
// AuthContext
//   ↓
// Usuario
//   ↓
// Role
//   ↓
// Permissions
//
// O backend é responsável pela segurança real.
// Este hook controla apenas o estado/visibilidade da interface.
//
// ============================================================

import {
  useCallback,
  useMemo,
} from "react";

import {
  useAuth,
} from "../context/AuthContext";


// ============================================================
// NORMALIZA PERMISSÕES
// ============================================================

function getPermissionsFromUser(
  user
) {

  if (
    !user
  ) {

    return [];

  }


  // ----------------------------------------------------------
  // Formato esperado:
  //
  // user.role.permissions
  //
  // ----------------------------------------------------------

  if (
    Array.isArray(
      user?.role?.permissions
    )
  ) {

    return user.role.permissions;

  }


  // ----------------------------------------------------------
  // Sequelize pode retornar:
  //
  // user.role.Permissions
  //
  // ----------------------------------------------------------

  if (
    Array.isArray(
      user?.role?.Permissions
    )
  ) {

    return user.role.Permissions;

  }


  // ----------------------------------------------------------
  // Compatibilidade:
  //
  // user.Permissions
  // ----------------------------------------------------------

  if (
    Array.isArray(
      user?.Permissions
    )
  ) {

    return user.Permissions;

  }


  // ----------------------------------------------------------
  // Compatibilidade:
  //
  // user.permissions
  //
  // ----------------------------------------------------------

  if (
    Array.isArray(
      user?.permissions
    )
  ) {

    return user.permissions;

  }


  return [];

}


// ============================================================
// NORMALIZA SLUG
// ============================================================

function getPermissionSlug(
  permission
) {

  if (
    typeof permission ===
    "string"
  ) {

    return permission;

  }


  return (
    permission?.slug ||
    permission?.permissionSlug ||
    permission?.nome ||
    permission?.name ||
    null
  );

}


// ============================================================
// HOOK
// ============================================================

export function usePermissions() {

  const {
    user,
  } =
    useAuth();


  // ==========================================================
  // PERMISSÕES
  // ==========================================================

  const permissions =
    useMemo(
      () => {

        return getPermissionsFromUser(
          user
        );

      },

      [
        user,
      ]

    );


  // ==========================================================
  // SLUGS
  // ==========================================================

  const permissionSlugs =
    useMemo(
      () => {

        return new Set(

          permissions

            .map(
              getPermissionSlug
            )

            .filter(Boolean)

        );

      },

      [
        permissions,
      ]

    );


  // ==========================================================
  // CAN
  // ==========================================================
  //
  // Exemplo:
  //
  // can("gerenciar_usuarios")
  //
  // ==========================================================

  const can =
    useCallback(

      (
        permission
      ) => {

        if (
          !permission
        ) {

          return false;

        }


        return permissionSlugs.has(
          permission
        );

      },

      [
        permissionSlugs,
      ]

    );


  // ==========================================================
  // CAN ANY
  // ==========================================================
  //
  // Exemplo:
  //
  // canAny([
  //   "gerenciar_usuarios",
  //   "gerenciar_roles"
  // ])
  //
  // ==========================================================

  const canAny =
    useCallback(

      (
        requiredPermissions = []
      ) => {

        if (
          !Array.isArray(
            requiredPermissions
          ) ||

          requiredPermissions.length ===
          0
        ) {

          return false;

        }


        return requiredPermissions.some(
          (
            permission
          ) =>
            permissionSlugs.has(
              permission
            )
        );

      },

      [
        permissionSlugs,
      ]

    );


  // ==========================================================
  // CAN ALL
  // ==========================================================
  //
  // Exemplo:
  //
  // canAll([
  //   "visualizar_membros",
  //   "gerenciar_membros"
  // ])
  //
  // ==========================================================

  const canAll =
    useCallback(

      (
        requiredPermissions = []
      ) => {

        if (
          !Array.isArray(
            requiredPermissions
          ) ||

          requiredPermissions.length ===
          0
        ) {

          return false;

        }


        return requiredPermissions.every(
          (
            permission
          ) =>
            permissionSlugs.has(
              permission
            )
        );

      },

      [
        permissionSlugs,
      ]

    );


  // ==========================================================
  // PERMISSÕES RAW
  // ==========================================================

  return {

    can,

    canAny,

    canAll,

    permissions,

    permissionSlugs,

    role:
      user?.role ||
      user?.Role ||
      null,

  };

}


// ============================================================
// EXPORT DEFAULT
// ============================================================

export default usePermissions;