// ============================================================
// SEED INICIAL
// ============================================================
//
// Responsável por:
//
// - criar/sincronizar permissões
// - criar/sincronizar cargos padrão
// - configurar permissões dos cargos
// - criar/garantir administrador inicial
// - garantir Membro para todos os usuários
// - sincronizar catálogo de departamentos
//
// REGRA DE LIFECYCLE:
//
// Todo Usuario deve possuir exatamente um Membro.
//
// Usuario
//    ↓ 1:1
// Membro
//
// Mesmo usuários:
//
// - sem_acesso
// - inativos
// - administradores
//
// possuem perfil Membro.
//
// A exposição no diretório é responsabilidade do
// membroController.
//
// ============================================================


// ============================================================
// DEPENDÊNCIAS
// ============================================================

const bcrypt =
  require(
    "bcryptjs"
  );


// ============================================================
// MODELS
// ============================================================

const {
  Usuario,
  Role,
  Permission,
  Membro,
  Department,
} =
  require(
    "../models"
  );


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// NORMALIZA SLUG
// ------------------------------------------------------------

function normalizeSlug(
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
// SINCRONIZA ROLE DE SISTEMA
// ------------------------------------------------------------
//
// findOrCreate() não atualiza defaults quando o registro
// já existe.
//
// Portanto sincronizamos manualmente:
//
// - nome
// - descricao
// - hierarchyOrder
// - tierLevel
// - isSystem
//
// ------------------------------------------------------------

async function syncSystemRole(
  data
) {

  const [
    role,
  ] =
    await Role.findOrCreate({

      where: {
        slug:
          data.slug,
      },

      defaults:
        data,

    });


  let changed =
    false;


  const fields = [

    "nome",

    "descricao",

    "hierarchyOrder",

    "tierLevel",

    "isSystem",

  ];


  for (
    const field
    of fields
  ) {

    if (
      role[field] !==
      data[field]
    ) {

      role[field] =
        data[field];

      changed =
        true;

    }

  }


  if (
    changed
  ) {

    await role.save();

  }


  return role;

}


// ============================================================
// PERMISSÕES
// ============================================================

const permissionsData = [

  // ----------------------------------------------------------
  // SISTEMA
  // ----------------------------------------------------------

  {
    nome:
      "Acessar sistema",

    slug:
      "acessar_sistema",

    descricao:
      "Permite entrar no sistema.",
  },


  // ----------------------------------------------------------
  // INÍCIO
  // ----------------------------------------------------------

  {
    nome:
      "Visualizar início",

    slug:
      "visualizar_inicio",

    descricao:
      "Permite visualizar a página inicial.",
  },


  // ----------------------------------------------------------
  // MEMBROS
  // ----------------------------------------------------------

  {
    nome:
      "Visualizar membros",

    slug:
      "visualizar_membros",

    descricao:
      "Permite visualizar a página de membros.",
  },


  {
    nome:
      "Gerenciar membros",

    slug:
      "gerenciar_membros",

    descricao:
      "Permite editar informações dos membros.",
  },


  // ----------------------------------------------------------
  // LINKS
  // ----------------------------------------------------------

  {
    nome:
      "Visualizar links",

    slug:
      "visualizar_links",

    descricao:
      "Permite visualizar links.",
  },


  {
    nome:
      "Gerenciar links",

    slug:
      "gerenciar_links",

    descricao:
      "Permite criar, editar e excluir links.",
  },


  // ----------------------------------------------------------
  // GALERIA
  // ----------------------------------------------------------

  {
    nome:
      "Visualizar galeria",

    slug:
      "visualizar_galeria",

    descricao:
      "Permite visualizar o arquivo histórico.",
  },


  {
    nome:
      "Gerenciar galeria",

    slug:
      "gerenciar_galeria",

    descricao:
      "Permite criar, editar e excluir registros.",
  },


  // ----------------------------------------------------------
  // RELAÇÕES EXTERNAS
  // ----------------------------------------------------------

  {
    nome:
      "Visualizar relações",

    slug:
      "visualizar_relacoes",

    descricao:
      "Permite visualizar relações externas.",
  },


  {
    nome:
      "Gerenciar relações",

    slug:
      "gerenciar_relacoes",

    descricao:
      "Permite administrar relações externas.",
  },


  // ----------------------------------------------------------
  // REGRAS
  // ----------------------------------------------------------

  {
    nome:
      "Visualizar regras",

    slug:
      "visualizar_regras",

    descricao:
      "Permite visualizar regras.",
  },


  {
    nome:
      "Gerenciar regras",

    slug:
      "gerenciar_regras",

    descricao:
      "Permite criar, editar e remover regras.",
  },


  // ----------------------------------------------------------
  // USUÁRIOS
  // ----------------------------------------------------------

  {
    nome:
      "Gerenciar usuários",

    slug:
      "gerenciar_usuarios",

    descricao:
      "Permite gerenciar contas e cargos dos usuários.",
  },


  // ----------------------------------------------------------
  // ROLES
  // ----------------------------------------------------------

  {
    nome:
      "Visualizar cargos",

    slug:
      "visualizar_roles",

    descricao:
      "Permite consultar os cargos disponíveis no sistema.",
  },


  {
    nome:
      "Gerenciar cargos",

    slug:
      "gerenciar_roles",

    descricao:
      "Permite criar cargos e configurar permissões.",
  },

];


// ============================================================
// SEED DE PERMISSÕES
// ============================================================

async function seedPermissions() {

  const permissions = {};


  for (
    const data
    of permissionsData
  ) {

    const [
      permission,
    ] =
      await Permission.findOrCreate({

        where: {
          slug:
            data.slug,
        },

        defaults:
          data,

      });


    let changed =
      false;


    if (
      permission.nome !==
      data.nome
    ) {

      permission.nome =
        data.nome;

      changed =
        true;

    }


    if (
      permission.descricao !==
      data.descricao
    ) {

      permission.descricao =
        data.descricao;

      changed =
        true;

    }


    if (
      changed
    ) {

      await permission.save();

    }


    permissions[
      data.slug
    ] =
      permission;

  }


  return permissions;

}


// ============================================================
// GARANTE MEMBRO PARA TODOS OS USUÁRIOS
// ============================================================
//
// Backfill para instalações existentes.
//
// Exemplo antigo:
//
// Usuario {
//   id: 15
// }
//
// sem Membro.
//
// Após o seed:
//
// Usuario {
//   id: 15
// }
//
// Membro {
//   usuarioId: 15,
//   status: "Ativo",
//   departamentos: []
// }
//
// findOrCreate() torna a operação idempotente.
//
// Rodar o seed várias vezes NÃO cria perfis duplicados.
//
// ============================================================

async function ensureMembrosForAllUsers() {

  const usuarios =
    await Usuario.findAll({

      attributes: [
        "id",
      ],

      order: [
        [
          "id",
          "ASC",
        ],
      ],

    });


  let createdCount =
    0;


  let existingCount =
    0;


  for (
    const usuario
    of usuarios
  ) {

    const [
      membro,
      created,
    ] =
      await Membro.findOrCreate({

        where: {
          usuarioId:
            usuario.id,
        },

        defaults: {

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

      });


    if (
      created
    ) {

      createdCount +=
        1;

    } else {

      existingCount +=
        1;

    }


    // --------------------------------------------------------
    // GARANTE ARRAY VÁLIDO EM DADOS ANTIGOS
    // --------------------------------------------------------

    if (
      !Array.isArray(
        membro.departamentos
      )
    ) {

      membro.departamentos =
        [];


      await membro.save();

    }

  }


  console.log(
    `[Seed] Membros: ${createdCount} criado(s), ${existingCount} já existente(s).`
  );

}


// ============================================================
// SINCRONIZA DEPARTAMENTOS A PARTIR DOS MEMBROS
// ============================================================
//
// Durante esta fase:
//
// Membro.departamentos = [
//   "Inteligência",
//   "Operações"
// ]
//
// Department funciona como catálogo central.
//
// O seed NÃO inventa nomes.
//
// Ele cria no catálogo somente departamentos encontrados
// nos registros existentes.
//
// ============================================================

async function seedDepartmentsFromMembers() {

  const membros =
    await Membro.findAll({

      attributes: [
        "departamentos",
      ],

    });


  const departmentNames =
    new Set();


  // ==========================================================
  // COLETA NOMES
  // ==========================================================

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


    for (
      const value
      of departamentos
    ) {

      const nome =
        String(
          value ||
          ""
        ).trim();


      if (
        nome
      ) {

        departmentNames.add(
          nome
        );

      }

    }

  }


  // ==========================================================
  // ORDENA
  // ==========================================================

  const sortedNames =
    [
      ...departmentNames,
    ].sort(
      (
        a,
        b
      ) =>
        a.localeCompare(
          b,
          "pt-BR"
        )
    );


  let createdCount =
    0;


  let existingCount =
    0;


  let order =
    10;


  // ==========================================================
  // SINCRONIZA CATÁLOGO
  // ==========================================================

  for (
    const nome
    of sortedNames
  ) {

    const slug =
      normalizeSlug(
        nome
      );


    if (
      !slug
    ) {

      continue;

    }


    // --------------------------------------------------------
    // PROCURA PRIMEIRO PELO NOME
    // --------------------------------------------------------

    let department =
      await Department.findOne({

        where: {
          nome,
        },

      });


    // --------------------------------------------------------
    // DEPOIS PELO SLUG
    // --------------------------------------------------------

    if (
      !department
    ) {

      department =
        await Department.findOne({

          where: {
            slug,
          },

        });

    }


    // --------------------------------------------------------
    // JÁ EXISTE
    // --------------------------------------------------------

    if (
      department
    ) {

      existingCount +=
        1;

      order +=
        10;

      continue;

    }


    // --------------------------------------------------------
    // CRIA
    // --------------------------------------------------------

    await Department.create({

      nome,

      slug,

      descricao:
        null,

      ativo:
        true,

      ordem:
        order,

    });


    createdCount +=
      1;


    order +=
      10;

  }


  console.log(
    `[Seed] Departamentos: ${createdCount} criado(s), ${existingCount} já existente(s).`
  );

}


// ============================================================
// EXECUTA SEED
// ============================================================

async function seedSystem() {

  // ==========================================================
  // PERMISSÕES
  // ==========================================================

  const permissions =
    await seedPermissions();


  // ==========================================================
  // SEM ACESSO
  // ==========================================================

  const semAcesso =
    await syncSystemRole({

      nome:
        "Sem acesso",

      slug:
        "sem_acesso",

      descricao:
        "Usuário aguardando aprovação.",

      hierarchyOrder:
        999,

      tierLevel:
        6,

      isSystem:
        true,

    });


  await semAcesso.setPermissions(
    []
  );


  // ==========================================================
  // MEMBRO
  // ==========================================================

  const membro =
    await syncSystemRole({

      nome:
        "Membro",

      slug:
        "membro",

      descricao:
        "Acesso básico.",

      hierarchyOrder:
        100,

      tierLevel:
        5,

      isSystem:
        true,

    });


  await membro.setPermissions([

    // Sistema
    permissions.acessar_sistema,

    // Início
    permissions.visualizar_inicio,

    // Links
    permissions.visualizar_links,

    // Galeria
    permissions.visualizar_galeria,

    // Regras
    permissions.visualizar_regras,

  ]);


  // ==========================================================
  // LIDERANÇA
  // ==========================================================

  const lideranca =
    await syncSystemRole({

      nome:
        "Liderança",

      slug:
        "lideranca",

      descricao:
        "Acesso de liderança.",

      hierarchyOrder:
        2,

      tierLevel:
        1,

      isSystem:
        true,

    });


  await lideranca.setPermissions([

    // Sistema
    permissions.acessar_sistema,

    // Início
    permissions.visualizar_inicio,

    // Membros
    permissions.visualizar_membros,
    permissions.gerenciar_membros,

    // Links
    permissions.visualizar_links,

    // Cargos
    permissions.visualizar_roles,

    // Galeria
    permissions.visualizar_galeria,
    permissions.gerenciar_galeria,

    // Relações
    permissions.visualizar_relacoes,
    permissions.gerenciar_relacoes,

    // Regras
    permissions.visualizar_regras,

  ]);


  // ==========================================================
  // ADMINISTRADOR
  // ==========================================================

  const administrador =
    await syncSystemRole({

      nome:
        "Administrador",

      slug:
        "administrador",

      descricao:
        "Acesso completo.",

      hierarchyOrder:
        1,

      tierLevel:
        1,

      isSystem:
        true,

    });


  // ----------------------------------------------------------
  // ADMIN RECEBE TODAS AS PERMISSÕES
  // ----------------------------------------------------------

  await administrador.setPermissions(
    Object.values(
      permissions
    )
  );


  // ==========================================================
  // ADMIN INICIAL
  // ==========================================================

  const adminEmail =
    process.env.ADMIN_EMAIL
      ?.trim()
      .toLowerCase();


  if (
    !adminEmail
  ) {

    throw new Error(
      "ADMIN_EMAIL não foi configurado no .env."
    );

  }


  const adminPassword =
    process.env.ADMIN_PASSWORD;


  if (
    !adminPassword
  ) {

    throw new Error(
      "ADMIN_PASSWORD não foi configurado no .env."
    );

  }


  let admin =
    await Usuario.findOne({

      where: {
        email:
          adminEmail,
      },

    });


  // ----------------------------------------------------------
  // CRIA ADMIN
  // ----------------------------------------------------------

  if (
    !admin
  ) {

    const passwordHash =
      await bcrypt.hash(
        adminPassword,
        10
      );


    admin =
      await Usuario.create({

        nome:
          process.env.ADMIN_NAME ||
          "Administrador",

        email:
          adminEmail,

        senha:
          passwordHash,

        roleId:
          administrador.id,

        ativo:
          true,

      });


    console.log(
      "[Seed] Administrador inicial criado."
    );

  } else {

    let adminChanged =
      false;


    // --------------------------------------------------------
    // GARANTE ROLE
    // --------------------------------------------------------

    if (
      admin.roleId !==
      administrador.id
    ) {

      admin.roleId =
        administrador.id;

      adminChanged =
        true;

    }


    // --------------------------------------------------------
    // GARANTE CONTA ATIVA
    // --------------------------------------------------------

    if (
      admin.ativo !==
      true
    ) {

      admin.ativo =
        true;

      adminChanged =
        true;

    }


    if (
      adminChanged
    ) {

      await admin.save();

    }

  }


  // ==========================================================
  // BACKFILL DOS PERFIS MEMBRO
  // ==========================================================
  //
  // Executamos depois de garantir o admin inicial.
  //
  // Assim o próprio administrador também recebe seu Membro.
  //
  // ==========================================================

  await ensureMembrosForAllUsers();


  // ==========================================================
  // CATÁLOGO DE DEPARTAMENTOS
  // ==========================================================
  //
  // Executamos depois do backfill.
  //
  // ==========================================================

  await seedDepartmentsFromMembers();


  // ==========================================================
  // FINAL
  // ==========================================================

  console.log(
    "[Seed] Sistema sincronizado com sucesso."
  );

}


// ============================================================
// EXPORT
// ============================================================

module.exports =
  seedSystem;