import { FastifyReply, FastifyRequest } from 'fastify';
import { ACLPolicy, CompiledPolicy, ParsedAclModule, PolicyAction, TargetModuleConfig } from '../../../../types/fastify';

type HttpMethod = "GET" | "HEAD" | "OPTIONS" | "POST" | "PUT" | "PATCH" | "DELETE";


export type AccessDecision =
  | { allowed: true; policy: ACLPolicy }
  | { allowed: false; reason: "NO_MATCH" | "DENIED"; policy?: ACLPolicy };

function moduleSpecificity(target: TargetModuleConfig, rule: ParsedAclModule): number {
  // -1 = não casa
  // 0 = *:*
  // 1 = mod:* ou *:sub (se você permitir)
  // 2 = mod:sub (mais específico)
  const moduleOk = rule.module === "*" || rule.module === target.module;
  if (!moduleOk) return -1;

  const subOk = rule.subModule === "*" || rule.subModule === target.subModule;
  if (!subOk) return -1;

  const moduleScore = rule.module === "*" ? 0 : 1;
  const subScore = rule.subModule === "*" ? 0 : 1;
  return moduleScore + subScore; // 0..2
}

function methodToAction(method: HttpMethod): PolicyAction {
  switch (method) {
    case "GET":
    case "HEAD":
    case "OPTIONS":
      return "read";
    case "POST":
      return "create";
    case "PUT":
    case "PATCH":
      return "update";
    case "DELETE":
      return "delete";
  }
}

function actionMatches(policyAction: PolicyAction, requestAction: PolicyAction): boolean {
  if (policyAction === "*") return true;
  if (policyAction === "readOnly") return requestAction === "read";
  if (policyAction === "writeOnly")
    return requestAction === "create" || requestAction === "update" || requestAction === "delete";
  return policyAction === requestAction;
}

export function getPoliciesCompiled(
  compiled: CompiledPolicy[],
  target: TargetModuleConfig
): CompiledPolicy[] {
  return compiled
    .filter((p) => p.__modules.some((r) => matchesModule(target, r)))
}

function stripCompiled(p: CompiledPolicy): ACLPolicy {
  // remove campos internos
  const { __modules, __actions, ...rest } = p as any;
  return rest as ACLPolicy;
}

export function decideAccess(
  compiled: CompiledPolicy[],
  target: TargetModuleConfig,
  method: HttpMethod
): AccessDecision {
  const reqAction = methodToAction(method);

  let bestAllow: { score: number; policy: ACLPolicy } | null = null;
  let bestDeny: { score: number; policy: ACLPolicy } | null = null;

  for (const p of compiled) {
    const pActions = new Set(p.__actions);

    const pAction = [...pActions][0]; // (por enquanto é 1 ação)
    if (!actionMatches(pAction, reqAction)) continue;

    // module match: pega o melhor score dentro das regras dessa policy
    let bestScoreForPolicy = -1;
    for (const rule of p.__modules) {
      const s = moduleSpecificity(target, rule);
      if (s > bestScoreForPolicy) bestScoreForPolicy = s;
      if (bestScoreForPolicy === 2) break; // já é máximo
    }
    if (bestScoreForPolicy < 0) continue;

    // separa allow/deny
    const candidate = { score: bestScoreForPolicy, policy: stripCompiled(p) };

    if (p.effect === "DENY") {
      if (!bestDeny || candidate.score > bestDeny.score) bestDeny = candidate;
      else if (bestDeny && candidate.score === bestDeny.score) bestDeny = candidate; // "última vence"
    } else {
      if (!bestAllow || candidate.score > bestAllow.score) bestAllow = candidate;
      else if (bestAllow && candidate.score === bestAllow.score) bestAllow = candidate;
    }
  }

  // DENY vence sempre
  if (bestDeny) return { allowed: false, reason: "DENIED", policy: bestDeny.policy };

  if (bestAllow) return { allowed: true, policy: bestAllow.policy };

  return { allowed: false, reason: "NO_MATCH" };
}

function getTargetFromRouteConfig(cfg: any): TargetModuleConfig {
  return {
    module: cfg.module ?? "*",
    subModule: cfg.subModule ?? "*",
  };
}

function matchesModule(
  target: TargetModuleConfig,
  rule: ParsedAclModule
): boolean {
  // módulo coringa
  const moduleOk = rule.module === "*" || rule.module === target.module;
  if (!moduleOk) return false;

  // submódulo coringa
  const subOk = rule.subModule === "*" || rule.subModule === target.subModule;
  return subOk;
}

export async function aclGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { method, url, user } = request;
  const userId = user?.id || 'Guest';

  console.log(`\n\n[ACL GUARD] ${method} ${url} - User: ${userId}`);


  request.routeOptions.config.debugMiddlewares
    ? request.routeOptions.config.debugMiddlewares.add('aclGuard')
    : request.routeOptions.config.debugMiddlewares = new Set(['aclGuard']);


  const cfg = (request.routeOptions.config ?? {});

  if (!request.acl) {
    console.log('[ACL GUARD] USER ACL:', JSON.stringify(request.acl, null, 2));
    return reply.code(401).send({ message: "Unauthorized" });
  }

  const target = getTargetFromRouteConfig(cfg);

  const compiled = getPoliciesCompiled(request.acl.policies, target); // ideal: cache por user/aclId
  const decision = decideAccess(compiled, target, request.method as HttpMethod);

  if (!decision.allowed) {
    reply.code(decision.reason === "DENIED" ? 403 : 403).send({
      message: decision.reason === "DENIED" ? "Access Denied" : "Without Access for this module",
      policy: decision.policy,
    });
    return;
  }
}
