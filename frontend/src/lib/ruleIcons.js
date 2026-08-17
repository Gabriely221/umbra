// ============================================================
// ÍCONES DE REGRAS
// ============================================================
//
// Mapeamento centralizado dos ícones utilizados nas regras.
//
// Este arquivo NÃO depende de:
// - Base44
// - backend
// - autenticação
// - React Query
//
// ============================================================

import {
  ScrollText,
  Shield,
  Scale,
  Gavel,
  AlertTriangle,
  Book,
  Swords,
  Crown,
  Flame,
  Eye,
  Ban,
  Lock,
} from "lucide-react";


// ============================================================
// MAPA DE ÍCONES
// ============================================================
//
// A chave é o valor persistido no banco.
//
// Exemplo:
//
// {
//   icon: "shield"
// }
//
// ============================================================

export const ruleIcons = {

  scroll: {
    component: ScrollText,
    label: "Pergaminho",
  },

  shield: {
    component: Shield,
    label: "Escudo",
  },

  scale: {
    component: Scale,
    label: "Balança",
  },

  gavel: {
    component: Gavel,
    label: "Martelo",
  },

  alert: {
    component: AlertTriangle,
    label: "Alerta",
  },

  book: {
    component: Book,
    label: "Livro",
  },

  sword: {
    component: Swords,
    label: "Espadas",
  },

  crown: {
    component: Crown,
    label: "Coroa",
  },

  flame: {
    component: Flame,
    label: "Chama",
  },

  eye: {
    component: Eye,
    label: "Olho",
  },

  ban: {
    component: Ban,
    label: "Proibido",
  },

  lock: {
    component: Lock,
    label: "Cadeado",
  },

};


// ============================================================
// CONFIG PADRÃO
// ============================================================

const DEFAULT_RULE_ICON =
  ruleIcons.scroll;


// ============================================================
// BUSCAR CONFIGURAÇÃO
// ============================================================

export function getRuleIconConfig(
  name
) {

  return (
    ruleIcons[name] ||
    DEFAULT_RULE_ICON
  );

}


// ============================================================
// BUSCAR COMPONENTE DO ÍCONE
// ============================================================
//
// Uso:
//
// const Icon = getRuleIcon(rule.icon);
//
// <Icon />
//
// ============================================================

export function getRuleIcon(
  name
) {

  return getRuleIconConfig(
    name
  ).component;

}


// ============================================================
// BUSCAR LABEL
// ============================================================

export function getRuleIconLabel(
  name
) {

  return getRuleIconConfig(
    name
  ).label;

}


// ============================================================
// VALIDAR ÍCONE
// ============================================================

export function isValidRuleIcon(
  name
) {

  return Object.prototype.hasOwnProperty.call(
    ruleIcons,
    name
  );

}


// ============================================================
// OPÇÕES PARA SELECT
// ============================================================
//
// Útil para RuleFormModal.
//
// Retorna:
//
// [
//   {
//     value: "scroll",
//     label: "Pergaminho",
//     Icon: ScrollText
//   }
// ]
//
// ============================================================

export const RULE_ICON_OPTIONS =
  Object.entries(
    ruleIcons
  ).map(
    (
      [
        value,
        config,
      ]
    ) => ({

      value,

      label:
        config.label,

      Icon:
        config.component,

    })
  );


// ============================================================
// DEFAULT EXPORT
// ============================================================

export default ruleIcons;