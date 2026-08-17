// ============================================================
// CONTROLLER DA HOME
// ============================================================
//
// Responsável exclusivamente pelas estatísticas exibidas na
// página inicial.
//
// Endpoint esperado:
//
// GET /api/home/stats
//
// RBAC:
//
// visualizar_inicio
//
// IMPORTANTE:
//
// A Home não precisa possuir:
//
// visualizar_membros
// visualizar_links
//
// para consultar essas estatísticas.
//
// O endpoint retorna apenas números agregados/minimamente
// necessários, sem expor coleções completas de Membro ou Link.
//
// ============================================================


// ============================================================
// SEQUELIZE
// ============================================================

const {
  Op,
} =
  require("sequelize");


// ============================================================
// MODELS
// ============================================================

const {
  Link,
  UserLink,
  Membro,
  Usuario,
  Role,
} =
  require("../models");


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// ID
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
// ARRAY DE STRINGS
// ------------------------------------------------------------

function normalizeStringArray(
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
            item
          ) =>
            String(
              item ??
              ""
            ).trim()
        )

        .filter(
          Boolean
        )

    ),
  ];

}


// ------------------------------------------------------------
// ROLE DO USUÁRIO
// ------------------------------------------------------------

function getUserRole(
  req
) {

  return (
    req.usuario?.Role ||
    req.usuario?.role ||
    req.user?.Role ||
    req.user?.role ||
    null
  );

}


// ------------------------------------------------------------
// PERMISSÕES DO USUÁRIO
// ------------------------------------------------------------

function getUserPermissions(
  req
) {

  const role =
    getUserRole(
      req
    );


  const permissions =
    role?.Permissions ||
    role?.permissions ||
    [];


  return Array.isArray(
    permissions
  )
    ? permissions
    : [];

}


// ------------------------------------------------------------
// POSSUI PERMISSÃO
// ------------------------------------------------------------

function hasPermission(
  req,
  slug
) {

  return getUserPermissions(
    req
  ).some(
    (
      permission
    ) => {

      if (
        typeof permission ===
        "string"
      ) {

        return (
          permission ===
          slug
        );

      }


      return (
        permission?.slug ===
        slug
      );

    }
  );

}


// ------------------------------------------------------------
// RESTRIÇÃO DE ROLE
// ------------------------------------------------------------
//
// Mantemos reconhecimento temporário de Role.nome para Links
// legados.
//
// O formato canônico continua sendo:
//
// Link.allowedRoles = Role.slug[]
//
// ------------------------------------------------------------

function matchesRoleRestriction(
  link,
  role
) {

  const allowedRoles =
    normalizeStringArray(
      link?.allowedRoles
    );


  // ----------------------------------------------------------
  // SEM RESTRIÇÃO
  // ----------------------------------------------------------

  if (
    allowedRoles.length ===
      0
  ) {

    return true;

  }


  if (
    !role
  ) {

    return false;

  }


  const roleSlug =
    String(
      role.slug ??
      ""
    ).trim();


  const roleName =
    String(
      role.nome ??
      ""
    ).trim();


  return allowedRoles.some(
    (
      allowed
    ) =>
      allowed ===
        roleSlug ||
      allowed ===
        roleName
  );

}


// ------------------------------------------------------------
// RESTRIÇÃO DE DEPARTAMENTO
// ------------------------------------------------------------
//
// Formato atual:
//
// Link.allowedDepartments = Department.nome[]
//
// ------------------------------------------------------------

function matchesDepartmentRestriction(
  link,
  userDepartments
) {

  const allowedDepartments =
    normalizeStringArray(
      link?.allowedDepartments
    );


  // ----------------------------------------------------------
  // SEM RESTRIÇÃO
  // ----------------------------------------------------------

  if (
    allowedDepartments.length ===
      0
  ) {

    return true;

  }


  if (
    userDepartments.length ===
      0
  ) {

    return false;

  }


  return allowedDepartments.some(
    (
      department
    ) =>
      userDepartments.includes(
        department
      )
  );

}


// ============================================================
// CONTAR MEMBROS ATIVOS
// ============================================================
//
// Mantemos a mesma semântica utilizada pelo diretório:
//
// - Membro.status === "Ativo"
// - usuário deve possuir Role
// - Role "sem_acesso" não entra no total
//
// IMPORTANTE:
//
// Usuario.ativo e Membro.status são conceitos diferentes.
//
// Não exigimos Usuario.ativo === true aqui, pois isso alteraria
// a semântica atual de "Membro ativo".
//
// ============================================================

async function countActiveMembers() {

  return Membro.count({

    where: {
      status:
        "Ativo",
    },

    include: [

      {
        model:
          Usuario,

        required:
          true,

        attributes:
          [],

        include: [

          {
            model:
              Role,

            required:
              true,

            attributes:
              [],

            where: {

              slug: {
                [Op.ne]:
                  "sem_acesso",
              },

            },

          },

        ],

      },

    ],

    distinct:
      true,

    col:
      "id",

  });

}


// ============================================================
// CONTAR LINKS DISPONÍVEIS
// ============================================================
//
// SEMÂNTICA:
//
// Usuário com gerenciar_links:
//
// → conta todos os links ATIVOS.
//
// Usuário comum:
//
// → somente links ATIVOS
// → UserLink direto concede acesso
//
// OU:
//
// → Role permitida
// E
// → Department permitido
//
// IMPORTANTE:
//
// Mesmo gerenciadores não contam links inativos na Home,
// porque o card se chama:
//
// "LINKS DISPONÍVEIS"
//
// ============================================================

async function countAvailableLinks(
  req
) {

  const usuarioId =
    normalizeId(
      req.usuario?.id ||
      req.user?.id
    );


  if (
    !usuarioId
  ) {

    const error =
      new Error(
        "Usuário não autenticado."
      );


    error.status =
      401;


    throw error;

  }


  // ==========================================================
  // GERENCIADOR
  // ==========================================================
  //
  // No módulo administrativo ele pode visualizar inativos.
  //
  // Na Home, porém, contamos somente os ativos.
  //
  // ==========================================================

  if (
    hasPermission(
      req,
      "gerenciar_links"
    )
  ) {

    return Link.count({

      where: {
        isActive:
          true,
      },

    });

  }


  // ==========================================================
  // USUÁRIO COMUM
  // ==========================================================

  const [
    links,
    userLinks,
    membro,
  ] =
    await Promise.all([

      // ------------------------------------------------------
      // LINKS ATIVOS
      // ------------------------------------------------------
      //
      // Buscamos apenas os campos necessários para calcular a
      // autorização de conteúdo.
      //
      // ------------------------------------------------------

      Link.findAll({

        attributes: [
          "id",
          "allowedRoles",
          "allowedDepartments",
        ],

        where: {
          isActive:
            true,
        },

      }),


      // ------------------------------------------------------
      // CONCESSÕES DIRETAS
      // ------------------------------------------------------

      UserLink.findAll({

        attributes: [
          "linkId",
        ],

        where: {
          usuarioId,
        },

      }),


      // ------------------------------------------------------
      // DEPARTAMENTOS
      // ------------------------------------------------------

      Membro.findOne({

        attributes: [
          "departamentos",
        ],

        where: {
          usuarioId,
        },

      }),

    ]);


  // ==========================================================
  // IDS CONCEDIDOS DIRETAMENTE
  // ==========================================================

  const directLinkIds =
    new Set(

      userLinks.map(
        (
          row
        ) =>
          Number(
            row.linkId
          )
      )

    );


  // ==========================================================
  // DEPARTAMENTOS DO USUÁRIO
  // ==========================================================

  const userDepartments =
    normalizeStringArray(
      membro?.departamentos
    );


  // ==========================================================
  // ROLE
  // ==========================================================

  const role =
    getUserRole(
      req
    );


  // ==========================================================
  // CONTAGEM
  // ==========================================================

  let count =
    0;


  for (
    const link
    of links
  ) {

    // --------------------------------------------------------
    // CONCESSÃO DIRETA
    // --------------------------------------------------------

    if (
      directLinkIds.has(
        Number(
          link.id
        )
      )
    ) {

      count +=
        1;


      continue;

    }


    // --------------------------------------------------------
    // ROLE
    // --------------------------------------------------------

    if (
      !matchesRoleRestriction(
        link,
        role
      )
    ) {

      continue;

    }


    // --------------------------------------------------------
    // DEPARTAMENTO
    // --------------------------------------------------------

    if (
      !matchesDepartmentRestriction(
        link,
        userDepartments
      )
    ) {

      continue;

    }


    count +=
      1;

  }


  return count;

}


// ============================================================
// ESTATÍSTICAS DA HOME
// ============================================================
//
// GET /api/home/stats
//
// Resposta:
//
// {
//   activeMembers: 12,
//   linkCount: 8
// }
//
// ============================================================

async function stats(
  req,
  res
) {

  try {

    const [
      activeMembers,
      linkCount,
    ] =
      await Promise.all([

        countActiveMembers(),

        countAvailableLinks(
          req
        ),

      ]);


    return res.json({

      activeMembers:
        Number(
          activeMembers
        ) ||
        0,

      linkCount:
        Number(
          linkCount
        ) ||
        0,

    });

  } catch (
    error
  ) {

    console.error(
      "[HomeController] stats:",
      error
    );


    return res
      .status(
        error.status ||
        500
      )
      .json({

        message:
          error.message ||
          "Erro ao carregar estatísticas da página inicial.",

      });

  }

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  stats,

};