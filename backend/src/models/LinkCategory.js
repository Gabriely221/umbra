// ============================================================
// MODEL DE CATEGORIA DE LINKS
// ============================================================

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");


const LinkCategory = sequelize.define(
  "LinkCategory",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    icon: {
      type: DataTypes.STRING(50),
      defaultValue: "link",
    },

    order: {
      type: DataTypes.INTEGER,
      defaultValue: 999,
    },
  },
  {
    tableName: "link_categories",
  }
);


module.exports = LinkCategory;