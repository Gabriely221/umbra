// ============================================================
// ÍCONES DE LINKS
// ============================================================
//
// Mapeamento centralizado dos ícones utilizados pelos links.
//
// Este arquivo NÃO depende de:
// - Base44
// - backend
// - autenticação
// - React Query
//
// ============================================================

import {
  Link2,
  Globe,
  Shield,
  Youtube,
  Instagram,
  FileText,
  Map,
  Star,
  Search,
  Calculator,
  Landmark,
  Zap,
  Crown,
  Flame,
  Target,
  Crosshair,
  Eye,
  Briefcase,
  Database,
  Lock,
  Key,
  Award,
  MessageCircle,
} from "lucide-react";


// ============================================================
// LISTA DE ÍCONES
// ============================================================
//
// `value` é o valor armazenado no banco.
//
// Exemplo:
//
// {
//   icon: "discord"
// }
//
// ============================================================

export const LINK_ICONS = [

  {
    value: "link",
    Icon: Link2,
    label: "Link",
  },

  {
    value: "globe",
    Icon: Globe,
    label: "Globo",
  },

  {
    value: "discord",
    Icon: MessageCircle,
    label: "Discord",
  },

  {
    value: "youtube",
    Icon: Youtube,
    label: "YouTube",
  },

  {
    value: "instagram",
    Icon: Instagram,
    label: "Instagram",
  },

  {
    value: "file",
    Icon: FileText,
    label: "Arquivo",
  },

  {
    value: "map",
    Icon: Map,
    label: "Mapa",
  },

  {
    value: "shield",
    Icon: Shield,
    label: "Escudo",
  },

  {
    value: "star",
    Icon: Star,
    label: "Estrela",
  },

  {
    value: "search",
    Icon: Search,
    label: "Lupa",
  },

  {
    value: "calculator",
    Icon: Calculator,
    label: "Calculadora",
  },

  {
    value: "landmark",
    Icon: Landmark,
    label: "Banco",
  },

  {
    value: "zap",
    Icon: Zap,
    label: "Raio",
  },

  {
    value: "crown",
    Icon: Crown,
    label: "Coroa",
  },

  {
    value: "flame",
    Icon: Flame,
    label: "Chama",
  },

  {
    value: "target",
    Icon: Target,
    label: "Alvo",
  },

  {
    value: "crosshair",
    Icon: Crosshair,
    label: "Mira",
  },

  {
    value: "eye",
    Icon: Eye,
    label: "Olho",
  },

  {
    value: "briefcase",
    Icon: Briefcase,
    label: "Pasta",
  },

  {
    value: "database",
    Icon: Database,
    label: "Base",
  },

  {
    value: "lock",
    Icon: Lock,
    label: "Cadeado",
  },

  {
    value: "key",
    Icon: Key,
    label: "Chave",
  },

  {
    value: "award",
    Icon: Award,
    label: "Prêmio",
  },

];


// ============================================================
// BUSCAR CONFIGURAÇÃO DO ÍCONE
// ============================================================

export function getLinkIconConfig(
  value
) {

  return (
    LINK_ICONS.find(
      (
        item
      ) =>
        item.value ===
        value
    ) ||
    LINK_ICONS[0]
  );

}


// ============================================================
// BUSCAR COMPONENTE DO ÍCONE
// ============================================================
//
// Uso:
//
// const Icon = getLinkIcon(link.icon);
//
// <Icon />
//
// ============================================================

export function getLinkIcon(
  value
) {

  return getLinkIconConfig(
    value
  ).Icon;

}


// ============================================================
// BUSCAR LABEL
// ============================================================

export function getLinkIconLabel(
  value
) {

  return getLinkIconConfig(
    value
  ).label;

}


// ============================================================
// VALIDAÇÃO
// ============================================================

export function isValidLinkIcon(
  value
) {

  return LINK_ICONS.some(
    (
      item
    ) =>
      item.value ===
      value
  );

}


// ============================================================
// DEFAULT
// ============================================================

export default LINK_ICONS;