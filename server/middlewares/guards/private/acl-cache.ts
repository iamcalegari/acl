import { FastifyReply, FastifyRequest } from "fastify";
import { ACLPolicy, ACLRole, CompiledPolicy, TargetModuleConfig } from "../../../../types/fastify";
import ACLs from './collection.acl.documents.json';

export type ACLDocument = {
  _id: string;
  role: ACLRole,
  policies: CompiledPolicy[];
}

const policiesCache = new Map<string, ACLDocument>();

function parseAclModule(input: string, separator = ":"): TargetModuleConfig {
  const raw = (input ?? "").trim();
  const idx = raw.indexOf(separator);

  if (idx === -1) return { module: raw || "*", subModule: "*" };

  const module = raw.slice(0, idx).trim() || "*";
  const subModule = raw.slice(idx + 1).trim() || "*";
  return { module, subModule };
}

function toArray<T>(v: T | T[]): T[] {
  return Array.isArray(v) ? v : [v];
}

export function compilePolicies(policies: ACLPolicy[], separator = ":"): CompiledPolicy[] {
  if (policies.length === 0) return [];

  //  console.log('COMPILE POLICIES', JSON.stringify(policies, null, 2));
  return policies.map((p) => {
    return {
      ...p,
      __modules: toArray(p.module).map((m) => parseAclModule(m, separator)),
      __actions: toArray(p.action),
    }
  });
}

const getFromCache = (aclId: string): ACLDocument | null => {
  const cached = policiesCache.get(aclId);

  if (!cached) return null;

  policiesCache.delete(aclId);
  policiesCache.set(aclId, cached);

  console.log(`[ACL CACHE] getting ACL: [${aclId} - ${cached.role}] from CACHE`);
  return cached;
}

const getFromSource = (aclId: string): ACLDocument | null => {

  const acl = ACLs.find(acl => acl._id === aclId);

  if (!acl) return null;

  const compiledPolicies = compilePolicies(acl.policies as ACLPolicy[]);

  const policies = {
    _id: acl._id,
    role: acl.role as ACLRole,
    policies: compiledPolicies
  }

  policiesCache.set(aclId, policies);

  console.log(`[ACL CACHE] getting ACL: [${aclId} - ${policies.role}] from SOURCE`);

  return policies;
}


export async function aclCache(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { method, url, user } = request;
  const userId = user?.id || 'Guest';

  console.log(`\n\n[ACL CACHE] ${method} ${url} - User: ${userId}`);

  request.routeOptions.config.debugMiddlewares
    ? request.routeOptions.config.debugMiddlewares.add('aclCache')
    : request.routeOptions.config.debugMiddlewares = new Set(['aclCache']);

  const { user: { id, acl: aclId } } = request;

  if (!request.user || !aclId) {
    console.log('[ACL CACHE] USER ACL:', JSON.stringify(request.user, null, 2));
    return reply.code(401).send({ message: "Unauthorized" });
  }

  const acl = policiesCache.has(aclId)
    ? getFromCache(aclId)
    : getFromSource(aclId);

  request.acl = acl ?? undefined;

  return;
}
