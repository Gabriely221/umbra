// ============================================================
// ROTAS DA HOME
// ============================================================
//
// Base registrada no server:
//
// /api/home
//
// Endpoint:
//
// GET /api/home/stats
//
// AUTORIZAÇÃO:
//
// - usuário autenticado
// - visualizar_inicio
//
// IMPORTANTE:
//
// A Home possui um endpoint próprio de estatísticas.
//
// Portanto NÃO é necessário conceder:
//
// - visualizar_membros
// - visualizar_links
//
// apenas para que o usuário consiga visualizar os números da
// página inicial.
//
// ============================================================


// ============================================================
// EXPRESS
// ============================================================

const express =
  require(
    "express"
  );


const router =
  express.Router();


// ============================================================
// CONTROLLER
// ============================================================

const {
  stats,
} =
  require(
    "../controllers/homeController"
  );


// ============================================================
// AUTENTICAÇÃO
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


// ============================================================
// ESTATÍSTICAS DA HOME
// ============================================================
//
// GET /api/home/stats
//
// Retorno:
//
// {
//   activeMembers: 12,
//   linkCount: 8
// }
//
// ============================================================

router.get(

  "/stats",

  authMiddleware,

  exigirPermissao(
    "visualizar_inicio"
  ),

  stats

);


// ============================================================
// EXPORT
// ============================================================

module.exports =
  router;