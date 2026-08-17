// ============================================================
// AGUARDANDO APROVAÇÃO
// ============================================================

import {
  useAuth,
} from "../context/AuthContext";


export default function Aguardando() {

  const {
    usuario,
    logout,
  } =
    useAuth();


  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">

      <div className="max-w-md text-center">

        <h1 className="font-heading text-3xl font-bold text-primary mb-4">
          CENTRAL CARTEL
        </h1>


        <h2 className="font-heading text-xl mb-4">
          AGUARDANDO APROVAÇÃO
        </h2>


        <p className="text-muted-foreground text-sm leading-relaxed mb-3">
          Olá, {usuario?.nome}.
        </p>


        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          Sua conta foi criada, mas a administração ainda não liberou seu acesso ao sistema.
        </p>


        <p className="text-muted-foreground text-sm mb-6">

          Cargo atual:

          {" "}

          <strong className="text-primary">
            {
              usuario?.role?.nome
            }
          </strong>

        </p>


        <button
          onClick={
            logout
          }

          className="border border-border rounded-lg px-5 py-2 text-sm hover:border-primary hover:text-primary"
        >
          SAIR
        </button>

      </div>

    </div>
  );
}