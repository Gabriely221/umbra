// ============================================================
// CONTROLLER DE REGRAS
// ============================================================
//
// Responsável por:
//
// - listar regras
// - criar regras
// - atualizar regras
// - excluir regras
//
// Existem dois níveis diferentes de autorização:
//
// 1. RBAC
//
// visualizar_regras
// gerenciar_regras
//
// Controlado pelas rotas.
//
// 2. RESTRIÇÃO DE CONTEÚDO
//
// Rule.allowedRoles
//
// PADRÃO OFICIAL:
//
// Role.slug[]
//
// Exemplo:
//
// [
//   "membro",
//   "lideranca"
// ]
//
// [] significa:
//
// sem restrição por cargo.
//
// ============================================================


// ============================================================
// MODELS
// ============================================================

const {
  Rule,
  Role,
} =
  require("../models");


// ============================================================
// CONSTANTES
// ============================================================

const RULE_PRIORITIES = [

  "Máxima",
  "Alta",
  "Média",
  "Baixa",

];


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// ERRO HTTP
// ------------------------------------------------------------

function httpError(
  status,
  message,
  data = {}
) {

  const error =
    new Error(
      message
    );


  error.status =
    status;


  error.data =
    data;


  return error;

}


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
// TEXTO
// ------------------------------------------------------------

function normalizeText(
  value
) {

  return String(
    value ??
    ""
  ).trim();

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

        .filter(Boolean)

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
// PERMISSÕES
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


// ============================================================
// RESOLVE ALLOWED ROLES
// ============================================================
//
// Entrada aceita:
//
// [
//   "lideranca"
// ]
//
// ou formato legado:
//
// [
//   "Liderança"
// ]
//
// Retorno:
//
// [
//   "lideranca"
// ]
//
// "sem_acesso" não pode ser utilizado como público de
// conteúdo.
//
// ============================================================

async function resolveAllowedRoles(
  values
) {

  if (
    !Array.isArray(
      values
    )
  ) {

    throw httpError(
      400,
      "Cargos permitidos deve ser uma lista."
    );

  }


  const normalized =
    normalizeStringArray(
      values
    );


  if (
    normalized.length ===
      0
  ) {

    return [];

  }


  const roles =
    await Role.findAll({

      attributes: [
        "id",
        "nome",
        "slug",
      ],

    });


  const resolved =
    [];


  const invalid =
    [];


  for (
    const value
    of normalized
  ) {

    const comparison =
      value.toLocaleLowerCase(
        "pt-BR"
      );


    const role =
      roles.find(
        (
          item
        ) => {

          const slug =
            String(
              item.slug ??
              ""
            )
              .trim()
              .toLocaleLowerCase(
                "pt-BR"
              );


          const nome =
            String(
              item.nome ??
              ""
            )
              .trim()
              .toLocaleLowerCase(
                "pt-BR"
              );


          return (
            comparison ===
              slug ||
            comparison ===
              nome
          );

        }
      );


    if (
      !role ||
      role.slug ===
        "sem_acesso"
    ) {

      invalid.push(
        value
      );


      continue;

    }


    resolved.push(
      role.slug
    );

  }


  if (
    invalid.length >
      0
  ) {

    throw httpError(
      400,
      "Um ou mais cargos informados são inválidos.",
      {

        invalidRoles:
          invalid,

      }
    );

  }


  return [

    ...new Set(
      resolved
    ),

  ];

}


// ============================================================
// VERIFICA RESTRIÇÃO DE CARGO
// ============================================================
//
// Também reconhece nomes antigos gravados no banco.
//
// Isso é temporário para a fase de migração.
//
// ============================================================

function matchesRoleRestriction(
  rule,
  role
) {

  const allowedRoles =
    normalizeStringArray(
      rule.allowedRoles
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


// ============================================================
// FORMATA REGRA
// ============================================================
//
// Mantemos aliases snake_case para facilitar a migração do
// frontend atual.
//
// ============================================================

function formatRule(
  rule
) {

  const allowedRoles =
    normalizeStringArray(
      rule.allowedRoles
    );


  return {

    id:
      rule.id,

    title:
      rule.title,

    description:
      rule.description,

    priority:
      rule.priority,

    icon:
      rule.icon,

    order:
      rule.order,


    // --------------------------------------------------------
    // PADRÃO DO MODEL
    // --------------------------------------------------------

    allowedRoles,


    // --------------------------------------------------------
    // COMPATIBILIDADE FRONTEND
    // --------------------------------------------------------

    allowed_cargos:
      allowedRoles,


    // --------------------------------------------------------
    // DATAS
    // --------------------------------------------------------

    createdAt:
      rule.createdAt,

    updatedAt:
      rule.updatedAt,

  };

}


// ============================================================
// LISTAR
// ============================================================
//
// GET /api/rules
//
// gerenciar_regras:
//
// → recebe todas.
//
// visualizar_regras:
//
// → recebe somente regras sem restrição ou compatíveis com
//   seu Role.slug.
//
// ============================================================

async function listar(
  req,
  res
) {

  try {

    const rules =
      await Rule.findAll({

        order: [

          [
            "order",
            "ASC",
          ],

          [
            "createdAt",
            "ASC",
          ],

        ],

      });


    // ========================================================
    // GERENCIADOR
    // ========================================================

    const canManage =
      hasPermission(
        req,
        "gerenciar_regras"
      );


    if (
      canManage
    ) {

      return res.json({

        rules:
          rules.map(
            formatRule
          ),

      });

    }


    // ========================================================
    // USUÁRIO COMUM
    // ========================================================

    const role =
      getUserRole(
        req
      );


    const visibleRules =
      rules.filter(
        (
          rule
        ) =>
          matchesRoleRestriction(
            rule,
            role
          )
      );


    return res.json({

      rules:
        visibleRules.map(
          formatRule
        ),

    });

  } catch (
    error
  ) {

    console.error(
      "[RuleController] listar:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          "Erro ao listar regras.",

      });

  }

}


// ============================================================
// CRIAR
// ============================================================
//
// POST /api/rules
//
// Permission:
//
// gerenciar_regras
//
// ============================================================

async function criar(
  req,
  res
) {

  try {

    const body =
      req.body ||
      {};


    // ========================================================
    // TITLE
    // ========================================================

    const title =
      normalizeText(
        body.title
      );


    if (
      !title
    ) {

      throw httpError(
        400,
        "Título da regra é obrigatório."
      );

    }


    // ========================================================
    // DESCRIPTION
    // ========================================================

    const description =
      normalizeText(
        body.description
      );


    if (
      !description
    ) {

      throw httpError(
        400,
        "Descrição da regra é obrigatória."
      );

    }


    // ========================================================
    // PRIORITY
    // ========================================================

    const priority =
      normalizeText(
        body.priority ||
        "Média"
      );


    if (
      !RULE_PRIORITIES.includes(
        priority
      )
    ) {

      throw httpError(
        400,
        `Prioridade inválida. Utilize: ${RULE_PRIORITIES.join(
          ", "
        )}.`
      );

    }


    // ========================================================
    // ICON
    // ========================================================

    const icon =
      normalizeText(
        body.icon
      ) ||
      "scroll";


    // ========================================================
    // ORDER
    // ========================================================

    const order =
      Number(
        body.order ??
        999
      );


    if (
      !Number.isFinite(
        order
      )
    ) {

      throw httpError(
        400,
        "A ordem informada é inválida."
      );

    }


    // ========================================================
    // ALLOWED ROLES
    // ========================================================

    const rolesInput =
      body.allowedRoles ??
      body.allowed_cargos ??
      [];


    const allowedRoles =
      await resolveAllowedRoles(
        rolesInput
      );


    // ========================================================
    // CRIA
    // ========================================================

    const rule =
      await Rule.create({

        title,

        description,

        priority,

        icon,

        order,

        allowedRoles,

      });


    return res
      .status(201)
      .json({

        message:
          "Regra criada com sucesso.",

        rule:
          formatRule(
            rule
          ),

      });

  } catch (
    error
  ) {

    console.error(
      "[RuleController] criar:",
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
          "Erro ao criar regra.",

        ...(
          error.data ||
          {}
        ),

      });

  }

}


// ============================================================
// ATUALIZAR
// ============================================================
//
// PUT /api/rules/:id
//
// Atualização parcial.
//
// Campos omitidos permanecem intactos.
//
// ============================================================

async function atualizar(
  req,
  res
) {

  try {

    const ruleId =
      normalizeId(
        req.params.id
      );


    if (
      !ruleId
    ) {

      throw httpError(
        400,
        "ID da regra inválido."
      );

    }


    const rule =
      await Rule.findByPk(
        ruleId
      );


    if (
      !rule
    ) {

      throw httpError(
        404,
        "Regra não encontrada."
      );

    }


    const body =
      req.body ||
      {};


    // ========================================================
    // TITLE
    // ========================================================

    if (
      body.title !==
      undefined
    ) {

      const title =
        normalizeText(
          body.title
        );


      if (
        !title
      ) {

        throw httpError(
          400,
          "O título da regra não pode ficar vazio."
        );

      }


      rule.title =
        title;

    }


    // ========================================================
    // DESCRIPTION
    // ========================================================

    if (
      body.description !==
      undefined
    ) {

      const description =
        normalizeText(
          body.description
        );


      if (
        !description
      ) {

        throw httpError(
          400,
          "A descrição da regra não pode ficar vazia."
        );

      }


      rule.description =
        description;

    }


    // ========================================================
    // PRIORITY
    // ========================================================

    if (
      body.priority !==
      undefined
    ) {

      const priority =
        normalizeText(
          body.priority
        );


      if (
        !RULE_PRIORITIES.includes(
          priority
        )
      ) {

        throw httpError(
          400,
          `Prioridade inválida. Utilize: ${RULE_PRIORITIES.join(
            ", "
          )}.`
        );

      }


      rule.priority =
        priority;

    }


    // ========================================================
    // ICON
    // ========================================================

    if (
      body.icon !==
      undefined
    ) {

      rule.icon =
        normalizeText(
          body.icon
        ) ||
        "scroll";

    }


    // ========================================================
    // ORDER
    // ========================================================

    if (
      body.order !==
      undefined
    ) {

      const order =
        Number(
          body.order
        );


      if (
        !Number.isFinite(
          order
        )
      ) {

        throw httpError(
          400,
          "A ordem informada é inválida."
        );

      }


      rule.order =
        order;

    }


    // ========================================================
    // ALLOWED ROLES
    // ========================================================

    const rolesInput =
      body.allowedRoles ??
      body.allowed_cargos;


    if (
      rolesInput !==
      undefined
    ) {

      rule.allowedRoles =
        await resolveAllowedRoles(
          rolesInput
        );

    }


    // ========================================================
    // SALVA
    // ========================================================

    await rule.save();


    return res.json({

      message:
        "Regra atualizada com sucesso.",

      rule:
        formatRule(
          rule
        ),

    });

  } catch (
    error
  ) {

    console.error(
      "[RuleController] atualizar:",
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
          "Erro ao atualizar regra.",

        ...(
          error.data ||
          {}
        ),

      });

  }

}


// ============================================================
// EXCLUIR
// ============================================================
//
// DELETE /api/rules/:id
//
// ============================================================

async function excluir(
  req,
  res
) {

  try {

    const ruleId =
      normalizeId(
        req.params.id
      );


    if (
      !ruleId
    ) {

      throw httpError(
        400,
        "ID da regra inválido."
      );

    }


    const rule =
      await Rule.findByPk(
        ruleId
      );


    if (
      !rule
    ) {

      throw httpError(
        404,
        "Regra não encontrada."
      );

    }


    await rule.destroy();


    return res.json({

      message:
        "Regra removida com sucesso.",

    });

  } catch (
    error
  ) {

    console.error(
      "[RuleController] excluir:",
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
          "Erro ao excluir regra.",

      });

  }

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  listar,

  criar,

  atualizar,

  excluir,

};