// ============================================================
// CONTROLLER DA GALERIA
// ============================================================
//
// Responsável por:
//
// - listar registros;
// - criar registros;
// - atualizar registros;
// - excluir registros;
// - receber upload de arquivos.
//
// TIPOS:
//
// image
// video
// story
//
// RESTRIÇÃO DE CONTEÚDO:
//
// GalleryItem.allowedRoles
// → Role.slug[]
//
// [] significa:
//
// sem restrição específica por cargo.
//
// IMPORTANTE:
//
// allowedRoles NÃO substitui RBAC.
//
// As rotas continuam responsáveis por:
//
// visualizar_galeria
// gerenciar_galeria
//
// SEGURANÇA DO HTML:
//
// O backend:
//
// - valida presença;
// - valida tamanho;
// - valida coerência do tipo.
//
// O backend NÃO tenta implementar sanitização HTML através de
// regex.
//
// Todo ponto que inserir story no DOM deve continuar usando:
//
// DOMPurify
//
// antes de:
//
// dangerouslySetInnerHTML
//
// ============================================================


// ============================================================
// MODELS
// ============================================================

const {
  GalleryItem,
  Role,
} =
  require(
    "../models"
  );


// ============================================================
// CONSTANTES
// ============================================================

const GALLERY_TYPES = [
  "image",
  "video",
  "story",
];


// ------------------------------------------------------------
// LIMITES DE CONTEÚDO
// ------------------------------------------------------------
//
// O Express possui um limite global maior.
//
// Estes limites existem para que um campo individual não possa
// consumir desnecessariamente o limite completo da request.
//
// description utiliza TEXT no banco.
//
// story utiliza LONGTEXT.
//
// ============================================================

const MAX_TITLE_LENGTH =
  200;


const MAX_DESCRIPTION_LENGTH =
  15000;


const MAX_STORY_LENGTH =
  500000;


const MAX_MEDIA_URL_LENGTH =
  2048;


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// ERRO HTTP
// ------------------------------------------------------------

function httpError(
  status,
  message,
  data = {}
) {

  const error =
    new Error(
      message
    );


  error.status =
    status;


  error.data =
    data;


  return error;

}


// ------------------------------------------------------------
// ID
// ------------------------------------------------------------

function normalizeId(
  value
) {

  const id =
    Number(
      value
    );


  if (
    !Number.isInteger(
      id
    ) ||
    id <=
      0
  ) {

    return null;

  }


  return id;

}


// ------------------------------------------------------------
// TEXTO
// ------------------------------------------------------------

function normalizeText(
  value
) {

  return String(
    value ??
    ""
  ).trim();

}


// ------------------------------------------------------------
// TEXTO OPCIONAL
// ------------------------------------------------------------

function normalizeOptionalText(
  value
) {

  if (
    value ===
      null ||
    value ===
      undefined
  ) {

    return null;

  }


  const text =
    String(
      value
    ).trim();


  return text ||
    null;

}


// ------------------------------------------------------------
// TEXTO OPCIONAL COM LIMITE
// ------------------------------------------------------------

function normalizeLimitedOptionalText(
  value,
  maxLength,
  label
) {

  const text =
    normalizeOptionalText(
      value
    );


  if (
    !text
  ) {

    return null;

  }


  if (
    text.length >
      maxLength
  ) {

    throw httpError(
      400,
      `${label} deve possuir no máximo ${maxLength} caracteres.`
    );

  }


  return text;

}


// ------------------------------------------------------------
// ARRAY DE STRINGS
// ------------------------------------------------------------

function normalizeStringArray(
  value
) {

  if (
    !Array.isArray(
      value
    )
  ) {

    return [];

  }


  return [
    ...new Set(

      value

        .map(
          (
            item
          ) =>
            String(
              item ??
              ""
            ).trim()
        )

        .filter(
          Boolean
        )

    ),
  ];

}


// ------------------------------------------------------------
// ROLE DO USUÁRIO
// ------------------------------------------------------------

function getUserRole(
  req
) {

  return (
    req.usuario?.Role ||
    req.usuario?.role ||
    req.user?.Role ||
    req.user?.role ||
    null
  );

}


// ------------------------------------------------------------
// PERMISSÕES
// ------------------------------------------------------------

function getUserPermissions(
  req
) {

  const role =
    getUserRole(
      req
    );


  const permissions =
    role?.Permissions ||
    role?.permissions ||
    [];


  return Array.isArray(
    permissions
  )
    ? permissions
    : [];

}


// ------------------------------------------------------------
// POSSUI PERMISSÃO
// ------------------------------------------------------------

function hasPermission(
  req,
  slug
) {

  return getUserPermissions(
    req
  ).some(
    (
      permission
    ) => {

      if (
        typeof permission ===
        "string"
      ) {

        return (
          permission ===
          slug
        );

      }


      return (
        permission?.slug ===
        slug
      );

    }
  );

}


// ============================================================
// ALLOWED ROLES
// ============================================================
//
// Entrada aceita:
//
// [
//   "lideranca"
// ]
//
// ou legado:
//
// [
//   "Liderança"
// ]
//
// Persistência:
//
// [
//   "lideranca"
// ]
//
// ============================================================

async function resolveAllowedRoles(
  values
) {

  if (
    !Array.isArray(
      values
    )
  ) {

    throw httpError(
      400,
      "Cargos permitidos deve ser uma lista."
    );

  }


  const normalized =
    normalizeStringArray(
      values
    );


  if (
    normalized.length ===
      0
  ) {

    return [];

  }


  const roles =
    await Role.findAll({

      attributes: [
        "id",
        "nome",
        "slug",
      ],

    });


  const resolved =
    [];


  const invalid =
    [];


  for (
    const value
    of normalized
  ) {

    const comparison =
      value
        .trim()
        .toLocaleLowerCase(
          "pt-BR"
        );


    const role =
      roles.find(
        (
          item
        ) => {

          const slug =
            String(
              item.slug ??
              ""
            )
              .trim()
              .toLocaleLowerCase(
                "pt-BR"
              );


          const nome =
            String(
              item.nome ??
              ""
            )
              .trim()
              .toLocaleLowerCase(
                "pt-BR"
              );


          return (
            comparison ===
              slug ||
            comparison ===
              nome
          );

        }
      );


    if (
      !role ||
      role.slug ===
        "sem_acesso"
    ) {

      invalid.push(
        value
      );


      continue;

    }


    resolved.push(
      role.slug
    );

  }


  if (
    invalid.length >
      0
  ) {

    throw httpError(
      400,
      "Um ou mais cargos informados são inválidos.",
      {
        invalidRoles:
          invalid,
      }
    );

  }


  return [
    ...new Set(
      resolved
    ),
  ];

}


// ============================================================
// MATCH DE ROLE
// ============================================================
//
// Reconhece temporariamente:
//
// Role.slug
// Role.nome
//
// porque ainda podemos possuir dados legados no banco.
//
// Depois da migration de normalização de dados, a
// compatibilidade com Role.nome poderá ser removida.
//
// ============================================================

function matchesRoleRestriction(
  item,
  role
) {

  const allowedRoles =
    normalizeStringArray(
      item.allowedRoles
    );


  // ----------------------------------------------------------
  // SEM RESTRIÇÃO
  // ----------------------------------------------------------

  if (
    allowedRoles.length ===
      0
  ) {

    return true;

  }


  if (
    !role
  ) {

    return false;

  }


  const roleSlug =
    String(
      role.slug ??
      ""
    ).trim();


  const roleName =
    String(
      role.nome ??
      ""
    ).trim();


  const roleSlugLower =
    roleSlug.toLocaleLowerCase(
      "pt-BR"
    );


  const roleNameLower =
    roleName.toLocaleLowerCase(
      "pt-BR"
    );


  return allowedRoles.some(
    (
      allowed
    ) => {

      const normalized =
        allowed.toLocaleLowerCase(
          "pt-BR"
        );


      return (
        normalized ===
          roleSlugLower ||
        normalized ===
          roleNameLower
      );

    }
  );

}


// ============================================================
// STORY
// ============================================================


// ------------------------------------------------------------
// TEXTO VISÍVEL
// ------------------------------------------------------------
//
// Esta função NÃO sanitiza HTML.
//
// Ela é utilizada somente para detectar conteúdos vazios
// produzidos pelo Quill, por exemplo:
//
// <p><br></p>
//
// ------------------------------------------------------------

function getStoryVisibleText(
  html
) {

  const value =
    String(
      html ??
      ""
    );


  return value

    .replace(
      /<[^>]*>/g,
      ""
    )

    .replace(
      /&nbsp;/gi,
      " "
    )

    .replace(
      /&#160;/gi,
      " "
    )

    .replace(
      /&#xA0;/gi,
      " "
    )

    .trim();

}


// ------------------------------------------------------------
// POSSUI CONTEÚDO
// ------------------------------------------------------------

function hasMeaningfulStory(
  html
) {

  return Boolean(
    getStoryVisibleText(
      html
    )
  );

}


// ------------------------------------------------------------
// NORMALIZA STORY
// ------------------------------------------------------------

function normalizeStory(
  value
) {

  return normalizeLimitedOptionalText(
    value,
    MAX_STORY_LENGTH,
    "A história"
  );

}


// ============================================================
// URL DE MÍDIA
// ============================================================
//
// Aceitamos:
//
// https://...
// http://...
// /uploads/gallery/...
//
// Não aceitamos:
//
// javascript:
// data:
// blob:
// file:
// ftp:
// //host/...
//
// Isso impede que campos persistentes de mídia sejam usados
// para armazenar esquemas inesperados.
//
// ============================================================

function normalizeMediaUrl(
  value
) {

  const text =
    normalizeOptionalText(
      value
    );


  if (
    !text
  ) {

    return null;

  }


  if (
    text.length >
      MAX_MEDIA_URL_LENGTH
  ) {

    throw httpError(
      400,
      `A URL da mídia deve possuir no máximo ${MAX_MEDIA_URL_LENGTH} caracteres.`
    );

  }


  // ----------------------------------------------------------
  // CONTROLES
  // ----------------------------------------------------------

  if (
    /[\u0000-\u001F\u007F]/.test(
      text
    )
  ) {

    throw httpError(
      400,
      "A URL da mídia contém caracteres inválidos."
    );

  }


  // ----------------------------------------------------------
  // UPLOAD LOCAL
  // ----------------------------------------------------------

  if (
    text.startsWith(
      "/uploads/gallery/"
    )
  ) {

    return text;

  }


  // ----------------------------------------------------------
  // NÃO ACEITAMOS URL PROTOCOL-RELATIVE
  // ----------------------------------------------------------

  if (
    text.startsWith(
      "//"
    )
  ) {

    throw httpError(
      400,
      "A URL da mídia é inválida."
    );

  }


  // ----------------------------------------------------------
  // URL ABSOLUTA
  // ----------------------------------------------------------

  let parsedUrl;


  try {

    parsedUrl =
      new URL(
        text
      );

  } catch {

    throw httpError(
      400,
      "A URL da mídia é inválida."
    );

  }


  if (
    parsedUrl.protocol !==
      "http:" &&
    parsedUrl.protocol !==
      "https:"
  ) {

    throw httpError(
      400,
      "A URL da mídia deve utilizar HTTP ou HTTPS."
    );

  }


  return text;

}


// ============================================================
// DATA
// ============================================================

function normalizeEventDate(
  value
) {

  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {

    return null;

  }


  const text =
    String(
      value
    ).trim();


  const date =
    new Date(
      text
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    throw httpError(
      400,
      "Data do evento inválida."
    );

  }


  // ----------------------------------------------------------
  // Mantemos o valor original.
  //
  // Isso preserva YYYY-MM-DD quando enviado pelo frontend.
  // ----------------------------------------------------------

  return text;

}


// ============================================================
// ORDEM
// ============================================================

function normalizeOrder(
  value,
  fallback = 999
) {

  if (
    value ===
      undefined ||
    value ===
      null ||
    value ===
      ""
  ) {

    return fallback;

  }


  const order =
    Number(
      value
    );


  if (
    !Number.isInteger(
      order
    )
  ) {

    throw httpError(
      400,
      "A ordem informada deve ser um número inteiro."
    );

  }


  return order;

}


// ============================================================
// TIPO
// ============================================================

function normalizeType(
  value,
  fallback = "image"
) {

  const sourceValue =
    value ===
      undefined ||
    value ===
      null

      ? fallback

      : value;


  const type =
    normalizeText(
      sourceValue
    ).toLowerCase();


  if (
    !GALLERY_TYPES.includes(
      type
    )
  ) {

    throw httpError(
      400,
      'Tipo inválido. Utilize "image", "video" ou "story".'
    );

  }


  return type;

}


// ============================================================
// VALIDA CONTEÚDO PELO TIPO
// ============================================================

function validateContentByType({
  type,
  imageUrl,
  story,
}) {

  // ----------------------------------------------------------
  // IMAGE
  // ----------------------------------------------------------

  if (
    type ===
    "image"
  ) {

    if (
      !imageUrl
    ) {

      throw httpError(
        400,
        "Uma imagem deve possuir um arquivo ou URL."
      );

    }


    return;

  }


  // ----------------------------------------------------------
  // VIDEO
  // ----------------------------------------------------------

  if (
    type ===
    "video"
  ) {

    if (
      !imageUrl
    ) {

      throw httpError(
        400,
        "Um vídeo deve possuir um arquivo ou URL."
      );

    }


    return;

  }


  // ----------------------------------------------------------
  // STORY
  // ----------------------------------------------------------

  if (
    type ===
    "story"
  ) {

    if (
      !story ||
      !hasMeaningfulStory(
        story
      )
    ) {

      throw httpError(
        400,
        "Uma história deve possuir conteúdo."
      );

    }

  }

}


// ============================================================
// FORMATA ITEM
// ============================================================

function formatGalleryItem(
  item
) {

  const allowedRoles =
    normalizeStringArray(
      item.allowedRoles
    );


  return {

    id:
      item.id,

    title:
      item.title,

    description:
      item.description,

    story:
      item.story,

    type:
      item.type,

    imageUrl:
      item.imageUrl,

    eventDate:
      item.eventDate,

    order:
      item.order,

    allowedRoles,


    // --------------------------------------------------------
    // COMPATIBILIDADE DURANTE A MIGRAÇÃO
    // --------------------------------------------------------

    file_url:
      item.imageUrl ||
      null,

    fileUrl:
      item.imageUrl ||
      null,

    image_url:
      item.imageUrl ||
      null,

    event_date:
      item.eventDate ||
      null,

    allowed_cargos:
      allowedRoles,


    // --------------------------------------------------------
    // DATAS DO REGISTRO
    // --------------------------------------------------------

    createdAt:
      item.createdAt,

    updatedAt:
      item.updatedAt,

  };

}


// ============================================================
// EXTRAI URL DE MÍDIA DO BODY
// ============================================================

function getImageUrlInput(
  body
) {

  if (
    body.imageUrl !==
      undefined
  ) {

    return body.imageUrl;

  }


  if (
    body.image_url !==
      undefined
  ) {

    return body.image_url;

  }


  if (
    body.fileUrl !==
      undefined
  ) {

    return body.fileUrl;

  }


  if (
    body.file_url !==
      undefined
  ) {

    return body.file_url;

  }


  return undefined;

}


// ============================================================
// EXTRAI EVENT DATE
// ============================================================

function getEventDateInput(
  body
) {

  if (
    body.eventDate !==
      undefined
  ) {

    return body.eventDate;

  }


  if (
    body.event_date !==
      undefined
  ) {

    return body.event_date;

  }


  return undefined;

}


// ============================================================
// EXTRAI ALLOWED ROLES
// ============================================================

function getAllowedRolesInput(
  body
) {

  if (
    body.allowedRoles !==
      undefined
  ) {

    return body.allowedRoles;

  }


  if (
    body.allowed_cargos !==
      undefined
  ) {

    return body.allowed_cargos;

  }


  return undefined;

}


// ============================================================
// BASE URL PÚBLICA
// ============================================================

function normalizeConfiguredBaseUrl(
  value
) {

  const text =
    normalizeText(
      value
    )
      .replace(
        /\/+$/g,
        ""
      );


  if (
    !text
  ) {

    return "";

  }


  let parsedUrl;


  try {

    parsedUrl =
      new URL(
        text
      );

  } catch {

    throw httpError(
      500,
      "PUBLIC_BASE_URL possui uma URL inválida."
    );

  }


  if (
    parsedUrl.protocol !==
      "http:" &&
    parsedUrl.protocol !==
      "https:"
  ) {

    throw httpError(
      500,
      "PUBLIC_BASE_URL deve utilizar HTTP ou HTTPS."
    );

  }


  return text;

}


// ============================================================
// LISTAR
// ============================================================
//
// GET /api/gallery
//
// gerenciar_galeria:
//
// → recebe todos os registros.
//
// visualizar_galeria:
//
// → recebe somente:
//   - allowedRoles vazio
//   OU
//   - seu Role.slug permitido.
//
// ============================================================

async function listar(
  req,
  res
) {

  try {

    const items =
      await GalleryItem.findAll({

        order: [

          [
            "eventDate",
            "DESC",
          ],

          [
            "order",
            "ASC",
          ],

          [
            "createdAt",
            "DESC",
          ],

        ],

      });


    const canManage =
      hasPermission(
        req,
        "gerenciar_galeria"
      );


    // ========================================================
    // GERENCIADOR
    // ========================================================

    if (
      canManage
    ) {

      return res.json(
        items.map(
          formatGalleryItem
        )
      );

    }


    // ========================================================
    // VISUALIZAÇÃO NORMAL
    // ========================================================

    const role =
      getUserRole(
        req
      );


    const visibleItems =
      items.filter(
        (
          item
        ) =>
          matchesRoleRestriction(
            item,
            role
          )
      );


    return res.json(
      visibleItems.map(
        formatGalleryItem
      )
    );

  } catch (
    error
  ) {

    console.error(
      "[GalleryController] listar:",
      error
    );


    return res
      .status(500)
      .json({

        message:
          "Erro ao listar registros da galeria.",

      });

  }

}


// ============================================================
// UPLOAD
// ============================================================
//
// POST /api/gallery/upload
//
// O Multer deve:
//
// - receber o arquivo;
// - validar tamanho;
// - validar MIME permitido;
// - salvar em uploads/gallery.
//
// Este controller apenas devolve a URL pública.
//
// O uploadMiddleware ainda será conferido separadamente.
//
// ============================================================

async function uploadGalleryFile(
  req,
  res
) {

  try {

    if (
      !req.file
    ) {

      return res
        .status(400)
        .json({

          message:
            "Nenhum arquivo foi enviado.",

        });

    }


    // ========================================================
    // BASE URL
    // ========================================================
    //
    // Produção:
    //
    // PUBLIC_BASE_URL=https://api.seudominio.com
    //
    // Em produção é altamente recomendado configurar a
    // variável para não depender do Host da requisição.
    //
    // ========================================================

    const configuredBaseUrl =
      normalizeConfiguredBaseUrl(
        process.env.PUBLIC_BASE_URL
      );


    const requestBaseUrl =
      `${req.protocol}://${req.get(
        "host"
      )}`;


    const baseUrl =
      configuredBaseUrl ||
      requestBaseUrl;


    // ========================================================
    // URL
    // ========================================================

    const relativeUrl =
      `/uploads/gallery/${encodeURIComponent(
        req.file.filename
      )}`;


    const fileUrl =
      `${baseUrl}${relativeUrl}`;


    // ========================================================
    // TIPO SUGERIDO
    // ========================================================

    let suggestedType =
      null;


    if (
      req.file.mimetype
        ?.toLowerCase()
        .startsWith(
          "image/"
        )
    ) {

      suggestedType =
        "image";

    }


    if (
      req.file.mimetype
        ?.toLowerCase()
        .startsWith(
          "video/"
        )
    ) {

      suggestedType =
        "video";

    }


    // ========================================================
    // RESPOSTA
    // ========================================================

    return res
      .status(201)
      .json({

        file_url:
          fileUrl,

        fileUrl:
          fileUrl,

        image_url:
          fileUrl,

        imageUrl:
          fileUrl,

        url:
          fileUrl,

        relativeUrl,

        filename:
          req.file.filename,

        originalName:
          req.file.originalname,

        mimeType:
          req.file.mimetype,

        size:
          req.file.size,

        suggestedType,

      });

  } catch (
    error
  ) {

    console.error(
      "[GalleryController] uploadGalleryFile:",
      error
    );


    return res
      .status(
        error.status ||
        500
      )
      .json({

        message:
          error.message ||
          "Erro ao enviar arquivo.",

      });

  }

}


// ============================================================
// CRIAR
// ============================================================
//
// POST /api/gallery
//
// Permission:
//
// gerenciar_galeria
//
// ============================================================

async function criar(
  req,
  res
) {

  try {

    const body =
      req.body ||
      {};


    // ========================================================
    // TYPE
    // ========================================================

    const type =
      normalizeType(
        body.type,
        "image"
      );


    // ========================================================
    // TITLE
    // ========================================================

    const title =
      normalizeLimitedOptionalText(
        body.title,
        MAX_TITLE_LENGTH,
        "O título"
      );


    // ========================================================
    // DESCRIPTION
    // ========================================================

    const description =
      normalizeLimitedOptionalText(
        body.description,
        MAX_DESCRIPTION_LENGTH,
        "A descrição"
      );


    // ========================================================
    // STORY
    // ========================================================

    const story =
      normalizeStory(
        body.story
      );


    // ========================================================
    // IMAGE URL
    // ========================================================

    let imageUrl =
      normalizeMediaUrl(
        getImageUrlInput(
          body
        )
      );


    // --------------------------------------------------------
    // STORY NÃO POSSUI MÍDIA PRINCIPAL
    // --------------------------------------------------------
    //
    // Isso evita manter uma URL residual caso um cliente envie
    // type=story juntamente com file_url.
    //
    // --------------------------------------------------------

    if (
      type ===
        "story"
    ) {

      imageUrl =
        null;

    }


    // ========================================================
    // EVENT DATE
    // ========================================================

    const eventDateInput =
      getEventDateInput(
        body
      );


    const eventDate =
      normalizeEventDate(
        eventDateInput
      );


    // ========================================================
    // ORDER
    // ========================================================

    const order =
      normalizeOrder(
        body.order,
        999
      );


    // ========================================================
    // ALLOWED ROLES
    // ========================================================

    const allowedRolesInput =
      getAllowedRolesInput(
        body
      ) ??
      [];


    const allowedRoles =
      await resolveAllowedRoles(
        allowedRolesInput
      );


    // ========================================================
    // VALIDA COERÊNCIA DO TIPO
    // ========================================================

    validateContentByType({

      type,

      imageUrl,

      story,

    });


    // ========================================================
    // CRIA
    // ========================================================

    const item =
      await GalleryItem.create({

        title,

        description,

        story,

        imageUrl,

        type,

        eventDate,

        order,

        allowedRoles,

      });


    return res
      .status(201)
      .json(
        formatGalleryItem(
          item
        )
      );

  } catch (
    error
  ) {

    console.error(
      "[GalleryController] criar:",
      error
    );


    return res
      .status(
        error.status ||
        500
      )
      .json({

        message:
          error.message ||
          "Erro ao criar registro da galeria.",

        ...(
          error.data ||
          {}
        ),

      });

  }

}


// ============================================================
// ATUALIZAR
// ============================================================
//
// PUT /api/gallery/:id
//
// Atualização parcial.
//
// Antes de salvar, validamos o estado FINAL do registro.
//
// Isso evita:
//
// type = "video"
// imageUrl = null
//
// ou:
//
// type = "story"
// story vazio
//
// ============================================================

async function atualizar(
  req,
  res
) {

  try {

    const itemId =
      normalizeId(
        req.params.id
      );


    if (
      !itemId
    ) {

      throw httpError(
        400,
        "ID do registro inválido."
      );

    }


    const item =
      await GalleryItem.findByPk(
        itemId
      );


    if (
      !item
    ) {

      throw httpError(
        404,
        "Registro não encontrado."
      );

    }


    const body =
      req.body ||
      {};


    // ========================================================
    // TITLE
    // ========================================================

    if (
      body.title !==
      undefined
    ) {

      item.title =
        normalizeLimitedOptionalText(
          body.title,
          MAX_TITLE_LENGTH,
          "O título"
        );

    }


    // ========================================================
    // DESCRIPTION
    // ========================================================

    if (
      body.description !==
      undefined
    ) {

      item.description =
        normalizeLimitedOptionalText(
          body.description,
          MAX_DESCRIPTION_LENGTH,
          "A descrição"
        );

    }


    // ========================================================
    // STORY
    // ========================================================

    if (
      body.story !==
      undefined
    ) {

      item.story =
        normalizeStory(
          body.story
        );

    }


    // ========================================================
    // TYPE
    // ========================================================

    if (
      body.type !==
      undefined
    ) {

      item.type =
        normalizeType(
          body.type,
          item.type
        );

    }


    // ========================================================
    // IMAGE URL
    // ========================================================

    const imageUrlInput =
      getImageUrlInput(
        body
      );


    if (
      imageUrlInput !==
      undefined
    ) {

      item.imageUrl =
        normalizeMediaUrl(
          imageUrlInput
        );

    }


    // --------------------------------------------------------
    // STORY NÃO POSSUI MÍDIA PRINCIPAL
    // --------------------------------------------------------

    if (
      item.type ===
        "story"
    ) {

      item.imageUrl =
        null;

    }


    // ========================================================
    // EVENT DATE
    // ========================================================

    const eventDateInput =
      getEventDateInput(
        body
      );


    if (
      eventDateInput !==
      undefined
    ) {

      item.eventDate =
        normalizeEventDate(
          eventDateInput
        );

    }


    // ========================================================
    // ORDER
    // ========================================================

    if (
      body.order !==
      undefined
    ) {

      item.order =
        normalizeOrder(
          body.order,
          item.order
        );

    }


    // ========================================================
    // ALLOWED ROLES
    // ========================================================

    const allowedRolesInput =
      getAllowedRolesInput(
        body
      );


    if (
      allowedRolesInput !==
      undefined
    ) {

      item.allowedRoles =
        await resolveAllowedRoles(
          allowedRolesInput
        );

    }


    // ========================================================
    // VALIDA ESTADO FINAL
    // ========================================================

    validateContentByType({

      type:
        item.type,

      imageUrl:
        item.imageUrl,

      story:
        item.story,

    });


    // ========================================================
    // SALVA
    // ========================================================

    await item.save();


    return res.json(
      formatGalleryItem(
        item
      )
    );

  } catch (
    error
  ) {

    console.error(
      "[GalleryController] atualizar:",
      error
    );


    return res
      .status(
        error.status ||
        500
      )
      .json({

        message:
          error.message ||
          "Erro ao atualizar registro da galeria.",

        ...(
          error.data ||
          {}
        ),

      });

  }

}


// ============================================================
// EXCLUIR
// ============================================================
//
// DELETE /api/gallery/:id
//
// O registro é removido do banco.
//
// O arquivo físico NÃO é removido automaticamente porque:
//
// - outro registro pode compartilhar a mesma mídia;
// - pode haver referências externas;
// - limpeza de arquivos órfãos deve ser tratada
//   separadamente.
//
// ============================================================

async function excluir(
  req,
  res
) {

  try {

    const itemId =
      normalizeId(
        req.params.id
      );


    if (
      !itemId
    ) {

      throw httpError(
        400,
        "ID do registro inválido."
      );

    }


    const item =
      await GalleryItem.findByPk(
        itemId
      );


    if (
      !item
    ) {

      throw httpError(
        404,
        "Registro não encontrado."
      );

    }


    await item.destroy();


    return res.json({

      message:
        "Registro removido com sucesso.",

    });

  } catch (
    error
  ) {

    console.error(
      "[GalleryController] excluir:",
      error
    );


    return res
      .status(
        error.status ||
        500
      )
      .json({

        message:
          error.message ||
          "Erro ao excluir registro da galeria.",

      });

  }

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  listar,

  uploadGalleryFile,

  criar,

  atualizar,

  excluir,

};