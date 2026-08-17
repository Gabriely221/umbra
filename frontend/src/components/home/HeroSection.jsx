// ============================================================
// HERO DA HOME
// ============================================================
//
// Componente visual principal da página inicial.
//
// O componente não utiliza SDK ou autenticação da Base44.
//
// O estado de autenticação vem exclusivamente do AuthContext.
//
// BOTÃO "SOLICITAR ACESSO":
//
// - aparece quando não existe usuário autenticado;
// - direciona para /register.
//
// USUÁRIO AUTENTICADO:
//
// - o botão de solicitação desaparece;
// - uma indicação discreta de acesso autorizado é exibida.
//
// ASSETS:
//
// As imagens são servidas localmente pelo Vite através de:
//
// frontend/public/images/
//
// Portanto NÃO existe mais dependência da Base44 neste
// componente.
//
// ============================================================

import React
  from "react";


// ============================================================
// REACT ROUTER
// ============================================================

import {
  Link,
} from "react-router-dom";


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
  ChevronDown,
} from "lucide-react";


// ============================================================
// AUTENTICAÇÃO
// ============================================================

import {
  useAuth,
} from "@/context/AuthContext";


// ============================================================
// ASSETS LOCAIS
// ============================================================
//
// Arquivos esperados:
//
// frontend/public/images/hero-background.png
// frontend/public/images/cartelhub-logo.png
//
// Como estão dentro de /public, são acessados a partir da raiz:
//
// /images/...
//
// ============================================================

const BG_URL =
  "/images/hero-background.png";


const LOGO_URL =
  "/images/cartelhub-logo.png";


// ============================================================
// COMPONENTE
// ============================================================

export default function HeroSection() {

  // ==========================================================
  // AUTENTICAÇÃO
  // ==========================================================
  //
  // "usuario" é a propriedade canônica do AuthContext.
  //
  // O alias "user" pode continuar existindo temporariamente
  // para compatibilidade com componentes antigos.
  //
  // Componentes novos/revisados utilizam "usuario".
  //
  // ==========================================================

  const {
    usuario,
    loading,
  } =
    useAuth();


  // ==========================================================
  // ESTADO DE AUTENTICAÇÃO
  // ==========================================================

  const isAuthenticated =
    Boolean(
      usuario
    );


  // ==========================================================
  // BOTÃO DE ACESSO
  // ==========================================================
  //
  // Enquanto o AuthContext restaura a sessão, não mostramos
  // nenhum estado de autenticação.
  //
  // Isso evita o efeito:
  //
  // SOLICITAR ACESSO
  //       ↓
  // ACESSO AUTORIZADO
  //
  // durante a inicialização.
  //
  // ==========================================================

  const showAccessButton =
    !loading &&
    !isAuthenticated;


  const showAuthorizedState =
    !loading &&
    isAuthenticated;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <section className="relative h-screen flex items-center justify-center overflow-hidden">


      {/* ======================================================
          BACKGROUND
          ====================================================== */}

      <div

        className="absolute inset-0 bg-cover bg-center"

        style={{
          backgroundImage:
            `url(${BG_URL})`,
        }}

        aria-hidden="true"

      />


      {/* ======================================================
          OVERLAY
          ====================================================== */}

      <div
        className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background"
        aria-hidden="true"
      />


      {/* ======================================================
          CONTEÚDO
          ====================================================== */}

      <motion.div

        initial={{
          opacity:
            0,

          y:
            40,
        }}

        animate={{
          opacity:
            1,

          y:
            0,
        }}

        transition={{
          duration:
            1.2,

          ease:
            "easeOut",
        }}

        className="relative z-10 text-center px-4"

      >


        {/* ====================================================
            LOGO
            ==================================================== */}

        <motion.img

          src={
            LOGO_URL
          }

          alt="Cartel Hub"

          className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-8 object-contain rounded-2xl"

          initial={{
            scale:
              0.5,

            opacity:
              0,
          }}

          animate={{
            scale:
              1,

            opacity:
              1,
          }}

          transition={{
            duration:
              1,

            delay:
              0.3,
          }}

        />


        {/* ====================================================
            ESPAÇAMENTO VISUAL
            ==================================================== */}

        <div
          className="mb-4"
          aria-hidden="true"
        />


        {/* ====================================================
            LINHA DECORATIVA
            ==================================================== */}

        <div
          className="w-24 h-[1px] bg-primary/40 mx-auto mb-6"
          aria-hidden="true"
        />


        {/* ====================================================
            FRASE PRINCIPAL
            ==================================================== */}

        <p className="font-heading text-sm sm:text-base tracking-[0.4em] text-muted-foreground uppercase">

          Lealdade · Respeito · Família

        </p>


        {/* ====================================================
            DESCRIÇÃO
            ==================================================== */}

        <motion.p

          className="mt-6 text-muted-foreground/70 text-sm max-w-md mx-auto font-body leading-relaxed"

          initial={{
            opacity:
              0,
          }}

          animate={{
            opacity:
              1,
          }}

          transition={{
            delay:
              0.8,
          }}

        >

          Unidos por um código. Fortalecidos pela confiança.
          Nós somos família.

        </motion.p>


        {/* ====================================================
            SOLICITAR ACESSO
            ====================================================
            
            A rota pública existente é:
            
            /register
            
            Não utilizamos /acesso.
            
            ==================================================== */}

        {showAccessButton && (

          <motion.div

            initial={{
              opacity:
                0,

              y:
                10,
            }}

            animate={{
              opacity:
                1,

              y:
                0,
            }}

            transition={{
              delay:
                1,
            }}

            className="mt-8"

          >

            <Link

              to="/register"

              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border border-primary/40 bg-primary/5 text-primary font-heading text-xs tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all duration-300"

            >

              SOLICITAR ACESSO

            </Link>

          </motion.div>

        )}


        {/* ====================================================
            USUÁRIO AUTENTICADO
            ====================================================
            
            Exibe apenas uma indicação visual.
            
            A autorização real para acessar módulos continua
            sendo controlada por:
            
            - AuthContext
            - ProtectedRoute
            - RBAC do backend
            
            ==================================================== */}

        {showAuthorizedState && (

          <motion.div

            initial={{
              opacity:
                0,
            }}

            animate={{
              opacity:
                1,
            }}

            transition={{
              delay:
                1,
            }}

            className="mt-8"

          >

            <span className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border border-primary/20 bg-primary/5 text-primary/70 font-heading text-xs tracking-[0.2em]">

              ACESSO AUTORIZADO

            </span>

          </motion.div>

        )}

      </motion.div>


      {/* ======================================================
          INDICADOR DE SCROLL
          ====================================================== */}

      <motion.div

        className="absolute bottom-8 left-1/2 -translate-x-1/2"

        animate={{
          y: [
            0,
            8,
            0,
          ],
        }}

        transition={{
          repeat:
            Infinity,

          duration:
            2,
        }}

        aria-hidden="true"

      >

        <ChevronDown
          className="w-6 h-6 text-muted-foreground/50"
        />

      </motion.div>

    </section>

  );

}