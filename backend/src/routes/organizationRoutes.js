// ============================================================
// ROTAS DE RELAÇÕES EXTERNAS
// ============================================================
//
// Base:
//
// /api/organizations
//
// ORGANIZAÇÕES:
//
// GET    /api/organizations
// POST   /api/organizations
//
// GET    /api/organizations/:id
// PUT    /api/organizations/:id
// DELETE /api/organizations/:id
//
//
// USUÁRIOS RESPONSÁVEIS:
//
// GET    /api/organizations/responsible-users
//
//
// HISTÓRICO:
//
// GET    /api/organizations/:organizationId/history
// POST   /api/organizations/:organizationId/history
// PUT    /api/organizations/:organizationId/history/:historyId
// DELETE /api/organizations/:organizationId/history/:historyId
//
//
// NEGOCIAÇÕES:
//
// GET    /api/organizations/:organizationId/negotiations
// POST   /api/organizations/:organizationId/negotiations
// PUT    /api/organizations/:organizationId/negotiations/:negotiationId
// DELETE /api/organizations/:organizationId/negotiations/:negotiationId
//
//
// RBAC:
//
// visualizar_relacoes
// → leitura das organizações autorizadas.
//
// gerenciar_relacoes
// → leitura completa.
// → criação.
// → edição.
// → exclusão.
// → gerenciamento de histórico.
// → gerenciamento de negociações.
// → listagem de usuários atribuíveis.
//
//
// AUTORIZAÇÃO DE CONTEÚDO:
//
// visualizar_relacoes
// → somente organizações ativas.
// → respeita allowedCargos.
//
// gerenciar_relacoes
// → vê organizações ativas e inativas.
// → ignora allowedCargos para administração.
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


const {
  exigirAlgumaPermissao,
} =
  permissionMiddleware;


// ============================================================
// CONTROLLER
// ============================================================

const {

  // ----------------------------------------------------------
  // ORGANIZAÇÕES
  // ----------------------------------------------------------

  listar,

  buscar,

  criar,

  atualizar,

  excluir,


  // ----------------------------------------------------------
  // USUÁRIOS RESPONSÁVEIS
  // ----------------------------------------------------------

  listarUsuariosResponsaveis,


  // ----------------------------------------------------------
  // HISTÓRICO
  // ----------------------------------------------------------

  listarHistorico,

  criarHistorico,

  atualizarHistorico,

  excluirHistorico,


  // ----------------------------------------------------------
  // NEGOCIAÇÕES
  // ----------------------------------------------------------

  listarNegociacoes,

  criarNegociacao,

  atualizarNegociacao,

  excluirNegociacao,

} =
  require(
    "../controllers/organizationController"
  );


// ============================================================
// ROUTER
// ============================================================

const router =
  express.Router();


// ============================================================
// MIDDLEWARE DE LEITURA
// ============================================================
//
// Pode acessar endpoints de leitura quem possuir:
//
// visualizar_relacoes
//
// OU
//
// gerenciar_relacoes
//
// O controller continua responsável pela autorização de
// conteúdo de cada organização.
//
// ============================================================

const podeVisualizarRelacoes =
  exigirAlgumaPermissao([
    "visualizar_relacoes",
    "gerenciar_relacoes",
  ]);


// ============================================================
// ORGANIZAÇÕES - LISTAR
// ============================================================
//
// GET /api/organizations
//
// visualizar_relacoes
// OU
// gerenciar_relacoes
//
// ============================================================

router.get(

  "/",

  authMiddleware,

  podeVisualizarRelacoes,

  listar

);


// ============================================================
// USUÁRIOS RESPONSÁVEIS
// ============================================================
//
// GET /api/organizations/responsible-users
//
// Retorna somente os usuários que podem receber uma nova
// atribuição como responsáveis por negociações.
//
// A implementação do controller considera:
//
// Usuario.ativo = true
//
// E:
//
// Role.slug != "sem_acesso"
//
//
// IMPORTANTE:
//
// Esta rota NÃO exige:
//
// visualizar_membros
// gerenciar_membros
// visualizar_roles
// gerenciar_usuarios
//
// O usuário precisa apenas administrar Relações.
//
// Também retornamos somente os dados mínimos necessários ao
// seletor:
//
// {
//   id,
//   nome,
//   email
// }
//
// IMPORTANTE SOBRE A ORDEM:
//
// Esta rota precisa aparecer ANTES de:
//
// GET /:id
//
// Caso contrário "responsible-users" pode ser interpretado
// como o parâmetro :id.
//
// ============================================================

router.get(

  "/responsible-users",

  authMiddleware,

  exigirPermissao(
    "gerenciar_relacoes"
  ),

  listarUsuariosResponsaveis

);


// ============================================================
// HISTÓRICO
// ============================================================
//
// As rotas específicas aparecem antes da rota genérica /:id.
//
// ============================================================


// ------------------------------------------------------------
// LISTAR HISTÓRICO
// ------------------------------------------------------------
//
// GET /api/organizations/:organizationId/history
//
// visualizar_relacoes
// OU
// gerenciar_relacoes
//
// O controller também verifica se o usuário pode acessar a
// organização correspondente.
//
// ------------------------------------------------------------

router.get(

  "/:organizationId/history",

  authMiddleware,

  podeVisualizarRelacoes,

  listarHistorico

);


// ------------------------------------------------------------
// CRIAR HISTÓRICO
// ------------------------------------------------------------
//
// POST /api/organizations/:organizationId/history
//
// gerenciar_relacoes
//
// ------------------------------------------------------------

router.post(

  "/:organizationId/history",

  authMiddleware,

  exigirPermissao(
    "gerenciar_relacoes"
  ),

  criarHistorico

);


// ------------------------------------------------------------
// ATUALIZAR HISTÓRICO
// ------------------------------------------------------------
//
// PUT /api/organizations/:organizationId/history/:historyId
//
// gerenciar_relacoes
//
// ------------------------------------------------------------

router.put(

  "/:organizationId/history/:historyId",

  authMiddleware,

  exigirPermissao(
    "gerenciar_relacoes"
  ),

  atualizarHistorico

);


// ------------------------------------------------------------
// EXCLUIR HISTÓRICO
// ------------------------------------------------------------
//
// DELETE /api/organizations/:organizationId/history/:historyId
//
// gerenciar_relacoes
//
// ------------------------------------------------------------

router.delete(

  "/:organizationId/history/:historyId",

  authMiddleware,

  exigirPermissao(
    "gerenciar_relacoes"
  ),

  excluirHistorico

);


// ============================================================
// NEGOCIAÇÕES
// ============================================================


// ------------------------------------------------------------
// LISTAR NEGOCIAÇÕES
// ------------------------------------------------------------
//
// GET /api/organizations/:organizationId/negotiations
//
// visualizar_relacoes
// OU
// gerenciar_relacoes
//
// O controller também verifica o acesso à organização.
//
// ------------------------------------------------------------

router.get(

  "/:organizationId/negotiations",

  authMiddleware,

  podeVisualizarRelacoes,

  listarNegociacoes

);


// ------------------------------------------------------------
// CRIAR NEGOCIAÇÃO
// ------------------------------------------------------------
//
// POST /api/organizations/:organizationId/negotiations
//
// gerenciar_relacoes
//
// ------------------------------------------------------------

router.post(

  "/:organizationId/negotiations",

  authMiddleware,

  exigirPermissao(
    "gerenciar_relacoes"
  ),

  criarNegociacao

);


// ------------------------------------------------------------
// ATUALIZAR NEGOCIAÇÃO
// ------------------------------------------------------------
//
// PUT /api/organizations/:organizationId/negotiations/:negotiationId
//
// gerenciar_relacoes
//
// ------------------------------------------------------------

router.put(

  "/:organizationId/negotiations/:negotiationId",

  authMiddleware,

  exigirPermissao(
    "gerenciar_relacoes"
  ),

  atualizarNegociacao

);


// ------------------------------------------------------------
// EXCLUIR NEGOCIAÇÃO
// ------------------------------------------------------------
//
// DELETE /api/organizations/:organizationId/negotiations/:negotiationId
//
// gerenciar_relacoes
//
// ------------------------------------------------------------

router.delete(

  "/:organizationId/negotiations/:negotiationId",

  authMiddleware,

  exigirPermissao(
    "gerenciar_relacoes"
  ),

  excluirNegociacao

);


// ============================================================
// ORGANIZAÇÃO - DETALHE
// ============================================================
//
// GET /api/organizations/:id
//
// visualizar_relacoes
// OU
// gerenciar_relacoes
//
// O controller:
//
// - bloqueia organizações inativas para usuário comum;
// - aplica allowedCargos;
// - devolve 404 para organização não acessível.
//
// ATENÇÃO:
//
// Rotas literais como:
//
// /responsible-users
//
// devem permanecer acima desta rota.
//
// ============================================================

router.get(

  "/:id",

  authMiddleware,

  podeVisualizarRelacoes,

  buscar

);


// ============================================================
// ORGANIZAÇÃO - CRIAR
// ============================================================
//
// POST /api/organizations
//
// gerenciar_relacoes
//
// ============================================================

router.post(

  "/",

  authMiddleware,

  exigirPermissao(
    "gerenciar_relacoes"
  ),

  criar

);


// ============================================================
// ORGANIZAÇÃO - ATUALIZAR
// ============================================================
//
// PUT /api/organizations/:id
//
// gerenciar_relacoes
//
// ============================================================

router.put(

  "/:id",

  authMiddleware,

  exigirPermissao(
    "gerenciar_relacoes"
  ),

  atualizar

);


// ============================================================
// ORGANIZAÇÃO - EXCLUIR
// ============================================================
//
// DELETE /api/organizations/:id
//
// gerenciar_relacoes
//
// ============================================================

router.delete(

  "/:id",

  authMiddleware,

  exigirPermissao(
    "gerenciar_relacoes"
  ),

  excluir

);


// ============================================================
// EXPORT
// ============================================================

module.exports =
  router;