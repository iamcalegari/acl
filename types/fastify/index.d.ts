
import { FastifyJWT } from '@fastify/jwt';
import { FastifyPluginCallback, preHandlerHookHandler } from 'fastify';

export type PluginScope = "global" | "instance";

export type DependencyScope = PluginScope;

export type GuardName = 'jwtGuard' | 'aclGuard';
export type MiddlewareName = 'aclCache' | 'loggerMiddleware' | string; // permite middlewares nomeados dinamicamente

export type GuardFunction = preHandlerHookHandler;

export type GuardDependency = {
  plugin?: FastifyPluginCallback<any>;
  middlewares?: preHandlerHookHandler | preHandlerHookHandler[];

  middlewaresStrategy?: 'before' | 'after';

  /** @default 'instance' */
  scope?: DependencyScope;

  options?: Record<string, any>;
  name?: string; // opcional: nome fixo
};

export type GuardDefinition = {
  guard: GuardFunction;
  scope?: PluginScope;
  dependencies?: GuardDependency[];
};

export type MiddlewareDefinition = Omit<GuardDefinition, 'guard'> & {
  name?: string;
  handlers: GuardFunction | GuardFunction[]

  /** @default 'afterAllGuards' */
  strategy?: 'beforeAllGuards' | 'afterAllGuards';
};

type PluginsRegistryItem = {
  plugin: FastifyPluginCallback;
  type: "dependency";
  scope: PluginScope;
  registered: boolean;
  options: Record<string, any>;
};

type GuardsRegistryItem = {
  preHandler: GuardFunction | GuardFunction[];
  type: "guard";
  scope: PluginScope;
  registered: boolean;
};

type MiddlewaresRegistryItem = {
  handlers: GuardFunction[];
  type: "middleware";
  scope: PluginScope;
  registered: boolean;
  strategy: 'beforeAllGuards' | 'afterAllGuards';
};

export type RoutesGuards = {
  guards: Partial<Record<GuardName, GuardsRegistryItem>>;
  middlewares: Partial<Record<MiddlewareName, MiddlewaresRegistryItem>>;
  plugins: Record<string, PluginsRegistryItem>;
};

export type ServerGuards = { [key in GuardName]?: GuardDefinition };
export type ServerMiddlewares = MiddlewareDefinition;

export type RoutesTypes = "apiRoutes" | "publicRoutes";

export type RouteOptions = {
  prefix?: string;
}

export type SetupRoutesPluginOptions = { allowRouteControl?: boolean }

export type RouteConfig = {
  path: string,
  options?: RouteOptions,
  guards?: ServerGuards,
  middlewares?: ServerMiddlewares[];

} & SetupRoutesPluginOptions;

export type RoutesConfig = {
  [routes in RoutesTypes]?: RouteConfig
}

export interface ServerSetupOptions extends RoutesConfig { }

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

  // para debug
  debugMiddlewares?: Set<string>; // array de strings para identificar quais middlewares foram aplicados (para usar nos guards, por exemplo)
};

export type RequiredModuleConfig = Required<Omit<ModuleConfig, 'isPublic' | 'debugMiddlewares'>>;
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
