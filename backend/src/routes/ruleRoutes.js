// ============================================================
// ROTAS DE REGRAS
// ============================================================
//
// Segurança:
//
// Request
//   ↓
// authMiddleware
//   ↓
// permissionMiddleware
//   ↓
// ruleController
//
// PERMISSÕES:
//
// visualizar_regras
// → pode consultar regras autorizadas para seu cargo
//
// gerenciar_regras
// → pode consultar todas, criar, editar e excluir
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
  listar,
  criar,
  atualizar,
  excluir,
} =
  require(
    "../controllers/ruleController"
  );


// ============================================================
// ROUTER
// ============================================================

const router =
  express.Router();


// ============================================================
// LISTAR
// ============================================================
//
// GET /api/rules
//
// visualizar_regras
// OU
// gerenciar_regras
//
// O controller decide:
//
// gerenciar_regras
// → todas
//
// somente visualizar_regras
// → aplica Rule.allowedRoles
//
// ============================================================

router.get(

  "/",

  authMiddleware,

  exigirAlgumaPermissao([
    "visualizar_regras",
    "gerenciar_regras",
  ]),

  listar

);


// ============================================================
// CRIAR
// ============================================================
//
// POST /api/rules
//
// ============================================================

router.post(

  "/",

  authMiddleware,

  exigirPermissao(
    "gerenciar_regras"
  ),

  criar

);


// ============================================================
// ATUALIZAR
// ============================================================
//
// PUT /api/rules/:id
//
// ============================================================

router.put(

  "/:id",

  authMiddleware,

  exigirPermissao(
    "gerenciar_regras"
  ),

  atualizar

);


// ============================================================
// EXCLUIR
// ============================================================
//
// DELETE /api/rules/:id
//
// ============================================================

router.delete(

  "/:id",

  authMiddleware,

  exigirPermissao(
    "gerenciar_regras"
  ),

  excluir

);


// ============================================================
// EXPORT
// ============================================================

module.exports =
  router;