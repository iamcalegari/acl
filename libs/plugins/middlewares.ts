import fp from "fastify-plugin";
import type { FastifyInstance, FastifyPluginAsync, RouteOptions as FRouteOptions } from "fastify";
import type { GuardFunction, MiddlewareDefinition, PluginScope } from "../../types/fastify";

type Strategy = "beforeAllGuards" | "afterAllGuards";

type MiddlewaresPluginOpts = {
  root: FastifyInstance;
  middlewares?: MiddlewareDefinition[];
};

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

declare module "fastify" {
  interface FastifyInstance {
    __mwGlobalBefore?: GuardFunction[];
    __mwGlobalAfter?: GuardFunction[];
    __mwInstanceBefore?: GuardFunction[];
    __mwInstanceAfter?: GuardFunction[];
    __mwScopeHookInstalled?: boolean;
  }
}

function bucketize(mws: MiddlewareDefinition[] = []) {
  const gBefore: GuardFunction[] = [];
  const gAfter: GuardFunction[] = [];
  const iBefore: GuardFunction[] = [];
  const iAfter: GuardFunction[] = [];

  for (const mw of mws) {
    const scope: PluginScope = mw.scope ?? "instance";
    const strategy: Strategy = mw.strategy ?? "afterAllGuards";
    const handlers = toArray(mw.handlers).filter(isFn);
    if (handlers.length === 0) continue;

    if (scope === "global") {
      (strategy === "beforeAllGuards" ? gBefore : gAfter).push(...handlers);
    } else {
      (strategy === "beforeAllGuards" ? iBefore : iAfter).push(...handlers);
    }
  }

  return { gBefore, gAfter, iBefore, iAfter };
}

function applyToRoute(route: FRouteOptions, before: GuardFunction[], after: GuardFunction[]) {
  const existing = toArray(route.preHandler).filter(isFn);
  const edgeSet = new Set<GuardFunction>([...before, ...after]);
  const core = existing.filter((fn) => !edgeSet.has(fn));
  route.preHandler = uniqKeepOrder([...before, ...core, ...after]);
}

const hasOwn = (obj: object, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(obj, key);

function ensureOwnArray<T extends object>(obj: T, key: keyof T) {
  if (!hasOwn(obj, key)) {
    // @ts-expect-error - criando propriedade dinamicamente
    obj[key] = [];
  }
  return obj[key] as unknown as any[];
}

function ensureOwnBool<T extends object>(obj: T, key: keyof T, initial = false) {
  if (!hasOwn(obj, key)) {
    // @ts-expect-error
    obj[key] = initial;
  }
  return obj[key] as boolean;
}

export const middlewaresPlugin: FastifyPluginAsync<MiddlewaresPluginOpts> = fp(
  async (app: FastifyInstance, opts: MiddlewaresPluginOpts) => {
    const { root, middlewares = [] } = opts;

    //  garante arrays como OWN PROPERTY (evita “vazar” instance entre escopos)
    ensureOwnArray(root, "__mwGlobalBefore");
    ensureOwnArray(root, "__mwGlobalAfter");
    ensureOwnArray(app, "__mwInstanceBefore");
    ensureOwnArray(app, "__mwInstanceAfter");
    ensureOwnBool(app, "__mwScopeHookInstalled", false);

    const { gBefore, gAfter, iBefore, iAfter } = bucketize(middlewares);

    // globais no root
    root.__mwGlobalBefore!.push(...gBefore);
    root.__mwGlobalAfter!.push(...gAfter);

    // instance no escopo atual (own)
    app.__mwInstanceBefore!.push(...iBefore);
    app.__mwInstanceAfter!.push(...iAfter);

    if (!app.__mwScopeHookInstalled) {
      app.__mwScopeHookInstalled = true;

      app.addHook("onRoute", (route: FRouteOptions) => {
        const before = uniqKeepOrder([
          ...(root.__mwGlobalBefore ?? []),
          ...(app.__mwInstanceBefore ?? []),
        ]);

        const after = uniqKeepOrder([
          ...(root.__mwGlobalAfter ?? []),
          ...(app.__mwInstanceAfter ?? []),
        ]);

        applyToRoute(route, before, after);
      });
    }
  },
  { name: "middlewaresPlugin" }
);
