// ============================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================================
//
// Responsável por:
//
// - validar JWT
// - localizar usuário no banco
// - carregar Role
// - carregar Permissions
// - verificar se a conta está ativa
//
// Fluxo:
//
// Authorization: Bearer TOKEN
//        ↓
// jwt.verify()
//        ↓
// Usuario
//        ↓
// Role
//        ↓
// Permissions
//        ↓
// req.usuario
//
// IMPORTANTE:
//
// O JWT contém apenas o usuarioId.
//
// Role e Permissions são consultados novamente no banco em
// cada requisição autenticada.
//
// Isso permite que alterações administrativas tenham efeito
// imediatamente, sem necessidade de gerar outro JWT.
//
// ============================================================


const jwt =
  require("jsonwebtoken");


const {
  Usuario,
  Role,
  Permission,
} =
  require("../models");


// ============================================================
// MIDDLEWARE
// ============================================================

async function authMiddleware(
  req,
  res,
  next
) {

  try {

    // ========================================================
    // HEADER AUTHORIZATION
    // ========================================================

    const authorization =
      req.headers.authorization;


    if (
      !authorization
    ) {

      return res
        .status(401)
        .json({

          message:
            "Token não informado.",

        });

    }


    // ========================================================
    // BEARER
    // ========================================================

    const parts =
      authorization
        .trim()
        .split(
          /\s+/
        );


    if (
      parts.length !==
        2 ||
      parts[0] !==
        "Bearer" ||
      !parts[1]
    ) {

      return res
        .status(401)
        .json({

          message:
            "Token malformado.",

        });

    }


    const token =
      parts[1];


    // ========================================================
    // VALIDA JWT
    // ========================================================

    const decoded =
      jwt.verify(

        token,

        process.env.JWT_SECRET

      );


    // ========================================================
    // VALIDA PAYLOAD
    // ========================================================

    const usuarioId =
      Number(
        decoded?.usuarioId
      );


    if (
      !usuarioId
    ) {

      return res
        .status(401)
        .json({

          message:
            "Token inválido.",

        });

    }


    // ========================================================
    // BUSCA USUÁRIO
    // ========================================================
    //
    // Role + Permissions são carregados novamente do banco.
    //
    // Isso significa que alterações no RBAC passam a valer
    // imediatamente.
    //
    // ========================================================

    const usuario =
      await Usuario.findByPk(

        usuarioId,

        {

          attributes: [

            "id",

            "nome",

            "email",

            "roleId",

            "ativo",

            "createdAt",

          ],

          include: [

            {

              model:
                Role,

              include: [

                {

                  model:
                    Permission,

                  through: {

                    attributes:
                      [],

                  },

                },

              ],

            },

          ],

        }

      );


    // ========================================================
    // USUÁRIO NÃO EXISTE
    // ========================================================

    if (
      !usuario
    ) {

      return res
        .status(401)
        .json({

          message:
            "Usuário não encontrado.",

        });

    }


    // ========================================================
    // CONTA DESATIVADA
    // ========================================================

    if (
      !usuario.ativo
    ) {

      return res
        .status(403)
        .json({

          message:
            "Usuário desativado.",

        });

    }


    // ========================================================
    // ROLE
    // ========================================================
    //
    // Um usuário deve possuir um Role válido.
    //
    // Caso tenha sido removido/invalidado manualmente, não
    // tratamos como autenticado com acesso normal.
    //
    // ========================================================

    if (
      !usuario.Role
    ) {

      return res
        .status(403)
        .json({

          message:
            "Usuário sem cargo configurado.",

        });

    }


    // ========================================================
    // DISPONIBILIZA USUÁRIO
    // ========================================================

    req.usuario =
      usuario;


    // Compatibilidade caso algum código utilize req.user.
    req.user =
      usuario;


    // ========================================================
    // CONTINUA
    // ========================================================

    return next();

  } catch (
    error
  ) {

    console.error(
      "[AuthMiddleware] erro:",
      error
    );


    // --------------------------------------------------------
    // JWT expirado
    // --------------------------------------------------------

    if (
      error?.name ===
      "TokenExpiredError"
    ) {

      return res
        .status(401)
        .json({

          message:
            "Sessão expirada.",

        });

    }


    // --------------------------------------------------------
    // JWT inválido
    // --------------------------------------------------------

    if (
      error?.name ===
      "JsonWebTokenError"
    ) {

      return res
        .status(401)
        .json({

          message:
            "Sessão inválida.",

        });

    }


    // --------------------------------------------------------
    // Erro inesperado
    // --------------------------------------------------------

    return res
      .status(401)
      .json({

        message:
          "Sessão inválida ou expirada.",

      });

  }

}


// ============================================================
// EXPORT
// ============================================================

module.exports =
  authMiddleware;