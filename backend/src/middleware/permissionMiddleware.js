// ============================================================
// MIDDLEWARE DE RBAC
// ============================================================
//
// Suporta:
//
// 1. Uma permissão:
//
// exigirPermissao(
//   "gerenciar_links"
// )
//
//
// 2. Qualquer uma de várias permissões:
//
// exigirAlgumaPermissao([
//   "gerenciar_usuarios",
//   "gerenciar_roles",
// ])
//
//
// 3. Todas as permissões:
//
// exigirTodasPermissoes([
//   "visualizar_links",
//   "gerenciar_links",
// ])
//
//
// O authMiddleware deve executar ANTES deste middleware.
//
// ============================================================


// ============================================================
// NORMALIZA USUÁRIO
// ============================================================

function getUsuario(
  req
) {

  return (
    req.usuario ||
    req.user ||
    null
  );

}


// ============================================================
// NORMALIZA ROLE
// ============================================================

function getRole(
  usuario
) {

  return (
    usuario?.Role ||
    usuario?.role ||
    null
  );

}


// ============================================================
// NORMALIZA PERMISSÕES DO ROLE
// ============================================================

function getRolePermissions(
  role
) {

  if (
    Array.isArray(
      role?.Permissions
    )
  ) {

    return role.Permissions;

  }


  if (
    Array.isArray(
      role?.permissions
    )
  ) {

    return role.permissions;

  }


  return [];

}


// ============================================================
// NORMALIZA SLUG
// ============================================================

function getPermissionSlug(
  permission
) {

  if (
    typeof permission ===
    "string"
  ) {

    return permission;

  }


  return (
    permission?.slug ||
    permission?.permissionSlug ||
    null
  );

}


// ============================================================
// SET DE PERMISSÕES
// ============================================================

function getPermissionSet(
  usuario
) {

  const role =
    getRole(
      usuario
    );


  const permissions =
    getRolePermissions(
      role
    );


  return new Set(

    permissions

      .map(
        getPermissionSlug
      )

      .filter(Boolean)

  );

}


// ============================================================
// VALIDA CONFIGURAÇÃO
// ============================================================

function normalizeRequiredPermissions(
  permissions
) {

  const list =
    Array.isArray(
      permissions
    )
      ? permissions
      : [
          permissions,
        ];


  return list

    .map(
      (
        permission
      ) =>
        typeof permission ===
          "string"
          ? permission.trim()
          : ""
    )

    .filter(Boolean);

}


// ============================================================
// RESPOSTA: NÃO AUTENTICADO
// ============================================================

function unauthorized(
  res
) {

  return res
    .status(401)
    .json({
      message:
        "Usuário não autenticado.",
    });

}


// ============================================================
// RESPOSTA: SEM ROLE
// ============================================================

function withoutRole(
  res
) {

  return res
    .status(403)
    .json({
      message:
        "Usuário sem cargo.",
    });

}


// ============================================================
// RESPOSTA: SEM PERMISSÃO
// ============================================================

function forbidden(
  res,
  requiredPermissions = []
) {

  return res
    .status(403)
    .json({

      message:
        "Você não possui permissão para realizar esta ação.",

      requiredPermissions,

    });

}


// ============================================================
// EXIGIR UMA PERMISSÃO
// ============================================================
//
// Exemplo:
//
// exigirPermissao(
//   "gerenciar_links"
// )
//
// ============================================================

function exigirPermissao(
  permissionSlug
) {

  const required =
    normalizeRequiredPermissions(
      permissionSlug
    );


  if (
    required.length !==
    1
  ) {

    throw new Error(
      "exigirPermissao() deve receber exatamente uma permissão válida."
    );

  }


  const requiredPermission =
    required[0];


  return (
    req,
    res,
    next
  ) => {

    const usuario =
      getUsuario(
        req
      );


    // --------------------------------------------------------
    // AUTENTICAÇÃO
    // --------------------------------------------------------

    if (
      !usuario
    ) {

      return unauthorized(
        res
      );

    }


    // --------------------------------------------------------
    // ROLE
    // --------------------------------------------------------

    const role =
      getRole(
        usuario
      );


    if (
      !role
    ) {

      return withoutRole(
        res
      );

    }


    // --------------------------------------------------------
    // PERMISSÕES
    // --------------------------------------------------------

    const permissionSet =
      getPermissionSet(
        usuario
      );


    const allowed =
      permissionSet.has(
        requiredPermission
      );


    if (
      !allowed
    ) {

      return forbidden(
        res,
        [
          requiredPermission,
        ]
      );

    }


    return next();

  };

}


// ============================================================
// EXIGIR QUALQUER UMA DAS PERMISSÕES
// ============================================================
//
// OR lógico.
//
// Exemplo:
//
// exigirAlgumaPermissao([
//   "gerenciar_usuarios",
//   "gerenciar_roles",
// ])
//
// O usuário precisa possuir PELO MENOS UMA.
//
// ============================================================

function exigirAlgumaPermissao(
  permissionSlugs
) {

  const requiredPermissions =
    normalizeRequiredPermissions(
      permissionSlugs
    );


  if (
    requiredPermissions.length ===
    0
  ) {

    throw new Error(
      "exigirAlgumaPermissao() deve receber pelo menos uma permissão válida."
    );

  }


  return (
    req,
    res,
    next
  ) => {

    const usuario =
      getUsuario(
        req
      );


    // --------------------------------------------------------
    // AUTENTICAÇÃO
    // --------------------------------------------------------

    if (
      !usuario
    ) {

      return unauthorized(
        res
      );

    }


    // --------------------------------------------------------
    // ROLE
    // --------------------------------------------------------

    const role =
      getRole(
        usuario
      );


    if (
      !role
    ) {

      return withoutRole(
        res
      );

    }


    // --------------------------------------------------------
    // PERMISSÕES
    // --------------------------------------------------------

    const permissionSet =
      getPermissionSet(
        usuario
      );


    const allowed =
      requiredPermissions.some(
        (
          permission
        ) =>
          permissionSet.has(
            permission
          )
      );


    if (
      !allowed
    ) {

      return forbidden(
        res,
        requiredPermissions
      );

    }


    return next();

  };

}


// ============================================================
// EXIGIR TODAS AS PERMISSÕES
// ============================================================
//
// AND lógico.
//
// Exemplo:
//
// exigirTodasPermissoes([
//   "visualizar_links",
//   "gerenciar_links",
// ])
//
// O usuário precisa possuir TODAS.
//
// ============================================================

function exigirTodasPermissoes(
  permissionSlugs
) {

  const requiredPermissions =
    normalizeRequiredPermissions(
      permissionSlugs
    );


  if (
    requiredPermissions.length ===
    0
  ) {

    throw new Error(
      "exigirTodasPermissoes() deve receber pelo menos uma permissão válida."
    );

  }


  return (
    req,
    res,
    next
  ) => {

    const usuario =
      getUsuario(
        req
      );


    // --------------------------------------------------------
    // AUTENTICAÇÃO
    // --------------------------------------------------------

    if (
      !usuario
    ) {

      return unauthorized(
        res
      );

    }


    // --------------------------------------------------------
    // ROLE
    // --------------------------------------------------------

    const role =
      getRole(
        usuario
      );


    if (
      !role
    ) {

      return withoutRole(
        res
      );

    }


    // --------------------------------------------------------
    // PERMISSÕES
    // --------------------------------------------------------

    const permissionSet =
      getPermissionSet(
        usuario
      );


    const allowed =
      requiredPermissions.every(
        (
          permission
        ) =>
          permissionSet.has(
            permission
          )
      );


    if (
      !allowed
    ) {

      return forbidden(
        res,
        requiredPermissions
      );

    }


    return next();

  };

}


// ============================================================
// EXPORT PRINCIPAL
// ============================================================
//
// Mantemos:
//
// const exigirPermissao =
//   require("./permissionMiddleware");
//
// para não quebrar as rotas existentes.
//
// ============================================================

module.exports =
  exigirPermissao;


// ============================================================
// EXPORTS ADICIONAIS
// ============================================================
//
// Também permite:
//
// const {
//   exigirAlgumaPermissao,
//   exigirTodasPermissoes,
// } = require("./permissionMiddleware");
//
// ============================================================

module.exports.exigirPermissao =
  exigirPermissao;

module.exports.exigirAlgumaPermissao =
  exigirAlgumaPermissao;

module.exports.exigirTodasPermissoes =
  exigirTodasPermissoes;