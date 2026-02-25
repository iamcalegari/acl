import { createContext, useContext } from "react";

export type AclContextValue = {
  module: string;
  subModule: string;
  scope?: string;
};
export const AclContext = createContext<AclContextValue | null>(null);


export function useAclContext() {
  return useContext(AclContext);
}

/**
 * Retorna o resource no padrão "module:subModule"
 */
export function useAclResource() {
  const ctx = useAclContext();

  if (!ctx) {
    // fallback seguro: sem boundary, não autoriza nada por padrão
    return {
      resource: "",
      scope: undefined as string | undefined,
      hasContext: false,
    };
  }

  return {
    resource: `${ctx.module}:${ctx.subModule}`,
    scope: ctx.scope,
    hasContext: true,
  };
}
