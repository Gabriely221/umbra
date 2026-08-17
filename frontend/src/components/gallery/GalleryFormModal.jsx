// ============================================================
// MODAL DE CRIAÇÃO / EDIÇÃO DA GALERIA
// ============================================================
//
// Responsável somente pela interface.
//
// Fluxo de upload:
//
// GalleryFormModal
//      ↓
// uploadFile()
//      ↓
// API
//      ↓
// Express / Multer
//
// Fluxo de persistência:
//
// GalleryFormModal
//      ↓
// normalizeStoryForPayload()
//      ↓
// onSave(payload)
//      ↓
// Gallery.jsx
//      ↓
// createGalleryItem() / updateGalleryItem()
//
// RBAC:
//
// A página Gallery.jsx já exige:
//
// gerenciar_galeria
//
// O backend continua sendo a autoridade real.
//
// TIPOS:
//
// image
// video
// story
//
// RESTRIÇÃO:
//
// allowed_cargos = Role.slug[]
//
// SEGURANÇA:
//
// A política de HTML está centralizada em:
//
// @/lib/storyHtml
//
// Este componente:
//
// - sanitiza conteúdo existente antes de carregar no editor;
// - valida se uma story possui conteúdo significativo;
// - sanitiza novamente antes do payload.
//
// Isso NÃO substitui:
//
// - validação do backend;
// - sanitização no ponto de renderização.
//
// ============================================================

import React, {
  useEffect,
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
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";


// ============================================================
// UI
// ============================================================

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Textarea,
} from "@/components/ui/textarea";


// ============================================================
// SELETOR DE CARGOS
// ============================================================

import CargoSelector
  from "@/components/shared/CargoSelector";


// ============================================================
// EDITOR
// ============================================================

import ReactQuill
  from "react-quill-new";


// ============================================================
// HTML DA STORY
// ============================================================

import {
  hasMeaningfulStory,
  normalizeStoryForPayload,
  sanitizeStoryHtml,
} from "@/lib/storyHtml";


// ============================================================
// API
// ============================================================

import {
  uploadFile,
} from "@/services/api";


// ============================================================
// CONSTANTES
// ============================================================

const GALLERY_TYPES = [
  "image",
  "video",
  "story",
];


const MAX_FILE_SIZE =
  50 *
  1024 *
  1024;


// ============================================================
// QUILL
// ============================================================

const QUILL_MODULES = {

  toolbar: [

    [
      {
        header: [
          1,
          2,
          3,
          false,
        ],
      },
    ],

    [
      "bold",
      "italic",
      "underline",
    ],

    [
      {
        list:
          "ordered",
      },

      {
        list:
          "bullet",
      },
    ],

    [
      "blockquote",
    ],

    [
      "link",
    ],

    [
      "clean",
    ],

  ],

};


// ============================================================
// FORMATOS PERMITIDOS
// ============================================================
//
// A toolbar controla as ferramentas visíveis.
//
// formats limita os formatos reconhecidos pelo editor.
//
// Não permitimos embeds de:
//
// - image
// - video
// - code-block
//
// A mídia principal da galeria é tratada pelo upload próprio.
//
// ============================================================

const QUILL_FORMATS = [

  "header",

  "bold",
  "italic",
  "underline",

  "list",

  "blockquote",

  "link",

];


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// HOJE
// ------------------------------------------------------------

function getTodayInputValue() {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() +
      1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


// ------------------------------------------------------------
// FORM VAZIO
// ------------------------------------------------------------

function createEmptyForm() {

  return {

    title:
      "",

    description:
      "",

    story:
      "",

    file_url:
      "",

    type:
      "image",

    event_date:
      getTodayInputValue(),

    allowed_cargos:
      [],

    order:
      999,

  };

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
// DATA PARA INPUT TYPE="DATE"
// ------------------------------------------------------------
//
// Aceita:
//
// 2026-08-16
// 2026-08-16T00:00:00.000Z
//
// e devolve:
//
// 2026-08-16
//
// ------------------------------------------------------------

function normalizeDateInput(
  value
) {

  if (
    !value
  ) {

    return "";

  }


  const stringValue =
    String(
      value
    ).trim();


  const match =
    stringValue.match(
      /^(\d{4}-\d{2}-\d{2})/
    );


  if (
    match
  ) {

    return match[1];

  }


  return "";

}


// ------------------------------------------------------------
// NORMALIZA ITEM
// ------------------------------------------------------------
//
// Todo HTML vindo da API é tratado como não confiável.
//
// Antes de carregá-lo no ReactQuill, utilizamos a política
// central:
//
// sanitizeStoryHtml()
//
// ------------------------------------------------------------

function normalizeItem(
  item
) {

  if (
    !item
  ) {

    return createEmptyForm();

  }


  const type =
    GALLERY_TYPES.includes(
      item.type
    )
      ? item.type
      : "image";


  const order =
    Number(
      item.order
    );


  return {

    title:
      String(
        item.title ??
        ""
      ),

    description:
      String(
        item.description ??
        ""
      ),

    story:
      sanitizeStoryHtml(
        item.story
      ),

    file_url:
      String(

        item.file_url ??

        item.fileUrl ??

        item.image_url ??

        item.imageUrl ??

        ""

      ),

    type,

    event_date:
      normalizeDateInput(

        item.event_date ??

        item.eventDate ??

        ""

      ),

    allowed_cargos:
      normalizeStringArray(

        item.allowed_cargos ??

        item.allowedRoles ??

        item.allowedCargos ??

        []

      ),

    order:
      Number.isInteger(
        order
      )
        ? order
        : 999,

  };

}


// ============================================================
// COMPONENTE
// ============================================================

export default function GalleryFormModal({

  open,

  item,

  onClose,

  onSave,

  onDelete,

}) {

  // ==========================================================
  // FORM
  // ==========================================================

  const [
    form,
    setForm,
  ] =
    useState(
      createEmptyForm
    );


  // ==========================================================
  // SALVANDO
  // ==========================================================

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );


  // ==========================================================
  // UPLOAD
  // ==========================================================

  const [
    uploading,
    setUploading,
  ] =
    useState(
      false
    );


  // ==========================================================
  // ERRO DO FORM
  // ==========================================================

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );


  // ==========================================================
  // ERRO DO UPLOAD
  // ==========================================================

  const [
    uploadError,
    setUploadError,
  ] =
    useState(
      ""
    );


  // ==========================================================
  // CARREGA ITEM
  // ==========================================================

  useEffect(
    () => {

      if (
        !open
      ) {

        return;

      }


      setForm(
        normalizeItem(
          item
        )
      );


      setSaving(
        false
      );


      setUploading(
        false
      );


      setError(
        ""
      );


      setUploadError(
        ""
      );

    },
    [
      item,
      open,
    ]
  );


  // ==========================================================
  // ALTERAR CAMPO
  // ==========================================================

  function set(
    field,
    value
  ) {

    setForm(
      (
        current
      ) => ({

        ...current,

        [field]:
          value,

      })
    );


    setError(
      ""
    );

  }


  // ==========================================================
  // ALTERAR TIPO
  // ==========================================================

  function handleTypeChange(
    value
  ) {

    if (
      !GALLERY_TYPES.includes(
        value
      )
    ) {

      return;

    }


    setForm(
      (
        current
      ) => {

        if (
          current.type ===
          value
        ) {

          return current;

        }


        return {

          ...current,

          type:
            value,

          // --------------------------------------------------
          // Um arquivo previamente selecionado pode não ser
          // compatível com o novo tipo.
          //
          // image → video
          // video → image
          // mídia → story
          //
          // Por segurança, exigimos nova seleção quando o tipo
          // é alterado.
          // --------------------------------------------------

          file_url:
            "",

        };

      }
    );


    setError(
      ""
    );


    setUploadError(
      ""
    );

  }


  // ==========================================================
  // FECHAR
  // ==========================================================

  function handleClose() {

    if (
      saving ||
      uploading
    ) {

      return;

    }


    if (
      typeof onClose ===
      "function"
    ) {

      onClose();

    }

  }


  // ==========================================================
  // UPLOAD
  // ==========================================================

  async function handleFileUpload(
    event
  ) {

    const input =
      event.currentTarget;


    const file =
      input.files?.[0];


    if (
      !file
    ) {

      return;

    }


    setUploading(
      true
    );


    setUploadError(
      ""
    );


    setError(
      ""
    );


    try {

      // ======================================================
      // TAMANHO
      // ======================================================

      if (
        file.size >
        MAX_FILE_SIZE
      ) {

        throw new Error(
          "O arquivo não pode ultrapassar 50 MB."
        );

      }


      // ======================================================
      // MIME - VALIDAÇÃO DE UX
      // ======================================================
      //
      // Esta verificação é apenas uma validação antecipada no
      // frontend.
      //
      // A validação real continua no Multer do backend.
      //
      // ======================================================

      if (
        form.type ===
          "image" &&
        !file.type
          .toLowerCase()
          .startsWith(
            "image/"
          )
      ) {

        throw new Error(
          "Selecione um arquivo de imagem válido."
        );

      }


      if (
        form.type ===
          "video" &&
        !file.type
          .toLowerCase()
          .startsWith(
            "video/"
          )
      ) {

        throw new Error(
          "Selecione um arquivo de vídeo válido."
        );

      }


      // ======================================================
      // API
      // ======================================================

      const result =
        await uploadFile(
          file,
          "gallery"
        );


      // ======================================================
      // URL
      // ======================================================

      const fileUrl =

        result?.file_url ??

        result?.fileUrl ??

        result?.image_url ??

        result?.imageUrl ??

        result?.url ??

        null;


      if (
        !fileUrl
      ) {

        throw new Error(
          "O servidor não retornou a URL do arquivo."
        );

      }


      // ======================================================
      // FORM
      // ======================================================

      set(
        "file_url",
        String(
          fileUrl
        )
      );

    } catch (
      uploadException
    ) {

      console.error(
        "[GalleryFormModal] erro no upload:",
        uploadException
      );


      setUploadError(

        uploadException?.message ||

        "Não foi possível enviar o arquivo."

      );

    } finally {

      setUploading(
        false
      );


      // ------------------------------------------------------
      // Permite selecionar o mesmo arquivo novamente.
      // ------------------------------------------------------

      input.value =
        "";

    }

  }


  // ==========================================================
  // VALIDAÇÃO
  // ==========================================================

  function validateForm() {

    // --------------------------------------------------------
    // IMAGE / VIDEO
    // --------------------------------------------------------

    if (
      form.type !==
        "story" &&
      !String(
        form.file_url ??
        ""
      ).trim()
    ) {

      return (
        form.type ===
        "video"

          ? "Selecione um arquivo de vídeo."

          : "Selecione um arquivo de imagem."
      );

    }


    // --------------------------------------------------------
    // STORY
    // --------------------------------------------------------

    if (
      form.type ===
        "story" &&
      !hasMeaningfulStory(
        form.story
      )
    ) {

      return "Informe o conteúdo da história.";

    }


    // --------------------------------------------------------
    // ORDER
    // --------------------------------------------------------

    const order =
      Number(
        form.order
      );


    if (
      !Number.isInteger(
        order
      )
    ) {

      return "A ordem do registro é inválida.";

    }


    return null;

  }


  // ==========================================================
  // SALVAR
  // ==========================================================

  async function handleSave() {

    if (
      saving ||
      uploading
    ) {

      return;

    }


    if (
      typeof onSave !==
      "function"
    ) {

      setError(
        "Não foi possível salvar o registro."
      );


      console.error(
        "[GalleryFormModal] onSave não informado."
      );


      return;

    }


    const validationError =
      validateForm();


    if (
      validationError
    ) {

      setError(
        validationError
      );


      return;

    }


    // ========================================================
    // NORMALIZA VALORES
    // ========================================================

    const title =
      String(
        form.title ??
        ""
      ).trim();


    const description =
      String(
        form.description ??
        ""
      ).trim();


    // ========================================================
    // STORY
    // ========================================================
    //
    // normalizeStoryForPayload():
    //
    // 1. sanitiza o HTML;
    // 2. verifica conteúdo visível;
    // 3. retorna HTML sanitizado ou null.
    //
    // Esta é a política central compartilhada com os
    // renderizadores.
    //
    // ========================================================

    const story =
      normalizeStoryForPayload(
        form.story
      );


    const fileUrl =
      String(
        form.file_url ??
        ""
      ).trim();


    const eventDate =
      String(
        form.event_date ??
        ""
      ).trim();


    // ========================================================
    // PAYLOAD
    // ========================================================
    //
    // Somente campos conhecidos pelo controller.
    //
    // Não enviamos:
    //
    // - id;
    // - timestamps;
    // - propriedades herdadas do objeto retornado pela API.
    //
    // ========================================================

    const payload = {

      title:
        title ||
        null,

      description:
        description ||
        null,

      story,

      type:
        form.type,

      file_url:
        fileUrl ||
        null,

      event_date:
        eventDate ||
        null,

      allowed_cargos:
        normalizeStringArray(
          form.allowed_cargos
        ),

      order:
        Number(
          form.order
        ),

    };


    setSaving(
      true
    );


    setError(
      ""
    );


    try {

      await onSave(
        payload
      );

    } catch (
      saveError
    ) {

      console.error(
        "[GalleryFormModal] erro ao salvar:",
        saveError
      );


      setError(

        saveError?.message ||

        "Não foi possível salvar o registro."

      );

    } finally {

      setSaving(
        false
      );

    }

  }


  // ==========================================================
  // EXCLUIR
  // ==========================================================

  async function handleDelete() {

    if (
      saving ||
      uploading ||
      !item?.id
    ) {

      return;

    }


    if (
      typeof onDelete !==
      "function"
    ) {

      setError(
        "Não foi possível excluir o registro."
      );


      return;

    }


    const confirmed =
      window.confirm(
        "Tem certeza que deseja excluir este registro histórico?"
      );


    if (
      !confirmed
    ) {

      return;

    }


    setSaving(
      true
    );


    setError(
      ""
    );


    try {

      await onDelete(
        item.id
      );

    } catch (
      deleteError
    ) {

      console.error(
        "[GalleryFormModal] erro ao excluir:",
        deleteError
      );


      setError(

        deleteError?.message ||

        "Não foi possível excluir o registro."

      );

    } finally {

      setSaving(
        false
      );

    }

  }


  // ==========================================================
  // FLAGS
  // ==========================================================

  const needsFile =
    form.type ===
      "image" ||
    form.type ===
      "video";


  const storyRequired =
    form.type ===
      "story";


  const hasRequiredStory =
    !storyRequired ||
    hasMeaningfulStory(
      form.story
    );


  const canSubmit =

    !saving &&

    !uploading &&

    (
      !needsFile ||
      Boolean(
        String(
          form.file_url ??
          ""
        ).trim()
      )
    ) &&

    hasRequiredStory;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <AnimatePresence>

      {open && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">


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

            className="absolute inset-0 bg-black/70 backdrop-blur-sm"

            onClick={
              handleClose
            }

          />


          {/* ==================================================
              MODAL
              ================================================== */}

          <motion.div

            initial={{
              opacity:
                0,

              scale:
                0.95,

              y:
                20,
            }}

            animate={{
              opacity:
                1,

              scale:
                1,

              y:
                0,
            }}

            exit={{
              opacity:
                0,

              scale:
                0.95,

              y:
                20,
            }}

            transition={{
              duration:
                0.25,
            }}

            className="relative z-10 w-full max-w-lg bg-card border border-border rounded-xl overflow-hidden shadow-2xl"

          >


            {/* =================================================
                HEADER
                ================================================= */}

            <div className="flex items-center justify-between px-6 py-4 border-b border-border">

              <div className="flex items-center gap-3">

                <Upload
                  className="w-5 h-5 text-muted-foreground"
                  aria-hidden="true"
                />


                <h2 className="font-heading text-lg font-bold tracking-[0.1em] text-primary">

                  {
                    item
                      ? "EDITAR REGISTRO"
                      : "NOVO REGISTRO"
                  }

                </h2>

              </div>


              <button

                type="button"

                onClick={
                  handleClose
                }

                disabled={
                  saving ||
                  uploading
                }

                aria-label="Fechar"

                className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"

              >

                <X
                  className="w-5 h-5"
                  aria-hidden="true"
                />

              </button>

            </div>


            {/* =================================================
                FORM
                ================================================= */}

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">


              {/* =================================================
                  TIPO + DATA
                  ================================================= */}

              <div className="grid grid-cols-2 gap-4">


                {/* TIPO */}

                <div className="space-y-1.5">

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                    TIPO *

                  </Label>


                  <Select

                    value={
                      form.type
                    }

                    onValueChange={
                      handleTypeChange
                    }

                    disabled={
                      saving ||
                      uploading
                    }

                  >

                    <SelectTrigger className="bg-background border-border text-primary font-heading tracking-wider text-sm">

                      <SelectValue />

                    </SelectTrigger>


                    <SelectContent>

                      <SelectItem
                        value="image"
                        className="font-heading tracking-wide"
                      >

                        Imagem

                      </SelectItem>


                      <SelectItem
                        value="video"
                        className="font-heading tracking-wide"
                      >

                        Vídeo

                      </SelectItem>


                      <SelectItem
                        value="story"
                        className="font-heading tracking-wide"
                      >

                        Texto / História

                      </SelectItem>

                    </SelectContent>

                  </Select>

                </div>


                {/* DATA */}

                <div className="space-y-1.5">

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                    DATA DO EVENTO

                  </Label>


                  <Input

                    type="date"

                    value={
                      form.event_date
                    }

                    onChange={(
                      event
                    ) =>
                      set(
                        "event_date",
                        event.target.value
                      )
                    }

                    disabled={
                      saving ||
                      uploading
                    }

                    className="bg-background border-border text-primary font-body"

                  />

                </div>

              </div>


              {/* =================================================
                  TÍTULO
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  TÍTULO (opcional)

                </Label>


                <Input

                  value={
                    form.title
                  }

                  onChange={(
                    event
                  ) =>
                    set(
                      "title",
                      event.target.value
                    )
                  }

                  disabled={
                    saving ||
                    uploading
                  }

                  maxLength={
                    200
                  }

                  placeholder="Título do registro"

                  className="bg-background border-border text-primary font-body"

                />

              </div>


              {/* =================================================
                  UPLOAD
                  ================================================= */}

              {needsFile && (

                <div className="space-y-1.5">

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                    ARQUIVO *

                  </Label>


                  <label className="block">

                    <input

                      type="file"

                      accept={
                        form.type ===
                        "image"

                          ? "image/*"

                          : "video/*"
                      }

                      onChange={
                        handleFileUpload
                      }

                      disabled={
                        uploading ||
                        saving
                      }

                      className="hidden"

                    />


                    <div
                      className={`px-4 py-3 border border-dashed rounded-lg bg-background/50 text-center transition-colors ${
                        uploading ||
                        saving

                          ? "border-border opacity-50 cursor-not-allowed"

                          : "border-border cursor-pointer hover:border-primary"
                      }`}
                    >

                      {uploading ? (

                        <div className="flex items-center justify-center gap-2">

                          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />


                          <span className="text-sm text-muted-foreground">

                            Enviando...

                          </span>

                        </div>

                      ) : form.file_url ? (

                        <span className="text-sm text-green-600">

                          ✓ Arquivo enviado — clique para trocar

                        </span>

                      ) : (

                        <span className="text-sm text-muted-foreground">

                          Clique para selecionar

                        </span>

                      )}

                    </div>

                  </label>


                  {uploadError && (

                    <p className="text-[11px] text-red-400">

                      {uploadError}

                    </p>

                  )}

                </div>

              )}


              {/* =================================================
                  HISTÓRIA
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  {
                    storyRequired
                      ? "HISTÓRIA *"
                      : "HISTÓRIA (opcional)"
                  }

                </Label>


                <ReactQuill

                  theme="snow"

                  value={
                    form.story
                  }

                  onChange={(
                    value
                  ) =>
                    set(
                      "story",
                      value
                    )
                  }

                  modules={
                    QUILL_MODULES
                  }

                  formats={
                    QUILL_FORMATS
                  }

                  readOnly={
                    saving ||
                    uploading
                  }

                  placeholder={
                    storyRequired

                      ? "Conte a história deste registro..."

                      : "Conte mais sobre este momento..."
                  }

                />


                {storyRequired &&
                  !hasMeaningfulStory(
                    form.story
                  ) && (

                  <p className="text-[10px] text-muted-foreground">

                    O conteúdo é obrigatório para registros do tipo história.

                  </p>

                )}

              </div>


              {/* =================================================
                  DESCRIÇÃO
                  ================================================= */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  LEGENDA (opcional)

                </Label>


                <Textarea

                  value={
                    form.description
                  }

                  onChange={(
                    event
                  ) =>
                    set(
                      "description",
                      event.target.value
                    )
                  }

                  disabled={
                    saving ||
                    uploading
                  }

                  maxLength={
                    15000
                  }

                  placeholder="Breve legenda..."

                  className="bg-background border-border text-primary font-body resize-none"

                  rows={
                    2
                  }

                />

              </div>


              {/* =================================================
                  CARGOS
                  ================================================= */}

              <CargoSelector

                selected={
                  form.allowed_cargos
                }

                onChange={(
                  cargos
                ) =>
                  set(
                    "allowed_cargos",
                    cargos
                  )
                }

                label="CARGOS PERMITIDOS"

                hint="Se vazio, não há restrição adicional por cargo. Se preenchido, somente os cargos selecionados poderão visualizar."

              />


              {/* =================================================
                  ERRO
                  ================================================= */}

              {error && (

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">

                  <p className="text-xs text-red-400 leading-relaxed">

                    {error}

                  </p>

                </div>

              )}

            </div>


            {/* =================================================
                FOOTER
                ================================================= */}

            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background/50">


              {/* =================================================
                  REMOVER
                  ================================================= */}

              {item ? (

                <Button

                  variant="ghost"

                  size="sm"

                  onClick={
                    handleDelete
                  }

                  disabled={
                    saving ||
                    uploading
                  }

                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-heading text-xs tracking-wider"

                >

                  <Trash2
                    className="w-4 h-4 mr-2"
                    aria-hidden="true"
                  />

                  REMOVER

                </Button>

              ) : (

                <div />

              )}


              {/* =================================================
                  AÇÕES
                  ================================================= */}

              <div className="flex gap-2">

                <Button

                  variant="outline"

                  size="sm"

                  onClick={
                    handleClose
                  }

                  disabled={
                    saving ||
                    uploading
                  }

                  className="font-heading text-xs tracking-wider border-border"

                >

                  CANCELAR

                </Button>


                <Button

                  size="sm"

                  onClick={
                    handleSave
                  }

                  disabled={
                    !canSubmit
                  }

                  className="font-heading text-xs tracking-wider bg-primary text-primary-foreground"

                >

                  {saving ? (

                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />

                  ) : (

                    <>

                      <Save
                        className="w-4 h-4 mr-2"
                        aria-hidden="true"
                      />

                      {
                        item
                          ? "SALVAR"
                          : "ADICIONAR"
                      }

                    </>

                  )}

                </Button>

              </div>

            </div>

          </motion.div>

        </div>

      )}

    </AnimatePresence>

  );

}