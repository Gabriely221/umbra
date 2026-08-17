// ============================================================
// MODEL DE AUDITORIA DAS ORGANIZAÇÕES
// ============================================================
//
// Este model registra alterações realizadas nos dados de uma
// organização.
//
// IMPORTANTE:
//
// Este model NÃO representa o histórico narrativo exibido no
// "Histórico" da organização.
//
// Ele representa auditoria:
//
// Exemplo:
//
// campo: status
// valor antigo: Neutra
// valor novo: Aliada
// usuário: Administrador
//
// Estrutura:
//
// OrganizationAuditLog
// ├── organizationId
// ├── usuarioId
// ├── action
// ├── field
// ├── oldValue
// └── newValue
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

const OrganizationAuditLog =
  sequelize.define(

    "OrganizationAuditLog",

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
      // Identifica a organização que sofreu a alteração.
      //
      // A relação física com organizations será definida no
      // models/index.js.
      // ======================================================

      organizationId: {

        type:
          DataTypes.INTEGER,

        allowNull:
          false,

      },


      // ======================================================
      // USUÁRIO RESPONSÁVEL
      // ======================================================
      //
      // Usuário autenticado que realizou a alteração.
      // ======================================================

      usuarioId: {

        type:
          DataTypes.INTEGER,

        allowNull:
          true,

      },


      // ======================================================
      // AÇÃO
      // ======================================================
      //
      // Exemplos:
      //
      // create
      // update
      // delete
      //
      // Também podemos usar outras ações futuramente.
      // ======================================================

      action: {

        type:
          DataTypes.STRING(50),

        allowNull:
          false,

      },


      // ======================================================
      // CAMPO ALTERADO
      // ======================================================

      field: {

        type:
          DataTypes.STRING(100),

        allowNull:
          true,

      },


      // ======================================================
      // VALOR ANTERIOR
      // ======================================================
      //
      // Armazenado como texto porque o valor pode ser:
      //
      // string
      // número
      // boolean
      // array
      // objeto JSON
      // ======================================================

      oldValue: {

        type:
          DataTypes.TEXT,

        allowNull:
          true,

      },


      // ======================================================
      // NOVO VALOR
      // ======================================================

      newValue: {

        type:
          DataTypes.TEXT,

        allowNull:
          true,

      },

    },

    {

      // ======================================================
      // TABELA
      // ======================================================

      tableName:
        "organization_audit_logs",

    }

  );


// ============================================================
// EXPORT
// ============================================================

module.exports =
  OrganizationAuditLog;