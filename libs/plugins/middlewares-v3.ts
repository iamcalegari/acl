import fp from "fastify-plugin";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type {
  GuardFunction,
  MiddlewareDefinition,
  MiddlewareName,
  MiddlewaresRegistryItem,
  PluginScope,
} from "../../types/fastify";

type Strategy = "beforeAllGuards" | "afterAllGuards";

type MiddlewaresPluginOpts = {
  root: FastifyInstance;
  middlewares?: MiddlewareDefinition[];
};

const toArray = <T>(v: T | T[] | undefined): T[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

const isGuardFn = (fn: unknown): fn is GuardFunction => typeof fn === "function";

function normalizeMiddlewareName(def: MiddlewareDefinition, idx: number) {
  return (
    def.name ||
    (typeof def.handlers === "function" && def.handlers.name) ||
    `mw_${idx}`
  );
}

function upsertMiddleware(
  target: FastifyInstance,
  name: MiddlewareName,
  item: MiddlewaresRegistryItem
) {
  if (!target.middlewares) target.decorate("middlewares", {});

  const existing = target.middlewares[name];

  // se já existir, mescla handlers mantendo ordem e sem duplicar
  const mergedHandlers = (() => {
    const current = existing?.handlers ?? [];
    const incoming = item.handlers ?? [];
    const seen = new Set<GuardFunction>();
    const out: GuardFunction[] = [];

    for (const fn of [...current, ...incoming]) {
      if (!seen.has(fn)) {
        seen.add(fn);
        out.push(fn);
      }
    }
    return out;
  })();

  target.middlewares[name] = {
    type: "middleware",
    scope: item.scope,
    registered: true,
    strategy: item.strategy,
    handlers: mergedHandlers,
  };
}

interface MiddlewareItem {
  scope: PluginScope;
  strategy: Strategy;
  handlers: GuardFunction[];
  name: MiddlewareName;
}

interface MiddlewareProcessingItem extends MiddlewareItem {
  item: MiddlewaresRegistryItem;
}

export const middlewaresPluginV3: FastifyPluginAsync<MiddlewaresPluginOpts> = fp(
  async (app: FastifyInstance, opts: MiddlewaresPluginOpts): Promise<void> => {
    const { root, middlewares = [] }: MiddlewaresPluginOpts = opts;

    // garante registries
    if (!root.middlewares) root.decorate("middlewares", {});
    if (!app.middlewares) app.decorate("middlewares", {});

    middlewares.forEach((def: MiddlewareDefinition, idx: number): void => {
      const scope: PluginScope = def.scope ?? "instance";
      const strategy: Strategy = def.strategy ?? "afterAllGuards";
      const handlers: GuardFunction[] = toArray(def.handlers).filter(isGuardFn);

      if (handlers.length === 0) return;

      const name: MiddlewareName = normalizeMiddlewareName(def, idx) as MiddlewareName;

      const item: MiddlewaresRegistryItem = {
        type: "middleware",
        scope,
        registered: true,
        strategy,
        handlers,
      };

      if (scope === "global") {
        // 1) guarda no root (fonte da verdade)
        upsertMiddleware(root, name, item);

        // 2) ESPELHA no app do escopo atual, para setMiddlewares(app, ...) enxergar
        upsertMiddleware(app, name, item);
      } else {
        // instance: só no app deste escopo
        upsertMiddleware(app, name, item);
      }
    });
  },
  { name: "middlewaresPluginV3" }
);
