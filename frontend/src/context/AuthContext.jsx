// ============================================================
// AUTH CONTEXT
// ============================================================
//
// Fonte central do estado de autenticação do frontend.
//
// Fluxo:
//
// Login
//   ↓
// services/api.js
//   ↓
// JWT → localStorage["cartelhub_token"]
//   ↓
// /api/auth/me
//   ↓
// Usuario + Role + Permissions
//   ↓
// AuthContext
//
// O backend continua sendo a autoridade real de autenticação
// e autorização.
//
// ============================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";


// ============================================================
// API
// ============================================================

import {
  login as loginApi,
  getCurrentUser,
  getToken,
  clearToken,
} from "../services/api";


// ============================================================
// CONTEXT
// ============================================================

const AuthContext =
  createContext(null);


// ============================================================
// HELPERS
// ============================================================

// ------------------------------------------------------------
// NORMALIZA UMA PERMISSÃO
// ------------------------------------------------------------
//
// Aceita:
//
// "gerenciar_usuarios"
//
// ou:
//
// {
//   id: 1,
//   slug: "gerenciar_usuarios"
// }
//
// ------------------------------------------------------------

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
    null
  );

}


// ------------------------------------------------------------
// OBTÉM PERMISSÕES DO USUÁRIO
// ------------------------------------------------------------
//
// Suporta o formato novo:
//
// usuario.role.permissions
//
// e formatos transitórios:
//
// usuario.permissoes
// usuario.permissions
//
// ------------------------------------------------------------

function getUserPermissionSlugs(
  usuario
) {

  if (
    !usuario
  ) {

    return [];

  }


  // ==========================================================
  // FORMATO NOVO
  // ==========================================================

  if (
    Array.isArray(
      usuario?.role?.permissions
    )
  ) {

    return usuario.role.permissions

      .map(
        getPermissionSlug
      )

      .filter(Boolean);

  }


  // ==========================================================
  // COMPATIBILIDADE SEQUELIZE
  // ==========================================================

  if (
    Array.isArray(
      usuario?.role?.Permissions
    )
  ) {

    return usuario.role.Permissions

      .map(
        getPermissionSlug
      )

      .filter(Boolean);

  }


  // ==========================================================
  // FORMATO LEGADO/COMPATIBILIDADE
  // ==========================================================

  if (
    Array.isArray(
      usuario?.permissoes
    )
  ) {

    return usuario.permissoes

      .map(
        getPermissionSlug
      )

      .filter(Boolean);

  }


  if (
    Array.isArray(
      usuario?.permissions
    )
  ) {

    return usuario.permissions

      .map(
        getPermissionSlug
      )

      .filter(Boolean);

  }


  return [];

}


// ============================================================
// PROVIDER
// ============================================================

export function AuthProvider({
  children,
}) {

  // ==========================================================
  // USUÁRIO
  // ==========================================================

  const [
    usuario,
    setUsuario,
  ] =
    useState(null);


  // ==========================================================
  // CARREGAMENTO INICIAL
  // ==========================================================

  const [
    loading,
    setLoading,
  ] =
    useState(true);


  // ==========================================================
  // ATUALIZAR USUÁRIO AUTENTICADO
  // ==========================================================
  //
  // Reconsulta /auth/me.
  //
  // Útil após:
  //
  // - mudança de nome
  // - mudança de role
  // - alteração de permissões
  //
  // ==========================================================

  const refreshUser =
    useCallback(
      async () => {

        const token =
          getToken();


        if (
          !token
        ) {

          setUsuario(
            null
          );

          return null;

        }


        try {

          const data =
            await getCurrentUser();


          const currentUser =
            data?.usuario ||
            data?.user ||
            data ||
            null;


          setUsuario(
            currentUser
          );


          return currentUser;

        } catch (
          error
        ) {

          clearToken();

          setUsuario(
            null
          );


          throw error;

        }

      },
      []
    );


  // ==========================================================
  // RESTAURAR SESSÃO
  // ==========================================================

  useEffect(
    () => {

      let mounted =
        true;


      async function restoreSession() {

        const token =
          getToken();


        // ------------------------------------------------------
        // SEM JWT
        // ------------------------------------------------------

        if (
          !token
        ) {

          if (
            mounted
          ) {

            setUsuario(
              null
            );

            setLoading(
              false
            );

          }


          return;

        }


        // ------------------------------------------------------
        // EXISTE JWT
        // ------------------------------------------------------

        try {

          const data =
            await getCurrentUser();


          const currentUser =
            data?.usuario ||
            data?.user ||
            data ||
            null;


          if (
            mounted
          ) {

            setUsuario(
              currentUser
            );

          }

        } catch (
          error
        ) {

          console.error(
            "[AuthContext] Não foi possível restaurar a sessão:",
            error
          );


          clearToken();


          if (
            mounted
          ) {

            setUsuario(
              null
            );

          }

        } finally {

          if (
            mounted
          ) {

            setLoading(
              false
            );

          }

        }

      }


      restoreSession();


      return () => {

        mounted =
          false;

      };

    },
    []
  );


  // ==========================================================
  // LOGIN
  // ==========================================================
  //
  // IMPORTANTE:
  //
  // services/api.js já chama setToken().
  //
  // Portanto o AuthContext NÃO grava o token novamente.
  //
  // ==========================================================

  const login =
    useCallback(
      async (
        email,
        senha
      ) => {

        const data =
          await loginApi(
            email,
            senha
          );


        const authenticatedUser =
          data?.usuario ||
          data?.user ||
          null;


        if (
          !data?.token
        ) {

          clearToken();

          throw new Error(
            "O servidor não retornou um token de autenticação."
          );

        }


        if (
          !authenticatedUser
        ) {

          clearToken();

          throw new Error(
            "O servidor não retornou os dados do usuário."
          );

        }


        setUsuario(
          authenticatedUser
        );


        return {
          ...data,

          usuario:
            authenticatedUser,

          user:
            authenticatedUser,
        };

      },
      []
    );


  // ==========================================================
  // LOGOUT
  // ==========================================================
  //
  // JWT é stateless no backend atual.
  //
  // Portanto o logout necessário neste momento é local:
  //
  // 1. apagar token
  // 2. apagar usuário do contexto
  //
  // Não chamamos POST /auth/logout porque essa rota ainda não
  // existe no backend atual.
  //
  // ==========================================================

  const logout =
    useCallback(
      () => {

        clearToken();

        setUsuario(
          null
        );

      },
      []
    );


  // ==========================================================
  // PERMISSÕES DO USUÁRIO
  // ==========================================================

  const permissions =
    useMemo(
      () => {

        return getUserPermissionSlugs(
          usuario
        );

      },
      [
        usuario,
      ]
    );


  // ==========================================================
  // SET DE PERMISSÕES
  // ==========================================================

  const permissionSet =
    useMemo(
      () => {

        return new Set(
          permissions
        );

      },
      [
        permissions,
      ]
    );


  // ==========================================================
  // TEM PERMISSÃO
  // ==========================================================

  const hasPermission =
    useCallback(
      (
        permission
      ) => {

        if (
          !permission
        ) {

          return false;

        }


        return permissionSet.has(
          permission
        );

      },
      [
        permissionSet,
      ]
    );


  // ==========================================================
  // TEM QUALQUER UMA
  // ==========================================================

  const hasAnyPermission =
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
            permissionSet.has(
              permission
            )
        );

      },
      [
        permissionSet,
      ]
    );


  // ==========================================================
  // TEM TODAS
  // ==========================================================

  const hasAllPermissions =
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
            permissionSet.has(
              permission
            )
        );

      },
      [
        permissionSet,
      ]
    );


  // ==========================================================
  // AUTENTICADO
  // ==========================================================

  const isAuthenticated =
    Boolean(
      usuario &&
      getToken()
    );


  // ==========================================================
  // VALUE
  // ==========================================================
  //
  // Mantemos:
  //
  // usuario
  //
  // e também:
  //
  // user
  //
  // porque alguns componentes convertidos usam uma forma e
  // outros ainda usam a outra.
  //
  // Posteriormente podemos padronizar tudo para `user`.
  //
  // ==========================================================

  const value =
    useMemo(
      () => ({

        // -----------------------------------------------------
        // USUÁRIO
        // -----------------------------------------------------

        usuario,

        user:
          usuario,


        // -----------------------------------------------------
        // ROLE
        // -----------------------------------------------------

        role:
          usuario?.role ||
          usuario?.Role ||
          null,


        // -----------------------------------------------------
        // PERMISSÕES
        // -----------------------------------------------------

        permissions,

        hasPermission,

        hasAnyPermission,

        hasAllPermissions,


        // -----------------------------------------------------
        // AUTENTICAÇÃO
        // -----------------------------------------------------

        login,

        logout,

        refreshUser,

        isAuthenticated,


        // -----------------------------------------------------
        // LOADING
        // -----------------------------------------------------

        loading,

        isLoadingAuth:
          loading,

      }),
      [
        usuario,
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        login,
        logout,
        refreshUser,
        isAuthenticated,
        loading,
      ]
    );


  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (

    <AuthContext.Provider
      value={
        value
      }
    >

      {children}

    </AuthContext.Provider>

  );

}


// ============================================================
// HOOK
// ============================================================

export function useAuth() {

  const context =
    useContext(
      AuthContext
    );


  if (
    !context
  ) {

    throw new Error(
      "useAuth deve ser utilizado dentro de <AuthProvider>."
    );

  }


  return context;

}


// ============================================================
// DEFAULT
// ============================================================

export default AuthContext;