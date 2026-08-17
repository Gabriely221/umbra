// ============================================================
// MODEL RULE
// ============================================================
//
// Representa uma regra exibida no sistema.
//
// Existem dois níveis diferentes de autorização:
//
// 1. RBAC
//
// visualizar_regras
// gerenciar_regras
//
// Isso é controlado pelas rotas.
//
// 2. RESTRIÇÃO DE CONTEÚDO
//
// allowedRoles
//
// Isso determina quais cargos podem visualizar determinada
// regra depois que o usuário já passou pelo RBAC.
//
// PADRÃO OFICIAL:
//
// allowedRoles = Role.slug[]
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

const {
  DataTypes,
} =
  require(
    "sequelize"
  );


const sequelize =
  require(
    "../config/database"
  );


// ============================================================
// MODEL
// ============================================================

const Rule =
  sequelize.define(

    "Rule",

    {

      // ======================================================
      // ID
      // ======================================================

      id: {

        type:
          DataTypes.INTEGER,

        autoIncrement:
          true,

        primaryKey:
          true,

      },


      // ======================================================
      // TÍTULO
      // ======================================================

      title: {

        type:
          DataTypes.STRING(
            200
          ),

        allowNull:
          false,

      },


      // ======================================================
      // DESCRIÇÃO
      // ======================================================

      description: {

        type:
          DataTypes.TEXT,

        allowNull:
          false,

      },


      // ======================================================
      // PRIORIDADE
      // ======================================================

      priority: {

        type:
          DataTypes.ENUM(
            "Máxima",
            "Alta",
            "Média",
            "Baixa"
          ),

        allowNull:
          false,

        defaultValue:
          "Média",

      },


      // ======================================================
      // ÍCONE
      // ======================================================

      icon: {

        type:
          DataTypes.STRING(
            50
          ),

        allowNull:
          false,

        defaultValue:
          "scroll",

      },


      // ======================================================
      // ORDEM
      // ======================================================

      order: {

        type:
          DataTypes.INTEGER,

        allowNull:
          false,

        defaultValue:
          999,

      },


      // ======================================================
      // CARGOS PERMITIDOS
      // ======================================================
      //
      // PADRÃO CANÔNICO:
      //
      // Role.slug[]
      //
      // Exemplo:
      //
      // [
      //   "lideranca",
      //   "administrador"
      // ]
      //
      // [] significa:
      //
      // sem restrição por cargo.
      //
      // O backend deve validar os slugs na criação/edição.
      //
      // Durante a migração podemos aceitar Role.nome antigo
      // no controller e convertê-lo para slug.
      //
      // ======================================================

      allowedRoles: {

        type:
          DataTypes.JSON,

        allowNull:
          true,

        defaultValue:
          [],

      },

    },

    {

      tableName:
        "rules",

    }

  );


// ============================================================
// EXPORT
// ============================================================

module.exports =
  Rule;