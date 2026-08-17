// ============================================================
// HOOKS DE CONFIGURAÇÃO DO SISTEMA
// ============================================================
//
// Camada de compatibilidade com componentes que ainda utilizam
// os antigos helpers de configuração.
//
// ARQUITETURA ATUAL:
//
// Role
// Permission
// LinkCategory
// Department
// API Node/Express
// React Query
//
// IMPORTANTE:
//
// Este arquivo ainda possui consumidores indiretos no sistema.
//
// Portanto ele deve ser mantido enquanto concluímos a
// modernização dos componentes.
//
// A segurança real continua sendo controlada por:
//
// - Role
// - Permission
// - AuthContext
// - usePermissions
// - ProtectedRoute
// - middleware RBAC do backend
//
// ============================================================

import {
  useQuery,
} from "@tanstack/react-query";


// ============================================================
// API
// ============================================================

import {
  getRoles,
  getLinkCategories,
  getDepartments,
} from "../services/api";


// ============================================================
// CONFIGURAÇÕES DE ABAS
// ============================================================
//
// As abas são rotas do frontend.
//
// A visibilidade real das páginas é controlada pelo RBAC
// através das permissions.
//
// Esta estrutura continua existindo somente para componentes
// antigos que ainda utilizam useAbas().
//
// ============================================================

const DEFAULT_ABAS = [

  {
    id:
      "inicio",

    name:
      "INÍCIO",

    path:
      "/",

    permission:
      "visualizar_inicio",

    min_access_level:
      "publico",

    is_system:
      true,

    allowed_cargos:
      [],

    is_active:
      true,

    display_order:
      1,
  },


  {
    id:
      "membros",

    name:
      "MEMBROS",

    path:
      "/membros",

    permission:
      "visualizar_membros",

    min_access_level:
      "publico",

    is_system:
      false,

    allowed_cargos:
      [],

    is_active:
      true,

    display_order:
      2,
  },


  {
    id:
      "relacoes",

    name:
      "RELAÇÕES",

    path:
      "/relacoes",

    permission:
      "visualizar_relacoes",

    min_access_level:
      "membro",

    is_system:
      false,

    allowed_cargos:
      [],

    is_active:
      true,

    display_order:
      3,
  },


  {
    id:
      "galeria",

    name:
      "GALERIA",

    path:
      "/galeria",

    permission:
      "visualizar_galeria",

    min_access_level:
      "publico",

    is_system:
      false,

    allowed_cargos:
      [],

    is_active:
      true,

    display_order:
      4,
  },


  {
    id:
      "links",

    name:
      "LINKS",

    path:
      "/links",

    permission:
      "visualizar_links",

    min_access_level:
      "recruta",

    is_system:
      false,

    allowed_cargos:
      [],

    is_active:
      true,

    display_order:
      5,
  },


  {
    id:
      "administracao",

    name:
      "ADMINISTRAÇÃO",

    path:
      "/administracao",

    permission:
      "gerenciar_roles",

    min_access_level:
      "administrador",

    is_system:
      true,

    allowed_cargos:
      [],

    is_active:
      true,

    display_order:
      6,
  },

];


// ============================================================
// VISIBILIDADES
// ============================================================
//
// Não existe uma entidade específica de visibilidade no
// backend atual.
//
// Mantemos este fallback para compatibilidade.
//
// ============================================================

const DEFAULT_VISIBILIDADES = [

  {
    name:
      "Geral",

    display_order:
      1,

    is_active:
      true,
  },

];


// ============================================================
// ORDENAÇÃO DE ACESSO LEGADA
// ============================================================
//
// Mantida somente para compatibilidade com componentes que
// ainda utilizam:
//
// canSeeTab()
//
// A segurança real NÃO depende destes níveis.
//
// ============================================================

const TAB_LEVEL_ORDER = {

  publico:
    0,

  recruta:
    1,

  membro:
    2,

  gerencia:
    3,

  administrador:
    4,

  admin:
    4,

  sem_acesso:
    0,

};


// ============================================================
// NORMALIZA ROLE
// ============================================================

function getRoleData(
  role
) {

  return {

    id:
      role?.id,

    name:
      role?.nome ||
      role?.name ||
      role?.slug ||
      "",

    nome:
      role?.nome ||
      role?.name ||
      role?.slug ||
      "",

    slug:
      role?.slug ||
      "",

    tier:
      role?.tierLevel ??
      role?.tier_level ??
      5,

    tier_level:
      role?.tierLevel ??
      role?.tier_level ??
      5,

    hierarchy_order:
      role?.hierarchyOrder ??
      role?.hierarchy_order ??
      99,

    hierarchyOrder:
      role?.hierarchyOrder ??
      role?.hierarchy_order ??
      99,

    display_order:
      role?.hierarchyOrder ??
      role?.hierarchy_order ??
      99,

    is_system:
      Boolean(
        role?.isSystem ??
        role?.is_system
      ),

    descricao:
      role?.descricao ||
      role?.description ||
      "",

  };

}


// ============================================================
// NORMALIZA CATEGORIA
// ============================================================

function getCategoryName(
  category
) {

  return (
    category?.name ||
    category?.nome ||
    ""
  );

}


// ============================================================
// NORMALIZA DEPARTAMENTO
// ============================================================

function getDepartmentName(
  department
) {

  return (
    department?.name ||
    department?.nome ||
    ""
  );

}


// ============================================================
// ROLE -> NÍVEL LEGADO
// ============================================================
//
// Converte o RBAC atual para o formato esperado por alguns
// componentes antigos.
//
// ============================================================

function roleToAccessLevel(
  role
) {

  const slug =
    role?.slug ||
    "";


  switch (
    slug
  ) {

    case "administrador":

      return "administrador";


    case "lideranca":

      return "gerencia";


    case "membro":

      return "membro";


    case "sem_acesso":

      return "sem_acesso";


    default:

      return "membro";

  }

}


// ============================================================
// useSystemConfigs
// ============================================================
//
// Mantido para compatibilidade.
//
// Para:
//
// - aba
// - visibilidade
//
// utilizamos configuração local.
//
// ============================================================

export function useSystemConfigs(
  configType
) {

  const isSupportedFallback =
    configType ===
      "aba" ||
    configType ===
      "visibilidade";


  return {

    items:
      isSupportedFallback

        ? (
          configType ===
          "aba"

            ? DEFAULT_ABAS

            : DEFAULT_VISIBILIDADES
        )

        : [],

    isLoading:
      false,

  };

}


// ============================================================
// CARGOS
// ============================================================
//
// Fonte:
//
// GET /api/admin/roles
//
// Backend:
//
// Role
//
// Mantemos também aliases necessários para componentes ainda
// não totalmente migrados.
//
// ============================================================

export function useCargos() {

  const {
    data: roles = [],
    isLoading,
    isError,
  } =
    useQuery({

      queryKey:
        [
          "roles",
        ],

      queryFn:
        getRoles,

    });


  const cargos = [

    ...roles

      .map(
        getRoleData
      )

      .filter(
        (
          cargo
        ) =>
          cargo.slug !==
          "sem_acesso"
      )

  ].sort(
    (
      a,
      b
    ) => (

      (
        a.hierarchy_order ??
        99
      ) -

      (
        b.hierarchy_order ??
        99
      )

      ||

      (
        a.display_order ??
        99
      ) -

      (
        b.display_order ??
        99
      )

    )
  );


  return {

    cargos,

    isLoading,

    isError,

  };

}


// ============================================================
// CATEGORIAS
// ============================================================
//
// Fonte:
//
// GET /api/links/categories
//
// ============================================================

export function useCategorias() {

  const {
    data: categories = [],
    isLoading,
    isError,
  } =
    useQuery({

      queryKey:
        [
          "link-categories",
        ],

      queryFn:
        getLinkCategories,

    });


  const categorias =

    categories

      .map(
        getCategoryName
      )

      .filter(
        Boolean
      );


  return {

    categorias,

    isLoading,

    isError,

  };

}


// ============================================================
// DEPARTAMENTOS
// ============================================================
//
// Fonte:
//
// API administrativa de departamentos.
//
// Enquanto componentes antigos ainda dependerem desse helper,
// mantemos fallback de lista vazia caso a consulta falhe.
//
// ============================================================

export function useDepartamentos() {

  const {
    data: departments = [],
    isLoading,
    isError,
  } =
    useQuery({

      queryKey:
        [
          "departments",
        ],

      queryFn:
        async () => {

          try {

            return await getDepartments();

          } catch (
            error
          ) {

            console.error(
              "[useDepartamentos] erro:",
              error
            );


            return [];

          }

        },

    });


  const departamentos =

    departments

      .map(
        getDepartmentName
      )

      .filter(
        Boolean
      );


  return {

    departamentos,

    isLoading,

    isError,

  };

}


// ============================================================
// VISIBILIDADES
// ============================================================

export function useVisibilidades() {

  return {

    visibilidades:
      DEFAULT_VISIBILIDADES

        .filter(
          (
            item
          ) =>
            item.is_active !==
            false
        )

        .map(
          (
            item
          ) =>
            item.name
        ),

    isLoading:
      false,

    isError:
      false,

  };

}


// ============================================================
// ABAS
// ============================================================
//
// As abas são derivadas das rotas oficiais do frontend.
//
// A autorização real deve continuar sendo feita através do
// sistema de permissions.
//
// ============================================================

export function useAbas() {

  return {

    abas:
      DEFAULT_ABAS,

    isLoading:
      false,

    isError:
      false,

  };

}


// ============================================================
// CAN SEE TAB
// ============================================================
//
// Mantido somente para compatibilidade.
//
// Componentes novos devem utilizar:
//
// can("permissao")
//
// ou:
//
// canAny([...])
//
// ============================================================

export function canSeeTab(
  minAccessLevel,
  level,
  allowedCargos = [],
  userCargo
) {

  // ==========================================================
  // RESTRIÇÃO EXPLÍCITA POR CARGO
  // ==========================================================

  if (

    Array.isArray(
      allowedCargos
    ) &&

    allowedCargos.length >
      0

  ) {

    if (
      !userCargo
    ) {

      return false;

    }


    const normalizedUserCargo =
      String(
        userCargo
      )
        .trim()
        .toLowerCase();


    const allowed =
      allowedCargos.map(
        (
          cargo
        ) =>
          String(
            cargo
          )
            .trim()
            .toLowerCase()
      );


    if (
      !allowed.includes(
        normalizedUserCargo
      )
    ) {

      return false;

    }

  }


  // ==========================================================
  // NÍVEIS
  // ==========================================================

  const required =
    TAB_LEVEL_ORDER[
      minAccessLevel
    ] ??
    0;


  const have =
    TAB_LEVEL_ORDER[
      level
    ] ??
    0;


  return (
    have >=
    required
  );

}


// ============================================================
// HELPERS DE COMPATIBILIDADE
// ============================================================

export function getAccessLevelFromRole(
  role
) {

  return roleToAccessLevel(
    role
  );

}


export function hasRoleAccess(
  role,
  minimumLevel
) {

  const level =
    roleToAccessLevel(
      role
    );


  return canSeeTab(
    minimumLevel,
    level,
    [],
    null
  );

}


// ============================================================
// EXPORT DEFAULT
// ============================================================

export default {

  useSystemConfigs,

  useCargos,

  useCategorias,

  useDepartamentos,

  useVisibilidades,

  useAbas,

  canSeeTab,

  getAccessLevelFromRole,

  hasRoleAccess,

};