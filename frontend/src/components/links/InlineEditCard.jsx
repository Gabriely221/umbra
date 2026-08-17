// ============================================================
// EDIÇÃO RÁPIDA DE LINK
// ============================================================
//
// Este componente é exclusivamente de interface.
//
// Fluxo:
//
// InlineEditCard
//      ↓
// onSave(id, payload)
//      ↓
// Links.jsx
//      ↓
// updateLink()
//      ↓
// API
//      ↓
// Express / RBAC
//      ↓
// Sequelize / MySQL
//
// IMPORTANTE:
//
// - não acessa banco diretamente
// - não possui lógica Base44
// - não decide RBAC
//
// A página Links.jsx já determinou se o usuário possui:
//
// gerenciar_links
//
// ============================================================

import React, {
  useEffect,
  useState,
} from "react";


// ============================================================
// ÍCONES
// ============================================================

import {
  Check,
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


// ============================================================
// HELPERS
// ============================================================

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

        .filter(Boolean)

    ),
  ];

}


// ============================================================
// COMPONENTE
// ============================================================

export default function InlineEditCard({

  link,

  categories = [],

  onSave,

  onCancel,

}) {

  // ==========================================================
  // TÍTULO
  // ==========================================================

  const [
    title,
    setTitle,
  ] =
    useState(
      link?.title ??
      ""
    );


  // ==========================================================
  // URL
  // ==========================================================

  const [
    url,
    setUrl,
  ] =
    useState(
      link?.url ??
      ""
    );


  // ==========================================================
  // CATEGORIAS SELECIONADAS
  // ==========================================================

  const [
    selectedCats,
    setSelectedCats,
  ] =
    useState(
      normalizeStringArray(
        link?.categories ??
        (
          link?.category
            ? [
                link.category,
              ]
            : []
        )
      )
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
  // SINCRONIZA QUANDO O LINK MUDA
  // ==========================================================

  useEffect(
    () => {

      if (
        !link
      ) {

        return;

      }


      setTitle(
        link.title ??
        ""
      );


      setUrl(
        link.url ??
        ""
      );


      setSelectedCats(

        normalizeStringArray(

          link.categories ??
          (
            link.category

              ? [
                  link.category,
                ]

              : []
          )

        )

      );

    },
    [
      link,
    ]
  );


  // ==========================================================
  // CATEGORIAS DISPONÍVEIS
  // ==========================================================

  const availableCategories =
    normalizeStringArray(
      categories
    );


  // ==========================================================
  // TOGGLE CATEGORIA
  // ==========================================================

  function toggleCat(
    category
  ) {

    setSelectedCats(
      (
        current
      ) => {

        const normalizedCurrent =
          normalizeStringArray(
            current
          );


        if (
          normalizedCurrent.includes(
            category
          )
        ) {

          return normalizedCurrent.filter(
            (
              item
            ) =>
              item !==
              category
          );

        }


        return [

          ...normalizedCurrent,

          category,

        ];

      }
    );

  }


  // ==========================================================
  // SALVAR
  // ==========================================================

  async function handleSave() {

    const normalizedTitle =
      String(
        title ??
        ""
      ).trim();


    const normalizedUrl =
      String(
        url ??
        ""
      ).trim();


    // --------------------------------------------------------
    // CAMPOS OBRIGATÓRIOS
    // --------------------------------------------------------

    if (
      !normalizedTitle ||
      !normalizedUrl
    ) {

      return;

    }


    // --------------------------------------------------------
    // ID
    // --------------------------------------------------------

    if (
      !link?.id
    ) {

      console.error(
        "[InlineEditCard] ID do link não informado."
      );


      return;

    }


    // --------------------------------------------------------
    // CALLBACK
    // --------------------------------------------------------

    if (
      typeof onSave !==
      "function"
    ) {

      console.error(
        "[InlineEditCard] onSave não foi informado."
      );


      return;

    }


    if (
      saving
    ) {

      return;

    }


    // ========================================================
    // PAYLOAD
    // ========================================================
    //
    // Somente os campos alterados pela edição rápida.
    //
    // Não enviamos:
    //
    // allowed_cargos
    // allowed_departments
    // is_active
    // is_featured
    // description
    // icon
    //
    // Portanto o PUT parcial preserva esses dados no backend.
    //
    // ========================================================

    const payload = {

      title:
        normalizedTitle,

      url:
        normalizedUrl,

      categories:
        normalizeStringArray(
          selectedCats
        ),

    };


    setSaving(
      true
    );


    try {

      await onSave(
        link.id,
        payload
      );

    } catch (
      error
    ) {

      console.error(
        "[InlineEditCard] erro ao salvar:",
        error
      );

    } finally {

      setSaving(
        false
      );

    }

  }


  // ==========================================================
  // CANCELAR
  // ==========================================================

  function handleCancel() {

    if (
      saving
    ) {

      return;

    }


    if (
      typeof onCancel ===
      "function"
    ) {

      onCancel();

    }

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="bg-card border border-primary/50 rounded-xl px-4 py-3.5 space-y-3">


      {/* ======================================================
          CAMPOS
          ====================================================== */}

      <div className="flex gap-2">


        {/* ====================================================
            TÍTULO
            ==================================================== */}

        <Input

          value={
            title
          }

          onChange={(
            event
          ) =>
            setTitle(
              event.target.value
            )
          }

          placeholder="Título"

          className="bg-background border-border text-primary text-sm font-heading tracking-wide h-8"

          autoFocus

        />


        {/* ====================================================
            URL
            ==================================================== */}

        <Input

          value={
            url
          }

          onChange={(
            event
          ) =>
            setUrl(
              event.target.value
            )
          }

          placeholder="https://..."

          className="bg-background border-border text-primary text-sm font-body h-8 flex-1"

        />

      </div>


      {/* ======================================================
          CATEGORIAS
          ====================================================== */}

      {availableCategories.length >
        0 && (

        <div className="flex flex-wrap gap-1.5">

          {availableCategories.map(
            (
              category
            ) => {

              const selected =
                selectedCats.includes(
                  category
                );


              return (

                <button

                  key={
                    category
                  }

                  type="button"

                  onClick={() =>
                    toggleCat(
                      category
                    )
                  }

                  disabled={
                    saving
                  }

                  aria-pressed={
                    selected
                  }

                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-heading tracking-wider transition-colors disabled:opacity-50 ${
                    selected

                      ? "bg-primary text-primary-foreground border-primary"

                      : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                  }`}

                >

                  {category}

                </button>

              );

            }
          )}

        </div>

      )}


      {/* ======================================================
          BOTÕES
          ====================================================== */}

      <div className="flex justify-end gap-2">


        {/* ====================================================
            CANCELAR
            ==================================================== */}

        <Button

          size="sm"

          variant="ghost"

          onClick={
            handleCancel
          }

          disabled={
            saving
          }

          className="h-7 px-2 text-muted-foreground hover:text-primary font-heading text-[10px] tracking-wider"

        >

          <X className="w-3.5 h-3.5 mr-1" />

          CANCELAR

        </Button>


        {/* ====================================================
            SALVAR
            ==================================================== */}

        <Button

          size="sm"

          onClick={
            handleSave
          }

          disabled={
            saving ||
            !String(
              title ??
              ""
            ).trim() ||
            !String(
              url ??
              ""
            ).trim()
          }

          className="h-7 px-3 bg-primary text-primary-foreground font-heading text-[10px] tracking-wider"

        >

          {saving ? (

            <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />

          ) : (

            <>

              <Check className="w-3.5 h-3.5 mr-1" />

              SALVAR

            </>

          )}

        </Button>

      </div>

    </div>

  );

}