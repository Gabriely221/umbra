// ============================================================
// ROTAS ADMINISTRATIVAS
// ============================================================
//
// Responsabilidades:
//
// - Permissões
// - Roles / Cargos
// - Usuários
// - Departamentos
//
// FLUXO:
//
// Request
//   ↓
// authMiddleware
//   ↓
// JWT
//   ↓
// permissionMiddleware
//   ↓
// Controller
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
  // PERMISSÕES
  // ----------------------------------------------------------

  listarPermissoes,


  // ----------------------------------------------------------
  // ROLES
  // ----------------------------------------------------------

  listarRoles,

  criarRole,

  atualizarRole,


  // ----------------------------------------------------------
  // USUÁRIOS
  // ----------------------------------------------------------

  listarUsuarios,

  atualizarUsuario,

  atualizarRoleUsuario,

  alterarStatusUsuario,

  excluirUsuario,


  // ----------------------------------------------------------
  // DEPARTAMENTOS
  // ----------------------------------------------------------

  listarDepartamentos,

  criarDepartamento,

  atualizarDepartamento,

  excluirDepartamento,

} =
  require(
    "../controllers/adminController"
  );


// ============================================================
// ROUTER
// ============================================================

const router =
  express.Router();


// ============================================================
// PERMISSÕES
// ============================================================
//
// GET /api/admin/permissions
//
// Exige:
//
// gerenciar_roles
//
// ============================================================

router.get(

  "/permissions",

  authMiddleware,

  exigirPermissao(
    "gerenciar_roles"
  ),

  listarPermissoes

);


// ============================================================
// LISTAR ROLES
// ============================================================
//
// GET /api/admin/roles
//
// Utilizado por:
//
// - Administração de usuários
// - Administração de cargos
//
// Exige:
//
// gerenciar_usuarios
// OU
// gerenciar_roles
//
// ============================================================

router.get(

  "/roles",

  authMiddleware,

  exigirAlgumaPermissao([
    "gerenciar_usuarios",
    "gerenciar_roles",
  ]),

  listarRoles

);


// ============================================================
// CRIAR ROLE
// ============================================================
//
// POST /api/admin/roles
//
// Exige:
//
// gerenciar_roles
//
// ============================================================

router.post(

  "/roles",

  authMiddleware,

  exigirPermissao(
    "gerenciar_roles"
  ),

  criarRole

);


// ============================================================
// ATUALIZAR ROLE
// ============================================================
//
// PUT /api/admin/roles/:id
//
// Exige:
//
// gerenciar_roles
//
// ============================================================

router.put(

  "/roles/:id",

  authMiddleware,

  exigirPermissao(
    "gerenciar_roles"
  ),

  atualizarRole

);


// ============================================================
// LISTAR USUÁRIOS
// ============================================================
//
// GET /api/admin/usuarios
//
// Exige:
//
// gerenciar_usuarios
//
// ============================================================

router.get(

  "/usuarios",

  authMiddleware,

  exigirPermissao(
    "gerenciar_usuarios"
  ),

  listarUsuarios

);


// ============================================================
// ATUALIZAR USUÁRIO
// ============================================================
//
// PATCH /api/admin/usuarios/:id
//
// Exige:
//
// gerenciar_usuarios
//
// ============================================================

router.patch(

  "/usuarios/:id",

  authMiddleware,

  exigirPermissao(
    "gerenciar_usuarios"
  ),

  atualizarUsuario

);


// ============================================================
// ALTERAR ROLE DO USUÁRIO
// ============================================================
//
// PATCH /api/admin/usuarios/:id/role
//
// Body:
//
// {
//   "roleId": 3
// }
//
// :id = Usuario.id
//
// ============================================================

router.patch(

  "/usuarios/:id/role",

  authMiddleware,

  exigirPermissao(
    "gerenciar_usuarios"
  ),

  atualizarRoleUsuario

);


// ============================================================
// ALTERAR STATUS DO USUÁRIO
// ============================================================
//
// PATCH /api/admin/usuarios/:id/status
//
// Body:
//
// {
//   "ativo": true
// }
//
// ou:
//
// {
//   "ativo": false
// }
//
// ============================================================

router.patch(

  "/usuarios/:id/status",

  authMiddleware,

  exigirPermissao(
    "gerenciar_usuarios"
  ),

  alterarStatusUsuario

);


// ============================================================
// EXCLUIR USUÁRIO
// ============================================================
//
// DELETE /api/admin/usuarios/:id
//
// ============================================================

router.delete(

  "/usuarios/:id",

  authMiddleware,

  exigirPermissao(
    "gerenciar_usuarios"
  ),

  excluirUsuario

);


// ============================================================
// DEPARTAMENTOS
// ============================================================


// ============================================================
// LISTAR DEPARTAMENTOS
// ============================================================
//
// GET /api/admin/departamentos
//
// A leitura do catálogo exige apenas autenticação.
//
// Motivo:
//
// DepartmentSelector é utilizado por diferentes módulos:
//
// - membros
// - usuários
// - links
//
// O endpoint apenas expõe o catálogo.
//
// Não permite modificar dados.
//
// ============================================================

router.get(

  "/departamentos",

  authMiddleware,

  listarDepartamentos

);


// ============================================================
// CRIAR DEPARTAMENTO
// ============================================================
//
// POST /api/admin/departamentos
//
// Body:
//
// {
//   "nome": "Inteligência",
//   "slug": "inteligencia",
//   "descricao": "...",
//   "ativo": true,
//   "ordem": 10
// }
//
// Gerenciamento do catálogo:
//
// gerenciar_membros
// OU
// gerenciar_usuarios
//
// ============================================================

router.post(

  "/departamentos",

  authMiddleware,

  exigirAlgumaPermissao([
    "gerenciar_membros",
    "gerenciar_usuarios",
  ]),

  criarDepartamento

);


// ============================================================
// ATUALIZAR DEPARTAMENTO
// ============================================================
//
// PUT /api/admin/departamentos/:id
//
// Ao alterar o nome do departamento, o controller atualiza
// também Membro.departamentos.
//
// Exige:
//
// gerenciar_membros
// OU
// gerenciar_usuarios
//
// ============================================================

router.put(

  "/departamentos/:id",

  authMiddleware,

  exigirAlgumaPermissao([
    "gerenciar_membros",
    "gerenciar_usuarios",
  ]),

  atualizarDepartamento

);


// ============================================================
// EXCLUIR DEPARTAMENTO
// ============================================================
//
// DELETE /api/admin/departamentos/:id
//
// O controller impede a exclusão quando o departamento ainda
// estiver associado a algum Membro.
//
// Exige:
//
// gerenciar_membros
// OU
// gerenciar_usuarios
//
// ============================================================

router.delete(

  "/departamentos/:id",

  authMiddleware,

  exigirAlgumaPermissao([
    "gerenciar_membros",
    "gerenciar_usuarios",
  ]),

  excluirDepartamento

);


// ============================================================
// EXPORT
// ============================================================

module.exports =
  router;