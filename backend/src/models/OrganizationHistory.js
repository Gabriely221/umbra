// ============================================================
// MODEL DE HISTÓRICO DA ORGANIZAÇÃO
// ============================================================
//
// Este model representa os acontecimentos registrados na
// história de uma organização.
//
// IMPORTANTE:
//
// Este NÃO é o log técnico de alterações do sistema.
//
// Auditoria fica em:
//
// OrganizationAuditLog
//
// Já este model representa:
//
// - acontecimentos
// - acordos
// - conflitos
// - mudanças de relação
// - fatos relevantes
// - observações históricas
//
// Exemplo:
//
// {
//   title: "Aliança formada",
//   description: "A organização passou a ser considerada aliada.",
//   date: "2026-08-10",
//   responsible: "01"
// }
//
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


// ============================================================
// MODEL
// ============================================================

const OrganizationHistory =
  sequelize.define(

    "OrganizationHistory",

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
      // ORGANIZAÇÃO
      // ======================================================
      //
      // Organização à qual o registro pertence.
      // ======================================================

      organizationId: {

        type:
          DataTypes.INTEGER,

        allowNull:
          false,

      },


      // ======================================================
      // TÍTULO
      // ======================================================
      //
      // Nome do acontecimento.
      //
      // Exemplo:
      //
      // "Primeiro contato"
      // "Aliança estabelecida"
      // "Conflito com a organização"
      // ======================================================

      title: {

        type:
          DataTypes.STRING(200),

        allowNull:
          false,

      },


      // ======================================================
      // DESCRIÇÃO
      // ======================================================
      //
      // Texto explicando o acontecimento.
      // ======================================================

      description: {

        type:
          DataTypes.TEXT,

        allowNull:
          true,

      },


      // ======================================================
      // DATA DO ACONTECIMENTO
      // ======================================================
      //
      // A data pode ser diferente de createdAt.
      //
      // createdAt:
      //   data em que o registro foi cadastrado.
      //
      // date:
      //   data em que o acontecimento ocorreu.
      // ======================================================

      date: {

        type:
          DataTypes.DATE,

        allowNull:
          false,

      },


      // ======================================================
      // RESPONSÁVEL
      // ======================================================
      //
      // Nome exibido no histórico.
      //
      // Mantemos como texto porque o frontend atual trabalha
      // dessa forma e isso permite registrar inclusive nomes
      // de RP que não correspondam diretamente a um usuário
      // da plataforma.
      // ======================================================

      responsible: {

        type:
          DataTypes.STRING(150),

        allowNull:
          true,

      },


      // ======================================================
      // USUÁRIO QUE CADASTROU
      // ======================================================
      //
      // Diferente de "responsible":
      //
      // responsible:
      //   pessoa associada ao acontecimento.
      //
      // usuarioId:
      //   usuário da plataforma que criou/editou o registro.
      //
      // Isso é útil para auditoria e controle interno.
      // ======================================================

      usuarioId: {

        type:
          DataTypes.INTEGER,

        allowNull:
          true,

      },

    },

    {

      // ======================================================
      // TABELA
      // ======================================================

      tableName:
        "organization_history",

    }

  );


// ============================================================
// EXPORT
// ============================================================

module.exports =
  OrganizationHistory;