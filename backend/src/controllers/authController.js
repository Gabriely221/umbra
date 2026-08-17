// ============================================================
// AUTH CONTROLLER
// ============================================================
//
// Responsável por:
//
// - registro
// - login
// - sessão atual (/me)
//
// REGRA DE LIFECYCLE:
//
// Todo Usuario deve possuir exatamente um Membro.
//
// Um novo cadastro nasce como:
//
// Usuario
// ├── role = sem_acesso
// └── ativo = true
//
// Membro
// ├── status = Ativo
// └── departamentos = []
//
// Usuários "sem_acesso" possuem Membro, mas não aparecem no
// diretório de membros.
//
// JWT:
//
// {
//   usuarioId
// }
//
// Role e Permissions nunca são confiadas ao token.
// São recarregadas do banco.
//
// ============================================================


// ============================================================
// DEPENDÊNCIAS
// ============================================================

const bcrypt =
  require(
    "bcryptjs"
  );


const jwt =
  require(
    "jsonwebtoken"
  );


// ============================================================
// DATABASE
// ============================================================

const sequelize =
  require(
    "../config/database"
  );


// ============================================================
// MODELS
// ============================================================

const {
  Usuario,
  Role,
  Permission,
  Membro,
} =
  require(
    "../models"
  );


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// FORMATA PERMISSÃO
// ------------------------------------------------------------

function formatPermission(
  permission
) {

  if (
    !permission
  ) {

    return null;

  }


  return {

    id:
      permission.id,

    nome:
      permission.nome,

    slug:
      permission.slug,

    descricao:
      permission.descricao ||
      null,

  };

}


// ------------------------------------------------------------
// FORMATA ROLE
// ------------------------------------------------------------

function formatRole(
  role
) {

  if (
    !role
  ) {

    return null;

  }


  const rawPermissions =
    role.Permissions ||
    role.permissions ||
    [];


  const permissions =
    Array.isArray(
      rawPermissions
    )

      ? rawPermissions
          .map(
            formatPermission
          )
          .filter(Boolean)

      : [];


  return {

    id:
      role.id,

    nome:
      role.nome,

    slug:
      role.slug,

    descricao:
      role.descricao ||
      null,

    hierarchyOrder:
      role.hierarchyOrder,

    tierLevel:
      role.tierLevel,

    isSystem:
      Boolean(
        role.isSystem
      ),

    permissions,

  };

}


// ------------------------------------------------------------
// FORMATA MEMBRO
// ------------------------------------------------------------

function formatMembro(
  membro
) {

  if (
    !membro
  ) {

    return null;

  }


  const departamentos =
    Array.isArray(
      membro.departamentos
    )
      ? membro.departamentos
      : [];


  return {

    id:
      membro.id,

    usuarioId:
      membro.usuarioId,

    status:
      membro.status ||
      "Ativo",

    codinome:
      membro.codinome ||
      null,

    avatarUrl:
      membro.avatarUrl ||
      null,

    avatar_url:
      membro.avatarUrl ||
      null,

    bio:
      membro.bio ||
      null,

    departamentos,

    departments:
      departamentos,

  };

}


// ------------------------------------------------------------
// FORMATA USUÁRIO
// ------------------------------------------------------------
//
// Este é o formato oficial da autenticação.
//
// Mantemos aliases de compatibilidade durante a migração.
//
// ------------------------------------------------------------

function formatUser(
  usuario
) {

  if (
    !usuario
  ) {

    return null;

  }


  const role =
    formatRole(
      usuario.Role ||
      usuario.role ||
      null
    );


  const membro =
    formatMembro(
      usuario.Membro ||
      usuario.membro ||
      null
    );


  const permissions =
    role?.permissions ||
    [];


  const permissionSlugs =
    permissions
      .map(
        (
          permission
        ) =>
          permission.slug
      )
      .filter(Boolean);


  return {

    // --------------------------------------------------------
    // USUÁRIO
    // --------------------------------------------------------

    id:
      usuario.id,

    nome:
      usuario.nome ||
      null,

    email:
      usuario.email ||
      null,

    ativo:
      usuario.ativo !==
      false,


    // --------------------------------------------------------
    // ROLE
    // --------------------------------------------------------

    role,


    // --------------------------------------------------------
    // MEMBRO
    // --------------------------------------------------------

    membro,

    membroId:
      membro?.id ||
      null,


    // --------------------------------------------------------
    // COMPATIBILIDADE DE PERMISSÕES
    // --------------------------------------------------------

    permissoes:
      permissionSlugs,

    permissions:
      permissionSlugs,

  };

}


// ------------------------------------------------------------
// INCLUDE PADRÃO DE AUTENTICAÇÃO
// ------------------------------------------------------------

function getAuthIncludes() {

  return [

    // --------------------------------------------------------
    // ROLE + PERMISSIONS
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // MEMBRO
    // --------------------------------------------------------

    {

      model:
        Membro,

    },

  ];

}


// ------------------------------------------------------------
// CARREGA USUÁRIO COMPLETO
// ------------------------------------------------------------

async function findUsuarioById(
  id,
  options = {}
) {

  return Usuario.findByPk(
    id,
    {

      attributes: {

        exclude: [
          "senha",
        ],

      },

      include:
        getAuthIncludes(),

      ...options,

    }
  );

}


// ------------------------------------------------------------
// JWT SECRET
// ------------------------------------------------------------

function getJwtSecret() {

  const secret =
    process.env.JWT_SECRET;


  if (
    !secret
  ) {

    throw new Error(
      "JWT_SECRET não foi configurado no .env."
    );

  }


  return secret;

}


// ============================================================
// REGISTER
// ============================================================
//
// POST /api/auth/register
//
// Cria atomicamente:
//
// Usuario + Membro
//
// Se qualquer criação falhar:
//
// ROLLBACK
//
// ============================================================

async function register(
  req,
  res
) {

  const transaction =
    await sequelize.transaction();


  try {

    const {
      nome,
      email,
      senha,
    } =
      req.body;


    // ========================================================
    // NORMALIZAÇÃO
    // ========================================================

    const normalizedName =
      String(
        nome ||
        ""
      ).trim();


    const normalizedEmail =
      String(
        email ||
        ""
      )
        .trim()
        .toLowerCase();


    const normalizedPassword =
      typeof senha ===
        "string"
        ? senha
        : "";


    // ========================================================
    // CAMPOS OBRIGATÓRIOS
    // ========================================================

    if (
      !normalizedName ||
      !normalizedEmail ||
      !normalizedPassword
    ) {

      await transaction.rollback();


      return res
        .status(400)
        .json({

          message:
            "Nome, email e senha são obrigatórios.",

        });

    }


    // ========================================================
    // SENHA
    // ========================================================

    if (
      normalizedPassword.length <
      6
    ) {

      await transaction.rollback();


      return res
        .status(400)
        .json({

          message:
            "A senha deve possuir pelo menos 6 caracteres.",

        });

    }


    // ========================================================
    // DUPLICIDADE
    // ========================================================

    const existing =
      await Usuario.findOne({

        where: {

          email:
            normalizedEmail,

        },

        transaction,

      });


    if (
      existing
    ) {

      await transaction.rollback();


      return res
        .status(409)
        .json({

          message:
            "Esse email já está cadastrado.",

        });

    }


    // ========================================================
    // ROLE INICIAL
    // ========================================================

    const role =
      await Role.findOne({

        where: {

          slug:
            "sem_acesso",

        },

        transaction,

      });


    if (
      !role
    ) {

      await transaction.rollback();


      return res
        .status(500)
        .json({

          message:
            "Cargo sem_acesso não encontrado. Execute o seed do sistema.",

        });

    }


    // ========================================================
    // HASH
    // ========================================================

    const passwordHash =
      await bcrypt.hash(
        normalizedPassword,
        10
      );


    // ========================================================
    // CRIA USUÁRIO
    // ========================================================

    const usuario =
      await Usuario.create(
        {

          nome:
            normalizedName,

          email:
            normalizedEmail,

          senha:
            passwordHash,

          roleId:
            role.id,

          ativo:
            true,

        },
        {
          transaction,
        }
      );


    // ========================================================
    // CRIA MEMBRO
    // ========================================================
    //
    // Mesmo aguardando aprovação, o usuário já possui seu
    // perfil correspondente.
    //
    // GET /membros oculta Role.slug = sem_acesso.
    //
    // ========================================================

    await Membro.create(
      {

        usuarioId:
          usuario.id,

        status:
          "Ativo",

        codinome:
          null,

        avatarUrl:
          null,

        bio:
          null,

        departamentos:
          [],

      },
      {
        transaction,
      }
    );


    // ========================================================
    // COMMIT
    // ========================================================

    await transaction.commit();


    // ========================================================
    // RETORNO COMPLETO
    // ========================================================

    const createdUser =
      await findUsuarioById(
        usuario.id
      );


    return res
      .status(201)
      .json({

        message:
          "Cadastro realizado. Aguarde a aprovação da administração.",

        usuario:
          formatUser(
            createdUser
          ),

      });

  } catch (
    error
  ) {

    try {

      await transaction.rollback();

    } catch {}


    console.error(
      "[AuthController] register:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro interno do servidor.",

      });

  }

}


// ============================================================
// LOGIN
// ============================================================
//
// POST /api/auth/login
//
// JWT contém somente:
//
// {
//   usuarioId
// }
//
// ============================================================

async function login(
  req,
  res
) {

  try {

    const {
      email,
      senha,
    } =
      req.body;


    // ========================================================
    // NORMALIZAÇÃO
    // ========================================================

    const normalizedEmail =
      String(
        email ||
        ""
      )
        .trim()
        .toLowerCase();


    const normalizedPassword =
      typeof senha ===
        "string"
        ? senha
        : "";


    // ========================================================
    // VALIDAÇÃO
    // ========================================================

    if (
      !normalizedEmail ||
      !normalizedPassword
    ) {

      return res
        .status(400)
        .json({

          message:
            "Email e senha são obrigatórios.",

        });

    }


    // ========================================================
    // BUSCA USUÁRIO
    // ========================================================
    //
    // Aqui precisamos da senha para bcrypt.compare().
    //
    // ========================================================

    const usuario =
      await Usuario.findOne({

        where: {

          email:
            normalizedEmail,

        },

        include:
          getAuthIncludes(),

      });


    // ========================================================
    // CREDENCIAIS
    // ========================================================

    if (
      !usuario
    ) {

      return res
        .status(401)
        .json({

          message:
            "Email ou senha inválidos.",

        });

    }


    const validPassword =
      await bcrypt.compare(
        normalizedPassword,
        usuario.senha
      );


    if (
      !validPassword
    ) {

      return res
        .status(401)
        .json({

          message:
            "Email ou senha inválidos.",

        });

    }


    // ========================================================
    // STATUS DA CONTA
    // ========================================================

    if (
      !usuario.ativo
    ) {

      return res
        .status(403)
        .json({

          message:
            "Seu usuário está desativado.",

        });

    }


    // ========================================================
    // JWT
    // ========================================================

    const token =
      jwt.sign(
        {

          usuarioId:
            usuario.id,

        },
        getJwtSecret(),
        {

          expiresIn:
            "7d",

        }
      );


    // ========================================================
    // RESPOSTA
    // ========================================================

    return res.json({

      message:
        "Login realizado com sucesso.",

      token,

      usuario:
        formatUser(
          usuario
        ),

    });

  } catch (
    error
  ) {

    console.error(
      "[AuthController] login:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro interno do servidor.",

      });

  }

}


// ============================================================
// ME
// ============================================================
//
// GET /api/auth/me
//
// Sempre reconsulta:
//
// - Usuario
// - Role
// - Permissions
// - Membro
//
// Isso faz alterações administrativas refletirem sem depender
// dos dados armazenados no JWT.
//
// ============================================================

async function me(
  req,
  res
) {

  try {

    const userId =
      req.usuario?.id ||
      req.user?.id ||
      null;


    if (
      !userId
    ) {

      return res
        .status(401)
        .json({

          message:
            "Usuário não autenticado.",

        });

    }


    // ========================================================
    // RECARREGA
    // ========================================================

    const usuario =
      await findUsuarioById(
        userId
      );


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
    // STATUS
    // ========================================================

    if (
      !usuario.ativo
    ) {

      return res
        .status(403)
        .json({

          message:
            "Seu usuário está desativado.",

        });

    }


    // ========================================================
    // RESPOSTA
    // ========================================================

    return res.json({

      usuario:
        formatUser(
          usuario
        ),

    });

  } catch (
    error
  ) {

    console.error(
      "[AuthController] me:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro ao carregar usuário.",

      });

  }

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  register,

  login,

  me,

};