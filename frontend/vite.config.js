// ============================================================
// VITE CONFIG
// ============================================================
//
// Configuração do frontend React.
//
// Alias:
//
// @ → frontend/src
//
// Exemplo:
//
// import Button from "@/components/ui/button";
//
// equivale a:
//
// import Button from "./src/components/ui/button";
//
// ============================================================

import {
  defineConfig,
} from "vite";

import react
  from "@vitejs/plugin-react";

import path
  from "node:path";

import {
  fileURLToPath,
} from "node:url";


// ============================================================
// __dirname PARA ES MODULES
// ============================================================

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );


// ============================================================
// CONFIG
// ============================================================

export default defineConfig({

  plugins: [
    react(),
  ],

  resolve: {

    alias: {

      "@":
        path.resolve(
          __dirname,
          "./src"
        ),

    },

  },

});