// ============================================================
// API CLIENT - CARTELHUB
// ============================================================
//
// Camada central de comunicação:
//
// React
//   ↓
// services/api.js
//   ↓
// HTTP + JWT
//   ↓
// Express
//   ↓
// RBAC
//   ↓
// Controllers
//   ↓
// Sequelize
//   ↓
// MySQL
//
// Nenhum componente deve utilizar fetch() diretamente.
//
// ============================================================


// ============================================================
// CONFIGURAÇÃO
// ============================================================

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api"
).replace(
  /\/$/,
  ""
);


// ============================================================
// JWT
// ============================================================

const TOKEN_KEY =
  "cartelhub_token";


// ============================================================
// GET TOKEN
// ============================================================

export function getToken() {

  return localStorage.getItem(
    TOKEN_KEY
  );

}


// ============================================================
// SET TOKEN
// ============================================================

export function setToken(
  token
) {

  if (
    !token
  ) {

    localStorage.removeItem(
      TOKEN_KEY
    );

    return;

  }


  localStorage.setItem(
    TOKEN_KEY,
    token
  );

}


// ============================================================
// CLEAR TOKEN
// ============================================================

export function clearToken() {

  localStorage.removeItem(
    TOKEN_KEY
  );

}


// ============================================================
// REQUEST PRINCIPAL
// ============================================================

export async function request(
  endpoint,
  options = {}
) {

  // ==========================================================
  // URL
  // ==========================================================

  const normalizedEndpoint =
    endpoint.startsWith(
      "/"
    )
      ? endpoint
      : `/${endpoint}`;


  const url =
    `${API_URL}${normalizedEndpoint}`;


  // ==========================================================
  // HEADERS
  // ==========================================================

  const token =
    getToken();


  const headers =
    new Headers(
      options.headers ||
      {}
    );


  const isFormData =
    typeof FormData !==
      "undefined" &&
    options.body instanceof
      FormData;


  // ----------------------------------------------------------
  // JSON
  // ----------------------------------------------------------

  if (
    options.body &&
    !isFormData &&
    !headers.has(
      "Content-Type"
    )
  ) {

    headers.set(
      "Content-Type",
      "application/json"
    );

  }


  // ----------------------------------------------------------
  // JWT
  // ----------------------------------------------------------

  if (
    token
  ) {

    headers.set(
      "Authorization",
      `Bearer ${token}`
    );

  }


  // ==========================================================
  // FETCH
  // ==========================================================

  let response;


  try {

    response =
      await fetch(
        url,
        {
          ...options,
          headers,
        }
      );

  } catch (
    cause
  ) {

    const error =
      new Error(
        "Não foi possível conectar ao servidor."
      );


    error.cause =
      cause;


    throw error;

  }


  // ==========================================================
  // BODY DA RESPOSTA
  // ==========================================================

  let data =
    null;


  // ----------------------------------------------------------
  // 204 = sem conteúdo
  // ----------------------------------------------------------

  if (
    response.status !==
    204
  ) {

    const contentType =
      response.headers.get(
        "content-type"
      );


    if (
      contentType?.includes(
        "application/json"
      )
    ) {

      try {

        data =
          await response.json();

      } catch {

        data =
          null;

      }

    } else {

      const text =
        await response.text();


      data =
        text ||
        null;

    }

  }


  // ==========================================================
  // ERROS HTTP
  // ==========================================================

  if (
    !response.ok
  ) {

    // --------------------------------------------------------
    // JWT inválido / expirado
    // --------------------------------------------------------

    if (
      response.status ===
      401
    ) {

      clearToken();

    }


    const message =

      (
        typeof data ===
          "object" &&
        data
      )

        ? (
            data.message ||
            data.error ||
            `Erro HTTP ${response.status}`
          )

        : (
            data ||
            `Erro HTTP ${response.status}`
          );


    const error =
      new Error(
        message
      );


    error.status =
      response.status;


    error.data =
      data;


    error.url =
      url;


    throw error;

  }


  return data;

}


// ============================================================
// HELPERS
// ============================================================

function requireId(
  value,
  label = "ID"
) {

  if (
    value ===
      undefined ||
    value ===
      null ||
    value ===
      ""
  ) {

    throw new Error(
      `${label} é obrigatório.`
    );

  }


  return value;

}


// ============================================================
// AUTH
// ============================================================


// ------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------

export async function login(
  email,
  senha
) {

  const data =
    await request(
      "/auth/login",
      {
        method:
          "POST",

        body:
          JSON.stringify({
            email:
              String(
                email ||
                ""
              )
                .trim()
                .toLowerCase(),

            senha,
          }),
      }
    );


  const token =
    data?.token ||
    data?.accessToken ||
    null;


  if (
    !token
  ) {

    clearToken();


    throw new Error(
      "O servidor não retornou um token de autenticação."
    );

  }


  setToken(
    token
  );


  return data;

}


// ------------------------------------------------------------
// CADASTRO
// ------------------------------------------------------------

export async function register(
  data
) {

  return request(
    "/auth/register",
    {
      method:
        "POST",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


// ------------------------------------------------------------
// USUÁRIO ATUAL
// ------------------------------------------------------------

export async function getCurrentUser() {

  return request(
    "/auth/me"
  );

}


// ------------------------------------------------------------
// LOGOUT
// ------------------------------------------------------------
//
// O backend atual utiliza JWT stateless e não possui
// POST /auth/logout.
//
// Portanto logout é local.
//
// ============================================================

export function logout() {

  clearToken();

}


// ============================================================
// HOME
// ============================================================
//
// GET /api/home/stats
//
// RBAC:
//
// visualizar_inicio
//
// Retorno:
//
// {
//   activeMembers: 12,
//   linkCount: 8
// }
//
// A Home utiliza este endpoint em vez de baixar coleções
// completas de membros e links apenas para calcular totais.
//
// ============================================================

export async function getHomeStats() {

  const response =
    await request(
      "/home/stats"
    );


  const activeMembers =
    Number(
      response?.activeMembers
    );


  const linkCount =
    Number(
      response?.linkCount
    );


  return {

    activeMembers:
      Number.isFinite(
        activeMembers
      )
        ? activeMembers
        : 0,

    linkCount:
      Number.isFinite(
        linkCount
      )
        ? linkCount
        : 0,

  };

}


// ============================================================
// USUÁRIOS
// ============================================================

export async function getUsuarios() {

  const response =
    await request(
      "/admin/usuarios"
    );


  return (
    response?.usuarios ||
    response ||
    []
  );

}


export const getUsers =
  getUsuarios;


// ------------------------------------------------------------
// ATUALIZAR USUÁRIO
// ------------------------------------------------------------
//
// PATCH /api/admin/usuarios/:id
//
// :id = Usuario.id
//
// ------------------------------------------------------------

export async function updateUser(
  userId,
  data
) {

  requireId(
    userId,
    "ID do usuário"
  );


  return request(
    `/admin/usuarios/${encodeURIComponent(
      userId
    )}`,
    {
      method:
        "PATCH",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


// ------------------------------------------------------------
// ALTERAR ROLE
// ------------------------------------------------------------

export async function updateUserRole(
  userId,
  roleId
) {

  requireId(
    userId,
    "ID do usuário"
  );


  requireId(
    roleId,
    "ID do cargo"
  );


  return request(
    `/admin/usuarios/${encodeURIComponent(
      userId
    )}/role`,
    {
      method:
        "PATCH",

      body:
        JSON.stringify({
          roleId:
            Number(
              roleId
            ),
        }),
    }
  );

}


// ------------------------------------------------------------
// ALTERAR STATUS DA CONTA
// ------------------------------------------------------------

export async function updateUserStatus(
  userId,
  ativo
) {

  requireId(
    userId,
    "ID do usuário"
  );


  if (
    typeof ativo !==
    "boolean"
  ) {

    throw new Error(
      'O campo "ativo" deve ser booleano.'
    );

  }


  return request(
    `/admin/usuarios/${encodeURIComponent(
      userId
    )}/status`,
    {
      method:
        "PATCH",

      body:
        JSON.stringify({
          ativo,
        }),
    }
  );

}


// ------------------------------------------------------------
// EXCLUIR USUÁRIO
// ------------------------------------------------------------

export async function deleteUser(
  userId
) {

  requireId(
    userId,
    "ID do usuário"
  );


  return request(
    `/admin/usuarios/${encodeURIComponent(
      userId
    )}`,
    {
      method:
        "DELETE",
    }
  );

}


// ============================================================
// RBAC
// ============================================================


// ------------------------------------------------------------
// PERMISSÕES
// ------------------------------------------------------------

export async function getPermissions() {

  const response =
    await request(
      "/admin/permissions"
    );


  return (
    response?.permissions ||
    response ||
    []
  );

}


// ------------------------------------------------------------
// ROLES
// ------------------------------------------------------------

export async function getRoles() {

  const response =
    await request(
      "/admin/roles"
    );


  return (
    response?.roles ||
    response ||
    []
  );

}


export async function createRole(
  data
) {

  return request(
    "/admin/roles",
    {
      method:
        "POST",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


export async function updateRole(
  id,
  data
) {

  requireId(
    id,
    "ID do cargo"
  );


  return request(
    `/admin/roles/${encodeURIComponent(
      id
    )}`,
    {
      method:
        "PUT",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


// ============================================================
// DEPARTAMENTOS
// ============================================================


// ------------------------------------------------------------
// LISTAR
// ------------------------------------------------------------
//
// GET /api/admin/departamentos
//
// ------------------------------------------------------------

export async function getDepartments() {

  const response =
    await request(
      "/admin/departamentos"
    );


  return (
    response?.departments ||
    response?.departamentos ||
    response ||
    []
  );

}


// ------------------------------------------------------------
// CRIAR
// ------------------------------------------------------------

export async function createDepartment(
  data
) {

  return request(
    "/admin/departamentos",
    {
      method:
        "POST",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


// ------------------------------------------------------------
// ATUALIZAR
// ------------------------------------------------------------

export async function updateDepartment(
  id,
  data
) {

  requireId(
    id,
    "ID do departamento"
  );


  return request(
    `/admin/departamentos/${encodeURIComponent(
      id
    )}`,
    {
      method:
        "PUT",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


// ------------------------------------------------------------
// EXCLUIR
// ------------------------------------------------------------

export async function deleteDepartment(
  id
) {

  requireId(
    id,
    "ID do departamento"
  );


  return request(
    `/admin/departamentos/${encodeURIComponent(
      id
    )}`,
    {
      method:
        "DELETE",
    }
  );

}


// ============================================================
// MEMBROS
// ============================================================

export async function getMembros() {

  const response =
    await request(
      "/membros"
    );


  return (
    response?.membros ||
    response ||
    []
  );

}


export const getMembers =
  getMembros;


// ------------------------------------------------------------
// ATUALIZAR MEMBRO
// ------------------------------------------------------------
//
// :id = Membro.id
//
// NÃO Usuario.id.
//
// ------------------------------------------------------------

export async function updateMembro(
  id,
  data
) {

  requireId(
    id,
    "ID do membro"
  );


  return request(
    `/membros/${encodeURIComponent(
      id
    )}`,
    {
      method:
        "PUT",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


// ============================================================
// LINKS
// ============================================================

export async function getLinks() {

  const response =
    await request(
      "/links"
    );


  return (
    response?.links ||
    response ||
    []
  );

}


export async function createLink(
  data
) {

  return request(
    "/links",
    {
      method:
        "POST",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


export async function updateLink(
  id,
  data
) {

  requireId(
    id,
    "ID do link"
  );


  return request(
    `/links/${encodeURIComponent(
      id
    )}`,
    {
      method:
        "PUT",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


export async function deleteLink(
  id
) {

  requireId(
    id,
    "ID do link"
  );


  return request(
    `/links/${encodeURIComponent(
      id
    )}`,
    {
      method:
        "DELETE",
    }
  );

}


// ============================================================
// CATEGORIAS DE LINKS
// ============================================================

export async function getLinkCategories() {

  const response =
    await request(
      "/links/categories"
    );


  return (
    response?.categories ||
    response ||
    []
  );

}


export async function createLinkCategory(
  data
) {

  return request(
    "/links/categories",
    {
      method:
        "POST",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


export async function updateLinkCategory(
  id,
  data
) {

  requireId(
    id,
    "ID da categoria"
  );


  return request(
    `/links/categories/${encodeURIComponent(
      id
    )}`,
    {
      method:
        "PUT",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


export async function deleteLinkCategory(
  id
) {

  requireId(
    id,
    "ID da categoria"
  );


  return request(
    `/links/categories/${encodeURIComponent(
      id
    )}`,
    {
      method:
        "DELETE",
    }
  );

}


// ============================================================
// USER LINKS
// ============================================================

export async function getUserLinks(
  userId
) {

  const query =
    userId

      ? `?usuarioId=${encodeURIComponent(
          userId
        )}`

      : "";


  const response =
    await request(
      `/links/user-links${query}`
    );


  return (
    response?.userLinks ||
    response?.user_links ||
    response ||
    []
  );

}


export async function assignUserLink(
  usuarioId,
  linkId
) {

  requireId(
    usuarioId,
    "ID do usuário"
  );


  requireId(
    linkId,
    "ID do link"
  );


  return request(
    "/links/user-links",
    {
      method:
        "POST",

      body:
        JSON.stringify({

          usuarioId:
            Number(
              usuarioId
            ),

          linkId:
            Number(
              linkId
            ),

        }),
    }
  );

}


export async function removeUserLink(
  usuarioId,
  linkId
) {

  requireId(
    usuarioId,
    "ID do usuário"
  );


  requireId(
    linkId,
    "ID do link"
  );


  return request(
    `/links/user-links/${encodeURIComponent(
      usuarioId
    )}/${encodeURIComponent(
      linkId
    )}`,
    {
      method:
        "DELETE",
    }
  );

}


// ============================================================
// UPLOAD
// ============================================================

export async function uploadFile(
  file,
  folder = "gallery"
) {

  if (
    !file
  ) {

    throw new Error(
      "Nenhum arquivo foi informado."
    );

  }


  const formData =
    new FormData();


  formData.append(
    "file",
    file
  );


  formData.append(
    "folder",
    folder
  );


  return request(
    "/gallery/upload",
    {
      method:
        "POST",

      body:
        formData,
    }
  );

}


// ============================================================
// GALERIA
// ============================================================

export async function getGallery() {

  const response =
    await request(
      "/gallery"
    );


  return (
    response?.items ||
    response?.gallery ||
    response ||
    []
  );

}


export async function createGalleryItem(
  data
) {

  return request(
    "/gallery",
    {
      method:
        "POST",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


export async function updateGalleryItem(
  id,
  data
) {

  requireId(
    id,
    "ID do item da galeria"
  );


  return request(
    `/gallery/${encodeURIComponent(
      id
    )}`,
    {
      method:
        "PUT",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


export async function deleteGalleryItem(
  id
) {

  requireId(
    id,
    "ID do item da galeria"
  );


  return request(
    `/gallery/${encodeURIComponent(
      id
    )}`,
    {
      method:
        "DELETE",
    }
  );

}


// ============================================================
// ORGANIZAÇÕES
// ============================================================

export async function getOrganizations() {

  const response =
    await request(
      "/organizations"
    );


  return (
    response?.organizations ||
    response ||
    []
  );

}


export async function getOrganization(
  id
) {

  requireId(
    id,
    "ID da organização"
  );


  return request(
    `/organizations/${encodeURIComponent(
      id
    )}`
  );

}


export async function createOrganization(
  data
) {

  return request(
    "/organizations",
    {
      method:
        "POST",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


export async function updateOrganization(
  id,
  data
) {

  requireId(
    id,
    "ID da organização"
  );


  return request(
    `/organizations/${encodeURIComponent(
      id
    )}`,
    {
      method:
        "PUT",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


export async function deleteOrganization(
  id
) {

  requireId(
    id,
    "ID da organização"
  );


  return request(
    `/organizations/${encodeURIComponent(
      id
    )}`,
    {
      method:
        "DELETE",
    }
  );

}


// ============================================================
// USUÁRIOS RESPONSÁVEIS DAS NEGOCIAÇÕES
// ============================================================

export async function getOrganizationResponsibleUsers() {

  const response =
    await request(
      "/organizations/responsible-users"
    );


  return (
    response?.users ||
    response?.usuarios ||
    response ||
    []
  );

}


// ============================================================
// HISTÓRICO DA ORGANIZAÇÃO
// ============================================================

export async function getOrganizationHistory(
  organizationId
) {

  requireId(
    organizationId,
    "ID da organização"
  );


  const response =
    await request(
      `/organizations/${encodeURIComponent(
        organizationId
      )}/history`
    );


  return (
    response?.history ||
    response?.events ||
    response ||
    []
  );

}


export async function createOrganizationHistory(
  organizationId,
  data
) {

  requireId(
    organizationId,
    "ID da organização"
  );


  return request(
    `/organizations/${encodeURIComponent(
      organizationId
    )}/history`,
    {
      method:
        "POST",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


export async function updateOrganizationHistory(
  organizationId,
  historyId,
  data
) {

  requireId(
    organizationId,
    "ID da organização"
  );


  requireId(
    historyId,
    "ID do histórico"
  );


  return request(
    `/organizations/${encodeURIComponent(
      organizationId
    )}/history/${encodeURIComponent(
      historyId
    )}`,
    {
      method:
        "PUT",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


export async function deleteOrganizationHistory(
  organizationId,
  historyId
) {

  requireId(
    organizationId,
    "ID da organização"
  );


  requireId(
    historyId,
    "ID do histórico"
  );


  return request(
    `/organizations/${encodeURIComponent(
      organizationId
    )}/history/${encodeURIComponent(
      historyId
    )}`,
    {
      method:
        "DELETE",
    }
  );

}


// ============================================================
// NEGOCIAÇÕES
// ============================================================

export async function getOrganizationNegotiations(
  organizationId
) {

  requireId(
    organizationId,
    "ID da organização"
  );


  const response =
    await request(
      `/organizations/${encodeURIComponent(
        organizationId
      )}/negotiations`
    );


  return (
    response?.negotiations ||
    response ||
    []
  );

}


export async function createOrganizationNegotiation(
  organizationId,
  data
) {

  requireId(
    organizationId,
    "ID da organização"
  );


  return request(
    `/organizations/${encodeURIComponent(
      organizationId
    )}/negotiations`,
    {
      method:
        "POST",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


export async function updateOrganizationNegotiation(
  organizationId,
  negotiationId,
  data
) {

  requireId(
    organizationId,
    "ID da organização"
  );


  requireId(
    negotiationId,
    "ID da negociação"
  );


  return request(
    `/organizations/${encodeURIComponent(
      organizationId
    )}/negotiations/${encodeURIComponent(
      negotiationId
    )}`,
    {
      method:
        "PUT",

      body:
        JSON.stringify(
          data
        ),
    }
  );

}


export async function deleteOrganizationNegotiation(
  organizationId,
  negotiationId
) {

  requireId(
    organizationId,
    "ID da organização"
  );


  requireId(
    negotiationId,
    "ID da negociação"
  );


  return request(
    `/organizations/${encodeURIComponent(
      organizationId
    )}/negotiations/${encodeURIComponent(
      negotiationId
    )}`,
    {
      method:
        "DELETE",
    }
  );

}


// ============================================================
// EXPORT DEFAULT
// ============================================================

const api = {

  // ----------------------------------------------------------
  // CORE
  // ----------------------------------------------------------

  request,

  getToken,
  setToken,
  clearToken,


  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------

  login,
  register,
  getCurrentUser,
  logout,


  // ----------------------------------------------------------
  // HOME
  // ----------------------------------------------------------

  getHomeStats,


  // ----------------------------------------------------------
  // USUÁRIOS
  // ----------------------------------------------------------

  getUsuarios,
  getUsers,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,


  // ----------------------------------------------------------
  // RBAC
  // ----------------------------------------------------------

  getPermissions,
  getRoles,
  createRole,
  updateRole,


  // ----------------------------------------------------------
  // DEPARTAMENTOS
  // ----------------------------------------------------------

  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,


  // ----------------------------------------------------------
  // MEMBROS
  // ----------------------------------------------------------

  getMembros,
  getMembers,
  updateMembro,


  // ----------------------------------------------------------
  // LINKS
  // ----------------------------------------------------------

  getLinks,
  createLink,
  updateLink,
  deleteLink,

  getLinkCategories,
  createLinkCategory,
  updateLinkCategory,
  deleteLinkCategory,

  getUserLinks,
  assignUserLink,
  removeUserLink,


  // ----------------------------------------------------------
  // UPLOAD / GALERIA
  // ----------------------------------------------------------

  uploadFile,

  getGallery,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,


  // ----------------------------------------------------------
  // ORGANIZAÇÕES
  // ----------------------------------------------------------

  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,

  getOrganizationResponsibleUsers,

  getOrganizationHistory,
  createOrganizationHistory,
  updateOrganizationHistory,
  deleteOrganizationHistory,

  getOrganizationNegotiations,
  createOrganizationNegotiation,
  updateOrganizationNegotiation,
  deleteOrganizationNegotiation,

};


export default api;