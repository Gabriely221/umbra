// ============================================================
// CADASTRO
// ============================================================
//
// Fluxo:
//
// Register.jsx
//   ↓
// services/api.js
//   ↓
// POST /api/auth/register
//   ↓
// role inicial: sem_acesso
//   ↓
// usuário aguarda aprovação
//
// ============================================================

import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  register,
} from "@/services/api";


// ============================================================
// COMPONENTE
// ============================================================

export default function Register() {

  const navigate =
    useNavigate();


  // ==========================================================
  // FORM
  // ==========================================================

  const [
    nome,
    setNome,
  ] =
    useState("");


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


  // ==========================================================
  // ESTADOS
  // ==========================================================

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


  const [
    sucesso,
    setSucesso,
  ] =
    useState("");


  // ==========================================================
  // SUBMIT
  // ==========================================================

  async function handleSubmit(
    event
  ) {

    event.preventDefault();


    setErro("");
    setSucesso("");


    // ========================================================
    // NORMALIZAÇÃO
    // ========================================================

    const normalizedName =
      nome.trim();


    const normalizedEmail =
      email
        .trim()
        .toLowerCase();


    // ========================================================
    // VALIDAÇÕES
    // ========================================================

    if (
      !normalizedName
    ) {

      setErro(
        "Informe seu nome."
      );

      return;

    }


    if (
      !normalizedEmail
    ) {

      setErro(
        "Informe seu email."
      );

      return;

    }


    if (
      !senha
    ) {

      setErro(
        "Informe sua senha."
      );

      return;

    }


    if (
      senha.length <
      6
    ) {

      setErro(
        "A senha deve possuir pelo menos 6 caracteres."
      );

      return;

    }


    // ========================================================
    // ENVIO
    // ========================================================

    setLoading(
      true
    );


    try {

      const data =
        await register({

          nome:
            normalizedName,

          email:
            normalizedEmail,

          senha,

        });


      setSucesso(

        data?.message ||

        "Cadastro realizado. Aguarde a aprovação da administração."

      );


      // ======================================================
      // LIMPA FORM
      // ======================================================

      setNome("");
      setEmail("");
      setSenha("");


      // ======================================================
      // REDIRECIONA
      // ======================================================

      window.setTimeout(
        () => {

          navigate(
            "/login",
            {
              replace:
                true,
            }
          );

        },
        1800
      );

    } catch (
      error
    ) {

      console.error(
        "[Register] erro:",
        error
      );


      setErro(

        error?.message ||

        "Não foi possível realizar o cadastro."

      );

    } finally {

      setLoading(
        false
      );

    }

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="min-h-screen flex items-center justify-center bg-background px-4">

      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8">


        {/* ====================================================
            HEADER
            ==================================================== */}

        <h1 className="font-heading text-3xl font-bold tracking-[0.15em] text-primary text-center mb-2">

          CENTRAL CARTEL

        </h1>


        <p className="text-center text-muted-foreground text-sm mb-8">

          Criar conta

        </p>


        {/* ====================================================
            FORM
            ==================================================== */}

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-4"
        >


          {/* NOME */}

          <input

            type="text"

            autoComplete="name"

            value={
              nome
            }

            onChange={(
              event
            ) =>
              setNome(
                event.target.value
              )
            }

            placeholder="Nome"

            disabled={
              loading
            }

            required

            className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary disabled:opacity-50"

          />


          {/* EMAIL */}

          <input

            type="email"

            autoComplete="email"

            value={
              email
            }

            onChange={(
              event
            ) =>
              setEmail(
                event.target.value
              )
            }

            placeholder="Email"

            disabled={
              loading
            }

            required

            className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary disabled:opacity-50"

          />


          {/* SENHA */}

          <input

            type="password"

            autoComplete="new-password"

            value={
              senha
            }

            onChange={(
              event
            ) =>
              setSenha(
                event.target.value
              )
            }

            placeholder="Senha"

            minLength={6}

            disabled={
              loading
            }

            required

            className="w-full bg-background border border-border rounded-lg px-4 py-3 outline-none focus:border-primary disabled:opacity-50"

          />


          <p className="text-[11px] text-muted-foreground">

            A senha deve possuir pelo menos 6 caracteres.

          </p>


          {/* ==================================================
              ERRO
              ================================================== */}

          {erro && (

            <div
              role="alert"
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-3"
            >

              <p className="text-red-400 text-sm">

                {erro}

              </p>

            </div>

          )}


          {/* ==================================================
              SUCESSO
              ================================================== */}

          {sucesso && (

            <div
              role="status"
              className="bg-green-500/10 border border-green-500/30 rounded-lg p-3"
            >

              <p className="text-green-400 text-sm">

                {sucesso}

              </p>

            </div>

          )}


          {/* ==================================================
              SUBMIT
              ================================================== */}

          <button

            type="submit"

            disabled={
              loading ||
              Boolean(
                sucesso
              )
            }

            className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-3 font-heading tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"

          >

            {loading
              ? "CRIANDO..."
              : sucesso
                ? "CADASTRO REALIZADO"
                : "CRIAR CONTA"
            }

          </button>

        </form>


        {/* ====================================================
            LOGIN
            ==================================================== */}

        <div className="text-center mt-6">

          <Link

            to="/login"

            className="text-sm text-muted-foreground hover:text-primary transition-colors"

          >

            Já tenho uma conta

          </Link>

        </div>

      </div>

    </div>

  );

}