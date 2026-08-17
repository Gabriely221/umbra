// ============================================================
// LIGHTBOX DA GALERIA
// ============================================================
//
// Componente exclusivamente visual.
//
// Tipos:
//
// image
// video
// story
//
// NÃO acessa:
//
// - API
// - Base44
// - banco
// - RBAC
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
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";


// ============================================================
// ANIMAÇÕES
// ============================================================

import {
  AnimatePresence,
  motion,
} from "framer-motion";


// ============================================================
// ÍCONES
// ============================================================

import {
  Pause,
  Play,
  ScrollText,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";


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
// URL DA MÍDIA
// ------------------------------------------------------------

function getMediaUrl(
  item
) {

  return String(

    item?.file_url ??

    item?.fileUrl ??

    item?.imageUrl ??

    item?.image_url ??

    ""

  ).trim();

}


// ------------------------------------------------------------
// TIPO
// ------------------------------------------------------------

function getItemType(
  item
) {

  const type =
    String(
      item?.type ??
      "image"
    )
      .trim()
      .toLowerCase();


  if (
    type ===
    "video"
  ) {

    return "video";

  }


  if (
    type ===
    "story"
  ) {

    return "story";

  }


  return "image";

}


// ------------------------------------------------------------
// TEMPO
// ------------------------------------------------------------

function formatTime(
  value
) {

  const time =
    Number(
      value
    );


  if (
    !Number.isFinite(
      time
    ) ||
    time <=
      0
  ) {

    return "0:00";

  }


  const minutes =
    Math.floor(
      time /
      60
    );


  const seconds =
    Math.floor(
      time %
      60
    );


  return `${minutes}:${String(
    seconds
  ).padStart(
    2,
    "0"
  )}`;

}


// ============================================================
// COMPONENTE
// ============================================================

export default function GalleryLightbox({

  item,

  open,

  onClose,

}) {

  // ==========================================================
  // VÍDEO
  // ==========================================================

  const videoRef =
    useRef(
      null
    );


  // ==========================================================
  // PLAYER
  // ==========================================================

  const [
    isPlaying,
    setIsPlaying,
  ] =
    useState(
      false
    );


  const [
    isMuted,
    setIsMuted,
  ] =
    useState(
      false
    );


  const [
    currentTime,
    setCurrentTime,
  ] =
    useState(
      0
    );


  const [
    duration,
    setDuration,
  ] =
    useState(
      0
    );


  // ==========================================================
  // NORMALIZA ITEM
  // ==========================================================

  const mediaUrl =
    getMediaUrl(
      item
    );


  const itemType =
    getItemType(
      item
    );


  const title =
    String(
      item?.title ??
      ""
    ).trim();


  const description =
    String(
      item?.description ??
      ""
    ).trim();


  // ==========================================================
  // STORY SANITIZADA
  // ==========================================================
  //
  // Mesmo que o fluxo normal do formulário sanitize antes do
  // payload, não confiamos no conteúdo armazenado.
  //
  // Motivos:
  //
  // - a API pode ser chamada diretamente;
  // - registros legados podem existir;
  // - regras de sanitização podem mudar;
  // - dados podem ter sido inseridos fora do frontend.
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
          item?.story
        ),
      [
        item?.story,
      ]
    );


  const hasStory =
    hasMeaningfulStory(
      sanitizedStory
    );


  // ==========================================================
  // RESET DO PLAYER
  // ==========================================================

  useEffect(
    () => {

      setIsPlaying(
        false
      );


      setIsMuted(
        false
      );


      setCurrentTime(
        0
      );


      setDuration(
        0
      );


      const video =
        videoRef.current;


      if (
        video
      ) {

        video.pause();


        try {

          video.currentTime =
            0;

        } catch {

          // --------------------------------------------------
          // Metadata ainda pode não estar disponível.
          // --------------------------------------------------

        }


        video.muted =
          false;

      }

    },
    [
      item,
      open,
    ]
  );


  // ==========================================================
  // ESC + SCROLL DA PÁGINA
  // ==========================================================

  useEffect(
    () => {

      if (
        !open
      ) {

        return undefined;

      }


      function handleKeyDown(
        event
      ) {

        if (
          event.key ===
          "Escape"
        ) {

          const video =
            videoRef.current;


          if (
            video
          ) {

            video.pause();

          }


          if (
            typeof onClose ===
            "function"
          ) {

            onClose();

          }

        }

      }


      const previousOverflow =
        document.body.style.overflow;


      document.body.style.overflow =
        "hidden";


      window.addEventListener(
        "keydown",
        handleKeyDown
      );


      return () => {

        document.body.style.overflow =
          previousOverflow;


        window.removeEventListener(
          "keydown",
          handleKeyDown
        );

      };

    },
    [
      open,
      onClose,
    ]
  );


  // ==========================================================
  // FECHAR
  // ==========================================================

  function handleClose() {

    const video =
      videoRef.current;


    if (
      video
    ) {

      video.pause();

    }


    if (
      typeof onClose ===
      "function"
    ) {

      onClose();

    }

  }


  // ==========================================================
  // PLAY / PAUSE
  // ==========================================================

  async function togglePlayPause() {

    const video =
      videoRef.current;


    if (
      !video
    ) {

      return;

    }


    try {

      if (
        video.paused
      ) {

        await video.play();

      } else {

        video.pause();

      }

    } catch (
      error
    ) {

      console.error(
        "[GalleryLightbox] erro ao reproduzir vídeo:",
        error
      );

    }

  }


  // ==========================================================
  // PLAY
  // ==========================================================

  function handlePlay() {

    setIsPlaying(
      true
    );

  }


  // ==========================================================
  // PAUSE
  // ==========================================================

  function handlePause() {

    setIsPlaying(
      false
    );

  }


  // ==========================================================
  // MUTE
  // ==========================================================

  function toggleMute() {

    const video =
      videoRef.current;


    if (
      !video
    ) {

      return;

    }


    const nextMuted =
      !video.muted;


    video.muted =
      nextMuted;


    setIsMuted(
      nextMuted
    );

  }


  // ==========================================================
  // TIME UPDATE
  // ==========================================================

  function handleTimeUpdate() {

    const video =
      videoRef.current;


    if (
      !video
    ) {

      return;

    }


    const nextTime =
      Number(
        video.currentTime
      );


    if (
      Number.isFinite(
        nextTime
      )
    ) {

      setCurrentTime(
        nextTime
      );

    }

  }


  // ==========================================================
  // METADATA
  // ==========================================================

  function handleLoadedMetadata() {

    const video =
      videoRef.current;


    if (
      !video
    ) {

      return;

    }


    const nextDuration =
      Number(
        video.duration
      );


    setDuration(

      Number.isFinite(
        nextDuration
      )

        ? nextDuration

        : 0

    );

  }


  // ==========================================================
  // PROGRESSO
  // ==========================================================

  function handleProgressChange(
    event
  ) {

    const requestedTime =
      Number(
        event.target.value
      );


    if (
      !Number.isFinite(
        requestedTime
      )
    ) {

      return;

    }


    const maxDuration =
      Number.isFinite(
        duration
      )
        ? duration
        : 0;


    const newTime =
      Math.min(
        Math.max(
          requestedTime,
          0
        ),
        maxDuration
      );


    setCurrentTime(
      newTime
    );


    if (
      videoRef.current
    ) {

      videoRef.current.currentTime =
        newTime;

    }

  }


  // ==========================================================
  // FIM
  // ==========================================================

  function handleEnded() {

    setIsPlaying(
      false
    );


    setCurrentTime(
      Number.isFinite(
        duration
      )
        ? duration
        : 0
    );

  }


  // ==========================================================
  // SEM ITEM
  // ==========================================================

  if (
    !item
  ) {

    return null;

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <AnimatePresence>

      {open && (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black"

          role="dialog"

          aria-modal="true"

          aria-label={
            title ||
            "Visualização da galeria"
          }

        >


          {/* ==================================================
              BACKDROP
              ================================================== */}

          <motion.div

            initial={{
              opacity:
                0,
            }}

            animate={{
              opacity:
                1,
            }}

            exit={{
              opacity:
                0,
            }}

            className="absolute inset-0"

            onClick={
              handleClose
            }

          />


          {/* ==================================================
              CONTEÚDO
              ================================================== */}

          <motion.div

            initial={{
              opacity:
                0,

              scale:
                0.95,
            }}

            animate={{
              opacity:
                1,

              scale:
                1,
            }}

            exit={{
              opacity:
                0,

              scale:
                0.95,
            }}

            className="relative z-10 max-w-5xl w-full max-h-[90vh] flex flex-col"

            onClick={(
              event
            ) =>
              event.stopPropagation()
            }

          >


            {/* =================================================
                FECHAR
                ================================================= */}

            <button

              type="button"

              onClick={
                handleClose
              }

              className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-black/60 hover:bg-black/80 transition-colors"

              title="Fechar"

              aria-label="Fechar"

            >

              <X
                className="w-6 h-6 text-white"
                aria-hidden="true"
              />

            </button>


            {/* =================================================
                IMAGEM
                ================================================= */}

            {itemType ===
              "image" && (

              <div className="flex flex-col items-center justify-center max-h-[90vh]">

                {mediaUrl ? (

                  <img

                    src={
                      mediaUrl
                    }

                    alt={
                      title ||
                      "Imagem da galeria"
                    }

                    className="max-w-full max-h-[75vh] object-contain rounded-lg"

                  />

                ) : (

                  <div className="flex flex-col items-center justify-center py-20 text-white">

                    <p className="text-sm text-gray-400">

                      Arquivo não encontrado.

                    </p>

                  </div>

                )}


                {(title ||
                  description) && (

                  <div className="w-full mt-4 text-white">

                    {title && (

                      <h3 className="font-heading text-lg font-bold tracking-wide mb-2">

                        {title}

                      </h3>

                    )}


                    {description && (

                      <p className="text-gray-300 font-body text-sm whitespace-pre-wrap">

                        {description}

                      </p>

                    )}

                  </div>

                )}

              </div>

            )}


            {/* =================================================
                VÍDEO
                ================================================= */}

            {itemType ===
              "video" && (

              <div className="flex flex-col gap-4">

                <div className="relative bg-black rounded-lg overflow-hidden">

                  {mediaUrl ? (

                    <video

                      ref={
                        videoRef
                      }

                      src={
                        mediaUrl
                      }

                      onTimeUpdate={
                        handleTimeUpdate
                      }

                      onLoadedMetadata={
                        handleLoadedMetadata
                      }

                      onPlay={
                        handlePlay
                      }

                      onPause={
                        handlePause
                      }

                      onEnded={
                        handleEnded
                      }

                      className="w-full max-h-[70vh] object-contain"

                      preload="metadata"

                      playsInline

                    />

                  ) : (

                    <div className="flex items-center justify-center h-64 text-gray-400">

                      Arquivo de vídeo não encontrado.

                    </div>

                  )}


                  {/* ===========================================
                      CONTROLES
                      =========================================== */}

                  {mediaUrl && (

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 space-y-3">


                      {/* =======================================
                          PROGRESSO
                          ======================================= */}

                      <input

                        type="range"

                        min={
                          0
                        }

                        max={
                          Number.isFinite(
                            duration
                          )
                            ? duration
                            : 0
                        }

                        step={
                          0.1
                        }

                        value={
                          Math.min(
                            currentTime,
                            duration ||
                              0
                          )
                        }

                        onChange={
                          handleProgressChange
                        }

                        aria-label="Progresso do vídeo"

                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary hover:h-2 transition-all"

                      />


                      {/* =======================================
                          CONTROLES
                          ======================================= */}

                      <div className="flex items-center justify-between gap-4">

                        <div className="flex items-center gap-3">


                          {/* PLAY */}

                          <button

                            type="button"

                            onClick={
                              togglePlayPause
                            }

                            className="p-2 rounded-lg bg-primary/20 hover:bg-primary/40 transition-colors text-white"

                            title={
                              isPlaying
                                ? "Pausar"
                                : "Reproduzir"
                            }

                            aria-label={
                              isPlaying
                                ? "Pausar vídeo"
                                : "Reproduzir vídeo"
                            }

                          >

                            {isPlaying ? (

                              <Pause
                                className="w-5 h-5"
                                aria-hidden="true"
                              />

                            ) : (

                              <Play
                                className="w-5 h-5"
                                aria-hidden="true"
                              />

                            )}

                          </button>


                          {/* MUTE */}

                          <button

                            type="button"

                            onClick={
                              toggleMute
                            }

                            className="p-2 rounded-lg bg-primary/20 hover:bg-primary/40 transition-colors text-white"

                            title={
                              isMuted
                                ? "Ativar som"
                                : "Silenciar"
                            }

                            aria-label={
                              isMuted
                                ? "Ativar som"
                                : "Silenciar vídeo"
                            }

                          >

                            {isMuted ? (

                              <VolumeX
                                className="w-5 h-5"
                                aria-hidden="true"
                              />

                            ) : (

                              <Volume2
                                className="w-5 h-5"
                                aria-hidden="true"
                              />

                            )}

                          </button>


                          {/* TEMPO */}

                          <span className="text-sm text-gray-300 font-body">

                            {
                              formatTime(
                                currentTime
                              )
                            }

                            {" / "}

                            {
                              formatTime(
                                duration
                              )
                            }

                          </span>

                        </div>

                      </div>

                    </div>

                  )}

                </div>


                {/* =============================================
                    INFORMAÇÕES
                    ============================================= */}

                {(title ||
                  description) && (

                  <div className="text-white">

                    {title && (

                      <h3 className="font-heading text-lg font-bold tracking-wide mb-2">

                        {title}

                      </h3>

                    )}


                    {description && (

                      <p className="text-gray-300 font-body text-sm whitespace-pre-wrap">

                        {description}

                      </p>

                    )}

                  </div>

                )}

              </div>

            )}


            {/* =================================================
                STORY
                ================================================= */}

            {itemType ===
              "story" && (

              <div className="bg-card border border-border rounded-xl overflow-hidden max-h-[80vh] overflow-y-auto">

                <div className="p-8">


                  {/* ===========================================
                      CABEÇALHO
                      =========================================== */}

                  <div className="flex items-center gap-3 mb-6">

                    <ScrollText
                      className="w-6 h-6 text-primary"
                      aria-hidden="true"
                    />


                    <h2 className="font-heading text-2xl font-bold tracking-wide text-primary">

                      {
                        title ||
                        "História"
                      }

                    </h2>

                  </div>


                  {/* ===========================================
                      DESCRIÇÃO
                      =========================================== */}

                  {description && (

                    <p className="text-muted-foreground text-sm mb-6 whitespace-pre-wrap">

                      {description}

                    </p>

                  )}


                  {/* ===========================================
                      CONTEÚDO HTML
                      ===========================================
                      
                      Este é o único sink HTML deste componente.
                      
                      sanitizedStory foi produzido pela política
                      central:
                      
                      @/lib/storyHtml
                      
                      Nunca utilizar:
                      
                      item.story
                      
                      diretamente em dangerouslySetInnerHTML.
                      
                      =========================================== */}

                  {hasStory ? (

                    <div className="story-content">

                      <div

                        dangerouslySetInnerHTML={{

                          __html:
                            sanitizedStory,

                        }}

                      />

                    </div>

                  ) : (

                    <p className="text-muted-foreground italic">

                      Nenhum conteúdo disponível.

                    </p>

                  )}

                </div>

              </div>

            )}

          </motion.div>

        </div>

      )}

    </AnimatePresence>

  );

}