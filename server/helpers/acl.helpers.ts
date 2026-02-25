/**
 * Gera um aclIndex a partir de um ACL compilado (com __modules e __actions)
 * no formato esperado pelo frontend:
 *
 * aclIndex.resources = [
 *   { name: "module-a:*", actions: { allowed: ["*"], denied: [] } },
 *   { name: "module-b:submodule-x", actions: { allowed: ["read"], denied: ["delete"] } },
 * ]
 *
 * Regras:
 * - Junta policies por (module:subModule).
 * - ALLOW adiciona em allowed; DENY adiciona em denied.
 * - Se existir "*" em denied => denied = ["*"] (nega tudo).
 * - Se existir "*" em allowed e NÃO houver denied ["*"] => allowed = ["*"] (permite tudo).
 * - Scope é preservado opcionalmente (se quiser usar depois no FE).
 */

type PolicyEffect = "ALLOW" | "DENY";
type PolicyAction =
  | "*"
  | "readOnly"
  | "writeOnly"
  | "create"
  | "read"
  | "update"
  | "delete";

type ParsedAclModule = { module: string; subModule: string };

type CompiledPolicy = {
  effect: PolicyEffect;
  scope?: string | string[];
  __modules: ParsedAclModule[];
  __actions: PolicyAction[] | Set<PolicyAction>;
};

type ACL = {
  _id: string;
  role: string;
  policies: CompiledPolicy[];
};

export type AclResourcesRule = {
  name: string; // "module:subModule"
  // opcional: preserve para evoluir suporte a scope no FE
  scope?: string | string[];
  actions: { allowed: PolicyAction[]; denied: PolicyAction[] };
};

export type AclResources = { resources: AclResourcesRule[] };

function toArray<T>(v: T[] | Set<T> | undefined | null): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : Array.from(v);
}

function keyOf(m: ParsedAclModule) {
  return `${m.module}:${m.subModule}`;
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function normalizeActionList(list: PolicyAction[]) {
  // se tiver "*", fica só "*"
  return list.includes("*")
    ? (["*"] as PolicyAction[])
    // se tiver "readOnly" ou "writeOnly", remove o "*" e adiciona os demais
    : uniq(list);
}

export function buildAclIndexFromACL(acl: ACL): AclResources {
  const map = new Map<
    string,
    { name: string; scope?: string | string[]; allowed: PolicyAction[]; denied: PolicyAction[] }
  >();

  for (const policy of acl.policies ?? []) {
    const actions = toArray(policy.__actions);
    const modules = policy.__modules ?? [];

    for (const mod of modules) {
      const name = keyOf(mod);

      const existing =
        map.get(name) ?? { name, scope: undefined as string | string[] | undefined, allowed: [], denied: [] };

      // Preserve scope (se houver). Se houver conflito, guardamos ambos em array.
      if (policy.scope !== undefined) {
        if (existing.scope === undefined) {
          existing.scope = policy.scope;
        } else {
          const prev = Array.isArray(existing.scope) ? existing.scope : [existing.scope];
          const next = Array.isArray(policy.scope) ? policy.scope : [policy.scope];
          existing.scope = uniq([...prev, ...next]);
        }
      }

      if (policy.effect === "ALLOW") existing.allowed.push(...actions);
      else existing.denied.push(...actions);

      map.set(name, existing);
    }
  }

  const resources: AclResourcesRule[] = [];

  for (const v of map.values()) {
    const denied = normalizeActionList(v.denied);
    let allowed = normalizeActionList(v.allowed);

    // Se negou tudo, allowed é irrelevante
    if (denied.includes("*")) allowed = [];

    const rule: AclResourcesRule = {
      name: v.name,
      actions: { allowed, denied },
    };

    // opcional: inclui scope se quiser já mandar ao FE
    if (v.scope !== undefined) rule.scope = v.scope;

    resources.push(rule);
  }

  // Ordenação opcional (mais específico primeiro), não é obrigatório,
  // porque o FE vai ordenar, mas ajuda debugar.
  const score = (name: string) => {
    const [m, s] = name.split(":");
    let sc = 0;
    if (m && m !== "*") sc += 2;
    if (s && s !== "*") sc += 1;
    return sc;
  };
  resources.sort((a, b) => score(b.name) - score(a.name));

  return { resources };
}
