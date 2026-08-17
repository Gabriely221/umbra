// ============================================================
// CENTRAL CARTEL API
// ============================================================
//
// Servidor principal da aplicação.
//
// Responsável por:
//
// - carregar variáveis de ambiente
// - configurar Express
// - configurar CORS
// - servir arquivos públicos
// - registrar as rotas
// - conectar ao MySQL
// - sincronizar os models
// - executar o seed do RBAC
// - iniciar o servidor
//
// ============================================================


// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

require("dotenv").config();


// ============================================================
// DEPENDÊNCIAS
// ============================================================

const express =
  require("express");

const cors =
  require("cors");

const path =
  require("path");

const sequelize =
  require("./config/database");


// ============================================================
// MODELS / RELACIONAMENTOS
// ============================================================
//
// Apenas importar ./models registra os relacionamentos
// Sequelize antes do sync().
//
// ============================================================

require("./models");


// ============================================================
// ROTAS
// ============================================================

const authRoutes =
  require("./routes/authRoutes");

const adminRoutes =
  require("./routes/adminRoutes");

const membroRoutes =
  require("./routes/membroRoutes");

const linkRoutes =
  require("./routes/linkRoutes");

const galleryRoutes =
  require("./routes/galleryRoutes");

const organizationRoutes =
  require("./routes/organizationRoutes");

const ruleRoutes =
  require("./routes/ruleRoutes");

const homeRoutes =
  require("./routes/homeRoutes");


// ============================================================
// SEED
// ============================================================

const seedSystem =
  require("./seed/seedSystem");


// ============================================================
// APP
// ============================================================

const app =
  express();


// ============================================================
// PORTA
// ============================================================

const PORT =
  Number(
    process.env.PORT ||
    3000
  );


// ============================================================
// CORS
// ============================================================
//
// Durante o desenvolvimento:
//
// Frontend:
// http://localhost:5173
//
// Backend:
// http://localhost:3000
//
// A variável FRONTEND_URL pode substituir o valor padrão.
//
// ============================================================

app.use(
  cors({

    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",

    credentials:
      true,

  })
);


// ============================================================
// JSON
// ============================================================
//
// Limite para requests JSON.
//
// Uploads de arquivos não passam por express.json();
// eles utilizam multipart/form-data através do Multer.
//
// ============================================================

app.use(
  express.json({

    limit:
      "10mb",

  })
);


// ============================================================
// URL ENCODED
// ============================================================

app.use(
  express.urlencoded({

    extended:
      true,

    limit:
      "10mb",

  })
);


// ============================================================
// ARQUIVOS PÚBLICOS
// ============================================================
//
// Os arquivos da pasta configurada abaixo poderão ser
// acessados através de:
//
// /uploads/...
//
// Exemplo:
//
// http://localhost:3000/uploads/gallery/foto.jpg
//
// IMPORTANTE:
//
// Mantemos o mesmo caminho físico que já existia no projeto:
//
// path.join(__dirname, "../uploads")
//
// A localização será conferida futuramente junto com o
// uploadMiddleware para não alterar o fluxo de uploads
// acidentalmente.
//
// ============================================================

app.use(

  "/uploads",

  express.static(

    path.join(
      __dirname,
      "../uploads"
    )

  )

);


// ============================================================
// TESTE DA API
// ============================================================
//
// GET /
//
// ============================================================

app.get(

  "/",

  (
    req,
    res
  ) => {

    return res.json({

      message:
        "Central Cartel API funcionando.",

      status:
        "online",

      timestamp:
        new Date().toISOString(),

    });

  }

);


// ============================================================
// ROTAS DE AUTENTICAÇÃO
// ============================================================
//
// Base:
//
// /api/auth
//
// Exemplos:
//
// POST /api/auth/login
// POST /api/auth/register
// GET  /api/auth/me
//
// ============================================================

app.use(

  "/api/auth",

  authRoutes

);


// ============================================================
// ROTAS ADMINISTRATIVAS
// ============================================================
//
// Base:
//
// /api/admin
//
// ============================================================

app.use(

  "/api/admin",

  adminRoutes

);


// ============================================================
// ROTAS DA HOME
// ============================================================
//
// Base:
//
// /api/home
//
// Endpoint:
//
// GET /api/home/stats
//
// Autorização:
//
// - JWT
// - visualizar_inicio
//
// ============================================================

app.use(

  "/api/home",

  homeRoutes

);


// ============================================================
// ROTAS DE MEMBROS
// ============================================================
//
// Base:
//
// /api/membros
//
// ============================================================

app.use(

  "/api/membros",

  membroRoutes

);


// ============================================================
// ROTAS DE LINKS
// ============================================================
//
// Base:
//
// /api/links
//
// ============================================================

app.use(

  "/api/links",

  linkRoutes

);


// ============================================================
// ROTAS DA GALERIA
// ============================================================
//
// Base:
//
// /api/gallery
//
// Inclui:
//
// GET    /api/gallery
// POST   /api/gallery/upload
// POST   /api/gallery
// PUT    /api/gallery/:id
// DELETE /api/gallery/:id
//
// ============================================================

app.use(

  "/api/gallery",

  galleryRoutes

);


// ============================================================
// ROTAS DE RELAÇÕES EXTERNAS
// ============================================================
//
// Base:
//
// /api/organizations
//
// ============================================================

app.use(

  "/api/organizations",

  organizationRoutes

);


// ============================================================
// ROTAS DE REGRAS
// ============================================================
//
// Base:
//
// /api/rules
//
// ============================================================

app.use(

  "/api/rules",

  ruleRoutes

);


// ============================================================
// TRATAMENTO GLOBAL DE ERROS
// ============================================================
//
// Captura erros que eventualmente não tenham sido tratados
// pelos controllers/middlewares.
//
// ============================================================

app.use(

  (
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "[Express] Erro não tratado:",
      error
    );


    // --------------------------------------------------------
    // ERRO DO MULTER - LIMITE DE TAMANHO
    // --------------------------------------------------------

    if (
      error?.code ===
      "LIMIT_FILE_SIZE"
    ) {

      return res
        .status(400)
        .json({

          message:
            "O arquivo ultrapassa o limite máximo permitido de 50 MB.",

        });

    }


    // --------------------------------------------------------
    // ERRO GENÉRICO
    // --------------------------------------------------------

    return res
      .status(
        error?.status ||
        500
      )
      .json({

        message:
          error?.message ||
          "Erro interno do servidor.",

      });

  }

);


// ============================================================
// START SERVER
// ============================================================

async function startServer() {

  try {

    // ========================================================
    // CONEXÃO COM MYSQL
    // ========================================================

    await sequelize.authenticate();


    console.log(
      "MySQL conectado."
    );


    // ========================================================
    // SINCRONIZAÇÃO DOS MODELS
    // ========================================================
    //
    // Durante desenvolvimento ainda utilizamos alter: true.
    //
    // IMPORTANTE:
    //
    // Isso será revisto no item de migrations.
    //
    // Alter automático é útil durante desenvolvimento, mas não
    // deve ser tratado como substituto definitivo de migrations
    // versionadas, principalmente agora que temos alterações
    // sensíveis de foreign keys e auditoria.
    //
    // Em produção:
    //
    // alter = false
    //
    // ========================================================

    await sequelize.sync({

      alter:
        process.env.NODE_ENV !==
        "production",

    });


    console.log(
      "Tabelas sincronizadas."
    );


    // ========================================================
    // SEED DO SISTEMA
    // ========================================================
    //
    // Cria/atualiza:
    //
    // - permissions
    // - roles
    // - relações Role ↔ Permission
    // - administrador inicial
    //
    // ========================================================

    await seedSystem();


    console.log(
      "RBAC inicializado."
    );


    // ========================================================
    // START EXPRESS
    // ========================================================

    app.listen(

      PORT,

      () => {

        console.log(
          `Servidor rodando em http://localhost:${PORT}`
        );


        console.log(
          `Arquivos públicos em http://localhost:${PORT}/uploads`
        );

      }

    );

  } catch (
    error
  ) {

    console.error(
      "Erro ao iniciar o servidor:",
      error
    );


    process.exit(
      1
    );

  }

}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

startServer();