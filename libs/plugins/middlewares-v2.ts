import fp from "fastify-plugin";
import type { FastifyInstance, FastifyPluginAsync, RouteOptions as FRouteOptions } from "fastify";
import type { GuardFunction, MiddlewareDefinition, PluginScope } from "../../types/fastify";

type Strategy = "beforeAllGuards" | "afterAllGuards";

type MiddlewaresPluginOpts = {
  root: FastifyInstance;
  middlewares?: MiddlewareDefinition[];
};

declare module "fastify" {
  interface FastifyInstance {
    __mwGlobalBefore?: GuardFunction[];
    __mwGlobalAfter?: GuardFunction[];
    __mwInstanceBefore?: GuardFunction[];
    __mwInstanceAfter?: GuardFunction[];
  }
}

const toArray = <T>(v: T | T[] | undefined): T[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

const isFn = (x: unknown): x is GuardFunction => typeof x === "function";

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

function bucketize(mws: MiddlewareDefinition[] = []) {
  const gBefore: GuardFunction[] = [];
  const gAfter: GuardFunction[] = [];
  const iBefore: GuardFunction[] = [];
  const iAfter: GuardFunction[] = [];

  for (const mw of mws) {
    const scope: PluginScope = mw.scope ?? "instance";
    const strategy: Strategy = mw.strategy ?? "afterAllGuards";
    const handlers = toArray(mw.handlers).filter(isFn);

    if (scope === "global") {
      (strategy === "beforeAllGuards" ? gBefore : gAfter).push(...handlers);
    } else {
      (strategy === "beforeAllGuards" ? iBefore : iAfter).push(...handlers);
    }
  }

  return { gBefore, gAfter, iBefore, iAfter };
}

/**
 * Injeta middlewares respeitando:
 * - global: entra em api + public
 * - instance: entra só no escopo
 * - beforeAllGuards: entra antes do chain existente (guards + deps)
 * - afterAllGuards: entra depois do chain existente
 * - NÃO duplica
 */
export const middlewaresPluginV2: FastifyPluginAsync<MiddlewaresPluginOpts> = fp(
  async (app: FastifyInstance, opts: MiddlewaresPluginOpts) => {
    const { root, middlewares = [] } = opts;

    // storage
    root.__mwGlobalBefore ??= [];
    root.__mwGlobalAfter ??= [];
    app.__mwInstanceBefore ??= [];
    app.__mwInstanceAfter ??= [];

    const { gBefore, gAfter, iBefore, iAfter } = bucketize(middlewares);

    // "global" deve ir pro root (para alcançar api + public)
    root.__mwGlobalBefore.push(...gBefore);
    root.__mwGlobalAfter.push(...gAfter);

    // "instance" fica só no escopo atual
    app.__mwInstanceBefore.push(...iBefore);
    app.__mwInstanceAfter.push(...iAfter);

    // injeção por rota
    app.addHook("onRoute", (route: FRouteOptions) => {
      console.log('\n[MIDDLEWARES PLUGIN] onRoute:', route.url, 'CONFIG: ', route.config, 'GUARDS: ', app?.guards);

      const existing = toArray(route.preHandler).filter(isFn);

      console.log(`\n[A] EXISTING:`, existing);

      const before = uniqKeepOrder([
        ...(root.__mwGlobalBefore ?? []),
        ...(app.__mwInstanceBefore ?? []),
      ]);

      const after = uniqKeepOrder([
        ...(root.__mwGlobalAfter ?? []),
        ...(app.__mwInstanceAfter ?? []),
      ]);

      console.log(`\n[B] BEFORE:`, before);
      console.log(`[B] AFTER:`, before);


      // evita duplicar caso algum já esteja em preHandler
      const edgeSet = new Set<GuardFunction>([...before, ...after]);
      const core = existing.filter((fn) => !edgeSet.has(fn));


      console.log(`\n[C] EDGE SET:`, edgeSet);
      console.log(`[C] CORE:`, core);

      route.preHandler = uniqKeepOrder([...before, ...core, ...after]);

      // opcional: debug no config (você já tem debugMiddlewares?: Set<string>)
      // (route.config ??= {}).debugMiddlewares = new Set([...((route.config as any)?.debugMiddlewares ?? []), ...]);
    });
  },
  { name: "middlewaresPluginV2" }
);
