// ============================================================
// MODEL MEMBRO
// ============================================================

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");


const Membro = sequelize.define(
  "Membro",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Usuário ao qual este perfil pertence.
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },

    status: {
      type: DataTypes.ENUM(
        "Ativo",
        "Inativo",
        "Afastado"
      ),
      defaultValue: "Ativo",
    },

    codinome: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // JSON facilita manter múltiplos departamentos.
    departamentos: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    tableName: "membros",
  }
);


module.exports = Membro;