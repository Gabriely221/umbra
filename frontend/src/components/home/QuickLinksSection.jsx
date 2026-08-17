// ============================================================
// NAVEGAÇÃO RÁPIDA DA HOME
// ============================================================
//
// Componente responsável por exibir atalhos para os principais
// módulos do sistema.
//
// Este componente NÃO acessa:
// - API
// - Base44
// - banco de dados
// - RBAC
//
// O controle real de acesso acontece no App.jsx através das
// rotas protegidas.
//
// ============================================================

import React from "react";


// ============================================================
// ROUTER
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
  Users,
  ScrollText,
  Image,
  ArrowRight,
} from "lucide-react";


// ============================================================
// LINKS DISPONÍVEIS
// ============================================================
//
// Cada item possui:
//
// icon
// title
// desc
// path
//
// As permissões não são verificadas aqui.
// ============================================================

const quickLinks = [

  {
    icon:
      Users,

    title:
      "MEMBROS",

    desc:
      "Conheça os membros da família e seus cargos na organização.",

    path:
      "/membros",

  },


  {
    icon:
      ScrollText,

    title:
      "REGRAS",

    desc:
      "As leis que mantêm a ordem e a disciplina dentro da família.",

    path:
      "/regras",

  },


  {
    icon:
      Image,

    title:
      "ARQUIVOS",

    desc:
      "Arquivo histórico da família.",

    path:
      "/galeria",

  },

];


// ============================================================
// COMPONENTE
// ============================================================

export default function QuickLinksSection() {

  return (

    <section className="py-20 px-4 border-t border-border">

      <div className="max-w-5xl mx-auto">


        {/* ====================================================
            TÍTULO
            ==================================================== */}

        <motion.h2

          initial={{
            opacity: 0,
          }}

          whileInView={{
            opacity: 1,
          }}

          viewport={{
            once: true,
          }}

          className="font-heading text-2xl font-bold tracking-[0.15em] text-center mb-12 text-primary"

        >

          NAVEGAÇÃO RÁPIDA

        </motion.h2>


        {/* ====================================================
            GRID
            ==================================================== */}

        <div className="grid md:grid-cols-3 gap-6">

          {quickLinks.map(
            (
              item,
              index
            ) => {

              const Icon =
                item.icon;


              return (

                <motion.div

                  key={
                    item.path
                  }

                  initial={{
                    opacity: 0,
                    y: 30,
                  }}

                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}

                  viewport={{
                    once: true,
                  }}

                  transition={{
                    delay:
                      index *
                      0.15,

                    duration:
                      0.6,
                  }}

                >

                  {/* =========================================
                      LINK
                      ========================================= */}

                  <Link

                    to={
                      item.path
                    }

                    className="group block bg-card border border-border rounded-lg p-8 hover:border-primary/30 transition-all duration-500 h-full"

                  >


                    {/* =======================================
                        ÍCONE
                        ======================================= */}

                    <Icon

                      className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-5"

                    />


                    {/* =======================================
                        TÍTULO
                        ======================================= */}

                    <h3 className="font-heading text-lg font-semibold tracking-[0.1em] text-primary mb-3">

                      {
                        item.title
                      }

                    </h3>


                    {/* =======================================
                        DESCRIÇÃO
                        ======================================= */}

                    <p className="text-sm text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">

                      {
                        item.desc
                      }

                    </p>


                    {/* =======================================
                        ACESSAR
                        ======================================= */}

                    <span className="flex items-center gap-2 text-xs font-heading tracking-[0.15em] text-muted-foreground group-hover:text-primary transition-colors">

                      ACESSAR

                      <ArrowRight

                        className="w-3 h-3 group-hover:translate-x-1 transition-transform"

                      />

                    </span>

                  </Link>

                </motion.div>

              );

            }
          )}

        </div>

      </div>

    </section>

  );

}