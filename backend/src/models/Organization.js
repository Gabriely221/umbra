// ============================================================
// MODEL ORGANIZAÇÃO / RELAÇÕES EXTERNAS
// ============================================================
//
// Representa uma organização/família externa cadastrada
// no sistema.
//
// Estrutura:
//
// Organization
// ├── informações básicas
// ├── status da relação
// ├── avaliação
// ├── controle de visibilidade
// └── informações estratégicas
//
// Relacionamentos:
//
// Organization
// ├── OrganizationHistory
// ├── OrganizationAuditLog
// └── OrganizationNegotiation
//
// AUTORIZAÇÃO:
//
// O RBAC é controlado pelas rotas:
//
// visualizar_relacoes
// gerenciar_relacoes
//
// Além disso, cada organização pode possuir uma restrição
// adicional de conteúdo através de:
//
// allowedCargos
//
// PADRÃO CANÔNICO:
//
// allowedCargos = Role.slug[]
//
// Exemplo:
//
// [
//   "membro",
//   "lideranca"
// ]
//
// [] significa:
//
// sem restrição específica por cargo.
//
// IMPORTANTE:
//
// Não existe associação Sequelize Organization ↔ Role.
// allowedCargos é um campo JSON de autorização de conteúdo.
//
// ============================================================

const {
  DataTypes,
} =
  require(
    "sequelize"
  );


const sequelize =
  require(
    "../config/database"
  );


// ============================================================
// MODEL
// ============================================================

const Organization =
  sequelize.define(

    "Organization",

    {

      // ======================================================
      // ID
      // ======================================================

      id: {

        type:
          DataTypes.INTEGER,

        autoIncrement:
          true,

        primaryKey:
          true,

      },


      // ======================================================
      // NOME
      // ======================================================

      name: {

        type:
          DataTypes.STRING(
            200
          ),

        allowNull:
          false,

      },


      // ======================================================
      // LÍDER
      // ======================================================

      leader: {

        type:
          DataTypes.STRING(
            150
          ),

        allowNull:
          true,

      },


      // ======================================================
      // SUB-LÍDER
      // ======================================================

      subLeader: {

        type:
          DataTypes.STRING(
            150
          ),

        allowNull:
          true,

        field:
          "sub_leader",

      },


      // ======================================================
      // CIDADE
      // ======================================================

      city: {

        type:
          DataTypes.STRING(
            100
          ),

        allowNull:
          true,

      },


      // ======================================================
      // QUANTIDADE DE MEMBROS
      // ======================================================
      //
      // NULL:
      // quantidade desconhecida.
      //
      // 0:
      // quantidade conhecida e igual a zero.
      //
      // ======================================================

      memberCount: {

        type:
          DataTypes.INTEGER,

        allowNull:
          true,

        field:
          "member_count",

        validate: {

          min:
            0,

        },

      },


      // ======================================================
      // STATUS DA RELAÇÃO
      // ======================================================

      status: {

        type:
          DataTypes.ENUM(

            "Aliada",

            "Parceira",

            "Neutra",

            "Em observação",

            "Hostil",

            "Inimiga"

          ),

        allowNull:
          false,

        defaultValue:
          "Neutra",

      },


      // ======================================================
      // ESPECIALIDADE
      // ======================================================

      specialty: {

        type:
          DataTypes.STRING(
            150
          ),

        allowNull:
          true,

      },


      // ======================================================
      // ESPECIALIDADE PERSONALIZADA
      // ======================================================

      customSpecialty: {

        type:
          DataTypes.STRING(
            200
          ),

        allowNull:
          true,

        field:
          "custom_specialty",

      },


      // ======================================================
      // DESCRIÇÃO
      // ======================================================

      description: {

        type:
          DataTypes.TEXT,

        allowNull:
          true,

      },


      // ======================================================
      // NÍVEL DE CONFIANÇA
      // ======================================================
      //
      // 0:
      // nenhuma confiança.
      //
      // 100:
      // confiança máxima.
      //
      // ======================================================

      trustLevel: {

        type:
          DataTypes.INTEGER,

        allowNull:
          false,

        defaultValue:
          50,

        field:
          "trust_level",

        validate: {

          min:
            0,

          max:
            100,

        },

      },


      // ======================================================
      // ORGANIZAÇÃO ATIVA
      // ======================================================
      //
      // true:
      // organização ativa.
      //
      // false:
      // organização arquivada/inativa.
      //
      // Política prevista no controller:
      //
      // visualizar_relacoes
      // → vê somente organizações ativas autorizadas.
      //
      // gerenciar_relacoes
      // → pode visualizar inclusive organizações inativas.
      //
      // ======================================================

      isActive: {

        type:
          DataTypes.BOOLEAN,

        allowNull:
          false,

        defaultValue:
          true,

        field:
          "is_active",

      },


      // ======================================================
      // CARGOS PERMITIDOS
      // ======================================================
      //
      // PADRÃO OFICIAL:
      //
      // Role.slug[]
      //
      // Exemplo:
      //
      // [
      //   "membro",
      //   "lideranca"
      // ]
      //
      // []
      //
      // significa:
      //
      // sem restrição adicional por cargo.
      //
      // Durante a migração, o controller poderá reconhecer
      // Role.nome legado na leitura/escrita, mas novas
      // gravações serão canonicalizadas para Role.slug.
      //
      // "sem_acesso" não deve ser aceito como público de
      // conteúdo.
      //
      // ======================================================

      allowedCargos: {

        type:
          DataTypes.JSON,

        allowNull:
          true,

        defaultValue:
          [],

        field:
          "allowed_cargos",

      },


      // ======================================================
      // OBSERVAÇÕES
      // ======================================================

      observations: {

        type:
          DataTypes.TEXT,

        allowNull:
          true,

      },


      // ======================================================
      // OBJETIVOS
      // ======================================================

      objectives: {

        type:
          DataTypes.TEXT,

        allowNull:
          true,

      },


      // ======================================================
      // OPORTUNIDADES
      // ======================================================

      opportunities: {

        type:
          DataTypes.TEXT,

        allowNull:
          true,

      },


      // ======================================================
      // ALERTAS
      // ======================================================

      alerts: {

        type:
          DataTypes.TEXT,

        allowNull:
          true,

      },


      // ======================================================
      // PESSOAS IMPORTANTES
      // ======================================================
      //
      // Exemplo:
      //
      // [
      //   {
      //     "name": "Fulano",
      //     "role": "Líder"
      //   }
      // ]
      //
      // A estrutura interna deverá ser validada/normalizada
      // pelo controller.
      //
      // ======================================================

      keyPeople: {

        type:
          DataTypes.JSON,

        allowNull:
          true,

        defaultValue:
          [],

        field:
          "key_people",

      },


      // ======================================================
      // ORDEM
      // ======================================================

      order: {

        type:
          DataTypes.INTEGER,

        allowNull:
          false,

        defaultValue:
          999,

      },


      // ======================================================
      // AVALIAÇÃO
      // ======================================================
      //
      // Campo JSON flexível mantido por compatibilidade com a
      // estrutura existente do sistema.
      //
      // ======================================================

      evaluation: {

        type:
          DataTypes.JSON,

        allowNull:
          true,

        defaultValue:
          {},

      },

    },

    {

      tableName:
        "organizations",

    }

  );


// ============================================================
// EXPORT
// ============================================================

module.exports =
  Organization;