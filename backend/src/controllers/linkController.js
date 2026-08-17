// ============================================================
// CONTROLLER DE LINKS
// ============================================================
//
// Responsável por:
//
// - listar links
// - criar links
// - atualizar links
// - excluir links
// - categorias
// - vínculos diretos Usuario <-> Link
//
// AUTORIZAÇÃO DE CONTEÚDO:
//
// Para usuário comum:
//
// link ativo
//   E
//   (
//     UserLink direto
//     OU
//     [
//       cargo permitido
//       E
//       departamento permitido
//     ]
//   )
//
// Para quem possui:
//
// gerenciar_links
//
// todas as restrições de conteúdo são ignoradas e links
// inativos também são retornados.
//
// IMPORTANTE:
//
// Isso NÃO substitui RBAC das rotas.
//
// ============================================================


// ============================================================
// MODELS
// ============================================================

const {
  Link,
  LinkCategory,
  UserLink,
  Usuario,
  Membro,
  Role,
  Department,
} =
  require("../models");


// ============================================================
// DATABASE
// ============================================================

const sequelize =
  require("../config/database");


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
// TEXTO OPCIONAL
// ------------------------------------------------------------

function normalizeOptionalText(
  value
) {

  if (
    value ===
      null ||
    value ===
      undefined
  ) {

    return null;

  }


  const text =
    String(
      value
    ).trim();


  return text ||
    null;

}


// ------------------------------------------------------------
// BOOLEAN
// ------------------------------------------------------------

function normalizeBoolean(
  value
) {

  if (
    typeof value ===
    "boolean"
  ) {

    return value;

  }


  if (
    value === 1 ||
    value === "1" ||
    value === "true"
  ) {

    return true;

  }


  if (
    value === 0 ||
    value === "0" ||
    value === "false"
  ) {

    return false;

  }


  return null;

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
// SLUG
// ------------------------------------------------------------

function generateSlug(
  value
) {

  return normalizeText(
    value
  )
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );

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
// POSSUI ALGUMA PERMISSÃO
// ------------------------------------------------------------

function hasAnyPermission(
  req,
  slugs
) {

  return slugs.some(
    (
      slug
    ) =>
      hasPermission(
        req,
        slug
      )
  );

}


// ------------------------------------------------------------
// FORMATA LINK
// ------------------------------------------------------------

function formatLink(
  link
) {

  const categories =
    Array.isArray(
      link?.LinkCategories
    )
      ? link.LinkCategories
      : [];


  const allowedRoles =
    normalizeStringArray(
      link?.allowedRoles
    );


  const allowedDepartments =
    normalizeStringArray(
      link?.allowedDepartments
    );


  return {

    id:
      link.id,

    title:
      link.title,

    url:
      link.url,

    description:
      link.description,

    icon:
      link.icon,

    // --------------------------------------------------------
    // snake_case usado atualmente pelo frontend
    // --------------------------------------------------------

    is_active:
      Boolean(
        link.isActive
      ),

    is_featured:
      Boolean(
        link.isFeatured
      ),

    allowed_cargos:
      allowedRoles,

    allowed_departments:
      allowedDepartments,


    // --------------------------------------------------------
    // aliases camelCase durante a migração
    // --------------------------------------------------------

    isActive:
      Boolean(
        link.isActive
      ),

    isFeatured:
      Boolean(
        link.isFeatured
      ),

    allowedRoles,

    allowedDepartments,


    // --------------------------------------------------------
    // DEMAIS CAMPOS
    // --------------------------------------------------------

    order:
      link.order,

    categories:
      categories.map(
        (
          category
        ) =>
          category.name
      ),

    createdAt:
      link.createdAt,

    updatedAt:
      link.updatedAt,

  };

}


// ------------------------------------------------------------
// INCLUDE PADRÃO
// ------------------------------------------------------------

function getLinkInclude() {

  return [

    {
      model:
        LinkCategory,

      through: {
        attributes:
          [],
      },
    },

  ];

}


// ============================================================
// NORMALIZA ROLES PERMITIDOS
// ============================================================
//
// PADRÃO CANÔNICO:
//
// [
//   "administrador",
//   "lideranca"
// ]
//
// Ainda aceitamos nomes antigos:
//
// [
//   "Administrador",
//   "Liderança"
// ]
//
// e os convertemos para Role.slug.
//
// ============================================================

async function resolveAllowedRoles(
  values,
  transaction = null
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

      transaction,

    });


  const result =
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
              item.slug ||
              ""
            ).toLocaleLowerCase(
              "pt-BR"
            );


          const nome =
            String(
              item.nome ||
              ""
            ).toLocaleLowerCase(
              "pt-BR"
            );


          return (
            slug ===
              comparison ||
            nome ===
              comparison
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


    result.push(
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
      result
    ),
  ];

}


// ============================================================
// NORMALIZA DEPARTAMENTOS PERMITIDOS
// ============================================================
//
// PADRÃO ATUAL:
//
// Department.nome
//
// ============================================================

async function resolveAllowedDepartments(
  values,
  transaction = null
) {

  if (
    !Array.isArray(
      values
    )
  ) {

    throw httpError(
      400,
      "Departamentos permitidos deve ser uma lista."
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


  const departments =
    await Department.findAll({

      attributes: [
        "id",
        "nome",
      ],

      transaction,

    });


  const result =
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


    const department =
      departments.find(
        (
          item
        ) =>
          String(
            item.nome ||
            ""
          ).toLocaleLowerCase(
            "pt-BR"
          ) ===
          comparison
      );


    if (
      !department
    ) {

      invalid.push(
        value
      );

      continue;

    }


    result.push(
      department.nome
    );

  }


  if (
    invalid.length >
      0
  ) {

    throw httpError(
      400,
      "Um ou mais departamentos informados não existem.",
      {
        invalidDepartments:
          invalid,
      }
    );

  }


  return [
    ...new Set(
      result
    ),
  ];

}


// ============================================================
// RESOLVE CATEGORIAS
// ============================================================

async function resolveCategories(
  values,
  transaction = null
) {

  if (
    !Array.isArray(
      values
    )
  ) {

    throw httpError(
      400,
      "Categorias deve ser uma lista."
    );

  }


  const names =
    normalizeStringArray(
      values
    );


  if (
    names.length ===
      0
  ) {

    return [];

  }


  const allCategories =
    await LinkCategory.findAll({

      transaction,

    });


  const resolved =
    [];


  const invalid =
    [];


  for (
    const name
    of names
  ) {

    const comparison =
      name.toLocaleLowerCase(
        "pt-BR"
      );


    const category =
      allCategories.find(
        (
          item
        ) =>
          String(
            item.name ||
            ""
          ).toLocaleLowerCase(
            "pt-BR"
          ) ===
          comparison
      );


    if (
      !category
    ) {

      invalid.push(
        name
      );

      continue;

    }


    resolved.push(
      category
    );

  }


  if (
    invalid.length >
      0
  ) {

    throw httpError(
      400,
      "Uma ou mais categorias informadas não existem.",
      {
        invalidCategories:
          invalid,
      }
    );

  }


  return resolved;

}


// ============================================================
// VERIFICA RESTRIÇÃO DE ROLE
// ============================================================
//
// Também reconhece Role.nome temporariamente para registros
// legados ainda não migrados.
//
// ============================================================

function matchesRoleRestriction(
  link,
  role
) {

  const allowedRoles =
    normalizeStringArray(
      link.allowedRoles
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
      role.slug ||
      ""
    );


  const roleName =
    String(
      role.nome ||
      ""
    );


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
// VERIFICA RESTRIÇÃO DE DEPARTAMENTO
// ============================================================

function matchesDepartmentRestriction(
  link,
  userDepartments
) {

  const allowedDepartments =
    normalizeStringArray(
      link.allowedDepartments
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
// LISTAR LINKS
// ============================================================
//
// GET /api/links
//
// Usuário com gerenciar_links:
//
// - vê links ativos
// - vê links inativos
// - ignora allowedRoles
// - ignora allowedDepartments
//
// Usuário comum:
//
// - somente links ativos
// - UserLink funciona como concessão direta
// - sem UserLink, precisa atender às restrições
//
// ============================================================

async function listar(
  req,
  res
) {

  try {

    const usuarioId =
      normalizeId(
        req.usuario?.id ||
        req.user?.id
      );


    if (
      !usuarioId
    ) {

      return res
        .status(401)
        .json({

          message:
            "Usuário não autenticado.",

        });

    }


    const elevated =
      hasPermission(
        req,
        "gerenciar_links"
      );


    // ========================================================
    // CONSULTAS
    // ========================================================

    const [
      links,
      userLinks,
      membro,
    ] =
      await Promise.all([

        Link.findAll({

          include:
            getLinkInclude(),

          order: [

            [
              "order",
              "ASC",
            ],

            [
              "createdAt",
              "DESC",
            ],

          ],

        }),


        // ----------------------------------------------------
        // VÍNCULOS DIRETOS
        // ----------------------------------------------------

        UserLink.findAll({

          where: {
            usuarioId,
          },

          attributes: [
            "linkId",
          ],

        }),


        // ----------------------------------------------------
        // DEPARTAMENTOS DO USUÁRIO
        // ----------------------------------------------------

        Membro.findOne({

          where: {
            usuarioId,
          },

          attributes: [
            "departamentos",
          ],

        }),

      ]);


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


    const userDepartments =
      normalizeStringArray(
        membro?.departamentos
      );


    const role =
      getUserRole(
        req
      );


    // ========================================================
    // FILTRAGEM
    // ========================================================

    const visibleLinks =
      links.filter(
        (
          link
        ) => {

          // --------------------------------------------------
          // GERENCIADOR DE LINKS
          // --------------------------------------------------
          //
          // Vê tudo, inclusive inativos.
          //
          // --------------------------------------------------

          if (
            elevated
          ) {

            return true;

          }


          // --------------------------------------------------
          // USUÁRIO COMUM NÃO VÊ INATIVOS
          // --------------------------------------------------

          if (
            !link.isActive
          ) {

            return false;

          }


          // --------------------------------------------------
          // CONCESSÃO DIRETA
          // --------------------------------------------------
          //
          // UserLink substitui as restrições de cargo e
          // departamento.
          //
          // Não substitui isActive.
          //
          // --------------------------------------------------

          if (
            directLinkIds.has(
              Number(
                link.id
              )
            )
          ) {

            return true;

          }


          // --------------------------------------------------
          // RESTRIÇÃO POR CARGO
          // --------------------------------------------------

          const roleAllowed =
            matchesRoleRestriction(
              link,
              role
            );


          if (
            !roleAllowed
          ) {

            return false;

          }


          // --------------------------------------------------
          // RESTRIÇÃO POR DEPARTAMENTO
          // --------------------------------------------------

          const departmentAllowed =
            matchesDepartmentRestriction(
              link,
              userDepartments
            );


          if (
            !departmentAllowed
          ) {

            return false;

          }


          return true;

        }
      );


    // ========================================================
    // RESPOSTA
    // ========================================================

    return res.json({

      links:
        visibleLinks.map(
          formatLink
        ),

    });

  } catch (
    error
  ) {

    console.error(
      "[LinkController] listar:",
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
          "Erro ao listar links.",

        ...(
          error.data ||
          {}
        ),

      });

  }

}


// ============================================================
// CRIAR LINK
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
    // CAMPOS OBRIGATÓRIOS
    // ========================================================

    const title =
      normalizeText(
        body.title
      );


    const url =
      normalizeText(
        body.url
      );


    if (
      !title
    ) {

      throw httpError(
        400,
        "Título do link é obrigatório."
      );

    }


    if (
      !url
    ) {

      throw httpError(
        400,
        "URL do link é obrigatória."
      );

    }


    // ========================================================
    // BOOLEANOS
    // ========================================================

    const activeInput =
      body.is_active ??
      body.isActive;


    const featuredInput =
      body.is_featured ??
      body.isFeatured;


    let isActive =
      true;


    let isFeatured =
      false;


    if (
      activeInput !==
      undefined
    ) {

      isActive =
        normalizeBoolean(
          activeInput
        );


      if (
        isActive ===
        null
      ) {

        throw httpError(
          400,
          'O campo "is_active" deve ser booleano.'
        );

      }

    }


    if (
      featuredInput !==
      undefined
    ) {

      isFeatured =
        normalizeBoolean(
          featuredInput
        );


      if (
        isFeatured ===
        null
      ) {

        throw httpError(
          400,
          'O campo "is_featured" deve ser booleano.'
        );

      }

    }


    // ========================================================
    // ORDEM
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
    // INPUTS DE RESTRIÇÃO
    // ========================================================

    const rolesInput =
      body.allowed_cargos ??
      body.allowedRoles ??
      [];


    const departmentsInput =
      body.allowed_departments ??
      body.allowedDepartments ??
      [];


    const categoriesInput =
      body.categories ??
      [];


    // ========================================================
    // TRANSAÇÃO
    // ========================================================

    const createdLink =
      await sequelize.transaction(
        async (
          transaction
        ) => {

          // --------------------------------------------------
          // ROLES → SLUG
          // --------------------------------------------------

          const allowedRoles =
            await resolveAllowedRoles(
              rolesInput,
              transaction
            );


          // --------------------------------------------------
          // DEPARTAMENTOS → NOME CANÔNICO
          // --------------------------------------------------

          const allowedDepartments =
            await resolveAllowedDepartments(
              departmentsInput,
              transaction
            );


          // --------------------------------------------------
          // CATEGORIAS
          // --------------------------------------------------

          const categories =
            await resolveCategories(
              categoriesInput,
              transaction
            );


          // --------------------------------------------------
          // LINK
          // --------------------------------------------------

          const link =
            await Link.create(
              {

                title,

                url,

                description:
                  normalizeOptionalText(
                    body.description
                  ),

                icon:
                  normalizeText(
                    body.icon
                  ) ||
                  "link",

                isActive,

                isFeatured,

                order,

                allowedRoles,

                allowedDepartments,

              },
              {
                transaction,
              }
            );


          // --------------------------------------------------
          // CATEGORIAS
          // --------------------------------------------------

          await link.setLinkCategories(
            categories,
            {
              transaction,
            }
          );


          return link;

        }
      );


    // ========================================================
    // RECARREGA
    // ========================================================

    const completeLink =
      await Link.findByPk(
        createdLink.id,
        {

          include:
            getLinkInclude(),

        }
      );


    return res
      .status(201)
      .json({

        message:
          "Link criado com sucesso.",

        link:
          formatLink(
            completeLink
          ),

      });

  } catch (
    error
  ) {

    console.error(
      "[LinkController] criar:",
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
          "Erro ao criar link.",

        ...(
          error.data ||
          {}
        ),

      });

  }

}


// ============================================================
// ATUALIZAR LINK
// ============================================================

async function atualizar(
  req,
  res
) {

  try {

    const linkId =
      normalizeId(
        req.params.id
      );


    if (
      !linkId
    ) {

      throw httpError(
        400,
        "ID do link inválido."
      );

    }


    const body =
      req.body ||
      {};


    await sequelize.transaction(
      async (
        transaction
      ) => {

        const link =
          await Link.findByPk(
            linkId,
            {
              transaction,
            }
          );


        if (
          !link
        ) {

          throw httpError(
            404,
            "Link não encontrado."
          );

        }


        // ====================================================
        // TITLE
        // ====================================================

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
              "O título do link não pode ficar vazio."
            );

          }


          link.title =
            title;

        }


        // ====================================================
        // URL
        // ====================================================

        if (
          body.url !==
          undefined
        ) {

          const url =
            normalizeText(
              body.url
            );


          if (
            !url
          ) {

            throw httpError(
              400,
              "A URL do link não pode ficar vazia."
            );

          }


          link.url =
            url;

        }


        // ====================================================
        // DESCRIPTION
        // ====================================================

        if (
          body.description !==
          undefined
        ) {

          link.description =
            normalizeOptionalText(
              body.description
            );

        }


        // ====================================================
        // ICON
        // ====================================================

        if (
          body.icon !==
          undefined
        ) {

          link.icon =
            normalizeText(
              body.icon
            ) ||
            "link";

        }


        // ====================================================
        // ATIVO
        // ====================================================

        const activeInput =
          body.is_active ??
          body.isActive;


        if (
          activeInput !==
          undefined
        ) {

          const value =
            normalizeBoolean(
              activeInput
            );


          if (
            value ===
            null
          ) {

            throw httpError(
              400,
              'O campo "is_active" deve ser booleano.'
            );

          }


          link.isActive =
            value;

        }


        // ====================================================
        // FEATURED
        // ====================================================

        const featuredInput =
          body.is_featured ??
          body.isFeatured;


        if (
          featuredInput !==
          undefined
        ) {

          const value =
            normalizeBoolean(
              featuredInput
            );


          if (
            value ===
            null
          ) {

            throw httpError(
              400,
              'O campo "is_featured" deve ser booleano.'
            );

          }


          link.isFeatured =
            value;

        }


        // ====================================================
        // ORDER
        // ====================================================

        if (
          body.order !==
          undefined
        ) {

          const value =
            Number(
              body.order
            );


          if (
            !Number.isFinite(
              value
            )
          ) {

            throw httpError(
              400,
              "A ordem informada é inválida."
            );

          }


          link.order =
            value;

        }


        // ====================================================
        // ALLOWED ROLES
        // ====================================================

        const rolesInput =
          body.allowed_cargos ??
          body.allowedRoles;


        if (
          rolesInput !==
          undefined
        ) {

          link.allowedRoles =
            await resolveAllowedRoles(
              rolesInput,
              transaction
            );

        }


        // ====================================================
        // ALLOWED DEPARTMENTS
        // ====================================================

        const departmentsInput =
          body.allowed_departments ??
          body.allowedDepartments;


        if (
          departmentsInput !==
          undefined
        ) {

          link.allowedDepartments =
            await resolveAllowedDepartments(
              departmentsInput,
              transaction
            );

        }


        // ====================================================
        // SALVA
        // ====================================================

        await link.save({
          transaction,
        });


        // ====================================================
        // CATEGORIAS
        // ====================================================

        if (
          body.categories !==
          undefined
        ) {

          const categories =
            await resolveCategories(
              body.categories,
              transaction
            );


          await link.setLinkCategories(
            categories,
            {
              transaction,
            }
          );

        }

      }
    );


    // ========================================================
    // RETORNO
    // ========================================================

    const updated =
      await Link.findByPk(
        linkId,
        {

          include:
            getLinkInclude(),

        }
      );


    return res.json({

      message:
        "Link atualizado com sucesso.",

      link:
        formatLink(
          updated
        ),

    });

  } catch (
    error
  ) {

    console.error(
      "[LinkController] atualizar:",
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
          "Erro ao atualizar link.",

        ...(
          error.data ||
          {}
        ),

      });

  }

}


// ============================================================
// EXCLUIR LINK
// ============================================================

async function excluir(
  req,
  res
) {

  try {

    const linkId =
      normalizeId(
        req.params.id
      );


    if (
      !linkId
    ) {

      throw httpError(
        400,
        "ID do link inválido."
      );

    }


    await sequelize.transaction(
      async (
        transaction
      ) => {

        const link =
          await Link.findByPk(
            linkId,
            {
              transaction,
            }
          );


        if (
          !link
        ) {

          throw httpError(
            404,
            "Link não encontrado."
          );

        }


        // ----------------------------------------------------
        // VÍNCULOS DIRETOS
        // ----------------------------------------------------

        await UserLink.destroy({

          where: {
            linkId,
          },

          transaction,

        });


        // ----------------------------------------------------
        // CATEGORIAS
        // ----------------------------------------------------

        await link.setLinkCategories(
          [],
          {
            transaction,
          }
        );


        // ----------------------------------------------------
        // LINK
        // ----------------------------------------------------

        await link.destroy({
          transaction,
        });

      }
    );


    return res.json({

      message:
        "Link excluído com sucesso.",

    });

  } catch (
    error
  ) {

    console.error(
      "[LinkController] excluir:",
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
          "Erro ao excluir link.",

      });

  }

}


// ============================================================
// LISTAR CATEGORIAS
// ============================================================

async function listarCategorias(
  req,
  res
) {

  try {

    const categories =
      await LinkCategory.findAll({

        order: [

          [
            "order",
            "ASC",
          ],

          [
            "name",
            "ASC",
          ],

        ],

      });


    return res.json({

      categories,

    });

  } catch (
    error
  ) {

    console.error(
      "[LinkController] listarCategorias:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          "Erro ao listar categorias.",

      });

  }

}


// ============================================================
// CRIAR CATEGORIA
// ============================================================

async function criarCategoria(
  req,
  res
) {

  try {

    const name =
      normalizeText(
        req.body.name
      );


    if (
      !name
    ) {

      return res
        .status(400)
        .json({

          message:
            "Nome da categoria é obrigatório.",

        });

    }


    const slug =
      generateSlug(
        req.body.slug ||
        name
      );


    if (
      !slug
    ) {

      return res
        .status(400)
        .json({

          message:
            "Slug da categoria é inválido.",

        });

    }


    const order =
      Number(
        req.body.order ??
        999
      );


    if (
      !Number.isFinite(
        order
      )
    ) {

      return res
        .status(400)
        .json({

          message:
            "A ordem da categoria é inválida.",

        });

    }


    const duplicate =
      await LinkCategory.findOne({

        where: {
          slug,
        },

      });


    if (
      duplicate
    ) {

      return res
        .status(409)
        .json({

          message:
            "Já existe uma categoria com esse slug.",

        });

    }


    const category =
      await LinkCategory.create({

        name,

        slug,

        icon:
          normalizeText(
            req.body.icon
          ) ||
          "link",

        order,

      });


    return res
      .status(201)
      .json({

        message:
          "Categoria criada com sucesso.",

        category,

      });

  } catch (
    error
  ) {

    console.error(
      "[LinkController] criarCategoria:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro ao criar categoria.",

      });

  }

}


// ============================================================
// ATUALIZAR CATEGORIA
// ============================================================

async function atualizarCategoria(
  req,
  res
) {

  try {

    const categoryId =
      normalizeId(
        req.params.id
      );


    if (
      !categoryId
    ) {

      return res
        .status(400)
        .json({

          message:
            "ID da categoria inválido.",

        });

    }


    const category =
      await LinkCategory.findByPk(
        categoryId
      );


    if (
      !category
    ) {

      return res
        .status(404)
        .json({

          message:
            "Categoria não encontrada.",

        });

    }


    // ========================================================
    // NAME
    // ========================================================

    if (
      req.body.name !==
      undefined
    ) {

      const name =
        normalizeText(
          req.body.name
        );


      if (
        !name
      ) {

        return res
          .status(400)
          .json({

            message:
              "Nome da categoria não pode ficar vazio.",

          });

      }


      category.name =
        name;

    }


    // ========================================================
    // SLUG
    // ========================================================

    if (
      req.body.slug !==
      undefined ||
      req.body.name !==
      undefined
    ) {

      const slug =
        generateSlug(
          req.body.slug ??
          category.name
        );


      if (
        !slug
      ) {

        return res
          .status(400)
          .json({

            message:
              "Slug da categoria é inválido.",

          });

      }


      const duplicate =
        await LinkCategory.findOne({

          where: {
            slug,
          },

        });


      if (
        duplicate &&
        duplicate.id !==
          category.id
      ) {

        return res
          .status(409)
          .json({

            message:
              "Já existe uma categoria com esse slug.",

          });

      }


      category.slug =
        slug;

    }


    // ========================================================
    // ICON
    // ========================================================

    if (
      req.body.icon !==
      undefined
    ) {

      category.icon =
        normalizeText(
          req.body.icon
        ) ||
        "link";

    }


    // ========================================================
    // ORDER
    // ========================================================

    if (
      req.body.order !==
      undefined
    ) {

      const order =
        Number(
          req.body.order
        );


      if (
        !Number.isFinite(
          order
        )
      ) {

        return res
          .status(400)
          .json({

            message:
              "A ordem da categoria é inválida.",

          });

      }


      category.order =
        order;

    }


    await category.save();


    return res.json({

      message:
        "Categoria atualizada com sucesso.",

      category,

    });

  } catch (
    error
  ) {

    console.error(
      "[LinkController] atualizarCategoria:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro ao atualizar categoria.",

      });

  }

}


// ============================================================
// EXCLUIR CATEGORIA
// ============================================================

async function excluirCategoria(
  req,
  res
) {

  try {

    const categoryId =
      normalizeId(
        req.params.id
      );


    if (
      !categoryId
    ) {

      return res
        .status(400)
        .json({

          message:
            "ID da categoria inválido.",

        });

    }


    const category =
      await LinkCategory.findByPk(
        categoryId
      );


    if (
      !category
    ) {

      return res
        .status(404)
        .json({

          message:
            "Categoria não encontrada.",

        });

    }


    await category.setLinks(
      []
    );


    await category.destroy();


    return res.json({

      message:
        "Categoria removida com sucesso.",

    });

  } catch (
    error
  ) {

    console.error(
      "[LinkController] excluirCategoria:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro ao excluir categoria.",

      });

  }

}


// ============================================================
// LISTAR USER LINKS
// ============================================================
//
// GET /api/links/user-links
//
// GET /api/links/user-links?usuarioId=123
//
// Usuário comum:
// → pode consultar apenas os próprios vínculos.
//
// gerenciar_usuarios OU gerenciar_links:
// → pode consultar outro usuário.
//
// ============================================================

async function listarUserLinks(
  req,
  res
) {

  try {

    const authenticatedUserId =
      normalizeId(
        req.usuario?.id ||
        req.user?.id
      );


    if (
      !authenticatedUserId
    ) {

      return res
        .status(401)
        .json({

          message:
            "Usuário não autenticado.",

        });

    }


    const requestedUserId =
      req.query.usuarioId !==
        undefined

        ? normalizeId(
            req.query.usuarioId
          )

        : authenticatedUserId;


    if (
      !requestedUserId
    ) {

      return res
        .status(400)
        .json({

          message:
            "ID de usuário inválido.",

        });

    }


    const canManage =
      hasAnyPermission(
        req,
        [
          "gerenciar_usuarios",
          "gerenciar_links",
        ]
      );


    if (
      requestedUserId !==
        authenticatedUserId &&
      !canManage
    ) {

      return res
        .status(403)
        .json({

          message:
            "Você não pode consultar os links de outro usuário.",

        });

    }


    const rows =
      await UserLink.findAll({

        where: {
          usuarioId:
            requestedUserId,
        },

        order: [
          [
            "linkId",
            "ASC",
          ],
        ],

      });


    const userLinks =
      rows.map(
        (
          row
        ) => ({

          usuarioId:
            row.usuarioId,

          linkId:
            row.linkId,

          // Compatibilidade
          user_id:
            row.usuarioId,

          link_id:
            row.linkId,

        })
      );


    return res.json({
      userLinks,
    });

  } catch (
    error
  ) {

    console.error(
      "[LinkController] listarUserLinks:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          "Erro ao consultar links do usuário.",

      });

  }

}


// ============================================================
// ATRIBUIR USER LINK
// ============================================================
//
// POST /api/links/user-links
//
// Body:
//
// {
//   usuarioId: 1,
//   linkId: 5
// }
//
// gerenciar_usuarios OU gerenciar_links.
//
// ============================================================

async function atribuirUserLink(
  req,
  res
) {

  try {

    if (
      !hasAnyPermission(
        req,
        [
          "gerenciar_usuarios",
          "gerenciar_links",
        ]
      )
    ) {

      return res
        .status(403)
        .json({

          message:
            "Você não possui permissão para atribuir links diretamente a usuários.",

        });

    }


    const usuarioId =
      normalizeId(
        req.body.usuarioId
      );


    const linkId =
      normalizeId(
        req.body.linkId
      );


    if (
      !usuarioId ||
      !linkId
    ) {

      return res
        .status(400)
        .json({

          message:
            "usuarioId e linkId válidos são obrigatórios.",

        });

    }


    const [
      usuario,
      link,
    ] =
      await Promise.all([

        Usuario.findByPk(
          usuarioId
        ),

        Link.findByPk(
          linkId
        ),

      ]);


    if (
      !usuario
    ) {

      return res
        .status(404)
        .json({

          message:
            "Usuário não encontrado.",

        });

    }


    if (
      !link
    ) {

      return res
        .status(404)
        .json({

          message:
            "Link não encontrado.",

        });

    }


    const [
      userLink,
      created,
    ] =
      await UserLink.findOrCreate({

        where: {
          usuarioId,
          linkId,
        },

        defaults: {
          usuarioId,
          linkId,
        },

      });


    return res
      .status(
        created
          ? 201
          : 200
      )
      .json({

        message:
          created
            ? "Link atribuído ao usuário."
            : "O usuário já possui esse vínculo.",

        userLink,

      });

  } catch (
    error
  ) {

    console.error(
      "[LinkController] atribuirUserLink:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro ao atribuir link ao usuário.",

      });

  }

}


// ============================================================
// REMOVER USER LINK
// ============================================================
//
// DELETE /api/links/user-links/:usuarioId/:linkId
//
// ============================================================

async function removerUserLink(
  req,
  res
) {

  try {

    if (
      !hasAnyPermission(
        req,
        [
          "gerenciar_usuarios",
          "gerenciar_links",
        ]
      )
    ) {

      return res
        .status(403)
        .json({

          message:
            "Você não possui permissão para remover vínculos diretos de links.",

        });

    }


    const usuarioId =
      normalizeId(
        req.params.usuarioId
      );


    const linkId =
      normalizeId(
        req.params.linkId
      );


    if (
      !usuarioId ||
      !linkId
    ) {

      return res
        .status(400)
        .json({

          message:
            "IDs de usuário e link inválidos.",

        });

    }


    const deleted =
      await UserLink.destroy({

        where: {
          usuarioId,
          linkId,
        },

      });


    if (
      deleted ===
      0
    ) {

      return res
        .status(404)
        .json({

          message:
            "Vínculo não encontrado.",

        });

    }


    return res.json({

      message:
        "Vínculo removido com sucesso.",

    });

  } catch (
    error
  ) {

    console.error(
      "[LinkController] removerUserLink:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro ao remover vínculo.",

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

  listarCategorias,

  criarCategoria,

  atualizarCategoria,

  excluirCategoria,

  listarUserLinks,

  atribuirUserLink,

  removerUserLink,

};