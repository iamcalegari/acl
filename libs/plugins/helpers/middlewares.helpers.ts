import type { FastifyInstance, RouteOptions } from "fastify";
import type { GuardFunction } from "../../../types/fastify";

type Strategy = "beforeAllGuards" | "afterAllGuards";

type RouteControlConfig = {
  /**
   * Desabilita middlewares pelo "name" (chave em fastify.middlewares).
   * Ex: { config: { disableMiddlewares: ["loggerMiddleware"] } }
   */
  disableMiddlewares?: string[] | Set<string>;

  /** Desabilita todos os middlewares strategy === "beforeAllGuards" */
  disableBeforeAllGuards?: boolean;

  /** Desabilita todos os middlewares strategy === "afterAllGuards" */
  disableAfterAllGuards?: boolean;

  /** Debug: set com nomes aplicados */
  debugMiddlewares?: Set<string>;
};

const toArray = <T>(v: T | T[] | undefined): T[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

const isGuardFn = (fn: unknown): fn is GuardFunction => typeof fn === "function";

const uniqKeepOrder = <T>(arr: T[]) => {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const x of arr) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
};

function asDisableSet(v: RouteControlConfig["disableMiddlewares"]) {
  if (!v) return new Set<string>();
  if (v instanceof Set) return v;
  return new Set<string>(v);
}

/**
 * Extrai middlewares cadastrados em target.middlewares e separa por strategy.
 * Respeita disableMiddlewares + disableBeforeAllGuards/disableAfterAllGuards.
 * Também adiciona nomes aplicados em debugMiddlewares.
 */
function collectStrategyMiddlewares(
  target: FastifyInstance,
  strategy: Strategy,
  control: RouteControlConfig
): { handlers: GuardFunction[]; names: string[] } {
  const disable = asDisableSet(control.disableMiddlewares);


  if (strategy === "beforeAllGuards" && control.disableBeforeAllGuards) {
    return { handlers: [], names: [] };
  }
  if (strategy === "afterAllGuards" && control.disableAfterAllGuards) {
    return { handlers: [], names: [] };
  }

  const mwStrategyGlobal = strategy === "beforeAllGuards" ? "__mwGlobalBefore" : "__mwGlobalAfter";
  const mwStrategyInstance = strategy === "beforeAllGuards" ? "__mwInstanceBefore" : "__mwInstanceAfter";

  const entriesGlobal = target[mwStrategyGlobal] ?? [];
  const entriesInstance = target[mwStrategyInstance] ?? [];

  const entries = [...entriesGlobal, ...entriesInstance];

  const selected: GuardFunction[] = [];
  const names: string[] = [];

  for (const item of entries) {
    if (!item) continue;

    const name = item.name;
    if (disable.has(name)) continue;

    const hs = toArray(item).filter(isGuardFn);
    if (hs.length === 0) continue;

    selected.push(...hs);
    names.push(name);
  }

  return { handlers: uniqKeepOrder(selected), names };
}

/**
 * Regras (determinístico):
 * - beforeAllGuards (do target.middlewares) sempre antes
 * - afterAllGuards (do target.middlewares) sempre depois
 * - mantém preHandlers “já existentes” (exceto os que são before/after)
 * - adiciona incoming sem duplicar e sem repetir os já existentes
 * - atualiza config.debugMiddlewares com os nomes aplicados
 */
export function setMiddlewares(
  target: FastifyInstance,
  routeOptions: RouteOptions,
  middlewares: (GuardFunction | GuardFunction[] | undefined)[],
  beforeAllMiddlewares?: (GuardFunction | GuardFunction[] | undefined)[],
  afterAllMiddlewares?: (GuardFunction | GuardFunction[] | undefined)[]
) {
  const cfg = ((routeOptions.config ?? {}) as any) as RouteControlConfig;

  console.log('\n[1] TARGET MIDDLEWARES', target.middlewares);

  console.log('[1] TARGET GLOBAL BEFORE', target.__mwGlobalBefore);
  console.log('[1] TARGET GLOBAL AFTER', target.__mwGlobalAfter);

  console.log('[1] TARGET INSTANCE BEFORE', target.__mwInstanceBefore);
  console.log('[1] TARGET INSTANCE AFTER', target.__mwInstanceAfter);


  console.log('[1] MIDDLEWARES', middlewares);
  console.log('[1] ROUTE OPTIONS', routeOptions);
  console.log('[1] CFG', cfg);
  console.log('[1] BEFORE ALL MIDDLEWARES', beforeAllMiddlewares);
  console.log('[1] AFTER ALL MIDDLEWARES', afterAllMiddlewares);

  // 1) coleta before/after cadastrados no target (plugins)
  const beforeCollected = collectStrategyMiddlewares(target, "beforeAllGuards", cfg);
  const afterCollected = collectStrategyMiddlewares(target, "afterAllGuards", cfg);

  console.log('\n[2] BEFORE COLLECTED', beforeCollected);
  console.log('[2] AFTER COLLECTED', afterCollected);

  // 2) inclui before/after passados por parâmetro (se você usar)
  const beforeExtra = toArray(beforeAllMiddlewares).flat().filter(isGuardFn);
  const afterExtra = toArray(afterAllMiddlewares).flat().filter(isGuardFn);

  console.log('\n[3] BEFORE EXTRA', beforeExtra);
  console.log('[3] AFTER EXTRA', afterExtra);

  const before = uniqKeepOrder([...beforeCollected.handlers, ...beforeExtra]);
  const after = uniqKeepOrder([...afterCollected.handlers, ...afterExtra]);

  console.log('\n[4] BEFORE', before);
  console.log('[4] AFTER', after);

  // 3) separa o que já existia no preHandler, removendo before/after para não duplicar
  const existing = toArray(routeOptions.preHandler).filter(isGuardFn);

  console.log('\n[5] EXISTING', existing);

  const edgeSet = new Set<GuardFunction>([...before, ...after]);
  const existingCore = existing.filter((fn) => !edgeSet.has(fn));

  console.log('\n[6] EDGE SET', edgeSet);
  console.log('[6] EXISTING CORE', existingCore);


  // 4) incoming (middlewares do guard, ex: aclCache + jwtGuard + aclGuard)
  const incoming = middlewares.flat().filter(isGuardFn);

  console.log('\n[7] INCOMING', incoming);

  // não repetir o que já está no core
  const existingCoreSet = new Set(existingCore);
  const incomingOnlyNew = incoming.filter((fn) => !existingCoreSet.has(fn));

  console.log('\n[8] EXISTING CORE SET', existingCoreSet);
  console.log('[8] INCOMING ONLY NEW', incomingOnlyNew);

  console.log('\n[9] UNIQ KEEP ORDER', [
    ...before,
    ...existingCore,
    ...incomingOnlyNew,
    ...after,
  ]);

  // 5) compose final determinístico
  routeOptions.preHandler = uniqKeepOrder([
    ...before,
    ...existingCore,
    ...incomingOnlyNew,
    ...after,
  ]);

  console.log('\n[10] ROUTE OPTIONS PRE HANDLER', routeOptions.preHandler);

  // 6) debug: nomes dos middlewares aplicados (se o caller quiser usar)
  // - mantém Set
  // const dbg = cfg.debugMiddlewares ?? new Set<string>();

  // console.log('[11] DBG', dbg);

  // for (const n of beforeCollected.names) dbg.add(n);
  // for (const n of afterCollected.names) dbg.add(n);

  // cfg.debugMiddlewares = dbg;

  console.log('\n[12] NEW CFG', cfg);
  console.log('[12] ROUTE OPTIONS CONFIG', routeOptions.config);

  // garante que o config volte pro routeOptions.config
  routeOptions.config = { ...(routeOptions.config as any), ...cfg };

  console.log('\n[13] NEW ROUTE OPTIONS CONFIG', routeOptions.config);

  console.log('\n[14] NEW ROUTE OPTIONS', routeOptions);
  return routeOptions;
}
