// ============================================================
// UTILITÁRIOS DE DATA
// ============================================================
//
// Regras:
//
// - "YYYY-MM-DD" deve ser interpretado como DATA LOCAL.
// - ISO completo continua usando new Date normalmente.
// - valores inválidos retornam null.
//
// Isso evita o problema clássico:
//
// 2026-08-16
//
// ser interpretado como UTC e aparecer como:
//
// 15/08/2026
//
// em alguns fusos horários.
//
// ============================================================


// ============================================================
// PARSE LOCAL
// ============================================================

export function parseDateLocal(
  value
) {

  if (
    !value
  ) {

    return null;
  }


  // ----------------------------------------------------------
  // Já é Date
  // ----------------------------------------------------------

  if (
    value instanceof Date
  ) {

    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value;

  }


  // ----------------------------------------------------------
  // Data simples:
  //
  // YYYY-MM-DD
  //
  // ----------------------------------------------------------

  if (
    typeof value ===
      "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {

    const [
      year,
      month,
      day,
    ] =
      value
        .split("-")
        .map(Number);


    const date =
      new Date(
        year,
        month - 1,
        day
      );


    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;

  }


  // ----------------------------------------------------------
  // ISO completo ou timestamp
  // ----------------------------------------------------------

  const date =
    new Date(
      value
    );


  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;

}


// ============================================================
// FORMATO YYYY-MM-DD
// ============================================================
//
// Útil para campos:
//
// <input type="date" />
//
// ============================================================

export function toDateInputValue(
  value
) {

  const date =
    parseDateLocal(
      value
    );


  if (
    !date
  ) {

    return "";
  }


  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


// ============================================================
// FORMATO BRASILEIRO
// ============================================================
//
// Retorna:
//
// DD/MM/YYYY
//
// ============================================================

export function formatDateBR(
  value,
  fallback = ""
) {

  const date =
    parseDateLocal(
      value
    );


  if (
    !date
  ) {

    return fallback;

  }


  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(
    date
  );

}


// ============================================================
// DATA + HORA BRASILEIRA
// ============================================================

export function formatDateTimeBR(
  value,
  fallback = ""
) {

  const date =
    parseDateLocal(
      value
    );


  if (
    !date
  ) {

    return fallback;

  }


  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    date
  );

}


// ============================================================
// VALIDAÇÃO
// ============================================================

export function isValidDate(
  value
) {

  return Boolean(
    parseDateLocal(
      value
    )
  );

}