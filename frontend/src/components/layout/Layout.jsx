// ============================================================
// LAYOUT PRINCIPAL
// ============================================================
//
// Contém:
//
// - menu principal
// - usuário logado
// - cargo atual
// - logout
// - Outlet do React Router
//
// VISIBILIDADE DO MENU:
//
// O menu segue a mesma lógica utilizada no App.jsx.
//
// Para módulos que possuem permissão de visualização e de
// gerenciamento:
//
// visualizar_x
// OU
// gerenciar_x
//
// Isso permite, por exemplo, que um cargo customizado possua:
//
// gerenciar_relacoes
//
// sem precisar obrigatoriamente possuir:
//
// visualizar_relacoes
//
// O backend e o ProtectedRoute continuam sendo as autoridades
// de segurança.
//
// O menu é apenas uma camada de UX.
//
// ============================================================


// ============================================================
// REACT ROUTER
// ============================================================

import {
  NavLink,
  Outlet,
} from "react-router-dom";


// ============================================================
// AUTH
// ============================================================

import {
  useAuth,
} from "@/context/AuthContext";


// ============================================================
// RBAC
// ============================================================

import {
  usePermissions,
} from "@/hooks/usePermissions";


// ============================================================
// COMPONENTE
// ============================================================

export default function Layout() {

  // ==========================================================
  // AUTH
  // ==========================================================

  const {
    usuario,
    logout,
  } =
    useAuth();


  // ==========================================================
  // PERMISSÕES
  // ==========================================================

  const {
    can,
    canAny,
  } =
    usePermissions();


  // ==========================================================
  // VISIBILIDADE DOS MÓDULOS
  // ==========================================================

  const canViewHome =
    can(
      "visualizar_inicio"
    );


  const canViewMembers =
    canAny([
      "visualizar_membros",
      "gerenciar_membros",
    ]);


  const canViewLinks =
    canAny([
      "visualizar_links",
      "gerenciar_links",
    ]);


  const canViewGallery =
    canAny([
      "visualizar_galeria",
      "gerenciar_galeria",
    ]);


  const canViewRelations =
    canAny([
      "visualizar_relacoes",
      "gerenciar_relacoes",
    ]);


  const canViewRules =
    canAny([
      "visualizar_regras",
      "gerenciar_regras",
    ]);


  const canViewAdministration =
    canAny([
      "gerenciar_usuarios",
      "gerenciar_roles",
    ]);


  // ==========================================================
  // ROLE ATUAL
  // ==========================================================
  //
  // Aceitamos temporariamente:
  //
  // usuario.role
  // usuario.Role
  //
  // durante a migração dos formatos de resposta.
  //
  // ==========================================================

  const currentRole =
    usuario?.role ||
    usuario?.Role ||
    null;


  // ==========================================================
  // CLASSES DO MENU
  // ==========================================================

  function getNavClass({
    isActive,
  }) {

    return [
      "text-sm",
      "transition-colors",

      isActive
        ? "text-primary"
        : "text-muted-foreground hover:text-primary",
    ].join(
      " "
    );

  }


  // ==========================================================
  // LOGOUT
  // ==========================================================

  function handleLogout() {

    logout();

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="min-h-screen bg-background">


      {/* ======================================================
          MENU
          ====================================================== */}

      <nav className="border-b border-border px-6 py-4">

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">


          {/* ==================================================
              LINKS
              ================================================== */}

          <div className="flex items-center gap-5 flex-wrap">


            {/* =================================================
                INÍCIO
                ================================================= */}

            {canViewHome && (

              <NavLink
                to="/"
                end
                className={
                  getNavClass
                }
              >
                INÍCIO
              </NavLink>

            )}


            {/* =================================================
                MEMBROS
                ================================================= */}

            {canViewMembers && (

              <NavLink
                to="/membros"
                className={
                  getNavClass
                }
              >
                MEMBROS
              </NavLink>

            )}


            {/* =================================================
                LINKS
                ================================================= */}

            {canViewLinks && (

              <NavLink
                to="/links"
                className={
                  getNavClass
                }
              >
                LINKS
              </NavLink>

            )}


            {/* =================================================
                GALERIA
                ================================================= */}

            {canViewGallery && (

              <NavLink
                to="/galeria"
                className={
                  getNavClass
                }
              >
                GALERIA
              </NavLink>

            )}


            {/* =================================================
                RELAÇÕES
                =================================================
                
                Rota canônica:
                
                /relacoes
                
                /relacoes-externas permanece apenas como
                redirect legado no App.jsx.
                
                ================================================= */}

            {canViewRelations && (

              <NavLink
                to="/relacoes"
                className={
                  getNavClass
                }
              >
                RELAÇÕES
              </NavLink>

            )}


            {/* =================================================
                REGRAS
                ================================================= */}

            {canViewRules && (

              <NavLink
                to="/regras"
                className={
                  getNavClass
                }
              >
                REGRAS
              </NavLink>

            )}


            {/* =================================================
                ADMINISTRAÇÃO
                =================================================
                
                A página pode ser acessada por:
                
                gerenciar_usuarios
                OU
                gerenciar_roles
                
                Portanto o menu precisa seguir a mesma regra.
                
                ================================================= */}

            {canViewAdministration && (

              <NavLink
                to="/administracao"
                className={
                  getNavClass
                }
              >
                ADMINISTRAÇÃO
              </NavLink>

            )}

          </div>


          {/* ==================================================
              USUÁRIO
              ================================================== */}

          <div className="flex items-center gap-4 shrink-0">

            <div className="text-right">

              <p className="text-sm text-primary">

                {
                  usuario?.nome ||
                  ""
                }

              </p>


              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">

                {
                  currentRole?.nome ||
                  currentRole?.slug ||
                  ""
                }

              </p>

            </div>


            <button

              type="button"

              onClick={
                handleLogout
              }

              className="text-xs text-muted-foreground hover:text-primary transition-colors"

            >
              SAIR
            </button>

          </div>

        </div>

      </nav>


      {/* ======================================================
          CONTEÚDO
          ====================================================== */}

      <main>

        <Outlet />

      </main>

    </div>

  );

}