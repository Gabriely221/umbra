// ============================================================
// ENTRADA DA TIMELINE DA GALERIA
// ============================================================
//
// Componente exclusivamente visual.
//
// NÃO acessa:
//
// - API
// - Base44
// - banco
// - RBAC
//
// A página Gallery.jsx decide:
//
// - quais registros podem ser visualizados;
// - se o registro pode ser editado;
// - ações de edição;
// - abertura do lightbox.
//
// SEGURANÇA:
//
// O campo story contém HTML armazenado no banco.
//
// Todo HTML vindo da API é tratado como NÃO confiável.
//
// Antes de usar:
//
// dangerouslySetInnerHTML
//
// o conteúdo passa pela política central:
//
// @/lib/storyHtml
//
// ============================================================

import React, {
  useMemo,
} from "react";


// ============================================================
// FRAMER MOTION
// ============================================================

import {
  motion,
} from "framer-motion";


// ============================================================
// ÍCONES
// ============================================================

import {
  Pencil,
  Play,
  ScrollText,
} from "lucide-react";


// ============================================================
// DATA
// ============================================================

import {
  format,
} from "date-fns";

import {
  ptBR,
} from "date-fns/locale";

import {
  parseDateLocal,
} from "@/lib/dateUtils";


// ============================================================
// HTML DA STORY
// ============================================================

import {
  hasMeaningfulStory,
  sanitizeStoryHtml,
} from "@/lib/storyHtml";


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// DATA
// ------------------------------------------------------------

function getEntryDate(
  entry
) {

  return (

    entry?.event_date ??

    entry?.eventDate ??

    entry?.created_date ??

    entry?.createdAt ??

    null

  );

}


// ------------------------------------------------------------
// URL DA MÍDIA
// ------------------------------------------------------------

function getMediaUrl(
  entry
) {

  return String(

    entry?.file_url ??

    entry?.fileUrl ??

    entry?.imageUrl ??

    entry?.image_url ??

    ""

  ).trim();

}


// ------------------------------------------------------------
// TIPO
// ------------------------------------------------------------

function getEntryType(
  entry
) {

  const value =
    String(
      entry?.type ??
      "image"
    )
      .trim()
      .toLowerCase();


  if (
    value ===
    "video"
  ) {

    return "video";

  }


  if (
    value ===
    "story"
  ) {

    return "story";

  }


  return "image";

}


// ============================================================
// COMPONENTE
// ============================================================

export default function TimelineEntry({

  entry,

  index = 0,

  isAdmin = false,

  onEdit,

  onLightbox,

}) {

  // ==========================================================
  // DATA
  // ==========================================================

  const rawDate =
    getEntryDate(
      entry
    );


  const date =
    rawDate
      ? parseDateLocal(
          rawDate
        )
      : null;


  // ==========================================================
  // POSIÇÃO
  // ==========================================================

  const isLeft =
    index %
      2 ===
    0;


  // ==========================================================
  // DATA FORMATADA
  // ==========================================================

  const formattedDate =
    date

      ? format(
          date,
          "dd 'de' MMMM",
          {
            locale:
              ptBR,
          }
        )

      : "Sem data";


  // ==========================================================
  // TIPO
  // ==========================================================

  const type =
    getEntryType(
      entry
    );


  // ==========================================================
  // MÍDIA
  // ==========================================================

  const mediaUrl =
    getMediaUrl(
      entry
    );


  // ----------------------------------------------------------
  // Apenas image/video possuem mídia visual na timeline.
  //
  // Um registro story pode possuir uma URL antiga no banco,
  // mas isso não deve gerar um bloco vazio/clicável.
  // ----------------------------------------------------------

  const hasRenderableMedia =
    Boolean(
      mediaUrl
    ) &&
    (
      type ===
        "image" ||
      type ===
        "video"
    );


  const canOpenLightbox =
    hasRenderableMedia &&
    typeof onLightbox ===
      "function";


  // ==========================================================
  // STORY SANITIZADA
  // ==========================================================
  //
  // Mesmo que o fluxo normal do formulário sanitize o HTML
  // antes de enviar o payload, qualquer valor retornado pela
  // API continua sendo considerado não confiável.
  //
  // Motivos:
  //
  // - a API pode ser chamada diretamente;
  // - dados legados podem existir;
  // - dados podem ter sido inseridos por outro cliente;
  // - a política de sanitização pode mudar futuramente.
  //
  // A política oficial está centralizada em:
  //
  // @/lib/storyHtml
  //
  // ==========================================================

  const sanitizedStory =
    useMemo(
      () =>
        sanitizeStoryHtml(
          entry?.story
        ),
      [
        entry?.story,
      ]
    );


  const hasStory =
    hasMeaningfulStory(
      sanitizedStory
    );


  // ==========================================================
  // DESCRIÇÃO
  // ==========================================================

  const description =
    String(
      entry?.description ??
      ""
    ).trim();


  // ==========================================================
  // TÍTULO
  // ==========================================================

  const title =
    String(
      entry?.title ??
      ""
    ).trim();


  // ==========================================================
  // LIGHTBOX
  // ==========================================================

  function handleOpenLightbox() {

    if (
      !canOpenLightbox
    ) {

      return;

    }


    onLightbox(
      entry
    );

  }


  // ==========================================================
  // EDIÇÃO
  // ==========================================================

  function handleEdit() {

    if (
      !isAdmin ||
      typeof onEdit !==
        "function"
    ) {

      return;

    }


    onEdit(
      entry
    );

  }


  // ==========================================================
  // TECLADO DA MÍDIA
  // ==========================================================

  function handleMediaKeyDown(
    event
  ) {

    if (
      !canOpenLightbox
    ) {

      return;

    }


    if (
      event.key ===
        "Enter" ||
      event.key ===
        " "
    ) {

      event.preventDefault();


      handleOpenLightbox();

    }

  }


  // ==========================================================
  // LABEL DA MÍDIA
  // ==========================================================

  const mediaLabel =
    type ===
    "video"

      ? "Abrir vídeo"

      : "Abrir imagem";


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <motion.div

      initial={{
        opacity:
          0,

        y:
          30,
      }}

      whileInView={{
        opacity:
          1,

        y:
          0,
      }}

      viewport={{
        once:
          true,

        margin:
          "-50px",
      }}

      transition={{
        duration:
          0.5,
      }}

      className="relative flex mb-8 md:mb-10"

    >


      {/* ======================================================
          PONTO DA TIMELINE
          ====================================================== */}

      <div
        className="
          absolute
          left-4
          md:left-1/2
          -translate-x-1/2
          z-10
          w-3
          h-3
          rounded-full
          bg-primary
          ring-4
          ring-background
          mt-7
        "
        aria-hidden="true"
      />


      {/* ======================================================
          CARD
          ====================================================== */}

      <div

        className={`ml-12 md:ml-0 w-full md:w-[calc(50%-2.5rem)] ${
          isLeft
            ? "md:mr-auto"
            : "md:ml-auto"
        }`}

      >


        {/* ====================================================
            DATA
            ==================================================== */}

        <p

          className={`font-display text-xl text-primary/70 mb-2 ${
            !isLeft
              ? "md:text-right"
              : ""
          }`}

        >

          {formattedDate}

        </p>


        {/* ====================================================
            CONTEÚDO
            ==================================================== */}

        <div className="bg-card border border-border rounded-lg overflow-hidden group hover:border-primary/20 transition-all duration-300">


          {/* ==================================================
              MÍDIA
              ================================================== */}

          {hasRenderableMedia && (

            <div

              className={`relative overflow-hidden ${
                canOpenLightbox
                  ? "cursor-pointer"
                  : ""
              }`}

              onClick={
                canOpenLightbox
                  ? handleOpenLightbox
                  : undefined
              }

              role={
                canOpenLightbox
                  ? "button"
                  : undefined
              }

              tabIndex={
                canOpenLightbox
                  ? 0
                  : undefined
              }

              onKeyDown={
                canOpenLightbox
                  ? handleMediaKeyDown
                  : undefined
              }

              aria-label={
                canOpenLightbox
                  ? mediaLabel
                  : undefined
              }

            >


              {/* ===============================================
                  IMAGEM
                  =============================================== */}

              {type ===
                "image" && (

                <img

                  src={
                    mediaUrl
                  }

                  alt={
                    title ||
                    "Imagem do arquivo histórico"
                  }

                  className="w-full max-h-96 object-cover group-hover:scale-[1.02] transition-transform duration-500"

                  loading="lazy"

                />

              )}


              {/* ===============================================
                  VÍDEO
                  =============================================== */}

              {type ===
                "video" && (

                <div className="relative">

                  <video

                    src={
                      mediaUrl
                    }

                    className="w-full max-h-96 object-cover"

                    preload="metadata"

                    playsInline

                  />


                  {canOpenLightbox && (

                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">

                      <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center">

                        <Play
                          className="w-5 h-5 text-primary-foreground ml-0.5"
                          aria-hidden="true"
                        />

                      </div>

                    </div>

                  )}

                </div>

              )}

            </div>

          )}


          {/* ==================================================
              TEXTO
              ================================================== */}

          <div className="p-5 md:p-6">


            {/* ===============================================
                TÍTULO
                =============================================== */}

            {title && (

              <h3 className="font-heading text-lg font-bold tracking-wide text-primary mb-3">

                {title}

              </h3>

            )}


            {/* ===============================================
                STORY
                ===============================================
                
                Este é o único sink HTML deste componente.
                
                Nunca utilizar:
                
                entry.story
                
                diretamente em dangerouslySetInnerHTML.
                
                sanitizedStory foi produzido pela política
                central:
                
                @/lib/storyHtml
                
                =============================================== */}

            {hasStory && (

              <div className="story-content">

                <div

                  dangerouslySetInnerHTML={{

                    __html:
                      sanitizedStory,

                  }}

                />

              </div>

            )}


            {/* ===============================================
                DESCRIÇÃO / LEGENDA
                ===============================================
                
                description é renderizada como texto comum pelo
                React.
                
                Não usamos dangerouslySetInnerHTML aqui.
                
                =============================================== */}

            {description && (

              <p

                className={`text-sm text-muted-foreground whitespace-pre-wrap ${
                  hasStory
                    ? "mt-4"
                    : ""
                }`}

              >

                {description}

              </p>

            )}


            {/* ===============================================
                STORY SEM CONTEÚDO
                =============================================== */}

            {type ===
              "story" &&
            !hasStory &&
            !description && (

              <div className="flex items-center gap-2 text-muted-foreground">

                <ScrollText
                  className="w-4 h-4"
                  aria-hidden="true"
                />


                <span className="text-sm">

                  Nenhum conteúdo disponível.

                </span>

              </div>

            )}


            {/* ===============================================
                EDITAR
                =============================================== */}

            {isAdmin &&
            typeof onEdit ===
              "function" && (

              <button

                type="button"

                onClick={
                  handleEdit
                }

                className="mt-4 text-xs font-heading tracking-wider text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"

              >

                <Pencil
                  className="w-3 h-3"
                  aria-hidden="true"
                />

                EDITAR

              </button>

            )}

          </div>

        </div>

      </div>

    </motion.div>

  );

}