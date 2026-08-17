const express =
  require("express");

const authMiddleware =
  require(
    "../middleware/authMiddleware"
  );

const exigirPermissao =
  require(
    "../middleware/permissionMiddleware"
  );

const {
  listar,
  buscar,
  atualizar,
} =
  require(
    "../controllers/membroController"
  );


const router =
  express.Router();


router.get(
  "/",

  authMiddleware,

  exigirPermissao(
    "visualizar_membros"
  ),

  listar
);


router.get(
  "/:id",

  authMiddleware,

  exigirPermissao(
    "visualizar_membros"
  ),

  buscar
);


router.put(
  "/:id",

  authMiddleware,

  exigirPermissao(
    "gerenciar_membros"
  ),

  atualizar
);


module.exports =
  router;