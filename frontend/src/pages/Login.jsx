// ============================================================
// LOGIN
// ============================================================

import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";


export default function Login() {

  const navigate =
    useNavigate();


  const {
    login,
  } =
    useAuth();


  const [
    email,
    setEmail,
  ] =
    useState("");


  const [
    senha,
    setSenha,
  ] =
    useState("");


  const [
    erro,
    setErro,
  ] =
    useState("");


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  // ==========================================================
  // SUBMIT
  // ==========================================================

  async function handleSubmit(
    event
  ) {

    event.preventDefault();

    setErro("");
    setLoading(
      true
    );


    try {

      const data =
        await login(
          email,
          senha
        );


      // Usuário cadastrado, mas sem acesso.
      if (
        !data.usuario.permissoes.includes(
          "acessar_sistema"
        )
      ) {

        navigate(
          "/aguardando",
          {
            replace:
              true,
          }
        );

        return;
      }


      // Usuário autorizado.
      navigate(
        "/",
        {
          replace:
            true,
        }
      );


    } catch (
      error
    ) {

      setErro(
        error.message
      );

    } finally {

      setLoading(
        false
      );
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">

      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8">


        <h1 className="font-heading text-3xl font-bold tracking-[0.15em] text-primary text-center mb-2">
          CENTRAL CARTEL
        </h1>


        <p className="text-center text-muted-foreground text-sm mb-8">
          Acesso ao sistema
        </p>


        <form
          onSubmit={
            handleSubmit
          }

          className="space-y-4"
        >

          <input
            type="email"

            value={
              email
            }

            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }

            placeholder="Email"

            className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary"
          />


          <input
            type="password"

            value={
              senha
            }

            onChange={(event) =>
              setSenha(
                event.target.value
              )
            }

            placeholder="Senha"

            className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary"
          />


          {erro && (

            <p className="text-red-400 text-sm">
              {
                erro
              }
            </p>

          )}


          <button
            type="submit"

            disabled={
              loading
            }

            className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-3 font-heading tracking-wider disabled:opacity-50"
          >

            {loading
              ? "ENTRANDO..."
              : "ENTRAR"}

          </button>

        </form>


        <div className="text-center mt-6">

          <Link
            to="/register"

            className="text-sm text-muted-foreground hover:text-primary"
          >
            Criar conta
          </Link>

        </div>

      </div>

    </div>
  );
}