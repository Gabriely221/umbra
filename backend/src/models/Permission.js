// ============================================================
// MODEL PERMISSION
// ============================================================

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");


const Permission = sequelize.define(
  "Permission",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },

    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "permissions",
  }
);


module.exports = Permission;