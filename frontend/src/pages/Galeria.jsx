// ============================================================
// PÁGINA GALERIA
// ============================================================
//
// RBAC:
//
// visualizar_galeria
// → pode visualizar os registros autorizados pelo backend.
//
// gerenciar_galeria
// → pode visualizar todos os registros.
// → pode criar.
// → pode editar.
// → pode excluir.
//
// IMPORTANTE:
//
// A filtragem por GalleryItem.allowedRoles pertence ao backend.
//
// O frontend NÃO deve recalcular autorização por cargo.
//
// ============================================================

import React, {
  useMemo,
  useState,
} from "react";


// ============================================================
// REACT QUERY
// ============================================================

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";


// ============================================================
// ANIMAÇÕES
// ============================================================

import {
  motion,
} from "framer-motion";


// ============================================================
// ÍCONES
// ============================================================

import {
  Plus,
  Scroll,
  Shield,
} from "lucide-react";


// ============================================================
// UI
// ============================================================

import {
  Button,
} from "@/components/ui/button";


// ============================================================
// COMPONENTES
// ============================================================

import GalleryFormModal
  from "@/components/gallery/GalleryFormModal";

import GalleryLightbox
  from "@/components/gallery/GalleryLightbox";

import TimelineEntry
  from "@/components/gallery/TimelineEntry";


// ============================================================
// DATA
// ============================================================

import {
  parseDateLocal,
} from "@/lib/dateUtils";


// ============================================================
// RBAC
// ============================================================

import {
  usePermissions,
} from "@/hooks/usePermissions";


// ============================================================
// API
// ============================================================

import {
  createGalleryItem,
  deleteGalleryItem,
  getGallery,
  updateGalleryItem,
} from "@/services/api";


// ============================================================
// HELPERS
// ============================================================


// ------------------------------------------------------------
// DATA DO ITEM
// ------------------------------------------------------------

function getItemDateValue(
  item
) {

  return (
    item?.eventDate ||
    item?.event_date ||
    item?.createdAt ||
    item?.created_date ||
    null
  );

}


// ------------------------------------------------------------
// DATA PARSEADA
// ------------------------------------------------------------

function getItemDate(
  item
) {

  const value =
    getItemDateValue(
      item
    );


  if (
    !value
  ) {

    return null;

  }


  return (
    parseDateLocal(
      value
    ) ||
    null
  );

}


// ------------------------------------------------------------
// TIMESTAMP PARA ORDENAÇÃO
// ------------------------------------------------------------

function getItemTimestamp(
  item
) {

  const date =
    getItemDate(
      item
    );


  if (
    !date
  ) {

    return null;

  }


  const timestamp =
    date.getTime();


  return Number.isNaN(
    timestamp
  )
    ? null
    : timestamp;

}


// ============================================================
// COMPONENTE
// ============================================================

export default function Galeria() {

  // ==========================================================
  // RBAC
  // ==========================================================

  const {
    can,
    canAny,
  } =
    usePermissions();


  const canView =
    canAny([
      "visualizar_galeria",
      "gerenciar_galeria",
    ]);


  const canEdit =
    can(
      "gerenciar_galeria"
    );


  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(
      false
    );


  const [
    selectedItem,
    setSelectedItem,
  ] =
    useState(
      null
    );


  const [
    lightboxItem,
    setLightboxItem,
  ] =
    useState(
      null
    );


  const [
    yearFilter,
    setYearFilter,
  ] =
    useState(
      "all"
    );


  const [
    sortAsc,
    setSortAsc,
  ] =
    useState(
      false
    );


  const queryClient =
    useQueryClient();


  // ==========================================================
  // GALERIA
  // ==========================================================
  //
  // GET /api/gallery já aplica:
  //
  // visualizar_galeria
  // → filtra GalleryItem.allowedRoles.
  //
  // gerenciar_galeria
  // → retorna todos os registros.
  //
  // Portanto não existe filtro de cargo nesta página.
  //
  // ==========================================================

  const {

    data:
      galleryResponse,

    isLoading,

    isError,

    error,

  } =
    useQuery({

      queryKey: [
        "gallery",
      ],

      queryFn:
        getGallery,

      enabled:
        canView,

    });


  // ==========================================================
  // NORMALIZA RETORNO
  // ==========================================================
  //
  // Aceita:
  //
  // [...]
  //
  // ou, caso o service/controller seja envelopado:
  //
  // {
  //   items: [...]
  // }
  //
  // ==========================================================

  const items =
    useMemo(
      () => {

        if (
          Array.isArray(
            galleryResponse
          )
        ) {

          return galleryResponse;

        }


        if (
          Array.isArray(
            galleryResponse?.items
          )
        ) {

          return galleryResponse.items;

        }


        return [];

      },
      [
        galleryResponse,
      ]
    );


  // ==========================================================
  // ANOS DISPONÍVEIS
  // ==========================================================

  const years =
    useMemo(
      () => {

        const yearsSet =
          new Set();


        items.forEach(
          (
            item
          ) => {

            const parsed =
              getItemDate(
                item
              );


            if (
              !parsed
            ) {

              return;

            }


            yearsSet.add(
              parsed.getFullYear()
            );

          }
        );


        return [
          ...yearsSet,
        ].sort(
          (
            a,
            b
          ) =>
            b - a
        );

      },
      [
        items,
      ]
    );


  // ==========================================================
  // FILTRO / ORDENAÇÃO
  // ==========================================================

  const sortedItems =
    useMemo(
      () => {

        let list =
          [
            ...items,
          ];


        // ====================================================
        // FILTRO POR ANO
        // ====================================================

        if (
          yearFilter !==
          "all"
        ) {

          const selectedYear =
            Number(
              yearFilter
            );


          list =
            list.filter(
              (
                item
              ) => {

                const parsed =
                  getItemDate(
                    item
                  );


                return (
                  parsed?.getFullYear() ===
                  selectedYear
                );

              }
            );

        }


        // ====================================================
        // ORDENAÇÃO POR DATA
        // ====================================================

        list.sort(
          (
            a,
            b
          ) => {

            const timestampA =
              getItemTimestamp(
                a
              );


            const timestampB =
              getItemTimestamp(
                b
              );


            // ------------------------------------------------
            // ITENS SEM DATA FICAM AO FINAL
            // ------------------------------------------------

            if (
              timestampA ===
                null &&
              timestampB ===
                null
            ) {

              return (
                (
                  a.order ??
                  999
                ) -
                (
                  b.order ??
                  999
                )
              );

            }


            if (
              timestampA ===
              null
            ) {

              return 1;

            }


            if (
              timestampB ===
              null
            ) {

              return -1;

            }


            const dateDifference =
              sortAsc

                ? timestampA -
                  timestampB

                : timestampB -
                  timestampA;


            if (
              dateDifference !==
              0
            ) {

              return dateDifference;

            }


            // ------------------------------------------------
            // EMPATE DE DATA
            // ------------------------------------------------

            return (
              (
                a.order ??
                999
              ) -
              (
                b.order ??
                999
              )
            );

          }
        );


        return list;

      },
      [
        items,
        yearFilter,
        sortAsc,
      ]
    );


  // ==========================================================
  // AGRUPAMENTO POR ANO
  // ==========================================================

  const groups =
    useMemo(
      () => {

        const map =
          new Map();


        sortedItems.forEach(
          (
            item
          ) => {

            const parsed =
              getItemDate(
                item
              );


            const year =
              parsed

                ? parsed.getFullYear()

                : "Sem data";


            if (
              !map.has(
                year
              )
            ) {

              map.set(
                year,
                []
              );

            }


            map
              .get(
                year
              )
              .push(
                item
              );

          }
        );


        return [
          ...map.entries(),
        ].map(
          (
            [
              year,
              entries,
            ]
          ) => ({

            year,

            entries,

          })
        );

      },
      [
        sortedItems,
      ]
    );


  // ==========================================================
  // INVALIDAR GALERIA
  // ==========================================================

  async function invalidateGallery() {

    await queryClient.invalidateQueries({

      queryKey: [
        "gallery",
      ],

    });

  }


  // ==========================================================
  // FECHAR MODAL
  // ==========================================================

  function closeModal() {

    setModalOpen(
      false
    );


    setSelectedItem(
      null
    );

  }


  // ==========================================================
  // CRIAR
  // ==========================================================

  const createMutation =
    useMutation({

      mutationFn:
        createGalleryItem,

      onSuccess:
        async () => {

          await invalidateGallery();

        },

    });


  // ==========================================================
  // EDITAR
  // ==========================================================

  const updateMutation =
    useMutation({

      mutationFn:
        ({
          id,
          data,
        }) =>
          updateGalleryItem(
            id,
            data
          ),

      onSuccess:
        async () => {

          await invalidateGallery();

        },

    });


  // ==========================================================
  // EXCLUIR
  // ==========================================================

  const deleteMutation =
    useMutation({

      mutationFn:
        deleteGalleryItem,

      onSuccess:
        async () => {

          await invalidateGallery();

        },

    });


  // ==========================================================
  // SALVAR
  // ==========================================================
  //
  // IMPORTANTE:
  //
  // Usamos mutateAsync para que GalleryFormModal possa fazer:
  //
  // await onSave(payload)
  //
  // e realmente aguardar o backend terminar.
  //
  // ==========================================================

  async function handleSave(
    data
  ) {

    if (
      !canEdit
    ) {

      throw new Error(
        "Você não possui permissão para editar a galeria."
      );

    }


    if (
      selectedItem?.id
    ) {

      await updateMutation.mutateAsync({

        id:
          selectedItem.id,

        data,

      });

    } else {

      await createMutation.mutateAsync(
        data
      );

    }


    closeModal();

  }


  // ==========================================================
  // EXCLUIR
  // ==========================================================

  async function handleDelete(
    id
  ) {

    if (
      !canEdit
    ) {

      throw new Error(
        "Você não possui permissão para excluir registros."
      );

    }


    if (
      !id
    ) {

      throw new Error(
        "Registro inválido."
      );

    }


    await deleteMutation.mutateAsync(
      id
    );


    closeModal();

  }


  // ==========================================================
  // ABRIR NOVO
  // ==========================================================

  function openAdd() {

    if (
      !canEdit
    ) {

      return;

    }


    setSelectedItem(
      null
    );


    setModalOpen(
      true
    );

  }


  // ==========================================================
  // ABRIR EDIÇÃO
  // ==========================================================

  function openEdit(
    item
  ) {

    if (
      !canEdit
    ) {

      return;

    }


    setSelectedItem(
      item
    );


    setModalOpen(
      true
    );

  }


  // ==========================================================
  // LIGHTBOX
  // ==========================================================

  function openLightbox(
    item
  ) {

    if (
      !item
    ) {

      return;

    }


    setLightboxItem(
      item
    );

  }


  // ==========================================================
  // ACESSO NEGADO
  // ==========================================================

  if (
    !canView
  ) {

    return (

      <div className="min-h-screen flex items-center justify-center px-4">

        <div className="text-center">

          <Shield
            className="w-12 h-12 mx-auto mb-4 text-red-400"
          />


          <h1 className="font-heading text-2xl font-bold tracking-[0.15em] text-red-400 mb-2">

            ACESSO NEGADO

          </h1>


          <p className="text-muted-foreground text-sm">

            Você não possui permissão para visualizar ou gerenciar a galeria.

          </p>

        </div>

      </div>

    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="min-h-screen bg-background py-12 px-4 md:px-8">

      <div className="max-w-5xl mx-auto">


        {/* ====================================================
            HEADER
            ==================================================== */}

        <div className="text-center mb-12">

          <Scroll
            className="w-8 h-8 mx-auto mb-4 text-muted-foreground"
          />


          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-[0.15em] text-primary mb-2">

            ARQUIVO HISTÓRICO

          </h1>


          <div className="w-16 h-[1px] bg-primary/30 mx-auto mb-4" />


          <p className="text-muted-foreground font-body text-sm md:text-base">

            A história da família, contada através do tempo

          </p>


          {/* ==================================================
              NOVO REGISTRO
              ================================================== */}

          {canEdit && (

            <Button

              onClick={
                openAdd
              }

              className="mt-6 font-heading text-xs tracking-[0.15em] bg-primary text-primary-foreground"

            >

              <Plus className="w-4 h-4 mr-2" />

              NOVO REGISTRO

            </Button>

          )}

        </div>


        {/* ====================================================
            FILTROS
            ==================================================== */}

        {items.length >
          0 && (

          <div className="flex flex-wrap items-center justify-center gap-2 mb-12">

            <button

              type="button"

              onClick={() =>
                setYearFilter(
                  "all"
                )
              }

              className={`px-3 py-1.5 rounded-lg text-xs font-heading tracking-wider transition-colors ${
                yearFilter ===
                "all"

                  ? "bg-primary text-primary-foreground"

                  : "bg-card border border-border text-muted-foreground hover:text-primary"
              }`}

            >

              Todos

            </button>


            {years.map(
              (
                year
              ) => (

                <button

                  key={
                    year
                  }

                  type="button"

                  onClick={() =>
                    setYearFilter(
                      String(
                        year
                      )
                    )
                  }

                  className={`px-3 py-1.5 rounded-lg text-xs font-heading tracking-wider transition-colors ${
                    yearFilter ===
                    String(
                      year
                    )

                      ? "bg-primary text-primary-foreground"

                      : "bg-card border border-border text-muted-foreground hover:text-primary"
                  }`}

                >

                  {year}

                </button>

              )
            )}


            <div className="w-[1px] h-6 bg-border mx-1" />


            <button

              type="button"

              onClick={() =>
                setSortAsc(
                  (
                    current
                  ) =>
                    !current
                )
              }

              className="px-3 py-1.5 rounded-lg text-xs font-heading tracking-wider bg-card border border-border text-muted-foreground hover:text-primary transition-colors"

            >

              {
                sortAsc
                  ? "↑ Mais antigas"
                  : "↓ Mais recentes"
              }

            </button>

          </div>

        )}


        {/* ====================================================
            TIMELINE
            ==================================================== */}

        {isLoading ? (

          <div className="flex justify-center py-20">

            <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />

          </div>

        ) : isError ? (

          <div className="text-center py-20">

            <p className="text-red-400 text-sm">

              {
                error?.message ||
                "Não foi possível carregar a galeria."
              }

            </p>

          </div>

        ) : sortedItems.length ===
          0 ? (

          <div className="flex flex-col items-center justify-center py-16">

            <Scroll className="w-16 h-16 text-muted-foreground/30 mb-4" />


            <p className="text-muted-foreground font-body text-center">

              {
                canEdit
                  ? "Nenhum registro histórico cadastrado."
                  : "Nenhum registro histórico disponível para seu acesso."
              }

            </p>

          </div>

        ) : (

          <div className="relative">


            {/* ==================================================
                LINHA DA TIMELINE
                ================================================== */}

            <div className="absolute left-4 md:left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/30 via-border to-transparent" />


            {groups.map(
              (
                group
              ) => (

                <div

                  key={
                    String(
                      group.year
                    )
                  }

                  className="mb-6"

                >


                  {/* ==========================================
                      ANO
                      ========================================== */}

                  <motion.div

                    initial={{
                      opacity:
                        0,

                      scale:
                        0.9,
                    }}

                    whileInView={{
                      opacity:
                        1,

                      scale:
                        1,
                    }}

                    viewport={{
                      once:
                        true,
                    }}

                    transition={{
                      duration:
                        0.4,
                    }}

                    className="relative flex items-center justify-center mb-8 mt-4"

                  >

                    <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary ring-4 ring-background z-10" />


                    <span className="font-display text-3xl md:text-4xl text-primary/60 ml-12 md:ml-0 bg-background px-4">

                      {group.year}

                    </span>

                  </motion.div>


                  {/* ==========================================
                      ENTRADAS
                      ========================================== */}

                  {group.entries.map(
                    (
                      entry,
                      index
                    ) => (

                      <TimelineEntry

                        key={
                          entry.id
                        }

                        entry={
                          entry
                        }

                        index={
                          index
                        }

                        isAdmin={
                          canEdit
                        }

                        onEdit={
                          canEdit
                            ? openEdit
                            : null
                        }

                        onLightbox={
                          openLightbox
                        }

                      />

                    )
                  )}

                </div>

              )
            )}

          </div>

        )}

      </div>


      {/* ======================================================
          MODAL
          ====================================================== */}

      {canEdit && (

        <GalleryFormModal

          open={
            modalOpen
          }

          item={
            selectedItem
          }

          onClose={
            closeModal
          }

          onSave={
            handleSave
          }

          onDelete={
            handleDelete
          }

        />

      )}


      {/* ======================================================
          LIGHTBOX
          ====================================================== */}

      <GalleryLightbox

        item={
          lightboxItem
        }

        open={
          Boolean(
            lightboxItem
          )
        }

        onClose={() =>
          setLightboxItem(
            null
          )
        }

      />

    </div>

  );

}