// ============================================================
// MODEL NEGOCIAÇÃO
// ============================================================
//
// Representa uma negociação vinculada a uma organização.
//
// Estrutura:
//
// OrganizationNegotiation
// ├── organizationId
// ├── title
// ├── description
// ├── status
// ├── responsibleUserId
// └── dueDate
//
// STATUS VÁLIDOS:
//
// Pendente
// Em andamento
// Concluída
// Cancelada
//
// RELACIONAMENTOS:
//
// OrganizationNegotiation
// → pertence a Organization
//
// OrganizationNegotiation
// → pode possuir um Usuario responsável
//
// O objeto:
//
// responsibleUser
//
// NÃO é uma coluna desta tabela.
//
// Ele é carregado através da associação Sequelize:
//
// OrganizationNegotiation.belongsTo(
//   Usuario,
//   {
//     foreignKey: "responsibleUserId",
//     as: "responsibleUser",
//   }
// );
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

const OrganizationNegotiation =
  sequelize.define(

    "OrganizationNegotiation",

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

      organizationId: {

        type:
          DataTypes.INTEGER,

        allowNull:
          false,

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
          true,

      },


      // ======================================================
      // STATUS
      // ======================================================
      //
      // Fluxo esperado:
      //
      // Pendente
      //      ↓
      // Em andamento
      //      ↓
      // Concluída
      //
      // Uma negociação também pode ser:
      //
      // Cancelada
      //
      // O controller deverá validar explicitamente estes
      // valores antes de persistir.
      //
      // ======================================================

      status: {

        type:
          DataTypes.ENUM(
            "Pendente",
            "Em andamento",
            "Concluída",
            "Cancelada"
          ),

        allowNull:
          false,

        defaultValue:
          "Pendente",

      },


      // ======================================================
      // USUÁRIO RESPONSÁVEL
      // ======================================================
      //
      // NULL:
      // nenhum responsável atribuído.
      //
      // Quando preenchido, deve corresponder a Usuario.id.
      //
      // O controller já valida a existência do usuário antes
      // de persistir.
      //
      // A associação Sequelize deve utilizar:
      //
      // as: "responsibleUser"
      //
      // ======================================================

      responsibleUserId: {

        type:
          DataTypes.INTEGER,

        allowNull:
          true,

      },


      // ======================================================
      // PRAZO
      // ======================================================

      dueDate: {

        type:
          DataTypes.DATE,

        allowNull:
          true,

      },

    },

    {

      tableName:
        "organization_negotiations",

    }

  );


// ============================================================
// EXPORT
// ============================================================

module.exports =
  OrganizationNegotiation;