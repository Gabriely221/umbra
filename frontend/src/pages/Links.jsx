// ============================================================
// PÁGINA DE LINKS
// ============================================================
//
// RBAC:
//
// visualizar_links
//     ↓
// pode visualizar
//
// gerenciar_links
//     ↓
// pode criar / editar / excluir / organizar
//
// O antigo useAccessLevel(), useUserCargo() e usePermissions()
// foi substituído pelo RBAC centralizado.
// ============================================================

import React, {
  useState,
  useCallback,
} from "react";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import {
  Link2,
  Plus,
  ExternalLink,
  Globe,
  FileText,
  Map,
  Shield,
  Star,
  Youtube,
  Instagram,
  Settings,
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Trash2,
  FolderInput,
  Square,
  CheckSquare,
  AlertTriangle,
  RefreshCw,
  Wifi,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";


import LinkFormModal
  from "../components/links/LinkFormModal";

import CategoryManager
  from "../components/links/CategoryManager";

import InlineEditCard
  from "../components/links/InlineEditCard";

import {
  getIconComponent,
} from "../components/links/CategoryIconEditor";


// RBAC
import {
  usePermissions,
} from "@/hooks/usePermissions";


// API
import {
  getLinks,
  createLink,
  updateLink,
  deleteLink,
  getLinkCategories,
} from "@/services/api";


// Drag and Drop
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";


// Date
import {
  differenceInDays,
} from "date-fns";


// ============================================================
// MAPA DE ÍCONES
// ============================================================

const iconMap = {

  link:
    Link2,

  globe:
    Globe,

  discord:
    Shield,

  youtube:
    Youtube,

  instagram:
    Instagram,

  file:
    FileText,

  map:
    Map,

  shield:
    Shield,

  star:
    Star,

};


// ============================================================
// LINK NOVO
// ============================================================

function isNew(
  link
) {

  const date =
    link.createdAt ||
    link.created_date;


  if (!date) {
    return false;
  }


  return (
    differenceInDays(
      new Date(),
      new Date(date)
    ) <= 7
  );
}


// ============================================================
// VERIFICADOR DE LINK
// ============================================================

function useLinkChecker(
  links
) {

  const [
    status,
    setStatus,
  ] =
    useState({});


  const [
    checking,
    setChecking,
  ] =
    useState(false);


  const checkAll =
    useCallback(
      async () => {

        if (
          !links.length
        ) {
          return;
        }


        setChecking(
          true
        );


        const initial =
          {};


        links.forEach(
          (link) => {

            initial[
              link.id
            ] =
              "checking";

          }
        );


        setStatus(
          initial
        );


        await Promise.all(

          links.map(
            async (
              link
            ) => {

              try {

                const controller =
                  new AbortController();


                const timeout =
                  setTimeout(
                    () =>
                      controller.abort(),
                    8000
                  );


                await fetch(
                  link.url,
                  {
                    method:
                      "HEAD",

                    mode:
                      "no-cors",

                    signal:
                      controller.signal,
                  }
                );


                clearTimeout(
                  timeout
                );


                setStatus(
                  (
                    current
                  ) => ({

                    ...current,

                    [link.id]:
                      "ok",

                  })
                );


              } catch {

                setStatus(
                  (
                    current
                  ) => ({

                    ...current,

                    [link.id]:
                      "broken",

                  })
                );
              }
            }
          )

        );


        setChecking(
          false
        );

      },

      [links]
    );


  return {
    status,
    checking,
    checkAll,
  };
}


// ============================================================
// COPIAR
// ============================================================

function CopyButton({
  url,
}) {

  const [
    copied,
    setCopied,
  ] =
    useState(false);


  function handleCopy(
    event
  ) {

    event.preventDefault();


    navigator.clipboard.writeText(
      url
    );


    setCopied(
      true
    );


    setTimeout(
      () =>
        setCopied(
          false
        ),
      2000
    );
  }


  return (

    <button

      onClick={
        handleCopy
      }

      className="p-1.5 rounded-md text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-all"

      title="Copiar URL"

    >

      {copied ? (

        <Check
          className="w-3.5 h-3.5 text-green-400"
        />

      ) : (

        <Copy
          className="w-3.5 h-3.5"
        />

      )}

    </button>
  );
}


// ============================================================
// LINK CARD
// ============================================================

function LinkCard({

  link,

  canEdit,

  onEdit,

  onInlineSave,

  dragHandleProps,

  selectable,

  selected,

  onToggleSelect,

  linkStatus,

  allCategories,

}) {

  const [
    inlineEditing,
    setInlineEditing,
  ] =
    useState(false);


  const [
    expanded,
    setExpanded,
  ] =
    useState(false);


  const Icon =
    iconMap[
      link.icon
    ] ||
    Link2;


  const hasLongDesc =
    link.description &&
    link.description.length >
      60;


  const newBadge =
    isNew(link);


  const isBroken =
    linkStatus ===
    "broken";


  const isChecking =
    linkStatus ===
    "checking";


  const inactive =
    link.is_active ===
    false;


  // ==========================================================
  // EDIÇÃO RÁPIDA
  // ==========================================================

  if (
    inlineEditing
  ) {

    return (

      <InlineEditCard

        link={
          link
        }

        categories={
          allCategories
        }

        onSave={
          async (
            id,
            data
          ) => {

            await onInlineSave(
              id,
              data
            );

            setInlineEditing(
              false
            );

          }
        }

        onCancel={() =>
          setInlineEditing(
            false
          )
        }

      />

    );
  }


  return (

    <div

      className={`group relative flex items-center gap-3 bg-card border rounded-xl px-4 py-3.5 transition-all duration-300 ${
        selected
          ? "border-primary/60 bg-primary/5"

          : isBroken
          ? "border-red-500/40 bg-red-500/5"

          : inactive
          ? "border-border/50 opacity-60"

          : "border-border hover:border-primary/40 hover:bg-accent/20"
      }`}

    >


      {/* SELEÇÃO */}
      {selectable && (

        <button

          onClick={() =>
            onToggleSelect(
              link.id
            )
          }

          className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
        >

          {selected ? (

            <CheckSquare
              className="w-4 h-4 text-primary"
            />

          ) : (

            <Square
              className="w-4 h-4"
            />

          )}

        </button>

      )}


      {/* DRAG */}
      {dragHandleProps &&
        !selectable && (

          <div
            {...dragHandleProps}

            className="text-muted-foreground/20 hover:text-muted-foreground/60 cursor-grab active:cursor-grabbing flex-shrink-0"
          >

            <GripVertical
              className="w-4 h-4"
            />

          </div>

        )}


      {/* ÍCONE */}
      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 border border-border group-hover:border-primary/30 group-hover:bg-primary/10 transition-all duration-300">

        <Icon
          className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-300"
        />

      </div>


      {/* CONTEÚDO */}
      <div className="flex-1 min-w-0">

        <div className="flex items-center gap-2 flex-wrap">

          <a

            href={
              link.url
            }

            target="_blank"

            rel="noopener noreferrer"

            className="font-heading text-sm font-semibold tracking-wide text-primary hover:underline"
          >
            {
              link.title
            }
          </a>


          {newBadge &&
            !inactive && (

            <span className="px-1.5 py-0.5 rounded text-[9px] font-heading tracking-widest bg-green-500/20 text-green-400 border border-green-500/30">
              NOVO
            </span>

          )}


          {inactive && (

            <span className="px-1.5 py-0.5 rounded text-[9px] font-heading tracking-widest bg-muted/50 text-muted-foreground border border-border">
              INATIVO
            </span>

          )}


          {isChecking && (

            <span className="px-1.5 py-0.5 rounded text-[9px] font-heading tracking-widest bg-muted/50 text-muted-foreground border border-border animate-pulse">
              VERIFICANDO
            </span>

          )}


          {isBroken && (

            <span className="px-1.5 py-0.5 rounded text-[9px] font-heading tracking-widest bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">

              <AlertTriangle
                className="w-2.5 h-2.5"
              />

              FORA DO AR

            </span>

          )}

        </div>


        {link.description && (

          <div>

            <p

              className={`text-xs text-muted-foreground font-body mt-0.5 ${
                !expanded &&
                hasLongDesc
                  ? "truncate"
                  : ""
              }`}
            >
              {
                link.description
              }
            </p>


            {hasLongDesc && (

              <button

                onClick={() =>
                  setExpanded(
                    (
                      current
                    ) =>
                      !current
                  )
                }

                className="text-[10px] text-primary/50 hover:text-primary font-heading tracking-wider flex items-center gap-0.5 mt-0.5 transition-colors"
              >

                {expanded ? (

                  <>
                    <ChevronUp
                      className="w-3 h-3"
                    />
                    VER MENOS
                  </>

                ) : (

                  <>
                    <ChevronDown
                      className="w-3 h-3"
                    />
                    VER MAIS
                  </>

                )}

              </button>

            )}

          </div>

        )}

      </div>


      {/* AÇÕES */}
      <div className="flex items-center gap-1 flex-shrink-0">

        <CopyButton
          url={
            link.url
          }
        />


        <a

          href={
            link.url
          }

          target="_blank"

          rel="noopener noreferrer"

          className="p-1.5 rounded-md text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-all"
        >

          <ExternalLink
            className="w-3.5 h-3.5"
          />

        </a>


        {canEdit &&
          !selectable && (

            <button

              onClick={() =>
                setInlineEditing(
                  true
                )
              }

              className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-all text-xs"

              title="Edição rápida"
            >
              ✎
            </button>

          )}


        {canEdit &&
          !selectable && (

            <button

              onClick={() =>
                onEdit(
                  link
                )
              }

              className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-all"

              title="Editar completo"
            >

              <Settings
                className="w-3.5 h-3.5"
              />

            </button>

          )}

      </div>

    </div>
  );
}


// ============================================================
// DESTAQUES
// ============================================================

function FeaturedSection({
  links,
  canEdit,
  onEdit,
}) {

  if (
    links.length ===
    0
  ) {

    return null;
  }


  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 20,
      }}

      animate={{
        opacity: 1,
        y: 0,
      }}

      className="mb-10"

    >

      <div className="flex items-center gap-3 mb-4">

        <Star
          className="w-4 h-4 text-yellow-400"
        />

        <span className="font-heading text-[11px] tracking-[0.3em] text-yellow-400/80">
          EM DESTAQUE
        </span>

        <div className="flex-1 h-[1px] bg-yellow-400/10" />

      </div>


      <div className="grid sm:grid-cols-2 gap-3">

        {links.map(
          (link) => (

            <div

              key={
                link.id
              }

              className="group relative flex items-center gap-3 bg-yellow-400/5 border border-yellow-400/20 rounded-xl px-4 py-3.5 hover:border-yellow-400/40 transition-all duration-300"
            >

              <div className="w-9 h-9 rounded-lg bg-yellow-400/10 flex items-center justify-center flex-shrink-0 border border-yellow-400/20">

                {React.createElement(
                  iconMap[
                    link.icon
                  ] ||
                  Link2,

                  {
                    className:
                      "w-4 h-4 text-yellow-400",
                  }
                )}

              </div>


              <div className="flex-1 min-w-0">

                <div className="flex items-center gap-2">

                  <a

                    href={
                      link.url
                    }

                    target="_blank"

                    rel="noopener noreferrer"

                    className="font-heading text-sm font-semibold tracking-wide text-primary hover:underline"
                  >
                    {
                      link.title
                    }
                  </a>


                  {isNew(link) && (

                    <span className="px-1.5 py-0.5 rounded text-[9px] font-heading tracking-widest bg-green-500/20 text-green-400 border border-green-500/30">
                      NOVO
                    </span>

                  )}

                </div>


                {link.description && (

                  <p className="text-xs text-muted-foreground font-body mt-0.5 truncate">
                    {
                      link.description
                    }
                  </p>

                )}

              </div>


              <div className="flex items-center gap-1 flex-shrink-0">

                <CopyButton
                  url={
                    link.url
                  }
                />


                <a

                  href={
                    link.url
                  }

                  target="_blank"

                  rel="noopener noreferrer"

                  className="p-1.5 text-yellow-400/40 hover:text-yellow-400 transition-colors"
                >

                  <ExternalLink
                    className="w-3.5 h-3.5"
                  />

                </a>


                {canEdit && (

                  <button

                    onClick={() =>
                      onEdit(
                        link
                      )
                    }

                    className="p-1.5 opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-primary transition-all text-xs"
                  >
                    ✎
                  </button>

                )}

              </div>

            </div>

          )
        )}

      </div>

    </motion.div>
  );
}


// ============================================================
// BARRA DE AÇÕES EM MASSA
// ============================================================

function BulkBar({
  count,
  categories,
  onDelete,
  onMove,
  onCancel,
}) {

  const [
    moveTo,
    setMoveTo,
  ] =
    useState("");


  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 10,
      }}

      animate={{
        opacity: 1,
        y: 0,
      }}

      exit={{
        opacity: 0,
        y: 10,
      }}

      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card border border-primary/40 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 flex-wrap justify-center"

    >

      <span className="font-heading text-xs tracking-wider text-primary">

        {
          count
        }

        {" "}

        SELECIONADO
        {
          count >
          1
            ? "S"
            : ""
        }

      </span>


      <div className="flex items-center gap-2">

        <select

          value={
            moveTo
          }

          onChange={(event) =>
            setMoveTo(
              event.target.value
            )
          }

          className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs font-heading text-primary outline-none"

        >

          <option value="">
            Mover para...
          </option>


          {categories.map(
            (category) => (

              <option
                key={
                  category
                }
                value={
                  category
                }
              >
                {
                  category
                }
              </option>

            )
          )}

        </select>


        <Button

          size="sm"

          variant="outline"

          onClick={() =>
            moveTo &&
            onMove(
              moveTo
            )
          }

          disabled={
            !moveTo
          }

          className="font-heading text-[11px] tracking-wider h-7 px-3"
        >

          <FolderInput
            className="w-3.5 h-3.5 mr-1"
          />

          MOVER

        </Button>

      </div>


      <Button

        size="sm"

        variant="destructive"

        onClick={
          onDelete
        }

        className="font-heading text-[11px] tracking-wider h-7 px-3"
      >

        <Trash2
          className="w-3.5 h-3.5 mr-1"
        />

        EXCLUIR

      </Button>


      <button
        onClick={
          onCancel
        }

        className="text-muted-foreground hover:text-primary transition-colors"
      >

        <span className="font-heading text-[11px] tracking-wider">
          CANCELAR
        </span>

      </button>

    </motion.div>
  );
}


// ============================================================
// PÁGINA
// ============================================================

export default function Links() {

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
      "visualizar_links",
      "gerenciar_links",
    ]);


  const canEdit =
    can(
      "gerenciar_links"
    );


  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);


  const [
    editingLink,
    setEditingLink,
  ] =
    useState(null);


  const [
    catManagerOpen,
    setCatManagerOpen,
  ] =
    useState(false);


  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    activeCategory,
    setActiveCategory,
  ] =
    useState("all");


  const [
    selectMode,
    setSelectMode,
  ] =
    useState(false);


  const [
    selected,
    setSelected,
  ] =
    useState(
      new Set()
    );


  const queryClient =
    useQueryClient();


  // ==========================================================
  // LINKS
  // ==========================================================

  const {
    data: links = [],
    isLoading,
  } =
    useQuery({

      queryKey:
        [
          "links",
        ],

      queryFn:
        getLinks,

      enabled:
        canView,

    });


  // ==========================================================
  // CATEGORIAS
  // ==========================================================

  const {
    data: linkCategories = [],
  } =
    useQuery({

      queryKey:
        [
          "link-categories",
        ],

      queryFn:
        getLinkCategories,

      enabled:
        canView,

    });


  // ==========================================================
  // STATUS
  // ==========================================================

  const {
    status:
      linkStatus,

    checking,

    checkAll,
  } =
    useLinkChecker(
      links
    );


  // ==========================================================
  // CATEGORIAS
  // ==========================================================

  const getLinkCats =
    (link) => {

      if (
        link.categories?.length
      ) {

        return link.categories;
      }


      if (
        link.category
      ) {

        return [
          link.category,
        ];
      }


      return [];
    };


  const dbCategoryNames =
    linkCategories.map(
      (
        category
      ) =>
        category.name
    );


  const linkCategoryNames =
    [
      ...new Set(
        links.flatMap(
          getLinkCats
        )
      ),
    ];


  const allCategories =
    [
      ...new Set([
        ...dbCategoryNames,
        ...linkCategoryNames,
      ]),
    ];


  // ==========================================================
  // ORDENAÇÃO
  // ==========================================================

  const sorted =
    [
      ...links,
    ].sort(
      (a, b) =>
        (
          a.order ??
          999
        ) -
        (
          b.order ??
          999
        )
    );


  // ==========================================================
  // LINKS ACESSÍVEIS
  // ==========================================================
  //
  // A autorização de conteúdo pertence ao backend.
  //
  // GET /api/links já aplica:
  //
  // - isActive para usuários comuns
  // - allowedRoles
  // - allowedDepartments
  // - UserLink direto
  //
  // E, para quem possui gerenciar_links, retorna também links
  // inativos e ignora as restrições de conteúdo.
  //
  // Portanto o frontend NÃO deve refiltrar a resposta.
  // ==========================================================

  const accessibleLinks =
    sorted;


  // ==========================================================
  // PESQUISA
  // ==========================================================

  const q =
    search
      .toLowerCase()
      .trim();


  const searchFiltered =
    q

      ? accessibleLinks.filter(
          (link) =>
            (
              link.title ||
              ""
            )
              .toLowerCase()
              .includes(q) ||

            (
              link.description ||
              ""
            )
              .toLowerCase()
              .includes(q)
        )

      : accessibleLinks;


  // ==========================================================
  // CATEGORIA
  // ==========================================================

  const categoryFiltered =
    activeCategory ===
      "all" ||
    q

      ? searchFiltered

      : searchFiltered.filter(
          (link) =>
            getLinkCats(
              link
            ).includes(
              activeCategory
            )
        );


  // ==========================================================
  // DESTAQUES
  // ==========================================================

  const featuredLinks =
    categoryFiltered.filter(
      (link) =>
        link.is_featured
    );


  const regularLinks =
    categoryFiltered.filter(
      (link) =>
        !link.is_featured
    );


  // ==========================================================
  // AGRUPAMENTO
  // ==========================================================

  const grouped =
    allCategories.reduce(
      (
        result,
        category
      ) => {

        const items =
          regularLinks.filter(
            (link) =>
              getLinkCats(
                link
              ).includes(
                category
              )
          );


        if (
          items.length
        ) {

          result[
            category
          ] =
            items;
        }


        return result;

      },

      {}
    );


  // Links sem categoria.
  const uncategorized =
    regularLinks.filter(
      (link) =>
        getLinkCats(
          link
        ).length ===
        0
    );


  if (
    uncategorized.length
  ) {

    grouped.Outros =
      uncategorized;
  }


  // ==========================================================
  // ABAS
  // ==========================================================

  const tabCategories =
    allCategories.filter(
      (category) =>
        accessibleLinks.some(
          (link) =>
            getLinkCats(
              link
            ).includes(
              category
            )
        )
    );


  // ==========================================================
  // MODAL
  // ==========================================================

  function openAdd() {

    if (!canEdit) {
      return;
    }


    setEditingLink(
      null
    );


    setModalOpen(
      true
    );
  }


  function openEdit(
    link
  ) {

    if (!canEdit) {
      return;
    }


    setEditingLink(
      link
    );


    setModalOpen(
      true
    );
  }


  function closeModal() {

    setModalOpen(
      false
    );


    setEditingLink(
      null
    );
  }


  // ==========================================================
  // SALVAR
  // ==========================================================

  async function handleSave(
    form
  ) {

    if (!canEdit) {

      alert(
        "Você não possui permissão para gerenciar links."
      );

      return;
    }


    const titleLower =
      (
        form.title ||
        ""
      )
        .trim()
        .toLowerCase();


    const duplicate =
      links.find(
        (link) =>

          (
            link.title ||
            ""
          )
            .trim()
            .toLowerCase() ===
          titleLower &&

          link.id !==
            editingLink?.id
      );


    if (
      duplicate
    ) {

      alert(
        "Já existe um link com este nome. Use um nome diferente."
      );

      return;
    }


    if (
      editingLink
    ) {

      await updateLink(
        editingLink.id,
        form
      );

    } else {

      await createLink(
        form
      );
    }


    queryClient.invalidateQueries({
      queryKey:
        [
          "links",
        ],
    });


    closeModal();
  }


  // ==========================================================
  // DELETE
  // ==========================================================

  async function handleDelete(
    id
  ) {

    if (!canEdit) {

      alert(
        "Você não possui permissão para excluir links."
      );

      return;
    }


    await deleteLink(
      id
    );


    queryClient.invalidateQueries({
      queryKey:
        [
          "links",
        ],
    });


    queryClient.invalidateQueries({
      queryKey:
        [
          "user-links",
        ],
    });


    closeModal();
  }


  // ==========================================================
  // EDIÇÃO RÁPIDA
  // ==========================================================

  async function handleInlineSave(
    id,
    data
  ) {

    if (!canEdit) {

      alert(
        "Você não possui permissão para editar links."
      );

      return;
    }


    await updateLink(
      id,
      data
    );


    queryClient.invalidateQueries({
      queryKey:
        [
          "links",
        ],
    });
  }


  // ==========================================================
  // DRAG AND DROP
  // ==========================================================

  async function handleDragEnd(
    result
  ) {

    if (!canEdit) {
      return;
    }


    if (
      !result.destination
    ) {
      return;
    }


    const category =
      result.source
        .droppableId;


    const items =
      [
        ...(
          grouped[
            category
          ] ||
          []
        ),
      ];


    const [
      moved,
    ] =
      items.splice(
        result.source.index,
        1
      );


    items.splice(
      result.destination.index,
      0,
      moved
    );


    await Promise.all(

      items.map(
        (
          item,
          index
        ) =>
          updateLink(
            item.id,
            {
              order:
                index + 1,
            }
          )
      )
    );


    queryClient.invalidateQueries({
      queryKey:
        [
          "links",
        ],
    });
  }


  // ==========================================================
  // SELEÇÃO
  // ==========================================================

  function toggleSelect(
    id
  ) {

    setSelected(
      (
        current
      ) => {

        const next =
          new Set(
            current
          );


        if (
          next.has(
            id
          )
        ) {

          next.delete(
            id
          );

        } else {

          next.add(
            id
          );
        }


        return next;
      }
    );
  }


  // ==========================================================
  // DELETE EM MASSA
  // ==========================================================

  async function handleBulkDelete() {

    if (!canEdit) {

      alert(
        "Você não possui permissão."
      );

      return;
    }


    if (
      !confirm(
        `Excluir ${selected.size} link(s)?`
      )
    ) {

      return;
    }


    await Promise.all(

      [...selected].map(
        (id) =>
          deleteLink(
            id
          )
      )
    );


    queryClient.invalidateQueries({
      queryKey:
        [
          "links",
        ],
    });


    setSelected(
      new Set()
    );


    setSelectMode(
      false
    );
  }


  // ==========================================================
  // MOVER EM MASSA
  // ==========================================================

  async function handleBulkMove(
    newCategory
  ) {

    if (!canEdit) {

      alert(
        "Você não possui permissão."
      );

      return;
    }


    await Promise.all(

      [...selected].map(
        (id) =>
          updateLink(
            id,
            {
              categories: [
                newCategory,
              ],
            }
          )
      )
    );


    queryClient.invalidateQueries({
      queryKey:
        [
          "links",
        ],
    });


    setSelected(
      new Set()
    );


    setSelectMode(
      false
    );
  }


  // ==========================================================
  // CANCELAR SELEÇÃO
  // ==========================================================

  function cancelSelect() {

    setSelectMode(
      false
    );

    setSelected(
      new Set()
    );
  }


  // ==========================================================
  // ACESSO NEGADO
  // ==========================================================

  if (!canView) {

    return (

      <div className="min-h-screen flex items-center justify-center">

        <div className="text-center">

          <Shield
            className="w-12 h-12 mx-auto mb-4 text-red-400"
          />

          <h1 className="font-heading text-2xl font-bold tracking-[0.15em] text-red-400 mb-2">
            ACESSO NEGADO
          </h1>

          <p className="text-muted-foreground text-sm">
            Você não possui permissão para visualizar ou gerenciar os links.
          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="min-h-screen px-4 py-16">

      <div className="max-w-4xl mx-auto">


        {/* HEADER */}
        <motion.div

          initial={{
            opacity: 0,
            y: 20,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          className="text-center mb-10"
        >

          <Link2
            className="w-8 h-8 mx-auto mb-4 text-muted-foreground"
          />


          <h1 className="font-heading text-4xl font-bold tracking-[0.15em] text-primary mb-2">
            LINKS
          </h1>


          <div className="w-16 h-[1px] bg-primary/30 mx-auto mb-4" />


          <p className="text-muted-foreground text-sm">
            Acesso rápido aos canais da família
          </p>


          {/* CONTROLES */}
          {canEdit && (

            <div className="flex items-center gap-2 mt-6 justify-center flex-wrap">


              <Button
                onClick={
                  openAdd
                }

                className="font-heading text-xs tracking-[0.15em] bg-primary text-primary-foreground hover:bg-primary/90"
              >

                <Plus
                  className="w-4 h-4 mr-2"
                />

                NOVO LINK

              </Button>


              <Button

                variant="outline"

                onClick={() =>
                  setCatManagerOpen(
                    true
                  )
                }

                className="font-heading text-xs tracking-[0.15em] border-border"
              >

                <Settings
                  className="w-4 h-4 mr-2"
                />

                CATEGORIAS

              </Button>


              <Button

                variant="outline"

                onClick={() => {

                  setSelectMode(
                    (
                      current
                    ) =>
                      !current
                  );

                  setSelected(
                    new Set()
                  );

                }}

                className={`font-heading text-xs tracking-[0.15em] border-border ${
                  selectMode
                    ? "border-primary/60 text-primary"
                    : ""
                }`}
              >

                <CheckSquare
                  className="w-4 h-4 mr-2"
                />

                SELECIONAR

              </Button>


              <Button

                variant="outline"

                onClick={
                  checkAll
                }

                disabled={
                  checking ||
                  isLoading
                }

                className="font-heading text-xs tracking-[0.15em] border-border"
              >

                {checking ? (

                  <RefreshCw
                    className="w-4 h-4 mr-2 animate-spin"
                  />

                ) : (

                  <Wifi
                    className="w-4 h-4 mr-2"
                  />

                )}


                {checking
                  ? "VERIFICANDO..."
                  : "VERIFICAR LINKS"}

              </Button>

            </div>

          )}

        </motion.div>


        {/* BUSCA */}
        <motion.div

          initial={{
            opacity: 0,
            y: 10,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          transition={{
            delay:
              0.1,
          }}

          className="relative mb-5"
        >

          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          />


          <Input

            value={
              search
            }

            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }

            placeholder="Buscar links..."

            className="pl-9 bg-card border-border font-body text-sm"

          />

        </motion.div>


        {/* CATEGORIAS */}
        {!q &&
          tabCategories.length >
            1 && (

          <motion.div

            initial={{
              opacity: 0,
              y: 10,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            transition={{
              delay:
                0.15,
            }}

            className="flex flex-wrap gap-2 mb-8"
          >

            <button

              onClick={() =>
                setActiveCategory(
                  "all"
                )
              }

              className={`px-3 py-1.5 rounded-lg border text-[11px] font-heading tracking-[0.15em] transition-colors ${
                activeCategory ===
                "all"

                  ? "bg-primary text-primary-foreground border-primary"

                  : "bg-card border-border text-muted-foreground hover:text-primary hover:border-primary/40"
              }`}
            >
              TODOS
            </button>


            {tabCategories.map(
              (
                category
              ) => {

                const categoryRecord =
                  linkCategories.find(
                    (
                      item
                    ) =>
                      item.name ===
                      category
                  );


                const CategoryIcon =
                  categoryRecord
                    ? getIconComponent(
                        categoryRecord.icon
                      )
                    : Link2;


                return (

                  <button

                    key={
                      category
                    }

                    onClick={() =>
                      setActiveCategory(
                        category
                      )
                    }

                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-heading tracking-[0.15em] transition-colors ${
                      activeCategory ===
                      category

                        ? "bg-primary text-primary-foreground border-primary"

                        : "bg-card border-border text-muted-foreground hover:text-primary hover:border-primary/40"
                    }`}
                  >

                    <CategoryIcon
                      className="w-3 h-3"
                    />

                    {
                      category.toUpperCase()
                    }

                  </button>

                );
              }
            )}

          </motion.div>

        )}


        {/* CONTEÚDO */}
        {isLoading ? (

          <div className="flex justify-center py-20">

            <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />

          </div>

        ) : categoryFiltered.length === 0 ? (

          <div className="text-center py-20">

            <p className="text-muted-foreground text-sm">

              {
                q
                  ? "Nenhum link encontrado."
                  : "Nenhum link adicionado ainda."
              }

            </p>

          </div>

        ) : (

          <>

            <FeaturedSection

              links={
                featuredLinks
              }

              canEdit={
                canEdit
              }

              onEdit={
                openEdit
              }

            />


            <DragDropContext
              onDragEnd={
                handleDragEnd
              }
            >

              <div className="space-y-10">

                {Object.entries(
                  grouped
                ).map(
                  (
                    [
                      category,
                      items,
                    ],
                    groupIndex
                  ) => {

                    const categoryRecord =
                      linkCategories.find(
                        (
                          item
                        ) =>
                          item.name ===
                          category
                      );


                    const CategoryIcon =
                      categoryRecord
                        ? getIconComponent(
                            categoryRecord.icon
                          )
                        : Link2;


                    return (

                      <motion.div

                        key={
                          category
                        }

                        initial={{
                          opacity: 0,
                          y: 20,
                        }}

                        animate={{
                          opacity: 1,
                          y: 0,
                        }}

                        transition={{
                          delay:
                            groupIndex *
                            0.07,
                        }}
                      >


                        {/* CABEÇALHO */}
                        <div className="flex items-center gap-4 mb-4">

                          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">

                            <CategoryIcon
                              className="w-4 h-4 text-primary"
                            />

                          </div>


                          <div>

                            <h2 className="font-heading text-sm font-bold tracking-[0.25em] text-primary">
                              {
                                category.toUpperCase()
                              }
                            </h2>

                            <p className="text-[10px] text-muted-foreground/50 font-heading tracking-wider">
                              {
                                items.length
                              }

                              {" "}

                              {
                                items.length ===
                                1
                                  ? "link"
                                  : "links"
                              }
                            </p>

                          </div>


                          <div className="flex-1 h-[1px] bg-border/50" />

                        </div>


                        {/* DROP */}
                        <Droppable

                          droppableId={
                            category
                          }

                          isDropDisabled={
                            !canEdit ||
                            selectMode
                          }

                        >

                          {(
                            provided
                          ) => (

                            <div

                              ref={
                                provided.innerRef
                              }

                              {
                                ...provided.droppableProps
                              }

                              className="space-y-2"
                            >

                              {items.map(
                                (
                                  link,
                                  index
                                ) => (

                                  <Draggable

                                    key={
                                      link.id
                                    }

                                    draggableId={
                                      String(
                                        link.id
                                      )
                                    }

                                    index={
                                      index
                                    }

                                    isDragDisabled={
                                      !canEdit ||
                                      selectMode
                                    }

                                  >

                                    {(
                                      drag,
                                      snapshot
                                    ) => (

                                      <div

                                        ref={
                                          drag.innerRef
                                        }

                                        {
                                          ...drag.draggableProps
                                        }

                                        className={
                                          snapshot.isDragging
                                            ? "opacity-80 scale-[1.02]"
                                            : ""
                                        }
                                      >

                                        <LinkCard

                                          link={
                                            link
                                          }

                                          canEdit={
                                            canEdit
                                          }

                                          onEdit={
                                            openEdit
                                          }

                                          onInlineSave={
                                            handleInlineSave
                                          }

                                          dragHandleProps={
                                            canEdit &&
                                            !selectMode
                                              ? drag.dragHandleProps
                                              : null
                                          }

                                          selectable={
                                            selectMode
                                          }

                                          selected={
                                            selected.has(
                                              link.id
                                            )
                                          }

                                          onToggleSelect={
                                            toggleSelect
                                          }

                                          linkStatus={
                                            linkStatus[
                                              link.id
                                            ]
                                          }

                                          allCategories={
                                            allCategories
                                          }

                                        />

                                      </div>

                                    )}

                                  </Draggable>

                                )
                              )}


                              {
                                provided.placeholder
                              }

                            </div>

                          )}

                        </Droppable>

                      </motion.div>

                    );
                  }
                )}

              </div>

            </DragDropContext>

          </>

        )}

      </div>


      {/* LINK MODAL */}
      {canEdit && (

        <LinkFormModal

          open={
            modalOpen
          }

          link={
            editingLink
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


      {/* CATEGORY MANAGER */}
      <AnimatePresence>

        {catManagerOpen &&
          canEdit && (

          <CategoryManager

            categories={
              linkCategories
            }

            onClose={() =>
              setCatManagerOpen(
                false
              )
            }

          />

        )}


        {/* BULK BAR */}
        {selectMode &&
          selected.size >
            0 && (

          <BulkBar

            count={
              selected.size
            }

            categories={
              allCategories
            }

            onDelete={
              handleBulkDelete
            }

            onMove={
              handleBulkMove
            }

            onCancel={
              cancelSelect
            }

          />

        )}

      </AnimatePresence>

    </div>
  );
}