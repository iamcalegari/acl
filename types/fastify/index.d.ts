
import { FastifyRequest, FastifyReply, FastifyPluginCallback, preHandlerHookHandler } from 'fastify';
import { FastifyJWT } from '@fastify/jwt';

export type GuardFunction = ((request: FastifyRequest, reply: FastifyReply, next?: () => Promise<void> | void) => Promise<void>)
  | ((request: FastifyRequest, reply?: FastifyReply, next?: () => Promise<void> | void) => Promise<void>)
  | preHandlerHookHandler;

export type GuardName = "jwtGuard" | "aclGuard" | string;

export interface RoutesCommonOptions {
  scope: "global" | "instance";
  type: "guard" | "dependency";
  registered: boolean;
  options?: any;
}

export interface RoutesGuardOptions extends RoutesCommonOptions {
  preHandler: GuardFunction | FastifyInstance;
}

export interface RoutesPluginOptions extends RoutesCommonOptions {
  plugin: FastifyPluginCallback;
}

export type RoutesGuards = {
  guards?: Record<GuardName, RoutesGuardOptions>
  plugins?: Record<GuardName, RoutesPluginOptions>
};

export interface ServerGuardOptions {
  dependencies?: {
    plugin: FastifyPluginCallback<any>;
    scope?: "global" | "instance";
    options?: any;
  }[]
  guard: GuardFunction | FastifyInstance;
}

export type ServerGuards = Record<GuardName, ServerGuardOptions>;


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
  acl?: ACL;
}
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUser;
    user: AuthUser;
  }
}

declare module "fastify" {
  interface FastifyRequest {
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
