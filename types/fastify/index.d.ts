
import { FastifyJWT } from '@fastify/jwt';
import { FastifyPluginCallback, preHandlerHookHandler } from 'fastify';

export type PluginScope = "global" | "instance";

export type DependencyScope = PluginScope;

export type GuardName = 'jwtGuard' | 'aclGuard' | 'aclCache';

export type GuardFunction = preHandlerHookHandler;

export type GuardDependency = {
  plugin: FastifyPluginCallback<any>;
  scope?: DependencyScope; // default instance
  options?: Record<string, any>;
  name?: string; // opcional: nome fixo
};

export type GuardDefinition = {
  guard: GuardFunction;
  scope?: PluginScope;
  dependencies?: GuardDependency[];
};

type PluginsRegistryItem = {
  plugin: FastifyPluginCallback;
  scope: PluginScope;
  type: "dependency";
  registered: boolean;
  options: Record<string, any>;
};

type GuardsRegistryItem = {
  preHandler: GuardFunction;
  type: "guard";
  registered: boolean;
  scope: PluginScope;
};

export type RoutesGuards = {
  guards: Partial<Record<GuardName, GuardsRegistryItem>>;
  plugins: Record<string, PluginsRegistryItem>;
};

export type ServerGuards = { [key in GuardName]?: GuardDefinition };

export interface ServerSetupOptions {
  apiPath: string,
  publicPath: string,
  guards: ServerGuards
}

export type ACLRole = "ADMIN" | "CONTADOR" | "GESTOR";
export type ACLPolicy = {
  effect: "ALLOW" | "DENY";
  action: "*" | "readOnly" | "writeOnly" | "create" | "read" | "update" | "delete";
  scope?: string | string[];
  module: string | string[];
}


export type PolicyAction = ACLPolicy["action"]

export type CompiledPolicy = ACLPolicy & {
  __modules: ParsedAclModule[];
  __actions: Set<PolicyAction> | PolicyAction[];
};
export interface ModuleConfig {
  guards: Set<GuardName>;
  module?: string;
  subModule?: string;
  isPublic?: boolean;
};

export type RequiredModuleConfig = Required<Omit<ModuleConfig, 'isPublic'>>;
export type TargetModuleConfig = Omit<RequiredModuleConfig, 'guards'>
export type ParsedAclModule = TargetModuleConfig; // subModule sempre definido (default "*")

export interface ACL {
  _id: string;
  role: ACLRole;
  policies: CompiledPolicy[];
}


export interface AuthUser {
  id: string;
  acl?: string;
}
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUser;
    user: AuthUser;
  }
}


export interface FastifyACLCache {
  acl?: ACLDocument;
}

declare module "fastify" {
  interface FastifyRequest extends FastifyACLCache {
    user?: AuthUser;
    jwtVerify: FastifyJWT["jwtVerify"];
  }

  interface FastifyReply {
    jwtSign: FastifyJWT["jwtSign"];
  }

  interface FastifyContextConfig extends Partial<ModuleConfig> { }

  interface FastifyInstance extends RoutesGuards {
    module(name: string): void;
    subModule(name: string): void;
  }
}
