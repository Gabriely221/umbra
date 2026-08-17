// ============================================================
// ROTAS DA GALERIA
// ============================================================
//
// Rotas:
//
// GET    /api/gallery
// POST   /api/gallery/upload
// POST   /api/gallery
// PUT    /api/gallery/:id
// DELETE /api/gallery/:id
//
// Todas exigem autenticação JWT.
//
// RBAC:
//
// visualizar_galeria
// → pode consultar os registros autorizados para seu cargo.
//
// gerenciar_galeria
// → pode consultar todos os registros.
// → pode fazer upload.
// → pode criar.
// → pode editar.
// → pode excluir.
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
// UPLOAD
// ============================================================
//
// O middleware deve exportar uma instância configurada do
// Multer.
//
// Campo esperado pelo frontend:
//
// file
//
// ============================================================

const uploadGalleryFile =
  require(
    "../middleware/uploadMiddleware"
  );


// ============================================================
// CONTROLLER
// ============================================================

const {

  listar,

  uploadGalleryFile:
    handleGalleryUpload,

  criar,

  atualizar,

  excluir,

} =
  require(
    "../controllers/galleryController"
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
// GET /api/gallery
//
// visualizar_galeria
// OU
// gerenciar_galeria
//
// O controller aplica a restrição de conteúdo:
//
// visualizar_galeria
// → GalleryItem.allowedRoles
//
// gerenciar_galeria
// → todos os itens.
//
// ============================================================

router.get(

  "/",

  authMiddleware,

  exigirAlgumaPermissao([
    "visualizar_galeria",
    "gerenciar_galeria",
  ]),

  listar

);


// ============================================================
// UPLOAD
// ============================================================
//
// POST /api/gallery/upload
//
// IMPORTANTE:
//
// Essa rota deve permanecer antes de qualquer rota dinâmica
// como /:id.
//
// multipart/form-data
//
// campo:
//
// file
//
// ============================================================

router.post(

  "/upload",

  authMiddleware,

  exigirPermissao(
    "gerenciar_galeria"
  ),

  uploadGalleryFile.single(
    "file"
  ),

  handleGalleryUpload

);


// ============================================================
// CRIAR
// ============================================================
//
// POST /api/gallery
//
// ============================================================

router.post(

  "/",

  authMiddleware,

  exigirPermissao(
    "gerenciar_galeria"
  ),

  criar

);


// ============================================================
// ATUALIZAR
// ============================================================
//
// PUT /api/gallery/:id
//
// ============================================================

router.put(

  "/:id",

  authMiddleware,

  exigirPermissao(
    "gerenciar_galeria"
  ),

  atualizar

);


// ============================================================
// EXCLUIR
// ============================================================
//
// DELETE /api/gallery/:id
//
// ============================================================

router.delete(

  "/:id",

  authMiddleware,

  exigirPermissao(
    "gerenciar_galeria"
  ),

  excluir

);


// ============================================================
// EXPORT
// ============================================================

module.exports =
  router;