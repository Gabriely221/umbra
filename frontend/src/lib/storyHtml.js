// ============================================================
// HTML DE HISTÓRIAS DA GALERIA
// ============================================================
//
// Política central de tratamento do conteúdo HTML produzido
// pelo editor rico.
//
// Utilizado por:
//
// - GalleryFormModal.jsx
// - GalleryLightbox.jsx
// - TimelineEntry.jsx
//
// OBJETIVOS:
//
// 1. manter uma única política de sanitização;
// 2. impedir divergência entre editor e renderizadores;
// 3. tratar qualquer HTML vindo do banco como não confiável;
// 4. limitar o HTML ao subconjunto necessário para stories;
// 5. detectar corretamente conteúdo visualmente vazio.
//
// IMPORTANTE:
//
// Este helper atua no FRONTEND.
//
// O backend continua responsável por:
//
// - validar tipo;
// - validar tamanho;
// - validar coerência dos campos;
// - aplicar RBAC.
//
// E toda renderização através de:
//
// dangerouslySetInnerHTML
//
// deve receber SOMENTE:
//
// sanitizeStoryHtml(...)
//
// ============================================================


// ============================================================
// DOMPURIFY
// ============================================================

import DOMPurify
  from "dompurify";


// ============================================================
// TAGS PERMITIDAS
// ============================================================
//
// Compatíveis com os formatos utilizados pelo ReactQuill:
//
// header:
// - h1
// - h2
// - h3
//
// texto:
// - p
// - br
//
// formatação:
// - strong / b
// - em / i
// - u
//
// listas:
// - ol
// - ul
// - li
// - span
//
// outros:
// - blockquote
// - a
//
// NÃO permitimos:
//
// - script
// - style
// - iframe
// - object
// - embed
// - img
// - video
// - audio
// - svg
// - form
// - input
// - button
//
// Mídia da galeria é tratada separadamente pelo módulo de
// upload.
//
// ============================================================

export const STORY_ALLOWED_TAGS = [

  "p",
  "br",

  "h1",
  "h2",
  "h3",

  "strong",
  "b",

  "em",
  "i",

  "u",

  "ol",
  "ul",
  "li",

  "blockquote",

  "a",

  // ----------------------------------------------------------
  // Quill 2 pode utilizar span em estruturas internas,
  // principalmente listas.
  // ----------------------------------------------------------

  "span",

];


// ============================================================
// ATRIBUTOS PERMITIDOS
// ============================================================
//
// href:
// → links.
//
// class:
// → classes estruturais produzidas pelo Quill.
//
// data-list:
// → representação utilizada por versões modernas do Quill
//   para listas.
//
// Não permitimos:
//
// - style
// - onclick
// - onerror
// - onload
// - src
// - srcdoc
// - target
//
// ============================================================

export const STORY_ALLOWED_ATTRIBUTES = [

  "href",

  "class",

  "data-list",

];


// ============================================================
// PROTOCOLOS DE LINK
// ============================================================
//
// Permitimos:
//
// http://
// https://
// mailto:
// tel:
//
// Também permitimos:
//
// /caminho
// #ancora
//
// Rejeitamos, entre outros:
//
// javascript:
// data:
// vbscript:
// file:
// blob:
//
// ============================================================

const STORY_ALLOWED_URI_REGEXP =
  /^(?:(?:https?|mailto|tel):|\/(?!\/)|#)/i;


// ============================================================
// CONFIGURAÇÃO DO DOMPURIFY
// ============================================================

export const STORY_SANITIZE_CONFIG = {

  ALLOWED_TAGS:
    STORY_ALLOWED_TAGS,

  ALLOWED_ATTR:
    STORY_ALLOWED_ATTRIBUTES,

  // ----------------------------------------------------------
  // Protocolos desconhecidos continuam bloqueados.
  // ----------------------------------------------------------

  ALLOW_UNKNOWN_PROTOCOLS:
    false,

  // ----------------------------------------------------------
  // Restringe href aos protocolos explicitamente definidos
  // acima.
  // ----------------------------------------------------------

  ALLOWED_URI_REGEXP:
    STORY_ALLOWED_URI_REGEXP,

};


// ============================================================
// SANITIZAR STORY
// ============================================================
//
// Esta é a função oficial para limpar o HTML.
//
// Pode ser utilizada:
//
// - ao carregar conteúdo existente no editor;
// - antes de enviar o payload;
// - imediatamente antes de dangerouslySetInnerHTML.
//
// ============================================================

export function sanitizeStoryHtml(
  html
) {

  const value =
    String(
      html ??
      ""
    ).trim();


  if (
    !value
  ) {

    return "";

  }


  const sanitized =
    DOMPurify.sanitize(
      value,
      STORY_SANITIZE_CONFIG
    );


  return String(
    sanitized ??
    ""
  ).trim();

}


// ============================================================
// TEXTO VISÍVEL
// ============================================================
//
// Obtém apenas o conteúdo textual de uma story.
//
// Exemplos:
//
// <p><br></p>
// → ""
//
// <p>&nbsp;</p>
// → ""
//
// <p>Olá</p>
// → "Olá"
//
// IMPORTANTE:
//
// Sempre sanitizamos antes de interpretar o conteúdo.
//
// ============================================================

export function getStoryVisibleText(
  html
) {

  const sanitized =
    sanitizeStoryHtml(
      html
    );


  if (
    !sanitized
  ) {

    return "";

  }


  // ==========================================================
  // DOMPARSER
  // ==========================================================
  //
  // Ambiente esperado: browser.
  //
  // Evita depender de regex para extrair texto do HTML.
  //
  // ==========================================================

  if (
    typeof DOMParser !==
    "undefined"
  ) {

    const parser =
      new DOMParser();


    const document =
      parser.parseFromString(
        sanitized,
        "text/html"
      );


    return String(
      document.body?.textContent ??
      ""
    )

      .replace(
        /\u00a0/g,
        " "
      )

      .replace(
        /\s+/g,
        " "
      )

      .trim();

  }


  // ==========================================================
  // FALLBACK
  // ==========================================================
  //
  // Serve apenas como fallback defensivo caso esse helper seja
  // executado em um ambiente sem DOMParser.
  //
  // NÃO é utilizado como mecanismo de sanitização.
  //
  // ==========================================================

  return sanitized

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

    .replace(
      /\s+/g,
      " "
    )

    .trim();

}


// ============================================================
// CONTEÚDO SIGNIFICATIVO
// ============================================================
//
// Função oficial para verificar se uma story realmente possui
// conteúdo visível.
//
// ============================================================

export function hasMeaningfulStory(
  html
) {

  return Boolean(
    getStoryVisibleText(
      html
    )
  );

}


// ============================================================
// NORMALIZAR STORY PARA PAYLOAD
// ============================================================
//
// Útil antes de enviar o valor à API.
//
// Retorna:
//
// HTML sanitizado
//
// ou:
//
// null
//
// quando não existe conteúdo visível.
//
// ============================================================

export function normalizeStoryForPayload(
  html
) {

  const sanitized =
    sanitizeStoryHtml(
      html
    );


  if (
    !hasMeaningfulStory(
      sanitized
    )
  ) {

    return null;

  }


  return sanitized;

}