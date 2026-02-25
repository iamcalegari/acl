import type { PolicyAction } from "../../acl/types";

export type LoginRequest = {
  id: string;
  email: string;
  senha: string;
  acl?: string; // opcional no schema? (no required não está)
};

export type LoginResponse = {
  accessToken: string;
  accessTokenExpiresIn: number;
  user: { _id: string; email: string };

  // routeOptions retornando também:
  config?: {
    guards?: string[];
    debugMiddlewares?: string[];
  };

  // podem vir outros campos do routeOptions; não precisamos tipar tudo
  [key: string]: unknown;
};



export type MeData = {
  user: {
    id: string;
    acl: string;
    jti: string;
    sub: string;
    iat: number;
    exp: number;
  };
  acl: {
    _id: string;
    role: string;
    policies: Array<{
      effect: "ALLOW" | "DENY";
      action: string | string[];
      module: string | string[];
      scope?: string;
      __modules: Array<{ module: string; subModule: string }>;
      __actions: PolicyAction[];
    }>;
  };
  config?: unknown;
  aclResources: AclResources; // <-- AQUI
  [k: string]: unknown;
};



export type AclResourcesRule = {
  name: string; // ex: "module-a:submodule-x" | "module-a:*" | "*:*"
  actions: {
    allowed: string[]; // ex ["read"] ou ["*"]
    denied: string[];  // ex ["delete"] ou ["*"]
  };
};

export type AclResources = AclResourcesRule[];

// seu /me agora (no formato do seu backend)
export type ApiOk<T> = { status: "ok"; data: T };
