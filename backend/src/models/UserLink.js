// ============================================================
// MODEL USER LINK
// ============================================================
//
// Tabela intermediária:
//
// usuario
//    ↕
// user_links
//    ↕
// link
//
// Permite atribuir links específicos diretamente a usuários.
// ============================================================

const {
  DataTypes,
} = require(
  "sequelize"
);

const sequelize =
  require(
    "../config/database"
  );


const UserLink =
  sequelize.define(

    "UserLink",

    {

      usuarioId: {

        type:
          DataTypes.INTEGER,

        primaryKey:
          true,

      },


      linkId: {

        type:
          DataTypes.INTEGER,

        primaryKey:
          true,

      },

    },

    {

      tableName:
        "user_links",

      timestamps:
        false,

      indexes: [

        {

          unique:
            true,

          fields: [
            "usuarioId",
            "linkId",
          ],

        },

      ],

    }

  );


module.exports =
  UserLink;