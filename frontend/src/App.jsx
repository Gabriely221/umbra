// ============================================================
// APLICAÇÃO
// ============================================================
//
// Estrutura:
//
// AuthProvider
//      ↓
// BrowserRouter
//      ↓
// ProtectedRoute
//      ↓
// Layout
//      ↓
// páginas autenticadas
//
// O frontend protege a interface.
//
// A autoridade final continua sendo:
//
// Express
// + JWT
// + RBAC
// + autorização de conteúdo no backend.
//
// ============================================================


// ============================================================
// ROUTER
// ============================================================

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";


// ============================================================
// AUTENTICAÇÃO
// ============================================================

import {
  AuthProvider,
} from "@/context/AuthContext";


// ============================================================
// PROTEÇÃO DE ROTAS
// ============================================================

import ProtectedRoute
  from "@/components/auth/ProtectedRoute";


// ============================================================
// LAYOUT
// ============================================================

import Layout
  from "@/components/layout/Layout";


// ============================================================
// PÁGINAS PÚBLICAS
// ============================================================

import Login
  from "@/pages/Login";

import Register
  from "@/pages/Register";


// ============================================================
// AGUARDANDO
// ============================================================

import Aguardando
  from "@/pages/Aguardando";


// ============================================================
// PÁGINAS AUTENTICADAS
// ============================================================

import Home
  from "@/pages/Home";

import Members
  from "@/pages/Membros";

import Links
  from "@/pages/Links";

import Galeria
  from "@/pages/Galeria";

import RelacoesExternas
  from "@/pages/RelacoesExternas";

import OrganizationDetail
  from "@/pages/DetalheOrganizacao";

import Administracao
  from "@/pages/Administracao";


// ============================================================
// REDIRECT LEGADO DE ORGANIZAÇÃO
// ============================================================
//
// Compatibilidade temporária:
//
// /relacoes-externas/:id
//
//                ↓
//
// /relacoes/:id
//
// ============================================================

function LegacyOrganizationRedirect() {

  const {
    id,
  } =
    useParams();


  if (
    !id
  ) {

    return (

      <Navigate
        to="/relacoes"
        replace
      />

    );

  }


  return (

    <Navigate
      to={`/relacoes/${id}`}
      replace
    />

  );

}


// ============================================================
// APP
// ============================================================

export default function App() {

  return (

    <AuthProvider>

      <BrowserRouter>

        <Routes>


          {/* ==================================================
              ROTAS PÚBLICAS
              ================================================== */}

          <Route

            path="/login"

            element={
              <Login />
            }

          />


          <Route

            path="/register"

            element={
              <Register />
            }

          />


          {/* ==================================================
              AGUARDANDO
              ==================================================
              
              Exige autenticação.
              
              NÃO exige acessar_sistema.
              
              Usuários:
              
              - sem_acesso
              - sem acessar_sistema
              
              precisam conseguir visualizar esta página.
              
              Se o usuário já possuir acesso ao sistema, o
              ProtectedRoute redireciona /aguardando para "/".
              
              ================================================== */}

          <Route

            path="/aguardando"

            element={

              <ProtectedRoute
                allowWithoutSystemAccess
              >

                <Aguardando />

              </ProtectedRoute>

            }

          />


          {/* ==================================================
              ÁREA DO SISTEMA
              ==================================================
              
              O ProtectedRoute externo exige:
              
              - usuário autenticado
              - acessar_sistema
              - role diferente de sem_acesso
              
              Todas as páginas abaixo herdam essa proteção.
              
              ================================================== */}

          <Route

            element={

              <ProtectedRoute>

                <Layout />

              </ProtectedRoute>

            }

          >


            {/* ================================================
                HOME
                ================================================ */}

            <Route

              path="/"

              element={

                <ProtectedRoute
                  permission="visualizar_inicio"
                >

                  <Home />

                </ProtectedRoute>

              }

            />


            {/* ================================================
                MEMBROS
                ================================================
                
                Leitura permitida para:
                
                visualizar_membros
                OU
                gerenciar_membros
                
                Isso também permite cargos customizados que
                possuam gerenciamento sem a permissão de
                visualização explicitamente atribuída.
                
                ================================================ */}

            <Route

              path="/membros"

              element={

                <ProtectedRoute

                  anyPermissions={[
                    "visualizar_membros",
                    "gerenciar_membros",
                  ]}

                >

                  <Members />

                </ProtectedRoute>

              }

            />


            {/* ================================================
                LINKS
                ================================================ */}

            <Route

              path="/links"

              element={

                <ProtectedRoute

                  anyPermissions={[
                    "visualizar_links",
                    "gerenciar_links",
                  ]}

                >

                  <Links />

                </ProtectedRoute>

              }

            />


            {/* ================================================
                GALERIA
                ================================================ */}

            <Route

              path="/galeria"

              element={

                <ProtectedRoute

                  anyPermissions={[
                    "visualizar_galeria",
                    "gerenciar_galeria",
                  ]}

                >

                  <Galeria />

                </ProtectedRoute>

              }

            />


            {/* ================================================
                RELAÇÕES EXTERNAS
                ================================================
                
                Rotas canônicas:
                
                /relacoes
                /relacoes/:id
                
                O backend também aplica:
                
                - isActive
                - allowedCargos
                - bypass administrativo para
                  gerenciar_relacoes
                
                ================================================ */}

            <Route

              path="/relacoes"

              element={

                <ProtectedRoute

                  anyPermissions={[
                    "visualizar_relacoes",
                    "gerenciar_relacoes",
                  ]}

                >

                  <RelacoesExternas />

                </ProtectedRoute>

              }

            />


            <Route

              path="/relacoes/:id"

              element={

                <ProtectedRoute

                  anyPermissions={[
                    "visualizar_relacoes",
                    "gerenciar_relacoes",
                  ]}

                >

                  <OrganizationDetail />

                </ProtectedRoute>

              }

            />


            {/* ================================================
                ROTAS LEGADAS DE RELAÇÕES
                ================================================
                
                Podem ser removidas no final da migração,
                depois do grep global por:
                
                relacoes-externas
                
                ================================================ */}

            <Route

              path="/relacoes-externas"

              element={

                <Navigate
                  to="/relacoes"
                  replace
                />

              }

            />


            <Route

              path="/relacoes-externas/:id"

              element={

                <LegacyOrganizationRedirect />

              }

            />


            {/* ================================================
                ADMINISTRAÇÃO
                ================================================
                
                Acesso à página quando possuir pelo menos uma:
                
                gerenciar_usuarios
                OU
                gerenciar_roles
                
                A própria página ainda pode controlar quais
                blocos administrativos são exibidos.
                
                ================================================ */}

            <Route

              path="/administracao"

              element={

                <ProtectedRoute

                  anyPermissions={[
                    "gerenciar_usuarios",
                    "gerenciar_roles",
                  ]}

                >

                  <Administracao />

                </ProtectedRoute>

              }

            />


          </Route>


        </Routes>

      </BrowserRouter>

    </AuthProvider>

  );

}