// ============================================================
// CARD DE MEMBRO
// ============================================================
//
// Este componente é exclusivamente visual.
//
// Ele NÃO acessa:
// - Base44
// - API
// - RBAC
// - banco de dados
//
// As permissões são tratadas pela página Membros.jsx.
//
// A página decide se deve enviar:
//
// onEdit={função}
//
// ou:
//
// onEdit={null}
//
// Quando onEdit existe, o botão de edição aparece.
// ============================================================

import React from "react";


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
  User,
  Calendar,
  Pencil,
} from "lucide-react";


// ============================================================
// COMPONENTES UI
// ============================================================

import {
  Badge,
} from "@/components/ui/badge";


// ============================================================
// DATE-FNS
// ============================================================

import {
  format,
} from "date-fns";


// ============================================================
// COMPONENTE
// ============================================================

export default function MemberCard({
  member,
  index = 0,
  onEdit,
}) {

  // ==========================================================
  // DATA DE ENTRADA
  // ==========================================================
  //
  // Mantemos compatibilidade com possíveis nomes antigos:
  //
  // join_date
  // joinDate
  //
  // O backend pode futuramente padronizar para joinDate.
  // ==========================================================

  const joinDate =
    member?.join_date ||
    member?.joinDate ||
    null;


  // ==========================================================
  // STATUS VISUAL
  // ==========================================================
  //
  // Status NÃO determina permissão.
  // É apenas uma representação visual do estado do membro.
  // ==========================================================

  const isActive =
    member?.status ===
    "Ativo";


  const isAway =
    member?.status ===
    "Afastado";


  const statusColor =
    isActive

      ? "bg-green-500"

      : isAway
      ? "bg-yellow-500"

      : "bg-zinc-500";


  const statusLabel =
    isActive

      ? "Online"

      : isAway
      ? "Afastado"
      : "Offline";


  // ==========================================================
  // DATA FORMATADA
  // ==========================================================

  let formattedJoinDate =
    null;


  if (joinDate) {

    const parsedDate =
      new Date(
        joinDate
      );


    // Evita mostrar "Invalid Date".
    if (
      !Number.isNaN(
        parsedDate.getTime()
      )
    ) {

      formattedJoinDate =
        format(
          parsedDate,
          "dd/MM/yyyy"
        );
    }
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 30,
      }}

      animate={{
        opacity: 1,
        y: 0,
      }}

      transition={{
        delay:
          index *
          0.08,

        duration:
          0.5,
      }}

      className="bg-card border border-border rounded-lg overflow-hidden group hover:border-primary/20 transition-all duration-500"

    >

      <div className="p-6 relative">


        {/* ====================================================
            BOTÃO EDITAR
            ====================================================
            
            A própria página decide se este botão pode existir.
            ==================================================== */}

        {onEdit && (

          <button

            type="button"

            onClick={() =>
              onEdit(
                member
              )
            }

            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"

            title="Editar membro"

          >

            <Pencil
              className="w-4 h-4"
            />

          </button>

        )}


        {/* ====================================================
            CONTEÚDO PRINCIPAL
            ==================================================== */}

        <div className="flex items-start gap-4">


          {/* ==================================================
              AVATAR
              ================================================== */}

          <div className="relative flex-shrink-0">

            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center border border-border overflow-hidden">

              {member?.avatar_url ? (

                <img

                  src={
                    member.avatar_url
                  }

                  alt={
                    member?.name ||
                    "Membro"
                  }

                  className="w-full h-full object-cover"

                  loading="lazy"

                />

              ) : (

                <User
                  className="w-6 h-6 text-muted-foreground"
                />

              )}

            </div>


            {/* =================================================
                INDICADOR DE STATUS
                ================================================= */}

            <div

              className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-card ${statusColor}`}

              title={
                statusLabel
              }

            />

          </div>


          {/* ==================================================
              DADOS DO MEMBRO
              ================================================== */}

          <div className="flex-1 min-w-0">


            {/* =================================================
                NOME
                ================================================= */}

            <div className="flex items-center gap-2 mb-1">

              <h3 className="font-heading text-base font-semibold tracking-wide text-primary truncate">

                {
                  member?.name ||
                  "Sem nome"
                }

              </h3>

            </div>


            {/* =================================================
                CODINOME
                ================================================= */}

            {member?.codename && (

              <p className="text-xs text-muted-foreground font-heading tracking-wider mb-1">

                "{member.codename}"

              </p>

            )}


            {/* =================================================
                CARGO
                ================================================= */}

            <Badge className="text-[10px] font-heading tracking-[0.1em] bg-secondary text-secondary-foreground">

              {
                member?.role ||
                "—"
              }

            </Badge>


            {/* =================================================
                BIO
                ================================================= */}

            <p className="text-xs text-muted-foreground/70 font-body mt-2 line-clamp-2">

              {
                member?.bio?.trim()
                  ? member.bio
                  : "Sem descrição"
              }

            </p>


            {/* =================================================
                DATA DE ENTRADA
                ================================================= */}

            {formattedJoinDate && (

              <div className="flex items-center gap-1.5 mt-3 text-muted-foreground/60">

                <Calendar
                  className="w-3 h-3"
                />

                <span className="text-[10px] font-heading tracking-wider">

                  {
                    formattedJoinDate
                  }

                </span>

              </div>

            )}

          </div>

        </div>

      </div>

    </motion.div>
  );
}