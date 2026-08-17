// ============================================================
// MIDDLEWARE DE UPLOAD
// ============================================================
//
// Utiliza Multer para receber arquivos enviados pelo frontend.
//
// DIRETÓRIO FÍSICO:
//
// <raiz-do-projeto>/uploads/gallery/
//
// IMPORTANTE:
//
// Este arquivo está em:
//
// backend/middleware/uploadMiddleware.js
//
// portanto:
//
// ../../uploads/gallery
//
// aponta para:
//
// <raiz-do-projeto>/uploads/gallery
//
// O server.js expõe:
//
// <raiz-do-projeto>/uploads
//
// através de:
//
// /uploads
//
// Portanto:
//
// <raiz-do-projeto>/uploads/gallery/arquivo.jpg
//
// fica disponível como:
//
// /uploads/gallery/arquivo.jpg
//
// ============================================================
//
// TIPOS PERMITIDOS:
//
// IMAGENS:
//
// - JPEG
// - PNG
// - WEBP
// - GIF
// - AVIF
//
// VÍDEOS:
//
// - MP4
// - WEBM
// - OGG
// - MOV
//
// SVG NÃO é permitido.
//
// Motivo:
//
// SVG é um formato ativo baseado em XML e pode conter recursos
// que não são necessários para a galeria.
//
// ============================================================
//
// LIMITE:
//
// 50 MB
//
// ============================================================


// ============================================================
// DEPENDÊNCIAS
// ============================================================

const multer =
  require(
    "multer"
  );


const fs =
  require(
    "fs"
  );


const path =
  require(
    "path"
  );


const crypto =
  require(
    "crypto"
  );


// ============================================================
// CONSTANTES
// ============================================================

const MAX_FILE_SIZE =
  50 *
  1024 *
  1024;


// ============================================================
// TIPOS PERMITIDOS
// ============================================================
//
// A extensão final NÃO é obtida cegamente do arquivo enviado.
//
// Ela é determinada pelo MIME permitido.
//
// Isso evita, por exemplo:
//
// imagem.html
// arquivo.svg
// video.exe
//
// serem persistidos usando extensões perigosas.
//
// extensions:
//
// extensões aceitas no nome original.
//
// outputExtension:
//
// extensão efetivamente utilizada no arquivo persistido.
//
// ============================================================

const ALLOWED_FILE_TYPES = {

  // ==========================================================
  // IMAGENS
  // ==========================================================

  "image/jpeg": {

    extensions: [
      ".jpg",
      ".jpeg",
      ".jfif",
    ],

    outputExtension:
      ".jpg",

  },


  "image/png": {

    extensions: [
      ".png",
    ],

    outputExtension:
      ".png",

  },


  "image/webp": {

    extensions: [
      ".webp",
    ],

    outputExtension:
      ".webp",

  },


  "image/gif": {

    extensions: [
      ".gif",
    ],

    outputExtension:
      ".gif",

  },


  "image/avif": {

    extensions: [
      ".avif",
    ],

    outputExtension:
      ".avif",

  },


  // ==========================================================
  // VÍDEOS
  // ==========================================================

  "video/mp4": {

    extensions: [
      ".mp4",
      ".m4v",
    ],

    outputExtension:
      ".mp4",

  },


  "video/x-m4v": {

    extensions: [
      ".m4v",
      ".mp4",
    ],

    outputExtension:
      ".mp4",

  },


  "video/webm": {

    extensions: [
      ".webm",
    ],

    outputExtension:
      ".webm",

  },


  "video/ogg": {

    extensions: [
      ".ogv",
      ".ogg",
    ],

    outputExtension:
      ".ogv",

  },


  "video/quicktime": {

    extensions: [
      ".mov",
    ],

    outputExtension:
      ".mov",

  },

};


// ============================================================
// DIRETÓRIO
// ============================================================

const uploadDirectory =
  path.join(
    __dirname,
    "../../uploads/gallery"
  );


// ============================================================
// GARANTE DIRETÓRIO
// ============================================================

if (
  !fs.existsSync(
    uploadDirectory
  )
) {

  fs.mkdirSync(
    uploadDirectory,
    {
      recursive:
        true,
    }
  );

}


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// ERRO DE UPLOAD
// ------------------------------------------------------------

function createUploadError(
  message,
  code =
    "INVALID_UPLOAD"
) {

  const error =
    new Error(
      message
    );


  error.status =
    400;


  error.code =
    code;


  return error;

}


// ------------------------------------------------------------
// MIME NORMALIZADO
// ------------------------------------------------------------

function normalizeMimeType(
  value
) {

  return String(
    value ??
    ""
  )
    .trim()
    .toLowerCase();

}


// ------------------------------------------------------------
// EXTENSÃO ORIGINAL
// ------------------------------------------------------------

function getOriginalExtension(
  file
) {

  return path
    .extname(
      String(
        file?.originalname ??
        ""
      )
    )
    .trim()
    .toLowerCase();

}


// ------------------------------------------------------------
// CONFIGURAÇÃO DO TIPO
// ------------------------------------------------------------

function getFileTypeConfig(
  file
) {

  const mimeType =
    normalizeMimeType(
      file?.mimetype
    );


  return (
    ALLOWED_FILE_TYPES[
      mimeType
    ] ||
    null
  );

}


// ------------------------------------------------------------
// NOME BASE
// ------------------------------------------------------------

function createSafeBaseName(
  originalName
) {

  const extension =
    path.extname(
      String(
        originalName ??
        ""
      )
    );


  const rawBaseName =
    path.basename(
      String(
        originalName ??
        ""
      ),
      extension
    );


  const normalized =
    rawBaseName

      .normalize(
        "NFD"
      )

      .replace(
        /[\u0300-\u036f]/g,
        ""
      )

      .replace(
        /[^a-zA-Z0-9_-]/g,
        "-"
      )

      .replace(
        /-+/g,
        "-"
      )

      .replace(
        /^[-_]+|[-_]+$/g,
        ""
      )

      .slice(
        0,
        80
      );


  return (
    normalized ||
    "arquivo"
  );

}


// ------------------------------------------------------------
// IDENTIFICADOR ALEATÓRIO
// ------------------------------------------------------------
//
// Não dependemos somente de:
//
// Date.now()
// Math.random()
//
// para gerar o nome do arquivo.
//
// ============================================================

function createRandomIdentifier() {

  return crypto
    .randomBytes(
      16
    )
    .toString(
      "hex"
    );

}


// ============================================================
// STORAGE
// ============================================================

const storage =
  multer.diskStorage({

    // --------------------------------------------------------
    // DESTINO
    // --------------------------------------------------------

    destination:
      (
        req,
        file,
        callback
      ) => {

        callback(
          null,
          uploadDirectory
        );

      },


    // --------------------------------------------------------
    // NOME DO ARQUIVO
    // --------------------------------------------------------

    filename:
      (
        req,
        file,
        callback
      ) => {

        try {

          const typeConfig =
            getFileTypeConfig(
              file
            );


          if (
            !typeConfig
          ) {

            return callback(

              createUploadError(
                "Tipo de arquivo não permitido.",
                "INVALID_FILE_TYPE"
              )

            );

          }


          const baseName =
            createSafeBaseName(
              file.originalname
            );


          const unique =
            createRandomIdentifier();


          // --------------------------------------------------
          // EXTENSÃO SEGURA
          // --------------------------------------------------
          //
          // A extensão vem da nossa whitelist de MIME.
          //
          // NÃO usamos diretamente:
          //
          // path.extname(file.originalname)
          //
          // para montar o arquivo final.
          //
          // --------------------------------------------------

          const outputExtension =
            typeConfig.outputExtension;


          const filename =
            `${baseName}-${unique}${outputExtension}`;


          return callback(
            null,
            filename
          );

        } catch (
          error
        ) {

          return callback(
            error
          );

        }

      },

  });


// ============================================================
// FILTRO
// ============================================================

function fileFilter(
  req,
  file,
  callback
) {

  try {

    // ========================================================
    // MIME
    // ========================================================

    const mimeType =
      normalizeMimeType(
        file?.mimetype
      );


    const typeConfig =
      ALLOWED_FILE_TYPES[
        mimeType
      ];


    if (
      !typeConfig
    ) {

      return callback(

        createUploadError(
          "Tipo de arquivo não permitido. Envie uma imagem ou vídeo em formato compatível.",
          "INVALID_FILE_TYPE"
        )

      );

    }


    // ========================================================
    // EXTENSÃO ORIGINAL
    // ========================================================
    //
    // MIME vem do cliente e não deve ser tratado como prova
    // absoluta do conteúdo.
    //
    // Conferir também a extensão evita inconsistências
    // simples, por exemplo:
    //
    // arquivo.html
    // Content-Type: image/jpeg
    //
    // Essa ainda não é uma validação por assinatura binária.
    //
    // ========================================================

    const originalExtension =
      getOriginalExtension(
        file
      );


    // --------------------------------------------------------
    // Arquivos sem extensão podem existir em alguns clientes.
    //
    // Nesse caso permitimos o upload porque a extensão final
    // será determinada pelo servidor através do MIME.
    // --------------------------------------------------------

    if (
      originalExtension &&
      !typeConfig.extensions.includes(
        originalExtension
      )
    ) {

      return callback(

        createUploadError(
          "A extensão do arquivo não corresponde ao tipo informado.",
          "INVALID_FILE_EXTENSION"
        )

      );

    }


    // ========================================================
    // ACEITA
    // ========================================================

    return callback(
      null,
      true
    );

  } catch (
    error
  ) {

    return callback(
      error
    );

  }

}


// ============================================================
// MULTER
// ============================================================

const uploadGalleryFile =
  multer({

    storage,

    fileFilter,

    limits: {

      // ------------------------------------------------------
      // TAMANHO DO ARQUIVO
      // ------------------------------------------------------

      fileSize:
        MAX_FILE_SIZE,


      // ------------------------------------------------------
      // QUANTIDADE DE ARQUIVOS
      // ------------------------------------------------------
      //
      // A rota utiliza:
      //
      // .single("file")
      //
      // Mantemos também o limite explícito.
      //
      // ------------------------------------------------------

      files:
        1,


      // ------------------------------------------------------
      // CAMPOS TEXTUAIS
      // ------------------------------------------------------
      //
      // Atualmente o frontend envia também:
      //
      // folder=gallery
      //
      // O backend NÃO utiliza esse valor para determinar o
      // diretório.
      //
      // Isso é intencional:
      //
      // o cliente não escolhe onde o arquivo será gravado.
      //
      // ------------------------------------------------------

      fields:
        5,


      // ------------------------------------------------------
      // PARTES MULTIPART
      // ------------------------------------------------------

      parts:
        10,


      // ------------------------------------------------------
      // TAMANHO DE CAMPO TEXTUAL
      // ------------------------------------------------------

      fieldSize:
        64 *
        1024,

    },

  });


// ============================================================
// EXPORT
// ============================================================

module.exports =
  uploadGalleryFile;