import { FastifyInstance, RouteOptions } from "fastify";
import { GuardFunction } from "../../../types/fastify";

const uniq = <T>(arr: T[]) => {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const v of arr) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
};

const toArray = <T>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

const isGuardFn = (fn: unknown): fn is GuardFunction => typeof fn === "function";


/**
 * Regras:
 * - beforeAllMiddlewares sempre antes
 * - afterAllMiddlewares sempre depois
 * - mantém preHandlers “já existentes” (exceto os que são before/after)
 * - adiciona middlewares novos sem duplicar e sem repetir os já existentes
 * - preserva ordem de inserção
 */
export function setMiddlewaresV1(
  target: FastifyInstance & { beforeAllMiddlewares?: GuardFunction[]; afterAllMiddlewares?: GuardFunction[] },
  routeOptions: RouteOptions,
  middlewares: (GuardFunction | GuardFunction[] | undefined)[],
  beforeAllMiddlewares?: (GuardFunction | GuardFunction[] | undefined)[],
  afterAllMiddlewares?: (GuardFunction | GuardFunction[] | undefined)[]
) {

  console.log(`\n\n[0] [SET MIDDLEWARES] [${routeOptions.url}] middlewares to set:`, middlewares);
  console.log(`[1] [SET MIDDLEWARES] [${routeOptions.url}] middlewares to set:`, target.middlewares);
  console.log(`[2] [SET MIDDLEWARES] [${routeOptions.url}] beforeAllMiddlewares to set:`, target.beforeAllMiddlewares);
  console.log(`[3] [SET MIDDLEWARES] [${routeOptions.url}] afterAllMiddlewares to set:`, target.afterAllMiddlewares);

  const { afterAllGuards, beforeAllGuards } = Object.values(target.middlewares || {})
    .filter((middleware): middleware is NonNullable<typeof middleware> => !!middleware && middleware.handlers.length > 0)
    .reduce((acc, { strategy, handlers }) => {

      return {
        ...acc,
        [strategy]: [...acc[strategy], ...toArray(handlers)]
      }
    }, { beforeAllGuards: [] as GuardFunction[], afterAllGuards: [] as GuardFunction[] });


  console.log(`\n\n[X] [SET MIDDLEWARES] [${routeOptions.url}] middlewares to set:`, middlewares);
  console.log(`[X] [SET MIDDLEWARES] [${routeOptions.url}] beforeAllMiddlewares to set:`, beforeAllGuards, beforeAllMiddlewares);
  console.log(`[X] [SET MIDDLEWARES] [${routeOptions.url}] afterAllMiddlewares to set:`, afterAllGuards, afterAllMiddlewares);

  const before = [...(beforeAllGuards ?? []), ...toArray(beforeAllMiddlewares)].filter(isGuardFn);
  const after = [...(afterAllGuards ?? []), ...toArray(afterAllMiddlewares)].filter(isGuardFn);

  const existing = toArray(routeOptions.preHandler).filter(isGuardFn);

  // console.log(`\n\n[Y] [SET MIDDLEWARES] [${routeOptions.url}] existing preHandlers:`, existing);
  // console.log(`[Y] [SET MIDDLEWARES] [${routeOptions.url}] beforeAllMiddlewares to set:`, before);
  // console.log(`[Y] [SET MIDDLEWARES] [${routeOptions.url}] afterAllMiddlewares to set:`, after);

  // remove before/after caso já estejam no preHandler (evita duplicar)
  const edgeSet = new Set<GuardFunction>([...before, ...after]);
  const existingCore = existing.filter((fn) => !edgeSet.has(fn));

  // flatten middlewares do parâmetro e remove undefined
  const incoming = middlewares.flat().filter(isGuardFn);

  // evita inserir algo que já existe no core
  const existingCoreSet = new Set(existingCore);
  const incomingOnlyNew = incoming.filter((fn) => !existingCoreSet.has(fn));

  routeOptions.preHandler = uniq([
    ...before,
    ...existingCore,
    ...incomingOnlyNew,
    ...after,
  ]);

  return routeOptions;
}
