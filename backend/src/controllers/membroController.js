// ============================================================
// CONTROLLER DE MEMBROS
// ============================================================
//
// Responsável pelo perfil público dos membros.
//
// Usuario:
//
// - autenticação
// - nome
// - email
// - role
// - ativo
//
// Membro:
//
// - status
// - codinome
// - avatarUrl
// - bio
// - departamentos
//
// REGRA DE LIFECYCLE:
//
// Todo Usuario deve possuir um Membro.
//
// Porém usuários com:
//
// Role.slug = "sem_acesso"
//
// não aparecem no diretório público de membros.
//
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

const {
  Membro,
  Usuario,
  Role,
  Department,
} =
  require("../models");


// ============================================================
// CONSTANTES
// ============================================================

const MEMBER_STATUS = [
  "Ativo",
  "Inativo",
  "Afastado",
];


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// NORMALIZA ID
// ------------------------------------------------------------

function normalizeId(
  value
) {

  const id =
    Number(
      value
    );


  if (
    !Number.isInteger(
      id
    ) ||
    id <=
      0
  ) {

    return null;

  }


  return id;

}


// ------------------------------------------------------------
// NORMALIZA TEXTO OPCIONAL
// ------------------------------------------------------------

function normalizeOptionalText(
  value
) {

  if (
    value ===
      null
  ) {

    return null;

  }


  const normalized =
    String(
      value
    ).trim();


  return normalized ||
    null;

}


// ------------------------------------------------------------
// NORMALIZA DEPARTAMENTOS
// ------------------------------------------------------------

function normalizeDepartments(
  value
) {

  if (
    !Array.isArray(
      value
    )
  ) {

    return [];

  }


  return [
    ...new Set(

      value

        .map(
          (
            department
          ) =>
            String(
              department ||
              ""
            ).trim()
        )

        .filter(Boolean)

    ),
  ];

}


// ------------------------------------------------------------
// VALIDA DEPARTAMENTOS NO CATÁLOGO
// ------------------------------------------------------------
//
// Aceitamos departamentos ativos ou inativos já cadastrados.
//
// O frontend somente oferece departamentos ativos para novas
// seleções, mas um registro histórico pode continuar associado
// a um departamento posteriormente desativado.
//
// ------------------------------------------------------------

async function validateDepartments(
  departments
) {

  if (
    departments.length ===
    0
  ) {

    return {
      valid:
        true,

      invalid:
        [],
    };

  }


  const catalog =
    await Department.findAll({

      attributes: [
        "nome",
      ],

    });


  const availableNames =
    new Set(

      catalog.map(
        (
          department
        ) =>
          department.nome
      )

    );


  const invalid =
    departments.filter(
      (
        name
      ) =>
        !availableNames.has(
          name
        )
    );


  return {

    valid:
      invalid.length ===
      0,

    invalid,

  };

}


// ------------------------------------------------------------
// FORMATA MEMBRO
// ------------------------------------------------------------

function formatMembro(
  membro
) {

  const usuario =
    membro?.Usuario ||
    membro?.usuario ||
    null;


  const role =
    usuario?.Role ||
    usuario?.role ||
    null;


  const departamentos =
    Array.isArray(
      membro?.departamentos
    )
      ? membro.departamentos
      : [];


  return {

    // --------------------------------------------------------
    // MEMBRO
    // --------------------------------------------------------

    id:
      membro?.id,

    membroId:
      membro?.id,

    usuarioId:
      membro?.usuarioId,

    status:
      membro?.status ||
      "Ativo",

    codinome:
      membro?.codinome ||
      null,

    avatarUrl:
      membro?.avatarUrl ||
      null,

    avatar_url:
      membro?.avatarUrl ||
      null,

    bio:
      membro?.bio ||
      null,

    departamentos,

    departments:
      departamentos,


    // --------------------------------------------------------
    // USUÁRIO
    // --------------------------------------------------------

    nome:
      usuario?.nome ||
      null,

    full_name:
      usuario?.nome ||
      null,

    email:
      usuario?.email ||
      null,

    ativo:
      usuario?.ativo !==
      false,

    usuarioAtivo:
      usuario?.ativo !==
      false,


    // --------------------------------------------------------
    // ROLE
    // --------------------------------------------------------

    role:
      role ||
      null,

  };

}


// ------------------------------------------------------------
// INCLUDE PADRÃO
// ------------------------------------------------------------

function getMemberInclude() {

  return [

    {
      model:
        Usuario,

      attributes: [
        "id",
        "nome",
        "email",
        "roleId",
        "ativo",
      ],

      include: [

        {
          model:
            Role,

          attributes: [
            "id",
            "nome",
            "slug",
            "descricao",
            "hierarchyOrder",
            "tierLevel",
            "isSystem",
          ],
        },

      ],

    },

  ];

}


// ============================================================
// LISTAR MEMBROS
// ============================================================
//
// GET /api/membros
//
// Usuários com role "sem_acesso" são removidos da listagem.
//
// A conta pode estar:
//
// Usuario.ativo = false
//
// e ainda continuar no histórico/diretório.
//
// O estado público é controlado separadamente por:
//
// Membro.status
//
// ============================================================

async function listar(
  req,
  res
) {

  try {

    const membros =
      await Membro.findAll({

        include:
          getMemberInclude(),

        order: [

          [
            "status",
            "ASC",
          ],

          [
            "id",
            "ASC",
          ],

        ],

      });


    // ========================================================
    // REMOVE CONTAS AGUARDANDO APROVAÇÃO
    // ========================================================

    const approvedMembers =
      membros.filter(
        (
          membro
        ) => {

          const roleSlug =
            membro.Usuario
              ?.Role
              ?.slug;


          return (
            roleSlug &&
            roleSlug !==
              "sem_acesso"
          );

        }
      );


    // ========================================================
    // FORMATO DA API
    // ========================================================

    const result =
      approvedMembers.map(
        formatMembro
      );


    return res.json({
      membros:
        result,
    });

  } catch (
    error
  ) {

    console.error(
      "[MembroController] listar:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          "Erro ao listar membros.",

      });

  }

}


// ============================================================
// BUSCAR MEMBRO
// ============================================================
//
// GET /api/membros/:id
//
// Também não expomos perfis de contas ainda em "sem_acesso".
//
// ============================================================

async function buscar(
  req,
  res
) {

  try {

    const memberId =
      normalizeId(
        req.params.id
      );


    if (
      !memberId
    ) {

      return res
        .status(400)
        .json({

          message:
            "ID de membro inválido.",

        });

    }


    const membro =
      await Membro.findByPk(
        memberId,
        {

          include:
            getMemberInclude(),

        }
      );


    if (
      !membro
    ) {

      return res
        .status(404)
        .json({

          message:
            "Membro não encontrado.",

        });

    }


    // ========================================================
    // AINDA NÃO APROVADO
    // ========================================================

    if (
      !membro.Usuario?.Role ||
      membro.Usuario.Role.slug ===
        "sem_acesso"
    ) {

      return res
        .status(404)
        .json({

          message:
            "Membro não encontrado.",

        });

    }


    return res.json({
      membro:
        formatMembro(
          membro
        ),
    });

  } catch (
    error
  ) {

    console.error(
      "[MembroController] buscar:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          "Erro ao buscar membro.",

      });

  }

}


// ============================================================
// ATUALIZAR MEMBRO
// ============================================================
//
// PUT /api/membros/:id
//
// Campos permitidos:
//
// - status
// - codinome
// - avatarUrl
// - avatar_url
// - bio
// - departamentos
// - departments
//
// NÃO altera:
//
// - Usuario.nome
// - Usuario.email
// - Usuario.senha
// - Usuario.roleId
// - Usuario.ativo
//
// ============================================================

async function atualizar(
  req,
  res
) {

  try {

    const memberId =
      normalizeId(
        req.params.id
      );


    if (
      !memberId
    ) {

      return res
        .status(400)
        .json({

          message:
            "ID de membro inválido.",

        });

    }


    const membro =
      await Membro.findByPk(
        memberId
      );


    if (
      !membro
    ) {

      return res
        .status(404)
        .json({

          message:
            "Membro não encontrado.",

        });

    }


    // ========================================================
    // STATUS
    // ========================================================

    if (
      req.body.status !==
      undefined
    ) {

      const status =
        String(
          req.body.status
        ).trim();


      if (
        !MEMBER_STATUS.includes(
          status
        )
      ) {

        return res
          .status(400)
          .json({

            message:
              `Status inválido. Utilize: ${MEMBER_STATUS.join(
                ", "
              )}.`,

          });

      }


      membro.status =
        status;

    }


    // ========================================================
    // CODINOME
    // ========================================================

    const codinome =
      req.body.codinome ??
      req.body.codename;


    if (
      codinome !==
      undefined
    ) {

      membro.codinome =
        normalizeOptionalText(
          codinome
        );

    }


    // ========================================================
    // AVATAR
    // ========================================================

    const avatarUrl =
      req.body.avatarUrl ??
      req.body.avatar_url;


    if (
      avatarUrl !==
      undefined
    ) {

      membro.avatarUrl =
        normalizeOptionalText(
          avatarUrl
        );

    }


    // ========================================================
    // BIO
    // ========================================================

    if (
      req.body.bio !==
      undefined
    ) {

      membro.bio =
        normalizeOptionalText(
          req.body.bio
        );

    }


    // ========================================================
    // DEPARTAMENTOS
    // ========================================================

    const departmentsInput =
      req.body.departamentos ??
      req.body.departments;


    if (
      departmentsInput !==
      undefined
    ) {

      if (
        !Array.isArray(
          departmentsInput
        )
      ) {

        return res
          .status(400)
          .json({

            message:
              "Departamentos deve ser uma lista.",

          });

      }


      const departments =
        normalizeDepartments(
          departmentsInput
        );


      const validation =
        await validateDepartments(
          departments
        );


      if (
        !validation.valid
      ) {

        return res
          .status(400)
          .json({

            message:
              "Um ou mais departamentos informados não existem.",

            invalidDepartments:
              validation.invalid,

          });

      }


      membro.departamentos =
        departments;

    }


    // ========================================================
    // SALVA
    // ========================================================

    await membro.save();


    // ========================================================
    // RECARREGA COM USUÁRIO E ROLE
    // ========================================================

    const updatedMembro =
      await Membro.findByPk(
        membro.id,
        {

          include:
            getMemberInclude(),

        }
      );


    return res.json({

      message:
        "Membro atualizado com sucesso.",

      membro:
        formatMembro(
          updatedMembro
        ),

    });

  } catch (
    error
  ) {

    console.error(
      "[MembroController] atualizar:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro ao atualizar membro.",

      });

  }

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  listar,

  buscar,

  atualizar,

};