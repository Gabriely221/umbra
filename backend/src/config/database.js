// ============================================================
// CONEXÃO COM O MYSQL
// ============================================================
//
// Centraliza a conexão Sequelize com o banco MySQL.
//
// Variáveis esperadas no .env:
//
// DB_NAME
// DB_USER
// DB_PASSWORD
// DB_HOST
// DB_PORT
//
// ============================================================

const {
  Sequelize,
} = require("sequelize");


// ============================================================
// VALIDAÇÃO DAS VARIÁVEIS
// ============================================================

const requiredVariables = [

  "DB_NAME",

  "DB_USER",

  "DB_HOST",

  "DB_PORT",

];


for (
  const variable
  of requiredVariables
) {

  if (
    !process.env[variable]
  ) {

    throw new Error(

      `Variável de ambiente obrigatória não configurada: ${variable}`

    );

  }

}


// ============================================================
// CONEXÃO
// ============================================================

const sequelize =
  new Sequelize(

    process.env.DB_NAME,

    process.env.DB_USER,

    process.env.DB_PASSWORD,

    {

      // ------------------------------------------------------
      // MYSQL
      // ------------------------------------------------------

      host:
        process.env.DB_HOST,

      port:
        Number(
          process.env.DB_PORT
        ),

      dialect:
        "mysql",


      // ------------------------------------------------------
      // LOG SQL
      // ------------------------------------------------------
      //
      // false evita poluir o terminal durante desenvolvimento.
      // ------------------------------------------------------

      logging:
        false,

    }

  );


// ============================================================
// EXPORT
// ============================================================

module.exports =
  sequelize;