import React from "react";
import { useAppSelector } from "../app/hooks";
import { selectCan } from "../features/auth/selectors";
import type { PolicyAction } from "../acl/types";
import { useAclResource } from "../acl/aclContext";

type Props = {
  /**
   * Default = "read": para renderizar página/seção.
   * Nos botões/ações, passe "create" | "update" | "delete" etc.
   */
  action?: PolicyAction;
  scope?: string; // se quiser sobrescrever o scope do boundary
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function CanInContext({
  action = "read",
  scope: scopeOverride,
  children,
  fallback = null,
}: Props) {
  const { resource, scope, hasContext } = useAclResource();
  const finalScope = scopeOverride ?? scope;

  // Sem contexto, não mostra
  const ok = useAppSelector((state) =>
    hasContext
      ? selectCan({ action, resource, scope: finalScope })(state)
      : false,
  );

  return <>{ok ? children : fallback}</>;
}
