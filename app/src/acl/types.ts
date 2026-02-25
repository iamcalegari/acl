export type PolicyEffect = "ALLOW" | "DENY";
export type PolicyAction = "*" | "readOnly" | "writeOnly" | "create" | "read" | "update" | "delete";

export type Policy = {
  effect: PolicyEffect;
  action?: string | string[];
  module?: string | string[];
  subModule?: string | string[];
  scope?: string;

  __actions?: PolicyAction[];
  __modules?: Array<{ module: string; subModule: string }>;
};

export type ACL = {
  _id: string;
  role: string;
  policies: Policy[];
};

export type MePayload = {
  user: {
    id: string;
    acl: string;
    jti: string;
    sub: string;
    iat: number;
    exp: number;
  };
  acl: ACL;
};

export type CanArgs = {
  action: PolicyAction;   // ex: "readOnly", "*"
  resource: string;       // ex: "module-b:submodule-y"
  scope?: string;         // opcional
};


export type ResourceRule = {
  name: string;           // "module-a:submodule-x" | "module-a:*" | "*:*"
  actions: {
    allowed: string[];    // ex ["read","create"] ou ["*"]
    denied: string[];     // ex ["delete"] ou ["*"]
  };
};

export type ResourcesIndex = {
  resources: ResourceRule[];
};
