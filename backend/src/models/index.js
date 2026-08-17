// ============================================================
// RELACIONAMENTOS DOS MODELS
// ============================================================
//
// Este arquivo centraliza todos os models e relacionamentos
// Sequelize da aplicação.
//
// Estrutura:
//
// Usuario
//   ├── Role
//   │    └── Permissions
//   │
//   └── Membro
//
// Department
//   └── catálogo independente
//
// Link
//   ├── LinkCategory
//   └── UserLink
//
// GalleryItem
//
// Organization
//   ├── OrganizationHistory
//   ├── OrganizationAuditLog
//   └── OrganizationNegotiation
//
// Rule
//
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

const Usuario =
  require("./Usuario");


const Role =
  require("./Role");


const Permission =
  require("./Permission");


const RolePermission =
  require("./RolePermission");


const Membro =
  require("./Membro");


const Department =
  require("./Department");


const Link =
  require("./Link");


const LinkCategory =
  require("./LinkCategory");


const UserLink =
  require("./UserLink");


const GalleryItem =
  require("./GalleryItem");


const Organization =
  require("./Organization");


const OrganizationNegotiation =
  require("./OrganizationNegotiation");


const OrganizationHistory =
  require("./OrganizationHistory");


const OrganizationAuditLog =
  require("./OrganizationAuditLog");


const Rule =
  require("./Rule");


// ============================================================
// USUARIO <-> ROLE
// ============================================================

Role.hasMany(
  Usuario,
  {
    foreignKey:
      "roleId",

    onUpdate:
      "CASCADE",

    onDelete:
      "RESTRICT",
  }
);


Usuario.belongsTo(
  Role,
  {
    foreignKey:
      "roleId",
  }
);


// ============================================================
// ROLE <-> PERMISSIONS
// ============================================================

Role.belongsToMany(
  Permission,
  {
    through:
      RolePermission,

    foreignKey:
      "roleId",

    otherKey:
      "permissionId",

    onDelete:
      "CASCADE",

    onUpdate:
      "CASCADE",
  }
);


Permission.belongsToMany(
  Role,
  {
    through:
      RolePermission,

    foreignKey:
      "permissionId",

    otherKey:
      "roleId",

    onDelete:
      "CASCADE",

    onUpdate:
      "CASCADE",
  }
);


// ============================================================
// USUARIO <-> MEMBRO
// ============================================================
//
// Um Usuario pode possuir um único perfil Membro.
//
// IMPORTANTE:
//
// Membro.departamentos continua sendo JSON.
//
// Não existe relação Sequelize Membro <-> Department nesta
// etapa da migração.
//
// ============================================================

Usuario.hasOne(
  Membro,
  {
    foreignKey:
      "usuarioId",

    onUpdate:
      "CASCADE",

    onDelete:
      "CASCADE",
  }
);


Membro.belongsTo(
  Usuario,
  {
    foreignKey:
      "usuarioId",
  }
);


// ============================================================
// DEPARTMENT
// ============================================================
//
// Department funciona atualmente como catálogo independente.
//
// Exemplos:
//
// Department:
// {
//   id: 1,
//   nome: "Inteligência",
//   slug: "inteligencia"
// }
//
// Membro:
// {
//   departamentos: [
//     "Inteligência"
//   ]
// }
//
// Futuramente podemos migrar os JSONs para slugs ou para uma
// relação N:N sem alterar a função atual do catálogo.
//
// ============================================================


// ============================================================
// LINK <-> CATEGORIA
// ============================================================

Link.belongsToMany(
  LinkCategory,
  {
    through:
      "link_category_items",

    foreignKey:
      "linkId",

    otherKey:
      "categoryId",

    onDelete:
      "CASCADE",

    onUpdate:
      "CASCADE",
  }
);


LinkCategory.belongsToMany(
  Link,
  {
    through:
      "link_category_items",

    foreignKey:
      "categoryId",

    otherKey:
      "linkId",

    onDelete:
      "CASCADE",

    onUpdate:
      "CASCADE",
  }
);


// ============================================================
// USUARIO <-> LINK
// ============================================================

Usuario.belongsToMany(
  Link,
  {
    through:
      UserLink,

    foreignKey:
      "usuarioId",

    otherKey:
      "linkId",

    onDelete:
      "CASCADE",

    onUpdate:
      "CASCADE",
  }
);


Link.belongsToMany(
  Usuario,
  {
    through:
      UserLink,

    foreignKey:
      "linkId",

    otherKey:
      "usuarioId",

    onDelete:
      "CASCADE",

    onUpdate:
      "CASCADE",
  }
);


// ============================================================
// ORGANIZAÇÃO <-> NEGOCIAÇÕES
// ============================================================
//
// Se uma organização for removida, suas negociações também
// deixam de existir.
//
// ============================================================

Organization.hasMany(
  OrganizationNegotiation,
  {
    foreignKey:
      "organizationId",

    onUpdate:
      "CASCADE",

    onDelete:
      "CASCADE",
  }
);


OrganizationNegotiation.belongsTo(
  Organization,
  {
    foreignKey:
      "organizationId",

    onUpdate:
      "CASCADE",

    onDelete:
      "CASCADE",
  }
);


// ============================================================
// ORGANIZAÇÃO <-> HISTÓRICO NARRATIVO
// ============================================================
//
// O histórico narrativo pertence à própria organização.
//
// Se a organização for removida, esses registros também podem
// ser removidos.
//
// Diferente do OrganizationAuditLog, este model representa
// conteúdo funcional da organização e não auditoria técnica.
//
// ============================================================

Organization.hasMany(
  OrganizationHistory,
  {
    foreignKey:
      "organizationId",

    onUpdate:
      "CASCADE",

    onDelete:
      "CASCADE",
  }
);


OrganizationHistory.belongsTo(
  Organization,
  {
    foreignKey:
      "organizationId",

    onUpdate:
      "CASCADE",

    onDelete:
      "CASCADE",
  }
);


// ============================================================
// USUARIO <-> HISTÓRICO
// ============================================================
//
// Se o usuário autor for excluído:
//
// - o registro histórico permanece;
// - usuarioId passa para NULL.
//
// ============================================================

Usuario.hasMany(
  OrganizationHistory,
  {
    foreignKey:
      "usuarioId",

    onUpdate:
      "CASCADE",

    onDelete:
      "SET NULL",
  }
);


OrganizationHistory.belongsTo(
  Usuario,
  {
    foreignKey:
      "usuarioId",

    onUpdate:
      "CASCADE",

    onDelete:
      "SET NULL",
  }
);


// ============================================================
// ORGANIZAÇÃO <-> AUDITORIA
// ============================================================
//
// IMPORTANTE:
//
// OrganizationAuditLog deve sobreviver à exclusão da
// Organization.
//
// Portanto:
//
// - organizationId permanece obrigatório no AuditLog;
// - organizationId funciona como identificador histórico;
// - NÃO criamos constraint física Sequelize entre as tabelas;
// - a associação continua disponível para include/navegação
//   enquanto a organização existir.
//
// Exemplo:
//
// Organization #15
//       ↓
// AuditLog.organizationId = 15
//       ↓
// DELETE Organization #15
//       ↓
// AuditLog continua com organizationId = 15.
//
// IMPORTANTE:
//
// constraints: false NÃO remove uma FK que já exista no MySQL.
//
// Se o banco atual possui:
//
// organization_audit_logs.organizationId
//   → organizations.id
//   → ON DELETE CASCADE
//
// essa FK será removida posteriormente através de migration.
//
// ============================================================

Organization.hasMany(
  OrganizationAuditLog,
  {
    foreignKey:
      "organizationId",

    constraints:
      false,
  }
);


OrganizationAuditLog.belongsTo(
  Organization,
  {
    foreignKey:
      "organizationId",

    constraints:
      false,
  }
);


// ============================================================
// USUARIO <-> AUDITORIA
// ============================================================
//
// A auditoria deve sobreviver à exclusão do usuário que
// realizou a operação.
//
// Por isso:
//
// usuarioId aceita NULL
//
// e:
//
// ON DELETE SET NULL
//
// ============================================================

Usuario.hasMany(
  OrganizationAuditLog,
  {
    foreignKey:
      "usuarioId",

    onUpdate:
      "CASCADE",

    onDelete:
      "SET NULL",
  }
);


OrganizationAuditLog.belongsTo(
  Usuario,
  {
    foreignKey:
      "usuarioId",

    onUpdate:
      "CASCADE",

    onDelete:
      "SET NULL",
  }
);


// ============================================================
// USUARIO <-> NEGOCIAÇÕES
// ============================================================
//
// OrganizationNegotiation.responsibleUserId:
//
// - pode ser NULL;
// - aponta para Usuario.id;
// - usuário excluído NÃO deve excluir a negociação;
// - neste caso responsibleUserId passa para NULL.
//
// O alias:
//
// responsibleUser
//
// é utilizado pelo organizationController nos includes.
//
// ============================================================

Usuario.hasMany(
  OrganizationNegotiation,
  {
    foreignKey:
      "responsibleUserId",

    onUpdate:
      "CASCADE",

    onDelete:
      "SET NULL",
  }
);


OrganizationNegotiation.belongsTo(
  Usuario,
  {
    foreignKey:
      "responsibleUserId",

    as:
      "responsibleUser",

    onUpdate:
      "CASCADE",

    onDelete:
      "SET NULL",
  }
);


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  Usuario,

  Role,

  Permission,

  RolePermission,

  Membro,

  Department,

  Link,

  LinkCategory,

  UserLink,

  GalleryItem,

  Organization,

  OrganizationNegotiation,

  OrganizationHistory,

  OrganizationAuditLog,

  Rule,

};