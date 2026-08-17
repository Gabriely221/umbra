// ============================================================
// CONTROLLER ADMINISTRATIVO
// ============================================================
//
// Responsável por:
//
// - permissões
// - cargos / roles
// - usuários
// - departamentos
//
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

const {
  Usuario,
  Role,
  Permission,
  UserLink,
  Membro,
  Department,
  Link,
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
// ID DO USUÁRIO AUTENTICADO
// ------------------------------------------------------------

function getAuthenticatedUserId(
  req
) {

  return (
    req.usuario?.id ||
    req.user?.id ||
    null
  );

}


// ------------------------------------------------------------
// NORMALIZA BOOLEANO
// ------------------------------------------------------------
//
// Retorna:
//
// true
// false
// null -> valor inválido
//
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
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  ) {

    return true;

  }


  if (
    value === false ||
    value === 0 ||
    value === "0" ||
    value === "false"
  ) {

    return false;

  }


  return null;

}


// ------------------------------------------------------------
// SLUG DE ROLE
// ------------------------------------------------------------
//
// Role.slug é utilizado como identificador persistente em:
//
// - Link.allowedRoles
// - Rule.allowedRoles
// - GalleryItem.allowedRoles
// - Organization.allowedCargos
//
// Por isso deve ser estável depois da criação.
//
// ------------------------------------------------------------

function normalizeRoleSlug(
  value
) {

  return String(
    value ??
    ""
  )
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );

}


// ------------------------------------------------------------
// SLUG DE DEPARTAMENTO
// ------------------------------------------------------------

function normalizeDepartmentSlug(
  value
) {

  return String(
    value ||
    ""
  )
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );

}


// ------------------------------------------------------------
// BUSCA USUÁRIO COMPLETO
// ------------------------------------------------------------

async function findUserWithRole(
  id
) {

  return Usuario.findByPk(
    id,
    {

      attributes: {
        exclude: [
          "senha",
        ],
      },

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

        {
          model:
            Membro,
        },

      ],

    }
  );

}


// ------------------------------------------------------------
// MEMBROS QUE USAM UM DEPARTAMENTO
// ------------------------------------------------------------

async function findMembersUsingDepartment(
  departmentName,
  transaction = null
) {

  const membros =
    await Membro.findAll({

      attributes: [
        "id",
        "departamentos",
      ],

      transaction,

    });


  return membros.filter(
    (
      membro
    ) => {

      const departamentos =
        Array.isArray(
          membro.departamentos
        )
          ? membro.departamentos
          : [];


      return departamentos.includes(
        departmentName
      );

    }
  );

}


// ------------------------------------------------------------
// RENOMEAR DEPARTAMENTO NOS MEMBROS
// ------------------------------------------------------------

async function replaceDepartmentNameInMembers(
  oldName,
  newName,
  transaction
) {

  if (
    oldName ===
    newName
  ) {

    return;

  }


  const membros =
    await findMembersUsingDepartment(
      oldName,
      transaction
    );


  for (
    const membro
    of membros
  ) {

    const departamentos =
      Array.isArray(
        membro.departamentos
      )
        ? membro.departamentos
        : [];


    membro.departamentos =
      [
        ...new Set(

          departamentos.map(
            (
              departmentName
            ) =>
              departmentName ===
              oldName

                ? newName

                : departmentName
          )

        ),
      ];


    await membro.save({
      transaction,
    });

  }

}


// ------------------------------------------------------------
// LINKS QUE USAM UM DEPARTAMENTO
// ------------------------------------------------------------
//
// Link.allowedDepartments utiliza:
//
// Department.nome[]
//
// Por isso precisamos localizar referências antes de
// renomear ou excluir um departamento.
//
// ------------------------------------------------------------

async function findLinksUsingDepartment(
  departmentName,
  transaction = null
) {

  const links =
    await Link.findAll({

      attributes: [
        "id",
        "title",
        "allowedDepartments",
      ],

      transaction,

    });


  return links.filter(
    (
      link
    ) => {

      const allowedDepartments =
        Array.isArray(
          link.allowedDepartments
        )
          ? link.allowedDepartments
          : [];


      return allowedDepartments.includes(
        departmentName
      );

    }
  );

}


// ------------------------------------------------------------
// RENOMEAR DEPARTAMENTO NOS LINKS
// ------------------------------------------------------------
//
// Link.allowedDepartments persiste Department.nome.
//
// Portanto, ao alterar:
//
// "Inteligência"
//
// para:
//
// "Inteligência Estratégica"
//
// precisamos atualizar as restrições dos links dentro da
// mesma transação.
//
// ------------------------------------------------------------

async function replaceDepartmentNameInLinks(
  oldName,
  newName,
  transaction
) {

  if (
    oldName ===
    newName
  ) {

    return;

  }


  const links =
    await findLinksUsingDepartment(
      oldName,
      transaction
    );


  for (
    const link
    of links
  ) {

    const allowedDepartments =
      Array.isArray(
        link.allowedDepartments
      )
        ? link.allowedDepartments
        : [];


    link.allowedDepartments =
      [
        ...new Set(

          allowedDepartments.map(
            (
              departmentName
            ) =>
              departmentName ===
              oldName

                ? newName

                : departmentName
          )

        ),
      ];


    await link.save({
      transaction,
    });

  }

}


// ============================================================
// PERMISSÕES
// ============================================================

async function listarPermissoes(
  req,
  res
) {

  try {

    const permissions =
      await Permission.findAll({

        order: [
          [
            "nome",
            "ASC",
          ],
        ],

      });


    return res.json({
      permissions,
    });

  } catch (
    error
  ) {

    console.error(
      "[AdminController] listarPermissoes:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          "Erro ao listar permissões.",

      });

  }

}


// ============================================================
// LISTAR ROLES
// ============================================================

async function listarRoles(
  req,
  res
) {

  try {

    const roles =
      await Role.findAll({

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

        order: [

          [
            "hierarchyOrder",
            "ASC",
          ],

          [
            "nome",
            "ASC",
          ],

        ],

      });


    return res.json({
      roles,
    });

  } catch (
    error
  ) {

    console.error(
      "[AdminController] listarRoles:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          "Erro ao listar cargos.",

      });

  }

}


// ============================================================
// CRIAR ROLE
// ============================================================
//
// O slug é definido somente na criação.
//
// Depois disso passa a funcionar como identificador
// persistente e não poderá ser alterado.
//
// ============================================================

async function criarRole(
  req,
  res
) {

  const transaction =
    await sequelize.transaction();


  try {

    const {
      nome,
      slug,
      descricao,
      hierarchyOrder,
      tierLevel,
      permissionIds,
    } =
      req.body ||
      {};


    // ========================================================
    // NOME
    // ========================================================

    const normalizedName =
      String(
        nome ??
        ""
      ).trim();


    if (
      !normalizedName
    ) {

      await transaction.rollback();


      return res
        .status(400)
        .json({

          message:
            "Nome do cargo é obrigatório.",

        });

    }


    // ========================================================
    // SLUG
    // ========================================================

    const normalizedSlug =
      normalizeRoleSlug(
        slug
      );


    if (
      !normalizedSlug
    ) {

      await transaction.rollback();


      return res
        .status(400)
        .json({

          message:
            "Slug do cargo é obrigatório e deve ser válido.",

        });

    }


    // ========================================================
    // SLUG ÚNICO
    // ========================================================

    const exists =
      await Role.findOne({

        where: {
          slug:
            normalizedSlug,
        },

        transaction,

      });


    if (
      exists
    ) {

      await transaction.rollback();


      return res
        .status(409)
        .json({

          message:
            "Esse slug já existe.",

        });

    }


    // ========================================================
    // HIERARQUIA
    // ========================================================

    const normalizedHierarchyOrder =
      Number(
        hierarchyOrder ??
        99
      );


    if (
      !Number.isFinite(
        normalizedHierarchyOrder
      )
    ) {

      await transaction.rollback();


      return res
        .status(400)
        .json({

          message:
            "hierarchyOrder inválido.",

        });

    }


    // ========================================================
    // TIER
    // ========================================================

    const normalizedTierLevel =
      Number(
        tierLevel ??
        5
      );


    if (
      !Number.isFinite(
        normalizedTierLevel
      )
    ) {

      await transaction.rollback();


      return res
        .status(400)
        .json({

          message:
            "tierLevel inválido.",

        });

    }


    // ========================================================
    // CRIA ROLE
    // ========================================================

    const role =
      await Role.create(
        {

          nome:
            normalizedName,

          slug:
            normalizedSlug,

          descricao:
            descricao
              ? String(
                  descricao
                ).trim()
              : null,

          hierarchyOrder:
            normalizedHierarchyOrder,

          tierLevel:
            normalizedTierLevel,

          isSystem:
            false,

        },
        {
          transaction,
        }
      );


    // ========================================================
    // PERMISSÕES
    // ========================================================

    if (
      Array.isArray(
        permissionIds
      )
    ) {

      const permissions =
        await Permission.findAll({

          where: {
            id:
              permissionIds,
          },

          transaction,

        });


      await role.setPermissions(
        permissions,
        {
          transaction,
        }
      );

    } else {

      await role.setPermissions(
        [],
        {
          transaction,
        }
      );

    }


    // ========================================================
    // COMMIT
    // ========================================================

    await transaction.commit();


    // ========================================================
    // RECARREGA
    // ========================================================

    const createdRole =
      await Role.findByPk(
        role.id,
        {

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

        }
      );


    return res
      .status(201)
      .json({

        message:
          "Cargo criado com sucesso.",

        role:
          createdRole,

      });

  } catch (
    error
  ) {

    try {

      await transaction.rollback();

    } catch {}


    console.error(
      "[AdminController] criarRole:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro ao criar cargo.",

      });

  }

}


// ============================================================
// ATUALIZAR ROLE
// ============================================================
//
// Role.slug é IMUTÁVEL depois da criação.
//
// Motivo:
//
// Role.slug é persistido em:
//
// - Link.allowedRoles
// - Rule.allowedRoles
// - GalleryItem.allowedRoles
// - Organization.allowedCargos
//
// Alterar um slug poderia invalidar restrições existentes.
//
// É permitido reenviar o mesmo slug.
//
// ============================================================

async function atualizarRole(
  req,
  res
) {

  const transaction =
    await sequelize.transaction();


  try {

    const roleId =
      Number(
        req.params.id
      );


    if (
      !Number.isInteger(
        roleId
      ) ||
      roleId <=
        0
    ) {

      await transaction.rollback();


      return res
        .status(400)
        .json({

          message:
            "ID do cargo inválido.",

        });

    }


    const role =
      await Role.findByPk(
        roleId,
        {
          transaction,
        }
      );


    if (
      !role
    ) {

      await transaction.rollback();


      return res
        .status(404)
        .json({

          message:
            "Cargo não encontrado.",

        });

    }


    const {
      nome,
      slug,
      descricao,
      hierarchyOrder,
      tierLevel,
      permissionIds,
    } =
      req.body ||
      {};


    // ========================================================
    // SLUG IMUTÁVEL
    // ========================================================

    if (
      slug !==
      undefined
    ) {

      const currentSlug =
        normalizeRoleSlug(
          role.slug
        );


      const requestedSlug =
        normalizeRoleSlug(
          slug
        );


      if (
        !requestedSlug
      ) {

        await transaction.rollback();


        return res
          .status(400)
          .json({

            message:
              "O slug do cargo é inválido.",

          });

      }


      if (
        requestedSlug !==
        currentSlug
      ) {

        await transaction.rollback();


        return res
          .status(400)
          .json({

            message:
              "O slug de um cargo não pode ser alterado depois da criação.",

          });

      }

    }


    // ========================================================
    // NOME
    // ========================================================

    if (
      nome !==
      undefined
    ) {

      const trimmedName =
        String(
          nome
        ).trim();


      if (
        !trimmedName
      ) {

        await transaction.rollback();


        return res
          .status(400)
          .json({

            message:
              "O nome do cargo não pode ficar vazio.",

          });

      }


      role.nome =
        trimmedName;

    }


    // ========================================================
    // DESCRIÇÃO
    // ========================================================

    if (
      descricao !==
      undefined
    ) {

      role.descricao =
        descricao
          ? String(
              descricao
            ).trim()
          : null;

    }


    // ========================================================
    // HIERARQUIA
    // ========================================================

    if (
      hierarchyOrder !==
      undefined
    ) {

      const value =
        Number(
          hierarchyOrder
        );


      if (
        !Number.isFinite(
          value
        )
      ) {

        await transaction.rollback();


        return res
          .status(400)
          .json({

            message:
              "hierarchyOrder inválido.",

          });

      }


      role.hierarchyOrder =
        value;

    }


    // ========================================================
    // TIER
    // ========================================================

    if (
      tierLevel !==
      undefined
    ) {

      const value =
        Number(
          tierLevel
        );


      if (
        !Number.isFinite(
          value
        )
      ) {

        await transaction.rollback();


        return res
          .status(400)
          .json({

            message:
              "tierLevel inválido.",

          });

      }


      role.tierLevel =
        value;

    }


    // ========================================================
    // SALVA ROLE
    // ========================================================
    //
    // role.slug propositalmente NÃO é alterado.
    //
    // ========================================================

    await role.save({
      transaction,
    });


    // ========================================================
    // PERMISSÕES
    // ========================================================

    if (
      Array.isArray(
        permissionIds
      )
    ) {

      const permissions =
        await Permission.findAll({

          where: {
            id:
              permissionIds,
          },

          transaction,

        });


      await role.setPermissions(
        permissions,
        {
          transaction,
        }
      );

    }


    // ========================================================
    // COMMIT
    // ========================================================

    await transaction.commit();


    // ========================================================
    // RECARREGA
    // ========================================================

    const updatedRole =
      await Role.findByPk(
        role.id,
        {

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

        }
      );


    return res.json({

      message:
        "Cargo atualizado com sucesso.",

      role:
        updatedRole,

    });

  } catch (
    error
  ) {

    try {

      await transaction.rollback();

    } catch {}


    console.error(
      "[AdminController] atualizarRole:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro ao atualizar cargo.",

      });

  }

}


// ============================================================
// LISTAR USUÁRIOS
// ============================================================

async function listarUsuarios(
  req,
  res
) {

  try {

    const usuarios =
      await Usuario.findAll({

        attributes: {
          exclude: [
            "senha",
          ],
        },

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

          {
            model:
              Membro,
          },

        ],

        order: [
          [
            "nome",
            "ASC",
          ],
        ],

      });


    return res.json({
      usuarios,
    });

  } catch (
    error
  ) {

    console.error(
      "[AdminController] listarUsuarios:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          "Erro ao listar usuários.",

      });

  }

}


// ============================================================
// ATUALIZAR USUÁRIO
// ============================================================

async function atualizarUsuario(
  req,
  res
) {

  try {

    const userId =
      Number(
        req.params.id
      );


    if (
      !Number.isInteger(
        userId
      ) ||
      userId <=
        0
    ) {

      return res
        .status(400)
        .json({

          message:
            "ID de usuário inválido.",

        });

    }


    const usuario =
      await Usuario.findByPk(
        userId
      );


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
      req.body.nome !==
      undefined
    ) {

      const nome =
        String(
          req.body.nome
        ).trim();


      if (
        !nome
      ) {

        return res
          .status(400)
          .json({

            message:
              "O nome do usuário não pode ficar vazio.",

          });

      }


      usuario.nome =
        nome;

    }


    await usuario.save();


    const updatedUser =
      await findUserWithRole(
        usuario.id
      );


    return res.json({

      message:
        "Usuário atualizado com sucesso.",

      usuario:
        updatedUser,

    });

  } catch (
    error
  ) {

    console.error(
      "[AdminController] atualizarUsuario:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro ao atualizar usuário.",

      });

  }

}


// ============================================================
// ALTERAR ROLE DO USUÁRIO
// ============================================================

async function atualizarRoleUsuario(
  req,
  res
) {

  try {

    const userId =
      Number(
        req.params.id
      );


    const roleId =
      Number(
        req.body.roleId
      );


    if (
      !Number.isInteger(
        userId
      ) ||
      userId <=
        0
    ) {

      return res
        .status(400)
        .json({

          message:
            "ID de usuário inválido.",

        });

    }


    if (
      !Number.isInteger(
        roleId
      ) ||
      roleId <=
        0
    ) {

      return res
        .status(400)
        .json({

          message:
            "roleId é obrigatório e deve ser válido.",

        });

    }


    const usuario =
      await Usuario.findByPk(
        userId,
        {

          include: [
            {
              model:
                Role,
            },
          ],

        }
      );


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


    const novaRole =
      await Role.findByPk(
        roleId
      );


    if (
      !novaRole
    ) {

      return res
        .status(404)
        .json({

          message:
            "Cargo não encontrado.",

        });

    }


    const oldRole =
      usuario.Role;


    // ========================================================
    // ÚLTIMO ADMINISTRADOR
    // ========================================================

    if (
      oldRole?.slug ===
        "administrador" &&
      novaRole.slug !==
        "administrador"
    ) {

      const adminCount =
        await Usuario.count({

          include: [
            {
              model:
                Role,

              where: {
                slug:
                  "administrador",
              },
            },
          ],

        });


      if (
        adminCount <=
        1
      ) {

        return res
          .status(400)
          .json({

            message:
              "O sistema precisa manter pelo menos um administrador.",

          });

      }

    }


    usuario.roleId =
      novaRole.id;


    await usuario.save();


    const updatedUser =
      await findUserWithRole(
        usuario.id
      );


    return res.json({

      message:
        "Cargo do usuário alterado com sucesso.",

      usuario:
        updatedUser,

    });

  } catch (
    error
  ) {

    console.error(
      "[AdminController] atualizarRoleUsuario:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro ao alterar cargo do usuário.",

      });

  }

}


// ============================================================
// ALTERAR STATUS DO USUÁRIO
// ============================================================

async function alterarStatusUsuario(
  req,
  res
) {

  try {

    const userId =
      Number(
        req.params.id
      );


    if (
      !Number.isInteger(
        userId
      ) ||
      userId <=
        0
    ) {

      return res
        .status(400)
        .json({

          message:
            "ID de usuário inválido.",

        });

    }


    const ativo =
      normalizeBoolean(
        req.body.ativo
      );


    if (
      ativo ===
      null
    ) {

      return res
        .status(400)
        .json({

          message:
            'O campo "ativo" deve ser true ou false.',

        });

    }


    const usuario =
      await Usuario.findByPk(
        userId
      );


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


    const authenticatedUserId =
      getAuthenticatedUserId(
        req
      );


    // ========================================================
    // AUTO-DESATIVAÇÃO
    // ========================================================

    if (
      usuario.id ===
        authenticatedUserId &&
      !ativo
    ) {

      return res
        .status(400)
        .json({

          message:
            "Você não pode desativar sua própria conta.",

        });

    }


    // ========================================================
    // ÚLTIMO ADMIN ATIVO
    // ========================================================

    if (
      !ativo
    ) {

      const role =
        await Role.findByPk(
          usuario.roleId
        );


      if (
        role?.slug ===
        "administrador"
      ) {

        const adminCount =
          await Usuario.count({

            where: {
              ativo:
                true,
            },

            include: [
              {
                model:
                  Role,

                where: {
                  slug:
                    "administrador",
                },
              },
            ],

          });


        if (
          adminCount <=
            1
        ) {

          return res
            .status(400)
            .json({

              message:
                "O sistema precisa manter pelo menos um administrador ativo.",

            });

        }

      }

    }


    usuario.ativo =
      ativo;


    await usuario.save();


    return res.json({

      message:
        "Status do usuário atualizado.",

      usuario: {

        id:
          usuario.id,

        ativo:
          usuario.ativo,

      },

    });

  } catch (
    error
  ) {

    console.error(
      "[AdminController] alterarStatusUsuario:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro ao alterar status do usuário.",

      });

  }

}


// ============================================================
// EXCLUIR USUÁRIO
// ============================================================

async function excluirUsuario(
  req,
  res
) {

  const transaction =
    await sequelize.transaction();


  try {

    const userId =
      Number(
        req.params.id
      );


    if (
      !Number.isInteger(
        userId
      ) ||
      userId <=
        0
    ) {

      await transaction.rollback();


      return res
        .status(400)
        .json({

          message:
            "ID de usuário inválido.",

        });

    }


    const authenticatedUserId =
      getAuthenticatedUserId(
        req
      );


    if (
      userId ===
      authenticatedUserId
    ) {

      await transaction.rollback();


      return res
        .status(400)
        .json({

          message:
            "Você não pode excluir sua própria conta por este painel.",

        });

    }


    const usuario =
      await Usuario.findByPk(
        userId,
        {

          include: [
            {
              model:
                Role,
            },
          ],

          transaction,

        }
      );


    if (
      !usuario
    ) {

      await transaction.rollback();


      return res
        .status(404)
        .json({

          message:
            "Usuário não encontrado.",

        });

    }


    // ========================================================
    // ÚLTIMO ADMINISTRADOR
    // ========================================================

    if (
      usuario.Role?.slug ===
      "administrador"
    ) {

      const adminCount =
        await Usuario.count({

          include: [
            {
              model:
                Role,

              where: {
                slug:
                  "administrador",
              },
            },
          ],

          transaction,

        });


      if (
        adminCount <=
        1
      ) {

        await transaction.rollback();


        return res
          .status(400)
          .json({

            message:
              "O sistema precisa manter pelo menos um administrador.",

          });

      }

    }


    // ========================================================
    // USER LINKS
    // ========================================================

    await UserLink.destroy({

      where: {
        usuarioId:
          userId,
      },

      transaction,

    });


    // ========================================================
    // MEMBRO
    // ========================================================

    await Membro.destroy({

      where: {
        usuarioId:
          userId,
      },

      transaction,

    });


    // ========================================================
    // USUÁRIO
    // ========================================================

    await usuario.destroy({
      transaction,
    });


    await transaction.commit();


    return res.json({

      message:
        "Usuário excluído com sucesso.",

    });

  } catch (
    error
  ) {

    try {

      await transaction.rollback();

    } catch {}


    console.error(
      "[AdminController] excluirUsuario:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro ao excluir usuário.",

      });

  }

}


// ============================================================
// DEPARTAMENTOS
// ============================================================


// ============================================================
// LISTAR DEPARTAMENTOS
// ============================================================
//
// GET /api/admin/departamentos
//
// Retorna ativos e inativos.
//
// ============================================================

async function listarDepartamentos(
  req,
  res
) {

  try {

    const departments =
      await Department.findAll({

        order: [

          [
            "ordem",
            "ASC",
          ],

          [
            "nome",
            "ASC",
          ],

        ],

      });


    return res.json({
      departments,
    });

  } catch (
    error
  ) {

    console.error(
      "[AdminController] listarDepartamentos:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          "Erro ao listar departamentos.",

      });

  }

}


// ============================================================
// CRIAR DEPARTAMENTO
// ============================================================
//
// POST /api/admin/departamentos
//
// Se slug não for enviado, ele é criado automaticamente.
//
// ============================================================

async function criarDepartamento(
  req,
  res
) {

  try {

    const nome =
      String(
        req.body.nome ||
        ""
      ).trim();


    if (
      !nome
    ) {

      return res
        .status(400)
        .json({

          message:
            "O nome do departamento é obrigatório.",

        });

    }


    const slug =
      normalizeDepartmentSlug(
        req.body.slug ||
        nome
      );


    if (
      !slug
    ) {

      return res
        .status(400)
        .json({

          message:
            "Não foi possível gerar um slug válido para o departamento.",

        });

    }


    // ========================================================
    // NOME DUPLICADO
    // ========================================================

    const existingName =
      await Department.findOne({

        where: {
          nome,
        },

      });


    if (
      existingName
    ) {

      return res
        .status(409)
        .json({

          message:
            "Já existe um departamento com esse nome.",

        });

    }


    // ========================================================
    // SLUG DUPLICADO
    // ========================================================

    const existingSlug =
      await Department.findOne({

        where: {
          slug,
        },

      });


    if (
      existingSlug
    ) {

      return res
        .status(409)
        .json({

          message:
            "Já existe um departamento com esse slug.",

        });

    }


    // ========================================================
    // ATIVO
    // ========================================================

    let ativo =
      true;


    if (
      req.body.ativo !==
      undefined
    ) {

      ativo =
        normalizeBoolean(
          req.body.ativo
        );


      if (
        ativo ===
        null
      ) {

        return res
          .status(400)
          .json({

            message:
              'O campo "ativo" deve ser true ou false.',

          });

      }

    }


    // ========================================================
    // ORDEM
    // ========================================================

    const ordem =
      Number(
        req.body.ordem ??
        99
      );


    if (
      !Number.isFinite(
        ordem
      )
    ) {

      return res
        .status(400)
        .json({

          message:
            "A ordem informada é inválida.",

        });

    }


    // ========================================================
    // CRIA
    // ========================================================

    const department =
      await Department.create({

        nome,

        slug,

        descricao:
          req.body.descricao
            ? String(
                req.body.descricao
              ).trim()
            : null,

        ativo,

        ordem,

      });


    return res
      .status(201)
      .json({

        message:
          "Departamento criado com sucesso.",

        department,

      });

  } catch (
    error
  ) {

    console.error(
      "[AdminController] criarDepartamento:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro ao criar departamento.",

      });

  }

}


// ============================================================
// ATUALIZAR DEPARTAMENTO
// ============================================================
//
// PUT /api/admin/departamentos/:id
//
// Department.nome é utilizado atualmente em:
//
// - Membro.departamentos
// - Link.allowedDepartments
//
// Se o nome mudar, todas as referências são atualizadas
// dentro da mesma transação.
//
// ============================================================

async function atualizarDepartamento(
  req,
  res
) {

  const transaction =
    await sequelize.transaction();


  try {

    const departmentId =
      Number(
        req.params.id
      );


    if (
      !Number.isInteger(
        departmentId
      ) ||
      departmentId <=
        0
    ) {

      await transaction.rollback();


      return res
        .status(400)
        .json({

          message:
            "ID de departamento inválido.",

        });

    }


    const department =
      await Department.findByPk(
        departmentId,
        {
          transaction,
        }
      );


    if (
      !department
    ) {

      await transaction.rollback();


      return res
        .status(404)
        .json({

          message:
            "Departamento não encontrado.",

        });

    }


    const oldName =
      department.nome;


    // ========================================================
    // NOME
    // ========================================================

    if (
      req.body.nome !==
      undefined
    ) {

      const nome =
        String(
          req.body.nome
        ).trim();


      if (
        !nome
      ) {

        await transaction.rollback();


        return res
          .status(400)
          .json({

            message:
              "O nome do departamento não pode ficar vazio.",

          });

      }


      const duplicate =
        await Department.findOne({

          where: {
            nome,
          },

          transaction,

        });


      if (
        duplicate &&
        duplicate.id !==
          department.id
      ) {

        await transaction.rollback();


        return res
          .status(409)
          .json({

            message:
              "Já existe um departamento com esse nome.",

          });

      }


      department.nome =
        nome;

    }


    // ========================================================
    // SLUG
    // ========================================================

    if (
      req.body.slug !==
      undefined
    ) {

      const slug =
        normalizeDepartmentSlug(
          req.body.slug
        );


      if (
        !slug
      ) {

        await transaction.rollback();


        return res
          .status(400)
          .json({

            message:
              "O slug informado é inválido.",

          });

      }


      const duplicate =
        await Department.findOne({

          where: {
            slug,
          },

          transaction,

        });


      if (
        duplicate &&
        duplicate.id !==
          department.id
      ) {

        await transaction.rollback();


        return res
          .status(409)
          .json({

            message:
              "Já existe um departamento com esse slug.",

          });

      }


      department.slug =
        slug;

    }


    // ========================================================
    // DESCRIÇÃO
    // ========================================================

    if (
      req.body.descricao !==
      undefined
    ) {

      department.descricao =
        req.body.descricao
          ? String(
              req.body.descricao
            ).trim()
          : null;

    }


    // ========================================================
    // ATIVO
    // ========================================================

    if (
      req.body.ativo !==
      undefined
    ) {

      const ativo =
        normalizeBoolean(
          req.body.ativo
        );


      if (
        ativo ===
        null
      ) {

        await transaction.rollback();


        return res
          .status(400)
          .json({

            message:
              'O campo "ativo" deve ser true ou false.',

          });

      }


      department.ativo =
        ativo;

    }


    // ========================================================
    // ORDEM
    // ========================================================

    if (
      req.body.ordem !==
      undefined
    ) {

      const ordem =
        Number(
          req.body.ordem
        );


      if (
        !Number.isFinite(
          ordem
        )
      ) {

        await transaction.rollback();


        return res
          .status(400)
          .json({

            message:
              "A ordem informada é inválida.",

          });

      }


      department.ordem =
        ordem;

    }


    // ========================================================
    // PROPAGA RENOMEAÇÃO
    // ========================================================
    //
    // Se qualquer atualização falhar:
    //
    // - Membro
    // - Link
    // - Department
    //
    // serão revertidos pela transaction.
    //
    // ========================================================

    if (
      department.nome !==
      oldName
    ) {

      await replaceDepartmentNameInMembers(
        oldName,
        department.nome,
        transaction
      );


      await replaceDepartmentNameInLinks(
        oldName,
        department.nome,
        transaction
      );

    }


    // ========================================================
    // SALVA DEPARTAMENTO
    // ========================================================

    await department.save({
      transaction,
    });


    await transaction.commit();


    return res.json({

      message:
        "Departamento atualizado com sucesso.",

      department,

    });

  } catch (
    error
  ) {

    try {

      await transaction.rollback();

    } catch {}


    console.error(
      "[AdminController] atualizarDepartamento:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro ao atualizar departamento.",

      });

  }

}


// ============================================================
// EXCLUIR DEPARTAMENTO
// ============================================================
//
// DELETE /api/admin/departamentos/:id
//
// A exclusão é bloqueada se o departamento estiver sendo
// utilizado por:
//
// - Membro.departamentos
// - Link.allowedDepartments
//
// Isso é especialmente importante para Links.
//
// Link.allowedDepartments = []
//
// significa:
//
// sem restrição por departamento.
//
// Portanto não podemos apagar referências silenciosamente,
// pois isso poderia ampliar acesso.
//
// ============================================================

async function excluirDepartamento(
  req,
  res
) {

  const transaction =
    await sequelize.transaction();


  try {

    const departmentId =
      Number(
        req.params.id
      );


    if (
      !Number.isInteger(
        departmentId
      ) ||
      departmentId <=
        0
    ) {

      await transaction.rollback();


      return res
        .status(400)
        .json({

          message:
            "ID de departamento inválido.",

        });

    }


    const department =
      await Department.findByPk(
        departmentId,
        {
          transaction,
        }
      );


    if (
      !department
    ) {

      await transaction.rollback();


      return res
        .status(404)
        .json({

          message:
            "Departamento não encontrado.",

        });

    }


    // ========================================================
    // MEMBROS
    // ========================================================

    const membersUsingDepartment =
      await findMembersUsingDepartment(
        department.nome,
        transaction
      );


    // ========================================================
    // LINKS
    // ========================================================

    const linksUsingDepartment =
      await findLinksUsingDepartment(
        department.nome,
        transaction
      );


    // ========================================================
    // EXISTEM REFERÊNCIAS
    // ========================================================

    if (
      membersUsingDepartment.length >
        0 ||
      linksUsingDepartment.length >
        0
    ) {

      await transaction.rollback();


      const references =
        [];


      if (
        membersUsingDepartment.length >
          0
      ) {

        references.push(
          `${membersUsingDepartment.length} membro(s)`
        );

      }


      if (
        linksUsingDepartment.length >
          0
      ) {

        references.push(
          `${linksUsingDepartment.length} link(s)`
        );

      }


      return res
        .status(409)
        .json({

          message:
            `O departamento está sendo utilizado por ${references.join(
              " e "
            )}. Remova essas associações ou desative o departamento antes de excluí-lo.`,

          memberCount:
            membersUsingDepartment.length,

          linkCount:
            linksUsingDepartment.length,

          links:
            linksUsingDepartment.map(
              (
                link
              ) => ({

                id:
                  link.id,

                title:
                  link.title,

              })
            ),

        });

    }


    // ========================================================
    // EXCLUI
    // ========================================================

    await department.destroy({
      transaction,
    });


    await transaction.commit();


    return res.json({

      message:
        "Departamento excluído com sucesso.",

    });

  } catch (
    error
  ) {

    try {

      await transaction.rollback();

    } catch {}


    console.error(
      "[AdminController] excluirDepartamento:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          error.message ||
          "Erro ao excluir departamento.",

      });

  }

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

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

};