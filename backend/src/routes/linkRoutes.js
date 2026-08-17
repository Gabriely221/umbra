// ============================================================
// ROTAS DE LINKS
// ============================================================
//
// Centraliza:
//
// - links
// - categorias
// - vínculos diretos Usuario <-> Link
//
// SEGURANÇA:
//
// Request
//   ↓
// authMiddleware
//   ↓
// permissionMiddleware
//   ↓
// linkController
//
// IMPORTANTE:
//
// Rotas específicas como:
//
// /user-links
// /categories
//
// devem ficar ANTES de:
//
// /:id
//
// ============================================================


// ============================================================
// EXPRESS
// ============================================================

const express =
  require(
    "express"
  );


// ============================================================
// AUTH
// ============================================================

const authMiddleware =
  require(
    "../middleware/authMiddleware"
  );


// ============================================================
// RBAC
// ============================================================

const permissionMiddleware =
  require(
    "../middleware/permissionMiddleware"
  );


const exigirPermissao =
  permissionMiddleware;


const {
  exigirAlgumaPermissao,
} =
  permissionMiddleware;


// ============================================================
// CONTROLLER
// ============================================================

const {

  // ----------------------------------------------------------
  // LINKS
  // ----------------------------------------------------------

  listar,
  criar,
  atualizar,
  excluir,


  // ----------------------------------------------------------
  // CATEGORIAS
  // ----------------------------------------------------------

  listarCategorias,
  criarCategoria,
  atualizarCategoria,
  excluirCategoria,


  // ----------------------------------------------------------
  // USER LINKS
  // ----------------------------------------------------------

  listarUserLinks,
  atribuirUserLink,
  removerUserLink,

} =
  require(
    "../controllers/linkController"
  );


// ============================================================
// ROUTER
// ============================================================

const router =
  express.Router();


// ============================================================
// USER LINKS
// ============================================================
//
// IMPORTANTE:
//
// Estas rotas precisam ficar antes de /:id.
//
// ============================================================


// ============================================================
// LISTAR USER LINKS
// ============================================================
//
// GET /api/links/user-links
//
// GET /api/links/user-links?usuarioId=10
//
// Casos permitidos:
//
// visualizar_links
// → usuário pode consultar os próprios vínculos
//
// gerenciar_usuarios
// → pode consultar vínculos de usuários administrados
//
// gerenciar_links
// → pode consultar vínculos para administrar links
//
// O controller ainda verifica se o usuário pode consultar
// outro Usuario.id.
//
// ============================================================

router.get(

  "/user-links",

  authMiddleware,

  exigirAlgumaPermissao([
    "visualizar_links",
    "gerenciar_usuarios",
    "gerenciar_links",
  ]),

  listarUserLinks

);


// ============================================================
// ATRIBUIR USER LINK
// ============================================================
//
// POST /api/links/user-links
//
// Body:
//
// {
//   "usuarioId": 10,
//   "linkId": 5
// }
//
// Pode ser executado por:
//
// gerenciar_usuarios
// OU
// gerenciar_links
//
// ============================================================

router.post(

  "/user-links",

  authMiddleware,

  exigirAlgumaPermissao([
    "gerenciar_usuarios",
    "gerenciar_links",
  ]),

  atribuirUserLink

);


// ============================================================
// REMOVER USER LINK
// ============================================================
//
// DELETE /api/links/user-links/:usuarioId/:linkId
//
// Pode ser executado por:
//
// gerenciar_usuarios
// OU
// gerenciar_links
//
// ============================================================

router.delete(

  "/user-links/:usuarioId/:linkId",

  authMiddleware,

  exigirAlgumaPermissao([
    "gerenciar_usuarios",
    "gerenciar_links",
  ]),

  removerUserLink

);


// ============================================================
// CATEGORIAS
// ============================================================
//
// Também precisam ficar antes de /:id.
//
// ============================================================


// ============================================================
// LISTAR CATEGORIAS
// ============================================================
//
// GET /api/links/categories
//
// Quem visualiza links precisa das categorias para montar
// a interface.
//
// Quem gerencia links também precisa carregar o catálogo,
// mesmo que uma Role customizada não possua visualizar_links.
//
// ============================================================

router.get(

  "/categories",

  authMiddleware,

  exigirAlgumaPermissao([
    "visualizar_links",
    "gerenciar_links",
  ]),

  listarCategorias

);


// ============================================================
// CRIAR CATEGORIA
// ============================================================

router.post(

  "/categories",

  authMiddleware,

  exigirPermissao(
    "gerenciar_links"
  ),

  criarCategoria

);


// ============================================================
// ATUALIZAR CATEGORIA
// ============================================================

router.put(

  "/categories/:id",

  authMiddleware,

  exigirPermissao(
    "gerenciar_links"
  ),

  atualizarCategoria

);


// ============================================================
// EXCLUIR CATEGORIA
// ============================================================

router.delete(

  "/categories/:id",

  authMiddleware,

  exigirPermissao(
    "gerenciar_links"
  ),

  excluirCategoria

);


// ============================================================
// LINKS
// ============================================================


// ============================================================
// LISTAR LINKS
// ============================================================
//
// GET /api/links
//
// Usuário comum:
//
// visualizar_links
//
// Administrador de links:
//
// gerenciar_links
//
// O controller diferencia os comportamentos:
//
// visualizar_links
//   → somente links ativos autorizados
//
// gerenciar_links
//   → todos os links, inclusive inativos
//
// ============================================================

router.get(

  "/",

  authMiddleware,

  exigirAlgumaPermissao([
    "visualizar_links",
    "gerenciar_links",
  ]),

  listar

);


// ============================================================
// CRIAR LINK
// ============================================================
//
// POST /api/links
//
// ============================================================

router.post(

  "/",

  authMiddleware,

  exigirPermissao(
    "gerenciar_links"
  ),

  criar

);


// ============================================================
// ATUALIZAR LINK
// ============================================================
//
// PUT /api/links/:id
//
// ============================================================

router.put(

  "/:id",

  authMiddleware,

  exigirPermissao(
    "gerenciar_links"
  ),

  atualizar

);


// ============================================================
// EXCLUIR LINK
// ============================================================
//
// DELETE /api/links/:id
//
// ============================================================

router.delete(

  "/:id",

  authMiddleware,

  exigirPermissao(
    "gerenciar_links"
  ),

  excluir

);


// ============================================================
// EXPORT
// ============================================================

module.exports =
  router;