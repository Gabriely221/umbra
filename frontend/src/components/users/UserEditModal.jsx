// ============================================================
// MODAL DE EDIÇÃO DE USUÁRIO / MEMBRO
// ============================================================
//
// Este modal trabalha com DUAS entidades:
//
// Usuario
// ├── id
// ├── nome
// ├── email
// ├── roleId
// └── ativo
//
// Membro
// ├── id
// ├── usuarioId
// ├── status
// ├── codinome
// ├── avatarUrl
// ├── bio
// └── departamentos
//
// IMPORTANTE:
//
// user.id
//   → Usuario.id
//
// user.membroId
//   → Membro.id
//
// Nunca devemos confundir os dois.
//
// ============================================================

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";


// ============================================================
// REACT QUERY
// ============================================================

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";


// ============================================================
// ANIMAÇÕES
// ============================================================

import {
  motion,
  AnimatePresence,
} from "framer-motion";


// ============================================================
// ÍCONES
// ============================================================

import {
  X,
  Save,
  Link2,
  Check,
  Trash2,
  Shield,
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
  Textarea,
} from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// ============================================================
// AUTH
// ============================================================

import {
  useAuth,
} from "@/context/AuthContext";


// ============================================================
// PERMISSÕES
// ============================================================

import {
  usePermissions,
} from "@/hooks/usePermissions";


// ============================================================
// API
// ============================================================

import {
  getLinks,
  getUserLinks,
  assignUserLink,
  removeUserLink,
  updateUser,
  updateUserRole,
  updateMembro,
  deleteUser,
  getRoles,
} from "@/services/api";


// ============================================================
// UTILITÁRIOS
// ============================================================

import {
  getLinkIcon,
} from "@/lib/linkIcons";


// ============================================================
// TOAST
// ============================================================

import {
  useToast,
} from "@/components/ui/use-toast";


// ============================================================
// COMPONENTES
// ============================================================

import DepartmentSelector
  from "@/components/shared/DepartmentSelector";


// ============================================================
// HELPERS
// ============================================================

// ------------------------------------------------------------
// NORMALIZA ID
// ------------------------------------------------------------
//
// Usamos String para evitar problemas do tipo:
//
// 1 !== "1"
//
// ------------------------------------------------------------

function normalizeId(
  value
) {

  if (
    value ===
      undefined ||
    value ===
      null ||
    value ===
      ""
  ) {

    return null;

  }


  return String(
    value
  );

}


// ------------------------------------------------------------
// ID DO LINK DIRETO
// ------------------------------------------------------------

function getUserLinkId(
  item
) {

  return normalizeId(

    item?.linkId ??

    item?.link_id ??

    item?.Link?.id ??

    item?.link?.id

  );

}


// ------------------------------------------------------------
// ROLE ID
// ------------------------------------------------------------

function getCurrentRoleId(
  user
) {

  return normalizeId(

    user?.role?.id ??

    user?.Role?.id ??

    user?.roleId

  );

}


// ============================================================
// COMPONENTE
// ============================================================

export default function UserEditModal({
  user,
  onClose,
  onSaved,
}) {

  // ==========================================================
  // AUTH
  // ==========================================================

  const {
    user:
      currentUser,
  } =
    useAuth();


  // ==========================================================
  // PERMISSÕES
  // ==========================================================

  const {
    can,
  } =
    usePermissions();


  const canManageUsers =
    can(
      "gerenciar_usuarios"
    );


  const canManageMembers =
    can(
      "gerenciar_membros"
    );


  // ==========================================================
  // AUTOEDIÇÃO
  // ==========================================================

  const isCurrentUser =
    Boolean(
      currentUser?.id &&
      user?.id &&
      String(
        currentUser.id
      ) ===
        String(
          user.id
        )
    );


  // ==========================================================
  // TOAST
  // ==========================================================

  const {
    toast,
  } =
    useToast();


  // ==========================================================
  // QUERY CLIENT
  // ==========================================================

  const queryClient =
    useQueryClient();


  // ==========================================================
  // USUÁRIO
  // ==========================================================

  const [
    nomeRp,
    setNomeRp,
  ] =
    useState("");


  const [
    roleId,
    setRoleId,
  ] =
    useState("");


  // ==========================================================
  // MEMBRO
  // ==========================================================

  const [
    codinome,
    setCodinome,
  ] =
    useState("");


  const [
    status,
    setStatus,
  ] =
    useState("Ativo");


  const [
    avatarUrl,
    setAvatarUrl,
  ] =
    useState("");


  const [
    bio,
    setBio,
  ] =
    useState("");


  const [
    departments,
    setDepartments,
  ] =
    useState([]);


  // ==========================================================
  // LINKS
  // ==========================================================

  const [
    assignedLinks,
    setAssignedLinks,
  ] =
    useState(
      new Set()
    );


  // ==========================================================
  // ESTADOS DE OPERAÇÃO
  // ==========================================================

  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    deleting,
    setDeleting,
  ] =
    useState(false);


  const [
    confirmDelete,
    setConfirmDelete,
  ] =
    useState(false);


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");


  // ==========================================================
  // ROLES
  // ==========================================================

  const {
    data:
      roles = [],

    isLoading:
      rolesLoading,

    isError:
      rolesError,

    error:
      rolesErrorObject,
  } =
    useQuery({

      queryKey:
        [
          "roles",
        ],

      queryFn:
        getRoles,

      enabled:
        Boolean(
          user?.id &&
          canManageUsers
        ),

    });


  // ==========================================================
  // TODOS OS LINKS
  // ==========================================================

  const {
    data:
      allLinks = [],

    isLoading:
      linksLoading,
  } =
    useQuery({

      queryKey:
        [
          "links",
        ],

      queryFn:
        getLinks,

      enabled:
        Boolean(
          user?.id &&
          canManageUsers
        ),

    });


  // ==========================================================
  // LINKS DIRETOS DO USUÁRIO
  // ==========================================================

  const {
    data:
      userLinks = [],

    isLoading:
      userLinksLoading,
  } =
    useQuery({

      queryKey:
        [
          "user-links",
          user?.id,
        ],

      queryFn:
        () =>
          getUserLinks(
            user.id
          ),

      enabled:
        Boolean(
          user?.id &&
          canManageUsers
        ),

    });


  // ==========================================================
  // INICIALIZA FORMULÁRIO
  // ==========================================================

  useEffect(
    () => {

      if (
        !user
      ) {

        return;

      }


      // -------------------------------------------------------
      // USUÁRIO
      // -------------------------------------------------------

      setNomeRp(

        user.nome_rp ||

        user.nomeRp ||

        user.nome ||

        user.full_name ||

        ""

      );


      setRoleId(
        getCurrentRoleId(
          user
        ) ||
        ""
      );


      // -------------------------------------------------------
      // MEMBRO
      // -------------------------------------------------------

      setCodinome(

        user.codinome ||

        user.codename ||

        ""

      );


      setStatus(

        user.status ||

        "Ativo"

      );


      setAvatarUrl(

        user.avatarUrl ||

        user.avatar_url ||

        ""

      );


      setBio(

        user.bio ||

        ""

      );


      setDepartments(

        Array.isArray(
          user.departamentos
        )

          ? user.departamentos

          : Array.isArray(
              user.departments
            )

            ? user.departments

            : []

      );


      // -------------------------------------------------------
      // ESTADOS AUXILIARES
      // -------------------------------------------------------

      setAssignedLinks(
        new Set()
      );


      setConfirmDelete(
        false
      );


      setErrorMessage("");

    },

    [
      user,
    ]
  );


  // ==========================================================
  // CARREGA LINKS DIRETOS
  // ==========================================================

  useEffect(
    () => {

      if (
        !canManageUsers
      ) {

        setAssignedLinks(
          new Set()
        );

        return;

      }


      const ids =
        userLinks

          .map(
            getUserLinkId
          )

          .filter(Boolean);


      setAssignedLinks(
        new Set(
          ids
        )
      );

    },

    [
      userLinks,
      canManageUsers,
    ]
  );


  // ==========================================================
  // ROLE SELECIONADO
  // ==========================================================

  const selectedRole =
    useMemo(
      () => {

        return roles.find(
          (
            role
          ) =>
            normalizeId(
              role.id
            ) ===
            normalizeId(
              roleId
            )
        );

      },
      [
        roles,
        roleId,
      ]
    );


  // ==========================================================
  // LINKS ATIVOS
  // ==========================================================

  const activeLinks =
    useMemo(
      () => {

        return allLinks.filter(
          (
            link
          ) => {

            const active =
              link?.is_active ??
              link?.isActive ??
              true;


            return (
              active !==
              false
            );

          }
        );

      },
      [
        allLinks,
      ]
    );


  // ==========================================================
  // TOGGLE LINK
  // ==========================================================

  function toggleLink(
    linkId
  ) {

    if (
      !canManageUsers
    ) {

      return;

    }


    const normalizedLinkId =
      normalizeId(
        linkId
      );


    if (
      !normalizedLinkId
    ) {

      return;

    }


    setAssignedLinks(
      (
        current
      ) => {

        const next =
          new Set(
            current
          );


        if (
          next.has(
            normalizedLinkId
          )
        ) {

          next.delete(
            normalizedLinkId
          );

        } else {

          next.add(
            normalizedLinkId
          );

        }


        return next;

      }
    );

  }


  // ==========================================================
  // SALVAR USUÁRIO
  // ==========================================================

  async function saveUsuario() {

    if (
      !canManageUsers
    ) {

      return;

    }


    // --------------------------------------------------------
    // NOME
    // --------------------------------------------------------

    const normalizedName =
      nomeRp.trim();


    const currentName =
      String(

        user?.nome ||

        user?.full_name ||

        ""

      ).trim();


    if (
      normalizedName &&
      normalizedName !==
        currentName
    ) {

      await updateUser(

        user.id,

        {
          nome:
            normalizedName,
        }

      );

    }


    // --------------------------------------------------------
    // ROLE
    // --------------------------------------------------------

    const currentRoleId =
      getCurrentRoleId(
        user
      );


    if (
      roleId &&
      normalizeId(
        roleId
      ) !==
        currentRoleId
    ) {

      await updateUserRole(

        user.id,

        Number(
          roleId
        )

      );

    }

  }


  // ==========================================================
  // SALVAR PERFIL DO MEMBRO
  // ==========================================================

  async function saveMembro() {

    if (
      !canManageMembers ||
      !user?.membroId
    ) {

      return;

    }


    await updateMembro(

      user.membroId,

      {
        status,

        codinome:
          codinome.trim() ||
          null,

        avatarUrl:
          avatarUrl.trim() ||
          null,

        bio:
          bio.trim() ||
          null,

        departamentos:
          Array.isArray(
            departments
          )
            ? departments
            : [],
      }

    );

  }


  // ==========================================================
  // SALVAR LINKS DIRETOS
  // ==========================================================

  async function saveUserLinks() {

    if (
      !canManageUsers
    ) {

      return;

    }


    const currentLinkIds =
      new Set(

        userLinks

          .map(
            getUserLinkId
          )

          .filter(Boolean)

      );


    const selectedLinkIds =
      new Set(
        assignedLinks
      );


    const linksToAdd =
      [
        ...selectedLinkIds,
      ].filter(
        (
          id
        ) =>
          !currentLinkIds.has(
            id
          )
      );


    const linksToRemove =
      [
        ...currentLinkIds,
      ].filter(
        (
          id
        ) =>
          !selectedLinkIds.has(
            id
          )
      );


    // --------------------------------------------------------
    // ADICIONA
    // --------------------------------------------------------

    await Promise.all(

      linksToAdd.map(
        (
          linkId
        ) =>
          assignUserLink(

            user.id,

            Number(
              linkId
            )

          )
      )

    );


    // --------------------------------------------------------
    // REMOVE
    // --------------------------------------------------------

    await Promise.all(

      linksToRemove.map(
        (
          linkId
        ) =>
          removeUserLink(

            user.id,

            Number(
              linkId
            )

          )
      )

    );

  }


  // ==========================================================
  // INVALIDA CACHE
  // ==========================================================

  async function invalidateCaches() {

    await Promise.all([

      queryClient.invalidateQueries({
        queryKey:
          [
            "user-links",
            user?.id,
          ],
      }),

      queryClient.invalidateQueries({
        queryKey:
          [
            "membros",
          ],
      }),

      queryClient.invalidateQueries({
        queryKey:
          [
            "all-users",
          ],
      }),

      queryClient.invalidateQueries({
        queryKey:
          [
            "roles",
          ],
      }),

    ]);

  }


  // ==========================================================
  // SALVAR
  // ==========================================================

  async function handleSave() {

    if (
      !user?.id
    ) {

      return;

    }


    if (
      !canManageUsers &&
      !canManageMembers
    ) {

      toast({

        title:
          "Sem permissão",

        description:
          "Você não possui permissão para alterar este usuário.",

        variant:
          "destructive",

      });


      return;

    }


    setSaving(
      true
    );

    setErrorMessage("");


    try {

      // -------------------------------------------------------
      // USUARIO
      // -------------------------------------------------------

      await saveUsuario();


      // -------------------------------------------------------
      // MEMBRO
      // -------------------------------------------------------

      await saveMembro();


      // -------------------------------------------------------
      // LINKS DIRETOS
      // -------------------------------------------------------

      await saveUserLinks();


      // -------------------------------------------------------
      // CACHE
      // -------------------------------------------------------

      await invalidateCaches();


      // -------------------------------------------------------
      // FEEDBACK
      // -------------------------------------------------------

      toast({

        title:
          "Usuário atualizado",

        description:
          "As alterações foram salvas com sucesso.",

      });


      onSaved?.();

      onClose?.();

    } catch (
      error
    ) {

      console.error(
        "[UserEditModal] erro ao salvar:",
        error
      );


      const message =
        error?.message ||
        "Não foi possível salvar as alterações.";


      setErrorMessage(
        message
      );


      toast({

        title:
          "Erro ao salvar",

        description:
          message,

        variant:
          "destructive",

      });

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
      !user?.id
    ) {

      return;

    }


    if (
      !canManageUsers
    ) {

      toast({

        title:
          "Sem permissão",

        description:
          "Você não possui permissão para excluir contas.",

        variant:
          "destructive",

      });


      return;

    }


    if (
      isCurrentUser
    ) {

      toast({

        title:
          "Operação não permitida",

        description:
          "Você não pode excluir a sua própria conta.",

        variant:
          "destructive",

      });


      return;

    }


    setDeleting(
      true
    );

    setErrorMessage("");


    try {

      await deleteUser(
        user.id
      );


      await Promise.all([

        queryClient.invalidateQueries({
          queryKey:
            [
              "all-users",
            ],
        }),

        queryClient.invalidateQueries({
          queryKey:
            [
              "membros",
            ],
        }),

        queryClient.invalidateQueries({
          queryKey:
            [
              "user-links",
            ],
        }),

      ]);


      toast({

        title:
          "Usuário excluído",

        description:
          "A conta foi removida do sistema.",

      });


      onSaved?.();

      onClose?.();

    } catch (
      error
    ) {

      console.error(
        "[UserEditModal] erro ao excluir:",
        error
      );


      const message =
        error?.message ||
        "Não foi possível excluir o usuário.";


      setErrorMessage(
        message
      );


      toast({

        title:
          "Erro ao excluir",

        description:
          message,

        variant:
          "destructive",

      });

    } finally {

      setDeleting(
        false
      );

    }

  }


  // ==========================================================
  // NOME DE EXIBIÇÃO
  // ==========================================================

  const displayName =

    nomeRp ||

    user?.nome ||

    user?.full_name ||

    "—";


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <AnimatePresence>

      <motion.div

        initial={{
          opacity: 0,
        }}

        animate={{
          opacity: 1,
        }}

        exit={{
          opacity: 0,
        }}

        className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4"

        onClick={() => {

          if (
            !saving &&
            !deleting
          ) {

            onClose?.();

          }

        }}

      >

        <motion.div

          initial={{
            opacity: 0,
            scale: 0.95,
            y: 20,
          }}

          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}

          exit={{
            opacity: 0,
            scale: 0.95,
            y: 20,
          }}

          onClick={(
            event
          ) =>
            event.stopPropagation()
          }

          className="bg-card border border-border rounded-xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto"

        >


          {/* ==================================================
              HEADER
              ================================================== */}

          <div className="flex items-center justify-between">

            <div>

              <p className="font-heading text-xs tracking-[0.25em] text-muted-foreground uppercase">

                — EDITAR USUÁRIO

              </p>

              <p className="font-heading text-base font-bold text-primary mt-0.5 tracking-wide">

                {displayName}

              </p>

              <p className="text-xs text-muted-foreground">

                {
                  user?.email ||
                  "—"
                }

              </p>

            </div>


            <button

              type="button"

              onClick={
                onClose
              }

              disabled={
                saving ||
                deleting
              }

              className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"

            >

              <X
                className="w-5 h-5"
              />

            </button>

          </div>


          <div className="w-full h-[1px] bg-border" />


          {/* ==================================================
              CONTA DO USUÁRIO
              ================================================== */}

          {canManageUsers && (

            <div className="space-y-4">

              <div className="flex items-center gap-2">

                <Shield
                  className="w-4 h-4 text-primary"
                />

                <p className="font-heading text-[10px] tracking-[0.2em] text-primary">

                  CONTA

                </p>

              </div>


              {/* NOME */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  NOME RP

                </Label>


                <Input

                  value={
                    nomeRp
                  }

                  onChange={(
                    event
                  ) =>
                    setNomeRp(
                      event.target.value
                    )
                  }

                  placeholder="Nome em RP do membro"

                  disabled={
                    saving ||
                    deleting
                  }

                  className="bg-background border-border text-primary font-body"

                />

              </div>


              {/* ROLE */}

              <div className="space-y-1.5">

                <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                  CARGO / ROLE

                </Label>


                <Select

                  value={
                    roleId
                  }

                  onValueChange={
                    setRoleId
                  }

                  disabled={
                    rolesLoading ||
                    rolesError ||
                    saving ||
                    deleting
                  }

                >

                  <SelectTrigger className="bg-background border-border text-primary font-heading text-xs tracking-wider">

                    <SelectValue

                      placeholder={

                        rolesLoading

                          ? "CARREGANDO..."

                          : rolesError

                            ? "ERRO AO CARREGAR"

                            : "SELECIONAR CARGO"

                      }

                    />

                  </SelectTrigger>


                  <SelectContent>

                    {roles.map(
                      (
                        role
                      ) => (

                        <SelectItem

                          key={
                            role.id
                          }

                          value={
                            String(
                              role.id
                            )
                          }

                        >

                          {
                            role.nome ||
                            role.name ||
                            role.slug
                          }

                        </SelectItem>

                      )
                    )}

                  </SelectContent>

                </Select>


                {rolesError && (

                  <p className="text-[10px] text-red-400">

                    {
                      rolesErrorObject?.message ||
                      "Não foi possível carregar os cargos."
                    }

                  </p>

                )}


                {selectedRole && (

                  <p className="text-[10px] text-muted-foreground">

                    {
                      selectedRole.descricao ||
                      selectedRole.description ||
                      "As permissões deste cargo são definidas pela administração."
                    }

                  </p>

                )}

              </div>

            </div>

          )}


          {/* ==================================================
              PERFIL DO MEMBRO
              ================================================== */}

          {canManageMembers &&
          user?.membroId && (

            <>

              {canManageUsers && (

                <div className="w-full h-[1px] bg-border" />

              )}


              <div className="space-y-4">

                <p className="font-heading text-[10px] tracking-[0.2em] text-primary">

                  PERFIL DO MEMBRO

                </p>


                {/* CODINOME */}

                <div className="space-y-1.5">

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                    CODINOME

                  </Label>


                  <Input

                    value={
                      codinome
                    }

                    onChange={(
                      event
                    ) =>
                      setCodinome(
                        event.target.value
                      )
                    }

                    placeholder="Codinome"

                    disabled={
                      saving ||
                      deleting
                    }

                    className="bg-background border-border text-primary"

                  />

                </div>


                {/* STATUS */}

                <div className="space-y-1.5">

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                    STATUS

                  </Label>


                  <Select

                    value={
                      status
                    }

                    onValueChange={
                      setStatus
                    }

                    disabled={
                      saving ||
                      deleting
                    }

                  >

                    <SelectTrigger className="bg-background border-border text-primary">

                      <SelectValue />

                    </SelectTrigger>


                    <SelectContent>

                      <SelectItem
                        value="Ativo"
                      >
                        Ativo
                      </SelectItem>

                      <SelectItem
                        value="Inativo"
                      >
                        Inativo
                      </SelectItem>

                      <SelectItem
                        value="Afastado"
                      >
                        Afastado
                      </SelectItem>

                    </SelectContent>

                  </Select>

                </div>


                {/* AVATAR */}

                <div className="space-y-1.5">

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                    URL DO AVATAR

                  </Label>


                  <Input

                    value={
                      avatarUrl
                    }

                    onChange={(
                      event
                    ) =>
                      setAvatarUrl(
                        event.target.value
                      )
                    }

                    placeholder="https://..."

                    disabled={
                      saving ||
                      deleting
                    }

                    className="bg-background border-border text-primary"

                  />

                </div>


                {/* BIO */}

                <div className="space-y-1.5">

                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                    BIO

                  </Label>


                  <Textarea

                    value={
                      bio
                    }

                    onChange={(
                      event
                    ) =>
                      setBio(
                        event.target.value
                      )
                    }

                    placeholder="Informações sobre o membro..."

                    disabled={
                      saving ||
                      deleting
                    }

                    rows={3}

                    className="bg-background border-border text-primary resize-none"

                  />

                </div>


                {/* DEPARTAMENTOS */}

                <DepartmentSelector

                  selected={
                    departments
                  }

                  onChange={
                    setDepartments
                  }

                  label="DEPARTAMENTOS"

                  hint="Departamentos associados ao perfil do membro."

                />

              </div>

            </>

          )}


          {/* ==================================================
              LINKS DIRETOS
              ==================================================
              
              Essa operação pertence à administração de Usuario
              e o backend exige gerenciar_usuarios.
              ================================================== */}

          {canManageUsers && (

            <>

              <div className="w-full h-[1px] bg-border" />


              <div className="space-y-2">

                <div className="flex items-center gap-2">

                  <Link2
                    className="w-3.5 h-3.5 text-muted-foreground"
                  />


                  <Label className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground">

                    LINKS AUTORIZADOS

                  </Label>


                  {assignedLinks.size >
                    0 && (

                    <span className="text-primary/60 text-[10px]">

                      ({assignedLinks.size})

                    </span>

                  )}

                </div>


                {linksLoading ||
                userLinksLoading ? (

                  <div className="flex justify-center py-4">

                    <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />

                  </div>

                ) : activeLinks.length ===
                  0 ? (

                  <p className="text-[11px] text-muted-foreground italic">

                    Nenhum link cadastrado.

                  </p>

                ) : (

                  <div className="space-y-1.5">

                    {activeLinks.map(
                      (
                        link
                      ) => {

                        const Icon =
                          getLinkIcon(
                            link.icon
                          );


                        const linkId =
                          normalizeId(
                            link.id
                          );


                        const isSelected =
                          assignedLinks.has(
                            linkId
                          );


                        return (

                          <button

                            key={
                              link.id
                            }

                            type="button"

                            onClick={() =>
                              toggleLink(
                                link.id
                              )
                            }

                            disabled={
                              saving ||
                              deleting
                            }

                            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg border text-xs transition-colors ${
                              isSelected

                                ? "bg-primary text-primary-foreground border-primary"

                                : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                            }`}

                          >

                            {isSelected ? (

                              <Check
                                className="w-3.5 h-3.5 flex-shrink-0"
                              />

                            ) : (

                              <Icon
                                className="w-3.5 h-3.5 flex-shrink-0"
                              />

                            )}


                            <span className="font-heading tracking-wide truncate">

                              {
                                link.title
                              }

                            </span>

                          </button>

                        );

                      }
                    )}

                  </div>

                )}

              </div>

            </>

          )}


          {/* ==================================================
              ERRO
              ================================================== */}

          {errorMessage && (

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">

              <p className="text-xs text-red-400 leading-relaxed">

                {errorMessage}

              </p>

            </div>

          )}


          {/* ==================================================
              EXCLUSÃO
              ================================================== */}

          {canManageUsers &&
          !isCurrentUser &&
          !confirmDelete && (

            <Button

              variant="outline"

              onClick={() =>
                setConfirmDelete(
                  true
                )
              }

              disabled={
                saving ||
                deleting
              }

              className="w-full font-heading text-[10px] tracking-wider border-destructive/40 text-destructive hover:bg-destructive/10"

            >

              <Trash2
                className="w-3.5 h-3.5 mr-1.5"
              />

              EXCLUIR USUÁRIO

            </Button>

          )}


          {canManageUsers &&
          isCurrentUser && (

            <p className="text-[10px] text-muted-foreground text-center">

              Sua própria conta não pode ser excluída por este painel.

            </p>

          )}


          {canManageUsers &&
          !isCurrentUser &&
          confirmDelete && (

            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">

              <p className="font-heading text-xs tracking-[0.2em] text-destructive uppercase">

                EXCLUIR USUÁRIO

              </p>


              <p className="text-xs text-muted-foreground leading-relaxed">

                Tem certeza que deseja excluir este usuário?
                Esta ação removerá a conta e suas relações
                dependentes.

              </p>


              <div className="flex gap-2">

                <Button

                  variant="outline"

                  onClick={() =>
                    setConfirmDelete(
                      false
                    )
                  }

                  disabled={
                    deleting
                  }

                  className="flex-1 font-heading text-[10px] tracking-wider"

                >

                  CANCELAR

                </Button>


                <Button

                  onClick={
                    handleDelete
                  }

                  disabled={
                    deleting
                  }

                  className="flex-1 font-heading text-[10px] tracking-wider bg-destructive text-destructive-foreground"

                >

                  {deleting ? (

                    <div className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />

                  ) : (

                    "EXCLUIR"

                  )}

                </Button>

              </div>

            </div>

          )}


          {/* ==================================================
              BOTÕES
              ================================================== */}

          <div className="flex gap-3 pt-1">

            <Button

              variant="outline"

              onClick={
                onClose
              }

              disabled={
                saving ||
                deleting
              }

              className="flex-1 font-heading text-[10px] tracking-wider"

            >

              CANCELAR

            </Button>


            <Button

              onClick={
                handleSave
              }

              disabled={
                saving ||
                deleting ||
                (
                  !canManageUsers &&
                  !canManageMembers
                )
              }

              className="flex-1 font-heading text-[10px] tracking-wider bg-primary text-primary-foreground"

            >

              {saving ? (

                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />

              ) : (

                <>

                  <Save
                    className="w-3.5 h-3.5 mr-1.5"
                  />

                  SALVAR

                </>

              )}

            </Button>

          </div>

        </motion.div>

      </motion.div>

    </AnimatePresence>

  );

}