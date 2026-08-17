// ============================================================
// MODEL DEPARTMENT
// ============================================================
//
// Catálogo central de departamentos do sistema.
//
// IMPORTANTE:
//
// Membro continua armazenando seus departamentos em:
//
// Membro.departamentos
//
// como JSON.
//
// Portanto Department NÃO possui relação N:N com Membro neste
// momento.
//
// O catálogo serve para:
//
// - DepartmentSelector
// - filtros
// - administração
// - validação
// - restrições futuras em Links / Rules / Organizations
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

const Department =
  sequelize.define(

    "Department",

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

      nome: {

        type:
          DataTypes.STRING(
            100
          ),

        allowNull:
          false,

        unique:
          true,

        validate: {

          notEmpty: {
            msg:
              "O nome do departamento é obrigatório.",
          },

          len: {
            args:
              [
                1,
                100,
              ],

            msg:
              "O nome do departamento deve possuir até 100 caracteres.",
          },

        },

      },


      // ======================================================
      // SLUG
      // ======================================================
      //
      // Identificador estável para utilização futura em regras
      // de acesso.
      //
      // Exemplos:
      //
      // Inteligência
      //      ↓
      // inteligencia
      //
      // Relações Externas
      //      ↓
      // relacoes_externas
      //
      // ======================================================

      slug: {

        type:
          DataTypes.STRING(
            120
          ),

        allowNull:
          false,

        unique:
          true,

        validate: {

          notEmpty: {
            msg:
              "O slug do departamento é obrigatório.",
          },

        },

      },


      // ======================================================
      // DESCRIÇÃO
      // ======================================================

      descricao: {

        type:
          DataTypes.TEXT,

        allowNull:
          true,

      },


      // ======================================================
      // ATIVO
      // ======================================================
      //
      // Departamentos antigos podem ser desativados sem apagar
      // referências históricas já existentes.
      //
      // ======================================================

      ativo: {

        type:
          DataTypes.BOOLEAN,

        allowNull:
          false,

        defaultValue:
          true,

      },


      // ======================================================
      // ORDEM
      // ======================================================
      //
      // Permite definir a ordem visual nos seletores.
      //
      // ======================================================

      ordem: {

        type:
          DataTypes.INTEGER,

        allowNull:
          false,

        defaultValue:
          99,

      },

    },

    {

      tableName:
        "departments",

      timestamps:
        true,

      indexes: [

        {
          unique:
            true,

          fields:
            [
              "nome",
            ],
        },

        {
          unique:
            true,

          fields:
            [
              "slug",
            ],
        },

        {
          fields:
            [
              "ativo",
            ],
        },

        {
          fields:
            [
              "ordem",
            ],
        },

      ],

    }

  );


// ============================================================
// EXPORT
// ============================================================

module.exports =
  Department;