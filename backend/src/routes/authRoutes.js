// ============================================================
// ROTAS DE AUTENTICAÇÃO
// ============================================================

const express =
  require("express");

const {
  register,
  login,
  me,
} =
  require(
    "../controllers/authController"
  );

const authMiddleware =
  require(
    "../middleware/authMiddleware"
  );


const router =
  express.Router();


// Cadastro.
router.post(
  "/register",
  register
);


// Login.
router.post(
  "/login",
  login
);


// Usuário atual.
router.get(
  "/me",
  authMiddleware,
  me
);


module.exports =
  router;