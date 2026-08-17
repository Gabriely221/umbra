// ============================================================
// PERMISSION GATE
// ============================================================
//
// Serve para esconder/exibir botões, menus e controles.
//
// NÃO é a segurança real.
// A API continua protegida pelo backend.
// ============================================================

import {
  useAuth,
} from "../../context/AuthContext";


export default function PermissionGate({
  permission,
  children,
  fallback = null,
}) {

  const {
    hasPermission,
  } =
    useAuth();


  if (
    !hasPermission(
      permission
    )
  ) {

    return fallback;
  }


  return children;
}