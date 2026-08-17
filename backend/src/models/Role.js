// ============================================================
// MODEL ROLE / CARGO
// ============================================================

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");


const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    // Identificador usado internamente.
    // Exemplo: administrador, lideranca, membro.
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Ordem hierárquica visual.
    hierarchyOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 99,
    },

    // Nível visual do cargo.
    tierLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },

    // Cargos do sistema não podem ser removidos.
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "roles",
  }
);


module.exports = Role;