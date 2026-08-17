// ============================================================
// MODEL LINK
// ============================================================
//
// Representa um link/recurso disponibilizado no sistema.
//
// A autorização de VISUALIZAÇÃO pode considerar:
//
// - isActive
// - allowedRoles
// - allowedDepartments
// - UserLink
//
// IMPORTANTE:
//
// Essas restrições de conteúdo NÃO substituem RBAC.
//
// Exemplo:
//
// visualizar_links
//
// continua sendo exigido pela rota.
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

const Link =
  sequelize.define(

    "Link",

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
      // URL
      // ======================================================

      url: {

        type:
          DataTypes.TEXT,

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
          true,

      },


      // ======================================================
      // ÍCONE
      // ======================================================

      icon: {

        type:
          DataTypes.STRING(
            50
          ),

        defaultValue:
          "link",

      },


      // ======================================================
      // ATIVO
      // ======================================================
      //
      // Links inativos não devem aparecer para usuários comuns.
      //
      // Usuários com gerenciar_links poderão visualizá-los no
      // modo administrativo.
      //
      // A decisão é aplicada no controller.
      //
      // ======================================================

      isActive: {

        type:
          DataTypes.BOOLEAN,

        defaultValue:
          true,

      },


      // ======================================================
      // DESTAQUE
      // ======================================================

      isFeatured: {

        type:
          DataTypes.BOOLEAN,

        defaultValue:
          false,

      },


      // ======================================================
      // ORDEM
      // ======================================================

      order: {

        type:
          DataTypes.INTEGER,

        defaultValue:
          999,

      },


      // ======================================================
      // CARGOS PERMITIDOS
      // ======================================================
      //
      // PADRÃO OFICIAL:
      //
      // Role.slug
      //
      // Exemplo:
      //
      // [
      //   "administrador",
      //   "lideranca"
      // ]
      //
      // [] significa:
      //
      // sem restrição por cargo.
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


      // ======================================================
      // DEPARTAMENTOS PERMITIDOS
      // ======================================================
      //
      // PADRÃO ATUAL:
      //
      // Department.nome
      //
      // Exemplo:
      //
      // [
      //   "Inteligência",
      //   "Operações"
      // ]
      //
      // [] significa:
      //
      // sem restrição por departamento.
      //
      // Futuramente podemos migrar para Department.slug.
      //
      // ======================================================

      allowedDepartments: {

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
        "links",

    }

  );


// ============================================================
// EXPORT
// ============================================================

module.exports =
  Link;