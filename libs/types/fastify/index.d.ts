import { FastifyRequest } from 'fastify'
import { GuardFunction, RoutesGuards } from '../../plugins/guards';

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
  guards: Set<keyof RoutesGuards>;
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

}
