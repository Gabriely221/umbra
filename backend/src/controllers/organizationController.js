// ============================================================
// CONTROLLER - RELAÇÕES EXTERNAS
// ============================================================
//
// Responsável por:
//
// ORGANIZAÇÕES
// - listar
// - buscar
// - criar
// - atualizar
// - excluir
//
// HISTÓRICO NARRATIVO
// - listar
// - criar
// - atualizar
// - excluir
//
// NEGOCIAÇÕES
// - listar
// - criar
// - atualizar
// - excluir
//
// AUDITORIA
// - registrar alterações de organizações
//
// ============================================================
//
// AUTORIZAÇÃO:
//
// visualizar_relacoes
// → somente organizações ativas
// → respeita Organization.allowedCargos
//
// gerenciar_relacoes
// → vê organizações ativas e inativas
// → ignora allowedCargos para administração
//
// ============================================================
//
// PADRÃO CANÔNICO:
//
// Organization.allowedCargos = Role.slug[]
//
// Exemplo:
//
// [
//   "membro",
//   "lideranca"
// ]
//
// [] = sem restrição adicional por cargo.
//
// ============================================================


// ============================================================
// MODELS
// ============================================================

const {
  Organization,
  OrganizationNegotiation,
  OrganizationHistory,
  OrganizationAuditLog,
  Role,
  Usuario,
} = require("../models");


const {
  Op,
} = require("sequelize");


// ============================================================
// CONSTANTES
// ============================================================

const ORGANIZATION_STATUSES = [
  "Aliada",
  "Parceira",
  "Neutra",
  "Em observação",
  "Hostil",
  "Inimiga",
];


const NEGOTIATION_STATUSES = [
  "Pendente",
  "Em andamento",
  "Concluída",
  "Cancelada",
];


// ============================================================
// NEGOCIAÇÕES ABERTAS
// ============================================================
//
// Uma organização é considerada "Em negociação" quando possui
// pelo menos uma negociação em um destes estados.
//
// Concluída e Cancelada não contam como abertas.
//
// ============================================================

const OPEN_NEGOTIATION_STATUSES = [
  "Pendente",
  "Em andamento",
];


// ============================================================
// HELPERS GERAIS
// ============================================================


// ------------------------------------------------------------
// ERRO HTTP
// ------------------------------------------------------------

function httpError(
  status,
  message,
  data = {}
) {
  const error =
    new Error(message);

  error.status =
    status;

  error.data =
    data;

  return error;
}


// ------------------------------------------------------------
// ID
// ------------------------------------------------------------

function normalizeId(
  value
) {
  const id =
    Number(value);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  return id;
}


// ------------------------------------------------------------
// TEXTO
// ------------------------------------------------------------

function normalizeText(
  value
) {
  return String(
    value ?? ""
  ).trim();
}


// ------------------------------------------------------------
// TEXTO OPCIONAL
// ------------------------------------------------------------

function normalizeOptionalText(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text =
    String(value).trim();

  return text || null;
}


// ------------------------------------------------------------
// BOOLEAN
// ------------------------------------------------------------
//
// Evita o problema:
//
// Boolean("false") === true
//
// ------------------------------------------------------------

function normalizeBoolean(
  value
) {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value === "number"
  ) {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }
  }

  if (
    typeof value === "string"
  ) {
    const normalized =
      value
        .trim()
        .toLowerCase();

    if (
      [
        "true",
        "1",
        "yes",
        "sim",
      ].includes(normalized)
    ) {
      return true;
    }

    if (
      [
        "false",
        "0",
        "no",
        "não",
        "nao",
      ].includes(normalized)
    ) {
      return false;
    }
  }

  throw httpError(
    400,
    "Valor booleano inválido."
  );
}


// ------------------------------------------------------------
// INTEIRO
// ------------------------------------------------------------

function normalizeInteger(
  value,
  {
    fieldName,
    allowNull = false,
    min = null,
    max = null,
  } = {}
) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    if (allowNull) {
      return null;
    }

    throw httpError(
      400,
      `${fieldName || "Valor"} inválido.`
    );
  }

  const number =
    Number(value);

  if (
    !Number.isInteger(number)
  ) {
    throw httpError(
      400,
      `${fieldName || "Valor"} deve ser um número inteiro.`
    );
  }

  if (
    min !== null &&
    number < min
  ) {
    throw httpError(
      400,
      `${fieldName || "Valor"} não pode ser menor que ${min}.`
    );
  }

  if (
    max !== null &&
    number > max
  ) {
    throw httpError(
      400,
      `${fieldName || "Valor"} não pode ser maior que ${max}.`
    );
  }

  return number;
}


// ------------------------------------------------------------
// DATA
// ------------------------------------------------------------

function normalizeDate(
  value,
  fieldName = "Data"
) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text =
    String(value).trim();

  const date =
    new Date(text);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw httpError(
      400,
      `${fieldName} inválida.`
    );
  }

  return text;
}


// ------------------------------------------------------------
// JSON ARRAY
// ------------------------------------------------------------

function normalizeJsonArray(
  value
) {
  if (
    Array.isArray(value)
  ) {
    return value;
  }

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return [];
  }

  if (
    typeof value === "string"
  ) {
    try {
      const parsed =
        JSON.parse(value);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  }

  return [];
}


// ------------------------------------------------------------
// ARRAY DE STRINGS
// ------------------------------------------------------------

function normalizeStringArray(
  value
) {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return [
    ...new Set(
      value
        .map(
          (item) =>
            String(
              item ?? ""
            ).trim()
        )
        .filter(Boolean)
    ),
  ];
}


// ============================================================
// KEY PEOPLE
// ============================================================

function normalizeKeyPeople(
  value
) {
  const entries =
    normalizeJsonArray(value);

  return entries
    .map(
      (item) => {
        if (
          !item ||
          typeof item !== "object" ||
          Array.isArray(item)
        ) {
          return null;
        }

        const name =
          normalizeOptionalText(
            item.name
          );

        const role =
          normalizeOptionalText(
            item.role
          );

        if (
          !name &&
          !role
        ) {
          return null;
        }

        return {
          name,
          role,
        };
      }
    )
    .filter(Boolean);
}


// ============================================================
// AVALIAÇÃO
// ============================================================

function normalizeEvaluation(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return {};
  }

  if (
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  if (
    typeof value === "string"
  ) {
    try {
      const parsed =
        JSON.parse(value);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return parsed;
      }
    } catch {
      // Continua para o erro abaixo.
    }
  }

  throw httpError(
    400,
    "A avaliação informada é inválida."
  );
}


// ============================================================
// AUDITORIA - JSON
// ============================================================

function safeJsonStringify(
  value
) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}


// ============================================================
// COMPARAÇÃO
// ============================================================

function valuesAreEqual(
  oldValue,
  newValue
) {
  return (
    JSON.stringify(oldValue) ===
    JSON.stringify(newValue)
  );
}


// ============================================================
// USUÁRIO AUTENTICADO
// ============================================================

function getUsuarioId(
  req
) {
  return (
    req.usuario?.id ||
    req.user?.id ||
    null
  );
}


// ============================================================
// ROLE DO USUÁRIO
// ============================================================

function getUserRole(
  req
) {
  return (
    req.usuario?.Role ||
    req.usuario?.role ||
    req.user?.Role ||
    req.user?.role ||
    null
  );
}


// ============================================================
// PERMISSÕES DO USUÁRIO
// ============================================================

function getUserPermissions(
  req
) {
  const role =
    getUserRole(req);

  const permissions =
    role?.Permissions ||
    role?.permissions ||
    [];

  return Array.isArray(
    permissions
  )
    ? permissions
    : [];
}


// ============================================================
// POSSUI PERMISSÃO
// ============================================================

function hasPermission(
  req,
  slug
) {
  return getUserPermissions(req)
    .some(
      (permission) => {
        if (
          typeof permission ===
          "string"
        ) {
          return (
            permission === slug
          );
        }

        return (
          permission?.slug === slug
        );
      }
    );
}


// ============================================================
// RESOLVE CARGOS PERMITIDOS
// ============================================================
//
// Entrada aceita:
//
// [
//   "lideranca"
// ]
//
// Também aceita temporariamente formato legado:
//
// [
//   "Liderança"
// ]
//
// Persistência:
//
// [
//   "lideranca"
// ]
//
// ============================================================

async function resolveAllowedCargos(
  values
) {
  if (
    !Array.isArray(values)
  ) {
    throw httpError(
      400,
      "Cargos permitidos deve ser uma lista."
    );
  }

  const normalized =
    normalizeStringArray(values);

  if (
    normalized.length === 0
  ) {
    return [];
  }

  const roles =
    await Role.findAll({
      attributes: [
        "id",
        "nome",
        "slug",
      ],
    });

  const resolved =
    [];

  const invalid =
    [];

  for (
    const value
    of normalized
  ) {
    const comparison =
      value
        .trim()
        .toLocaleLowerCase(
          "pt-BR"
        );

    const role =
      roles.find(
        (item) => {
          const slug =
            String(
              item.slug ?? ""
            )
              .trim()
              .toLocaleLowerCase(
                "pt-BR"
              );

          const nome =
            String(
              item.nome ?? ""
            )
              .trim()
              .toLocaleLowerCase(
                "pt-BR"
              );

          return (
            comparison === slug ||
            comparison === nome
          );
        }
      );

    if (
      !role ||
      role.slug === "sem_acesso"
    ) {
      invalid.push(value);
      continue;
    }

    resolved.push(
      role.slug
    );
  }

  if (
    invalid.length > 0
  ) {
    throw httpError(
      400,
      "Um ou mais cargos informados são inválidos.",
      {
        invalidRoles:
          invalid,
      }
    );
  }

  return [
    ...new Set(resolved),
  ];
}


// ============================================================
// MATCH DE CARGO
// ============================================================
//
// Reconhece:
//
// - Role.slug
// - Role.nome legado
//
// ============================================================

function matchesCargoRestriction(
  organization,
  role
) {
  const allowedCargos =
    normalizeStringArray(
      organization.allowedCargos
    );

  if (
    allowedCargos.length === 0
  ) {
    return true;
  }

  if (!role) {
    return false;
  }

  const roleSlug =
    normalizeText(
      role.slug
    ).toLocaleLowerCase(
      "pt-BR"
    );

  const roleName =
    normalizeText(
      role.nome
    ).toLocaleLowerCase(
      "pt-BR"
    );

  return allowedCargos.some(
    (allowed) => {
      const normalized =
        allowed.toLocaleLowerCase(
          "pt-BR"
        );

      return (
        normalized === roleSlug ||
        normalized === roleName
      );
    }
  );
}


// ============================================================
// ACESSO À ORGANIZAÇÃO
// ============================================================
//
// gerenciar_relacoes:
// → acessa qualquer organização.
//
// visualizar_relacoes:
// → somente ativa.
// → respeita allowedCargos.
//
// ============================================================

function canAccessOrganization(
  req,
  organization
) {
  if (!organization) {
    return false;
  }

  if (
    hasPermission(
      req,
      "gerenciar_relacoes"
    )
  ) {
    return true;
  }

  if (
    organization.isActive === false
  ) {
    return false;
  }

  return matchesCargoRestriction(
    organization,
    getUserRole(req)
  );
}


// ============================================================
// SERIALIZA ORGANIZAÇÃO
// ============================================================

function serializeOrganization(
  organization
) {
  if (!organization) {
    return null;
  }

  const data =
    typeof organization.toJSON ===
    "function"
      ? organization.toJSON()
      : organization;

  const allowedCargos =
    normalizeStringArray(
      data.allowedCargos
    );

  const keyPeople =
    Array.isArray(
      data.keyPeople
    )
      ? data.keyPeople
      : [];

  return {
    ...data,

    // --------------------------------------------------------
    // snake_case
    // --------------------------------------------------------

    sub_leader:
      data.subLeader ??
      null,

    member_count:
      data.memberCount ??
      null,

    custom_specialty:
      data.customSpecialty ??
      null,

    trust_level:
      data.trustLevel ??
      50,

    is_active:
      data.isActive ??
      true,

    allowed_cargos:
      allowedCargos,

    key_people:
      keyPeople,

    // --------------------------------------------------------
    // camelCase
    // --------------------------------------------------------

    subLeader:
      data.subLeader ??
      null,

    memberCount:
      data.memberCount ??
      null,

    customSpecialty:
      data.customSpecialty ??
      null,

    trustLevel:
      data.trustLevel ??
      50,

    isActive:
      data.isActive ??
      true,

    allowedCargos,

    keyPeople,
  };
}


// ============================================================
// SERIALIZA USUÁRIO RESPONSÁVEL
// ============================================================

function serializeResponsibleUser(
  user
) {
  if (!user) {
    return null;
  }

  const data =
    typeof user.toJSON ===
    "function"
      ? user.toJSON()
      : user;

  return {
    id:
      data.id,

    nome:
      data.nome ??
      data.name ??
      null,

    email:
      data.email ??
      null,
  };
}


// ============================================================
// SERIALIZA NEGOCIAÇÃO
// ============================================================

function serializeNegotiation(
  negotiation
) {
  if (!negotiation) {
    return null;
  }

  const data =
    typeof negotiation.toJSON ===
    "function"
      ? negotiation.toJSON()
      : negotiation;

  const responsibleUser =
    data.responsibleUser ??
    data.ResponsibleUser ??
    null;

  return {
    ...data,

    responsibleUserId:
      data.responsibleUserId ??
      null,

    responsible_user_id:
      data.responsibleUserId ??
      null,

    dueDate:
      data.dueDate ??
      null,

    due_date:
      data.dueDate ??
      null,

    responsibleUser:
      serializeResponsibleUser(
        responsibleUser
      ),

    responsible_user:
      serializeResponsibleUser(
        responsibleUser
      ),
  };
}


// ============================================================
// INCLUDE DO RESPONSÁVEL
// ============================================================
//
// Exige em models/index.js:
//
// OrganizationNegotiation.belongsTo(
//   Usuario,
//   {
//     foreignKey: "responsibleUserId",
//     as: "responsibleUser",
//   }
// );
//
// ============================================================

function getResponsibleUserInclude() {
  return {
    model:
      Usuario,

    as:
      "responsibleUser",

    attributes: [
      "id",
      "nome",
      "email",
    ],

    required:
      false,
  };
}


// ============================================================
// BUSCA NEGOCIAÇÃO COM RESPONSÁVEL
// ============================================================

async function findNegotiationWithResponsible(
  negotiationId
) {
  return OrganizationNegotiation.findByPk(
    negotiationId,
    {
      include: [
        getResponsibleUserInclude(),
      ],
    }
  );
}


// ============================================================
// VALIDA RESPONSÁVEL
// ============================================================

async function validateResponsibleUserId(
  value,
  {
    allowExistingId = null,
  } = {}
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const id =
    normalizeId(value);

  if (!id) {
    throw httpError(
      400,
      "Usuário responsável inválido."
    );
  }

  const user =
    await Usuario.findByPk(
      id,
      {
        attributes: [
          "id",
          "ativo",
        ],

        include: [
          {
            model:
              Role,

            attributes: [
              "id",
              "slug",
            ],

            required:
              false,
          },
        ],
      }
    );

  if (!user) {
    throw httpError(
      400,
      "O usuário responsável informado não existe."
    );
  }

  const existingId =
    normalizeId(
      allowExistingId
    );

  // ----------------------------------------------------------
  // Preserva atribuições históricas.
  //
  // Se uma negociação já estiver atribuída a um usuário que
  // posteriormente foi desativado ou movido para "sem_acesso",
  // editar outro campo da negociação não deve ser bloqueado.
  //
  // Porém esse usuário não poderá ser escolhido em uma nova
  // atribuição.
  // ----------------------------------------------------------

  if (
    existingId &&
    id === existingId
  ) {
    return id;
  }

  const role =
    user.Role ||
    user.role ||
    null;

  if (
    user.ativo !== true ||
    !role ||
    role.slug === "sem_acesso"
  ) {
    throw httpError(
      400,
      "O usuário responsável informado não está disponível para atribuição."
    );
  }

  return id;
}


// ============================================================
// NORMALIZA ORGANIZAÇÃO
// ============================================================

async function normalizeOrganizationPayload(
  body = {}
) {
  const payload = {};


  // ==========================================================
  // NOME
  // ==========================================================

  if (
    body.name !== undefined
  ) {
    const name =
      normalizeText(
        body.name
      );

    if (!name) {
      throw httpError(
        400,
        "O nome da organização é obrigatório."
      );
    }

    if (
      name.length > 200
    ) {
      throw httpError(
        400,
        "O nome da organização deve possuir no máximo 200 caracteres."
      );
    }

    payload.name =
      name;
  }


  // ==========================================================
  // LÍDER
  // ==========================================================

  if (
    body.leader !== undefined
  ) {
    payload.leader =
      normalizeOptionalText(
        body.leader
      );
  }


  // ==========================================================
  // SUB-LÍDER
  // ==========================================================

  if (
    body.sub_leader !== undefined ||
    body.subLeader !== undefined
  ) {
    payload.subLeader =
      normalizeOptionalText(
        body.sub_leader ??
        body.subLeader
      );
  }


  // ==========================================================
  // CIDADE
  // ==========================================================

  if (
    body.city !== undefined
  ) {
    payload.city =
      normalizeOptionalText(
        body.city
      );
  }


  // ==========================================================
  // QUANTIDADE DE MEMBROS
  // ==========================================================

  if (
    body.member_count !== undefined ||
    body.memberCount !== undefined
  ) {
    payload.memberCount =
      normalizeInteger(
        body.member_count ??
        body.memberCount,
        {
          fieldName:
            "Quantidade de membros",

          allowNull:
            true,

          min:
            0,
        }
      );
  }


  // ==========================================================
  // STATUS
  // ==========================================================

  if (
    body.status !== undefined
  ) {
    const status =
      normalizeText(
        body.status
      );

    if (
      !ORGANIZATION_STATUSES.includes(
        status
      )
    ) {
      throw httpError(
        400,
        "Status da organização inválido."
      );
    }

    payload.status =
      status;
  }


  // ==========================================================
  // ESPECIALIDADE
  // ==========================================================

  if (
    body.specialty !== undefined
  ) {
    payload.specialty =
      normalizeOptionalText(
        body.specialty
      );
  }


  if (
    body.custom_specialty !== undefined ||
    body.customSpecialty !== undefined
  ) {
    payload.customSpecialty =
      normalizeOptionalText(
        body.custom_specialty ??
        body.customSpecialty
      );
  }


  // ==========================================================
  // DESCRIÇÃO
  // ==========================================================

  if (
    body.description !== undefined
  ) {
    payload.description =
      normalizeOptionalText(
        body.description
      );
  }


  // ==========================================================
  // NÍVEL DE CONFIANÇA
  // ==========================================================

  if (
    body.trust_level !== undefined ||
    body.trustLevel !== undefined
  ) {
    payload.trustLevel =
      normalizeInteger(
        body.trust_level ??
        body.trustLevel,
        {
          fieldName:
            "Nível de confiança",

          min:
            0,

          max:
            100,
        }
      );
  }


  // ==========================================================
  // ATIVO
  // ==========================================================

  if (
    body.is_active !== undefined ||
    body.isActive !== undefined
  ) {
    payload.isActive =
      normalizeBoolean(
        body.is_active ??
        body.isActive
      );
  }


  // ==========================================================
  // CARGOS PERMITIDOS
  // ==========================================================

  if (
    body.allowed_cargos !== undefined ||
    body.allowedCargos !== undefined
  ) {
    payload.allowedCargos =
      await resolveAllowedCargos(
        body.allowed_cargos ??
        body.allowedCargos
      );
  }


  // ==========================================================
  // OBSERVAÇÕES
  // ==========================================================

  if (
    body.observations !== undefined
  ) {
    payload.observations =
      normalizeOptionalText(
        body.observations
      );
  }


  // ==========================================================
  // OBJETIVOS
  // ==========================================================

  if (
    body.objectives !== undefined
  ) {
    payload.objectives =
      normalizeOptionalText(
        body.objectives
      );
  }


  // ==========================================================
  // OPORTUNIDADES
  // ==========================================================

  if (
    body.opportunities !== undefined
  ) {
    payload.opportunities =
      normalizeOptionalText(
        body.opportunities
      );
  }


  // ==========================================================
  // ALERTAS
  // ==========================================================

  if (
    body.alerts !== undefined
  ) {
    payload.alerts =
      normalizeOptionalText(
        body.alerts
      );
  }


  // ==========================================================
  // PESSOAS IMPORTANTES
  // ==========================================================

  if (
    body.key_people !== undefined ||
    body.keyPeople !== undefined
  ) {
    payload.keyPeople =
      normalizeKeyPeople(
        body.key_people ??
        body.keyPeople
      );
  }


  // ==========================================================
  // ORDEM
  // ==========================================================

  if (
    body.order !== undefined
  ) {
    payload.order =
      normalizeInteger(
        body.order,
        {
          fieldName:
            "Ordem",
        }
      );
  }


  // ==========================================================
  // AVALIAÇÃO
  // ==========================================================

  if (
    body.evaluation !== undefined
  ) {
    payload.evaluation =
      normalizeEvaluation(
        body.evaluation
      );
  }


  return payload;
}


// ============================================================
// NORMALIZA HISTÓRICO
// ============================================================

function normalizeHistoryPayload(
  body = {}
) {
  const payload = {};


  // ==========================================================
  // TÍTULO
  // ==========================================================

  if (
    body.title !== undefined
  ) {
    const title =
      normalizeText(
        body.title
      );

    if (!title) {
      throw httpError(
        400,
        "O título do histórico é obrigatório."
      );
    }

    payload.title =
      title;
  }


  // ==========================================================
  // DESCRIÇÃO
  // ==========================================================

  if (
    body.description !== undefined
  ) {
    payload.description =
      normalizeOptionalText(
        body.description
      );
  }


  // ==========================================================
  // DATA
  // ==========================================================

  if (
    body.date !== undefined ||
    body.eventDate !== undefined ||
    body.event_date !== undefined
  ) {
    payload.date =
      normalizeDate(
        body.date ??
        body.eventDate ??
        body.event_date,
        "Data do histórico"
      );

    if (!payload.date) {
      throw httpError(
        400,
        "A data do histórico é obrigatória."
      );
    }
  }


  // ==========================================================
  // RESPONSÁVEL
  // ==========================================================

  if (
    body.responsible !== undefined ||
    body.responsibleName !== undefined
  ) {
    payload.responsible =
      normalizeOptionalText(
        body.responsible ??
        body.responsibleName
      );
  }


  return payload;
}


// ============================================================
// NORMALIZA NEGOCIAÇÃO
// ============================================================

async function normalizeNegotiationPayload(
  body = {},
  {
    currentResponsibleUserId = null,
  } = {}
) {
  const payload = {};


  // ==========================================================
  // TÍTULO
  // ==========================================================

  if (
    body.title !== undefined
  ) {
    const title =
      normalizeText(
        body.title
      );

    if (!title) {
      throw httpError(
        400,
        "O título da negociação é obrigatório."
      );
    }

    if (
      title.length > 200
    ) {
      throw httpError(
        400,
        "O título da negociação deve possuir no máximo 200 caracteres."
      );
    }

    payload.title =
      title;
  }


  // ==========================================================
  // DESCRIÇÃO
  // ==========================================================

  if (
    body.description !== undefined
  ) {
    payload.description =
      normalizeOptionalText(
        body.description
      );
  }


  // ==========================================================
  // STATUS
  // ==========================================================

  if (
    body.status !== undefined
  ) {
    const status =
      normalizeText(
        body.status
      );

    if (
      !NEGOTIATION_STATUSES.includes(
        status
      )
    ) {
      throw httpError(
        400,
        "Status da negociação inválido.",
        {
          allowedStatuses:
            NEGOTIATION_STATUSES,
        }
      );
    }

    payload.status =
      status;
  }


  // ==========================================================
  // USUÁRIO RESPONSÁVEL
  // ==========================================================

  if (
    body.responsible_user_id !== undefined ||
    body.responsibleUserId !== undefined
  ) {
    payload.responsibleUserId =
      await validateResponsibleUserId(
        body.responsible_user_id ??
        body.responsibleUserId,
        {
          allowExistingId:
            currentResponsibleUserId,
        }
      );
  }


  // ==========================================================
  // PRAZO
  // ==========================================================

  if (
    body.due_date !== undefined ||
    body.dueDate !== undefined
  ) {
    payload.dueDate =
      normalizeDate(
        body.due_date ??
        body.dueDate,
        "Data limite da negociação"
      );
  }


  return payload;
}


// ============================================================
// AUDITORIA
// ============================================================


// ------------------------------------------------------------
// REGISTRA AUDITORIA
// ------------------------------------------------------------

async function registrarAuditoria({
  organizationId,
  usuarioId,
  action,
  field = null,
  oldValue = null,
  newValue = null,
}) {
  try {
    await OrganizationAuditLog.create({
      organizationId,
      usuarioId,
      action,
      field,

      oldValue:
        safeJsonStringify(
          oldValue
        ),

      newValue:
        safeJsonStringify(
          newValue
        ),
    });
  } catch (error) {
    // --------------------------------------------------------
    // A auditoria não deve impedir a operação principal.
    // --------------------------------------------------------

    console.error(
      "[OrganizationAuditLog] erro ao registrar auditoria:",
      error
    );
  }
}


// ------------------------------------------------------------
// AUDITA ALTERAÇÕES
// ------------------------------------------------------------

async function auditarAlteracoes({
  organizationId,
  usuarioId,
  oldValues,
  newValues,
}) {
  for (
    const field
    of Object.keys(newValues)
  ) {
    const oldValue =
      oldValues[field];

    const newValue =
      newValues[field];

    if (
      valuesAreEqual(
        oldValue,
        newValue
      )
    ) {
      continue;
    }

    await registrarAuditoria({
      organizationId,
      usuarioId,

      action:
        "update",

      field,
      oldValue,
      newValue,
    });
  }
}


// ============================================================
// CARREGA ORGANIZAÇÃO ACESSÍVEL
// ============================================================
//
// Se não existir ou se o usuário não puder acessar,
// devolvemos 404.
//
// Isso evita revelar que uma organização restrita existe.
//
// ============================================================

async function getAccessibleOrganization(
  req,
  organizationId,
  options = {}
) {
  const id =
    normalizeId(
      organizationId
    );

  if (!id) {
    throw httpError(
      400,
      "ID da organização inválido."
    );
  }

  const organization =
    await Organization.findByPk(
      id,
      options
    );

  if (
    !organization ||
    !canAccessOrganization(
      req,
      organization
    )
  ) {
    throw httpError(
      404,
      "Organização não encontrada."
    );
  }

  return organization;
}


// ============================================================
// ORGANIZAÇÕES
// ============================================================


// ------------------------------------------------------------
// LISTAR
// ------------------------------------------------------------
//
// GET /api/organizations
//
// ------------------------------------------------------------

async function listar(
  req,
  res
) {
  try {
    const organizations =
      await Organization.findAll({
        order: [
          [
            "order",
            "ASC",
          ],
          [
            "name",
            "ASC",
          ],
        ],
      });

    const canManage =
      hasPermission(
        req,
        "gerenciar_relacoes"
      );

    const visibleOrganizations =
      canManage
        ? organizations
        : organizations.filter(
            (organization) =>
              canAccessOrganization(
                req,
                organization
              )
          );


    // ========================================================
    // ORGANIZAÇÕES "EM NEGOCIAÇÃO"
    // ========================================================
    //
    // Uma organização conta como "Em negociação" quando
    // possui pelo menos uma negociação com status:
    //
    // - Pendente
    // - Em andamento
    //
    // Consultamos somente os IDs das organizações que o usuário
    // já pode visualizar. Assim:
    //
    // - não existe N+1;
    // - organizações restritas não entram na agregação;
    // - cada organização conta apenas uma vez.
    //
    // ========================================================

    const visibleOrganizationIds =
      visibleOrganizations
        .map(
          (organization) =>
            normalizeId(
              organization.id
            )
        )
        .filter(Boolean);


    let openNegotiationOrganizationIds =
      new Set();


    if (
      visibleOrganizationIds.length > 0
    ) {

      const rows =
        await OrganizationNegotiation.findAll({

          attributes: [
            "organizationId",
          ],

          where: {

            organizationId: {
              [Op.in]:
                visibleOrganizationIds,
            },

            status: {
              [Op.in]:
                OPEN_NEGOTIATION_STATUSES,
            },

          },

          group: [
            "organizationId",
          ],

          raw:
            true,

        });


      openNegotiationOrganizationIds =
        new Set(
          rows
            .map(
              (row) =>
                normalizeId(
                  row.organizationId ??
                  row.organization_id
                )
            )
            .filter(Boolean)
        );

    }


    const result =
      visibleOrganizations.map(
        (organization) => {

          const organizationId =
            normalizeId(
              organization.id
            );


          const hasOpenNegotiation =
            Boolean(
              organizationId &&
              openNegotiationOrganizationIds.has(
                organizationId
              )
            );


          return {

            ...serializeOrganization(
              organization
            ),

            // --------------------------------------------------
            // CAMEL CASE
            // --------------------------------------------------

            hasOpenNegotiation,

            emNegociacao:
              hasOpenNegotiation,


            // --------------------------------------------------
            // SNAKE CASE
            // --------------------------------------------------

            has_open_negotiation:
              hasOpenNegotiation,

            em_negociacao:
              hasOpenNegotiation,

          };

        }
      );


    return res.json(
      result
    );
  } catch (error) {
    console.error(
      "[OrganizationController] listar:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Erro ao listar organizações.",
      });
  }
}


// ------------------------------------------------------------
// BUSCAR
// ------------------------------------------------------------
//
// GET /api/organizations/:id
//
// ------------------------------------------------------------

async function buscar(
  req,
  res
) {
  try {
    const organization =
      await getAccessibleOrganization(
        req,
        req.params.id,
        {
          include: [
            {
              model:
                OrganizationNegotiation,

              include: [
                getResponsibleUserInclude(),
              ],
            },
            {
              model:
                OrganizationHistory,
            },
          ],

          order: [
            [
              OrganizationNegotiation,
              "dueDate",
              "ASC",
            ],
            [
              OrganizationHistory,
              "date",
              "DESC",
            ],
          ],
        }
      );

    const result =
      serializeOrganization(
        organization
      );

    const negotiations =
      (
        organization.OrganizationNegotiations ||
        organization.organizationNegotiations ||
        []
      ).map(
        serializeNegotiation
      );

    const history =
      (
        organization.OrganizationHistories ||
        organization.organizationHistories ||
        []
      ).map(
        (entry) =>
          entry.toJSON
            ? entry.toJSON()
            : entry
      );

    return res.json({
      ...result,
      negotiations,
      history,
    });
  } catch (error) {
    console.error(
      "[OrganizationController] buscar:",
      error
    );

    return res
      .status(
        error.status ||
        500
      )
      .json({
        message:
          error.message ||
          "Erro ao buscar organização.",

        ...(
          error.data ||
          {}
        ),
      });
  }
}


// ------------------------------------------------------------
// CRIAR
// ------------------------------------------------------------
//
// POST /api/organizations
//
// ------------------------------------------------------------

async function criar(
  req,
  res
) {
  try {
    const payload =
      await normalizeOrganizationPayload(
        req.body || {}
      );

    if (!payload.name) {
      throw httpError(
        400,
        "O nome da organização é obrigatório."
      );
    }

    const organization =
      await Organization.create(
        payload
      );

    await registrarAuditoria({
      organizationId:
        organization.id,

      usuarioId:
        getUsuarioId(req),

      action:
        "create",

      oldValue:
        null,

      newValue:
        organization.toJSON(),
    });

    return res
      .status(201)
      .json(
        serializeOrganization(
          organization
        )
      );
  } catch (error) {
    console.error(
      "[OrganizationController] criar:",
      error
    );

    return res
      .status(
        error.status ||
        500
      )
      .json({
        message:
          error.message ||
          "Erro ao criar organização.",

        ...(
          error.data ||
          {}
        ),
      });
  }
}


// ------------------------------------------------------------
// ATUALIZAR
// ------------------------------------------------------------
//
// PUT /api/organizations/:id
//
// ------------------------------------------------------------

async function atualizar(
  req,
  res
) {
  try {
    const organization =
      await getAccessibleOrganization(
        req,
        req.params.id
      );

    const payload =
      await normalizeOrganizationPayload(
        req.body || {}
      );

    if (
      Object.keys(payload).length === 0
    ) {
      throw httpError(
        400,
        "Nenhum campo válido foi informado para atualização."
      );
    }

    const oldValues =
      organization.toJSON();

    await organization.update(
      payload
    );

    const newValues =
      organization.toJSON();

    await auditarAlteracoes({
      organizationId:
        organization.id,

      usuarioId:
        getUsuarioId(req),

      oldValues,
      newValues,
    });

    return res.json(
      serializeOrganization(
        organization
      )
    );
  } catch (error) {
    console.error(
      "[OrganizationController] atualizar:",
      error
    );

    return res
      .status(
        error.status ||
        500
      )
      .json({
        message:
          error.message ||
          "Erro ao atualizar organização.",

        ...(
          error.data ||
          {}
        ),
      });
  }
}


// ------------------------------------------------------------
// EXCLUIR
// ------------------------------------------------------------
//
// DELETE /api/organizations/:id
//
// ------------------------------------------------------------

async function excluir(
  req,
  res
) {
  try {
    const organization =
      await getAccessibleOrganization(
        req,
        req.params.id
      );

    const organizationId =
      organization.id;

    const oldValues =
      organization.toJSON();

    // --------------------------------------------------------
    // Registramos antes da exclusão.
    //
    // IMPORTANTE:
    // ainda precisamos confirmar o comportamento da FK do
    // OrganizationAuditLog para garantir que esse log não seja
    // removido por CASCADE junto com a organização.
    // --------------------------------------------------------

    await registrarAuditoria({
      organizationId,

      usuarioId:
        getUsuarioId(req),

      action:
        "delete",

      oldValue:
        oldValues,

      newValue:
        null,
    });

    await organization.destroy();

    return res.json({
      message:
        "Organização removida com sucesso.",
    });
  } catch (error) {
    console.error(
      "[OrganizationController] excluir:",
      error
    );

    return res
      .status(
        error.status ||
        500
      )
      .json({
        message:
          error.message ||
          "Erro ao excluir organização.",

        ...(
          error.data ||
          {}
        ),
      });
  }
}


// ============================================================
// HISTÓRICO
// ============================================================


// ------------------------------------------------------------
// LISTAR HISTÓRICO
// ------------------------------------------------------------
//
// GET /api/organizations/:organizationId/history
//
// ------------------------------------------------------------

async function listarHistorico(
  req,
  res
) {
  try {
    const organization =
      await getAccessibleOrganization(
        req,
        req.params.organizationId
      );

    const history =
      await OrganizationHistory.findAll({
        where: {
          organizationId:
            organization.id,
        },

        order: [
          [
            "date",
            "DESC",
          ],
          [
            "id",
            "DESC",
          ],
        ],
      });

    return res.json({
      history,
    });
  } catch (error) {
    console.error(
      "[OrganizationController] listarHistorico:",
      error
    );

    return res
      .status(
        error.status ||
        500
      )
      .json({
        message:
          error.message ||
          "Erro ao listar histórico.",

        ...(
          error.data ||
          {}
        ),
      });
  }
}


// ------------------------------------------------------------
// CRIAR HISTÓRICO
// ------------------------------------------------------------
//
// POST /api/organizations/:organizationId/history
//
// ------------------------------------------------------------

async function criarHistorico(
  req,
  res
) {
  try {
    const organization =
      await getAccessibleOrganization(
        req,
        req.params.organizationId
      );

    const payload =
      normalizeHistoryPayload(
        req.body || {}
      );

    if (!payload.title) {
      throw httpError(
        400,
        "O título do histórico é obrigatório."
      );
    }

    if (!payload.date) {
      throw httpError(
        400,
        "A data do histórico é obrigatória."
      );
    }

    const history =
      await OrganizationHistory.create({
        organizationId:
          organization.id,

        title:
          payload.title,

        description:
          payload.description ??
          null,

        date:
          payload.date,

        responsible:
          payload.responsible ??
          null,

        usuarioId:
          getUsuarioId(req),
      });

    return res
      .status(201)
      .json(history);
  } catch (error) {
    console.error(
      "[OrganizationController] criarHistorico:",
      error
    );

    return res
      .status(
        error.status ||
        500
      )
      .json({
        message:
          error.message ||
          "Erro ao criar registro histórico.",

        ...(
          error.data ||
          {}
        ),
      });
  }
}


// ------------------------------------------------------------
// ATUALIZAR HISTÓRICO
// ------------------------------------------------------------
//
// PUT /api/organizations/:organizationId/history/:historyId
//
// ------------------------------------------------------------

async function atualizarHistorico(
  req,
  res
) {
  try {
    const organization =
      await getAccessibleOrganization(
        req,
        req.params.organizationId
      );

    const historyId =
      normalizeId(
        req.params.historyId
      );

    if (!historyId) {
      throw httpError(
        400,
        "ID do histórico inválido."
      );
    }

    const history =
      await OrganizationHistory.findOne({
        where: {
          id:
            historyId,

          organizationId:
            organization.id,
        },
      });

    if (!history) {
      throw httpError(
        404,
        "Registro histórico não encontrado."
      );
    }

    const payload =
      normalizeHistoryPayload(
        req.body || {}
      );

    if (
      Object.keys(payload).length === 0
    ) {
      throw httpError(
        400,
        "Nenhum campo válido foi informado para atualização."
      );
    }

    await history.update(
      payload
    );

    return res.json(
      history
    );
  } catch (error) {
    console.error(
      "[OrganizationController] atualizarHistorico:",
      error
    );

    return res
      .status(
        error.status ||
        500
      )
      .json({
        message:
          error.message ||
          "Erro ao atualizar histórico.",

        ...(
          error.data ||
          {}
        ),
      });
  }
}


// ------------------------------------------------------------
// EXCLUIR HISTÓRICO
// ------------------------------------------------------------
//
// DELETE /api/organizations/:organizationId/history/:historyId
//
// ------------------------------------------------------------

async function excluirHistorico(
  req,
  res
) {
  try {
    const organization =
      await getAccessibleOrganization(
        req,
        req.params.organizationId
      );

    const historyId =
      normalizeId(
        req.params.historyId
      );

    if (!historyId) {
      throw httpError(
        400,
        "ID do histórico inválido."
      );
    }

    const history =
      await OrganizationHistory.findOne({
        where: {
          id:
            historyId,

          organizationId:
            organization.id,
        },
      });

    if (!history) {
      throw httpError(
        404,
        "Registro histórico não encontrado."
      );
    }

    await history.destroy();

    return res.json({
      message:
        "Registro histórico removido com sucesso.",
    });
  } catch (error) {
    console.error(
      "[OrganizationController] excluirHistorico:",
      error
    );

    return res
      .status(
        error.status ||
        500
      )
      .json({
        message:
          error.message ||
          "Erro ao excluir histórico.",

        ...(
          error.data ||
          {}
        ),
      });
  }
}


// ============================================================
// USUÁRIOS RESPONSÁVEIS
// ============================================================
//
// Lista mínima de usuários que podem receber uma NOVA
// atribuição de negociação.
//
// Regras:
//
// - Usuario.ativo = true
// - deve possuir Role
// - Role.slug != "sem_acesso"
//
// A rota deve exigir:
//
// gerenciar_relacoes
//
// Não depende de:
//
// - visualizar_membros
// - gerenciar_usuarios
//
// ============================================================

async function listarUsuariosResponsaveis(
  req,
  res
) {
  try {
    const users =
      await Usuario.findAll({
        attributes: [
          "id",
          "nome",
          "email",
        ],

        where: {
          ativo:
            true,
        },

        include: [
          {
            model:
              Role,

            attributes: [],

            required:
              true,

            where: {
              slug: {
                [Op.ne]:
                  "sem_acesso",
              },
            },
          },
        ],

        order: [
          [
            "nome",
            "ASC",
          ],
          [
            "id",
            "ASC",
          ],
        ],
      });

    return res.json({
      users:
        users.map(
          serializeResponsibleUser
        ),
    });
  } catch (error) {
    console.error(
      "[OrganizationController] listarUsuariosResponsaveis:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Erro ao listar usuários responsáveis.",
      });
  }
}


// ============================================================
// NEGOCIAÇÕES
// ============================================================


// ------------------------------------------------------------
// LISTAR NEGOCIAÇÕES
// ------------------------------------------------------------
//
// GET /api/organizations/:organizationId/negotiations
//
// ------------------------------------------------------------

async function listarNegociacoes(
  req,
  res
) {
  try {
    const organization =
      await getAccessibleOrganization(
        req,
        req.params.organizationId
      );

    const negotiations =
      await OrganizationNegotiation.findAll({
        where: {
          organizationId:
            organization.id,
        },

        include: [
          getResponsibleUserInclude(),
        ],

        order: [
          [
            "dueDate",
            "ASC",
          ],
          [
            "id",
            "DESC",
          ],
        ],
      });

    return res.json({
      negotiations:
        negotiations.map(
          serializeNegotiation
        ),
    });
  } catch (error) {
    console.error(
      "[OrganizationController] listarNegociacoes:",
      error
    );

    return res
      .status(
        error.status ||
        500
      )
      .json({
        message:
          error.message ||
          "Erro ao listar negociações.",

        ...(
          error.data ||
          {}
        ),
      });
  }
}


// ------------------------------------------------------------
// CRIAR NEGOCIAÇÃO
// ------------------------------------------------------------
//
// POST /api/organizations/:organizationId/negotiations
//
// ------------------------------------------------------------

async function criarNegociacao(
  req,
  res
) {
  try {
    const organization =
      await getAccessibleOrganization(
        req,
        req.params.organizationId
      );

    const payload =
      await normalizeNegotiationPayload(
        req.body || {}
      );

    if (!payload.title) {
      throw httpError(
        400,
        "O título da negociação é obrigatório."
      );
    }

    const negotiation =
      await OrganizationNegotiation.create({
        organizationId:
          organization.id,

        title:
          payload.title,

        description:
          payload.description ??
          null,

        status:
          payload.status ||
          "Pendente",

        responsibleUserId:
          payload.responsibleUserId ??
          null,

        dueDate:
          payload.dueDate ??
          null,
      });

    const created =
      await findNegotiationWithResponsible(
        negotiation.id
      );

    return res
      .status(201)
      .json(
        serializeNegotiation(
          created ||
          negotiation
        )
      );
  } catch (error) {
    console.error(
      "[OrganizationController] criarNegociacao:",
      error
    );

    return res
      .status(
        error.status ||
        500
      )
      .json({
        message:
          error.message ||
          "Erro ao criar negociação.",

        ...(
          error.data ||
          {}
        ),
      });
  }
}


// ------------------------------------------------------------
// ATUALIZAR NEGOCIAÇÃO
// ------------------------------------------------------------
//
// PUT /api/organizations/:organizationId/negotiations/:negotiationId
//
// ------------------------------------------------------------

async function atualizarNegociacao(
  req,
  res
) {
  try {
    const organization =
      await getAccessibleOrganization(
        req,
        req.params.organizationId
      );

    const negotiationId =
      normalizeId(
        req.params.negotiationId
      );

    if (!negotiationId) {
      throw httpError(
        400,
        "ID da negociação inválido."
      );
    }

    const negotiation =
      await OrganizationNegotiation.findOne({
        where: {
          id:
            negotiationId,

          organizationId:
            organization.id,
        },
      });

    if (!negotiation) {
      throw httpError(
        404,
        "Negociação não encontrada."
      );
    }

    const payload =
      await normalizeNegotiationPayload(
        req.body || {},
        {
          currentResponsibleUserId:
            negotiation.responsibleUserId,
        }
      );

    if (
      Object.keys(payload).length === 0
    ) {
      throw httpError(
        400,
        "Nenhum campo válido foi informado para atualização."
      );
    }

    await negotiation.update(
      payload
    );

    const updated =
      await findNegotiationWithResponsible(
        negotiation.id
      );

    return res.json(
      serializeNegotiation(
        updated ||
        negotiation
      )
    );
  } catch (error) {
    console.error(
      "[OrganizationController] atualizarNegociacao:",
      error
    );

    return res
      .status(
        error.status ||
        500
      )
      .json({
        message:
          error.message ||
          "Erro ao atualizar negociação.",

        ...(
          error.data ||
          {}
        ),
      });
  }
}


// ------------------------------------------------------------
// EXCLUIR NEGOCIAÇÃO
// ------------------------------------------------------------
//
// DELETE /api/organizations/:organizationId/negotiations/:negotiationId
//
// ------------------------------------------------------------

async function excluirNegociacao(
  req,
  res
) {
  try {
    const organization =
      await getAccessibleOrganization(
        req,
        req.params.organizationId
      );

    const negotiationId =
      normalizeId(
        req.params.negotiationId
      );

    if (!negotiationId) {
      throw httpError(
        400,
        "ID da negociação inválido."
      );
    }

    const negotiation =
      await OrganizationNegotiation.findOne({
        where: {
          id:
            negotiationId,

          organizationId:
            organization.id,
        },
      });

    if (!negotiation) {
      throw httpError(
        404,
        "Negociação não encontrada."
      );
    }

    await negotiation.destroy();

    return res.json({
      message:
        "Negociação removida com sucesso.",
    });
  } catch (error) {
    console.error(
      "[OrganizationController] excluirNegociacao:",
      error
    );

    return res
      .status(
        error.status ||
        500
      )
      .json({
        message:
          error.message ||
          "Erro ao excluir negociação.",

        ...(
          error.data ||
          {}
        ),
      });
  }
}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  // ==========================================================
  // ORGANIZAÇÕES
  // ==========================================================

  listar,

  buscar,

  criar,

  atualizar,

  excluir,


  // ==========================================================
  // HISTÓRICO
  // ==========================================================

  listarHistorico,

  criarHistorico,

  atualizarHistorico,

  excluirHistorico,


  // ==========================================================
  // USUÁRIOS RESPONSÁVEIS
  // ==========================================================

  listarUsuariosResponsaveis,


  // ==========================================================
  // NEGOCIAÇÕES
  // ==========================================================

  listarNegociacoes,

  criarNegociacao,

  atualizarNegociacao,

  excluirNegociacao,

};