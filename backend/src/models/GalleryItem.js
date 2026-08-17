// ============================================================
// MODEL GALERIA
// ============================================================
//
// Representa os registros do arquivo histórico.
//
// Um GalleryItem pode ser:
//
// - image
// - video
// - story
//
// AUTORIZAÇÃO:
//
// O RBAC continua sendo controlado pelas rotas:
//
// visualizar_galeria
// gerenciar_galeria
//
// allowedRoles é apenas uma restrição adicional de conteúdo.
//
// PADRÃO CANÔNICO:
//
// allowedRoles = Role.slug[]
//
// Exemplo:
//
// [
//   "membro",
//   "lideranca"
// ]
//
// [] significa:
//
// sem restrição específica por cargo.
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

const GalleryItem =
  sequelize.define(

    "GalleryItem",

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
      // TÍTULO
      // ======================================================
      //
      // Opcional.
      //
      // Isso permite registros históricos que dependam apenas
      // de mídia, descrição ou história.
      //
      // IMPORTANTE:
      //
      // Se a tabela existente estiver com NOT NULL, será
      // necessária migration para permitir NULL.
      //
      // ======================================================

      title: {

        type:
          DataTypes.STRING(
            200
          ),

        allowNull:
          true,

      },


      // ======================================================
      // DESCRIÇÃO CURTA
      // ======================================================

      description: {

        type:
          DataTypes.TEXT,

        allowNull:
          true,

      },


      // ======================================================
      // HISTÓRIA
      // ======================================================
      //
      // Conteúdo HTML produzido pelo editor rico.
      //
      // Exemplo:
      //
      // <p>Texto da história...</p>
      //
      // Para image/video pode ser NULL.
      //
      // IMPORTANTE:
      //
      // O model apenas armazena o HTML.
      //
      // Sanitização deve acontecer na camada apropriada antes
      // de renderizar conteúdo HTML no frontend.
      //
      // ======================================================

      story: {

        type:
          DataTypes.TEXT(
            "long"
          ),

        allowNull:
          true,

      },


      // ======================================================
      // URL DA MÍDIA
      // ======================================================
      //
      // image:
      // → URL da imagem.
      //
      // video:
      // → URL do vídeo.
      //
      // story:
      // → pode ser NULL.
      //
      // ======================================================

      imageUrl: {

        type:
          DataTypes.TEXT,

        allowNull:
          true,

      },


      // ======================================================
      // TIPO
      // ======================================================

      type: {

        type:
          DataTypes.ENUM(
            "image",
            "video",
            "story"
          ),

        allowNull:
          false,

        defaultValue:
          "image",

      },


      // ======================================================
      // DATA DO EVENTO
      // ======================================================
      //
      // Mantemos DATE por compatibilidade com a estrutura
      // atual do banco.
      //
      // O frontend pode trabalhar com YYYY-MM-DD e usar os
      // helpers de data para evitar conversão visual incorreta
      // por timezone.
      //
      // ======================================================

      eventDate: {

        type:
          DataTypes.DATE,

        allowNull:
          true,

      },


      // ======================================================
      // ORDEM
      // ======================================================

      order: {

        type:
          DataTypes.INTEGER,

        allowNull:
          false,

        defaultValue:
          999,

      },


      // ======================================================
      // CARGOS PERMITIDOS
      // ======================================================
      //
      // PADRÃO OFICIAL:
      //
      // Role.slug[]
      //
      // Exemplo:
      //
      // [
      //   "membro",
      //   "lideranca"
      // ]
      //
      // []
      //
      // significa:
      //
      // sem restrição específica por cargo.
      //
      // O controller deverá:
      //
      // - validar os roles;
      // - aceitar temporariamente Role.nome legado;
      // - converter novos dados para Role.slug;
      // - recusar "sem_acesso".
      //
      // ======================================================

      allowedRoles: {

        type:
          DataTypes.JSON,

        allowNull:
          true,

        defaultValue:
          [],

      },

    },

    {

      tableName:
        "gallery_items",

    }

  );


// ============================================================
// EXPORT
// ============================================================

module.exports =
  GalleryItem;