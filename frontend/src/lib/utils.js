// ============================================================
// UTILITÁRIOS GERAIS
// ============================================================
//
// Utilitários compartilhados pelo frontend.
//
// Este arquivo NÃO depende de:
// - Base44
// - API
// - autenticação
// - backend
//
// ============================================================

import {
  clsx,
} from "clsx";

import {
  twMerge,
} from "tailwind-merge";


// ============================================================
// CN
// ============================================================
//
// Combina classes CSS/Tailwind.
//
// Exemplo:
//
// cn(
//   "px-4 py-2",
//   active && "bg-primary",
//   className
// )
//
// clsx:
// remove valores falsy e monta a string.
//
// twMerge:
// resolve conflitos de classes Tailwind.
//
// Exemplo:
//
// cn("p-2", "p-4")
//
// resultado:
//
// "p-4"
//
// ============================================================

export function cn(
  ...inputs
) {

  return twMerge(
    clsx(
      inputs
    )
  );

}


// ============================================================
// IS IFRAME
// ============================================================
//
// Detecta se a aplicação está sendo executada dentro
// de um iframe.
//
// O typeof window evita erro caso o código seja analisado
// em ambiente sem DOM.
//
// ============================================================

export const isIframe =

  typeof window !==
    "undefined"

  &&

  window.self !==
    window.top;