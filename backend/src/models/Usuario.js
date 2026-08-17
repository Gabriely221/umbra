// ============================================================
// MODEL USUARIO
// ============================================================
//
// Representa os usuários autenticados do Central Cartel.
//
// Estrutura:
//
// Usuario
// ├── id
// ├── nome
// ├── email
// ├── senha
// ├── roleId
// └── ativo
//
// Relacionamentos definidos em models/index.js:
//
// Usuario
// ├── Role
// ├── Membro
// ├── OrganizationHistory
// ├── OrganizationAuditLog
// ├── OrganizationNegotiation
// └── UserLink
//
// ============================================================

const {
  DataTypes,
} = require("sequelize");


const sequelize =
  require(
    "../config/database"
  );


// ============================================================
// MODEL
// ============================================================

const Usuario =
  sequelize.define(

    "Usuario",

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
      // NOME
      // ======================================================
      //
      // Nome utilizado dentro do sistema.
      //
      // Para o nome de RP, o frontend possui campos próprios
      // quando necessário.
      // ======================================================

      nome: {

        type:
          DataTypes.STRING(150),

        allowNull:
          false,

      },


      // ======================================================
      // EMAIL
      // ======================================================
      //
      // Usado para login.
      // ======================================================

      email: {

        type:
          DataTypes.STRING(150),

        allowNull:
          false,

        unique:
          true,

        validate: {

          isEmail:
            true,

        },

      },


      // ======================================================
      // SENHA
      // ======================================================
      //
      // Este campo contém SOMENTE o hash da senha.
      //
      // Nunca armazenar senha em texto puro.
      // ======================================================

      senha: {

        type:
          DataTypes.STRING,

        allowNull:
          false,

      },


      // ======================================================
      // ROLE
      // ======================================================
      //
      // Cargo RBAC associado ao usuário.
      //
      // Exemplo:
      //
      // roleId = 3
      //
      // ↓
      //
      // Role "Liderança"
      //
      // O relacionamento é configurado em:
      //
      // models/index.js
      // ======================================================

      roleId: {

        type:
          DataTypes.INTEGER,

        allowNull:
          false,

      },


      // ======================================================
      // STATUS DA CONTA
      // ======================================================
      //
      // true:
      //    usuário pode acessar o sistema
      //
      // false:
      //    usuário está desativado
      //
      // A autenticação/RBAC deve respeitar este campo.
      // ======================================================

      ativo: {

        type:
          DataTypes.BOOLEAN,

        allowNull:
          false,

        defaultValue:
          true,

      },

    },

    {

      // ======================================================
      // TABELA
      // ======================================================

      tableName:
        "usuarios",

    }

  );


// ============================================================
// EXPORT
// ============================================================

module.exports =
  Usuario;