// ============================================================
// ENTRY POINT DO REACT
// ============================================================

import {
  StrictMode,
} from "react";

import {
  createRoot,
} from "react-dom/client";


// ============================================================
// REACT QUERY
// ============================================================

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";


// ============================================================
// APP
// ============================================================

import App
  from "./App";


// ============================================================
// TOASTER
// ============================================================

import {
  Toaster,
} from "@/components/ui/toaster";


// ============================================================
// REACT QUILL
// ============================================================
//
// O GalleryFormModal utiliza:
//
// theme="snow"
//
// Portanto precisamos carregar o stylesheet estrutural do
// tema.
//
// IMPORTANTE:
//
// Este import vem ANTES do index.css.
//
// Assim:
//
// 1. Quill carrega seus estilos base;
// 2. index.css aplica nossas customizações visuais por cima.
//
// ============================================================

import "react-quill-new/dist/quill.snow.css";


// ============================================================
// CSS GLOBAL
// ============================================================

import "./index.css";


// ============================================================
// REACT QUERY CLIENT
// ============================================================

const queryClient =
  new QueryClient({

    defaultOptions: {

      queries: {

        // ----------------------------------------------------
        // Dados permanecem frescos por 30 segundos.
        // ----------------------------------------------------

        staleTime:
          30 * 1000,


        // ----------------------------------------------------
        // Evita refetch automático sempre que a janela volta
        // a receber foco.
        // ----------------------------------------------------

        refetchOnWindowFocus:
          false,


        // ----------------------------------------------------
        // Uma nova tentativa em caso de falha de rede/API.
        //
        // Não queremos múltiplas tentativas automáticas em
        // erros de autorização.
        // ----------------------------------------------------

        retry:
          1,

      },

      mutations: {

        retry:
          0,

      },

    },

  });


// ============================================================
// ROOT
// ============================================================

const rootElement =
  document.getElementById(
    "root"
  );


if (
  !rootElement
) {

  throw new Error(
    'Elemento "#root" não encontrado no index.html.'
  );

}


// ============================================================
// RENDER
// ============================================================

createRoot(
  rootElement
).render(

  <StrictMode>

    <QueryClientProvider
      client={
        queryClient
      }
    >

      <App />


      {/* ======================================================
          TOASTS GLOBAIS
          ====================================================== */}

      <Toaster />

    </QueryClientProvider>

  </StrictMode>

);