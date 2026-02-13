import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { GuardFunction, MiddlewaresRegistryItem, ServerMiddlewares } from "../../types/fastify";
import { normalizeDependencyName, registerGuardsDependencies } from "./helpers/plugin.helpers";
import { setMiddlewares } from "./helpers/route-visibility.helpers";


const kHookInstalled = Symbol("moduleName");
export interface FastifyModule {
  [kHookInstalled]?: boolean;
  afterAllMiddlewares?: GuardFunction[];
  beforeAllMiddlewares?: GuardFunction[];
}

declare module "fastify" {
  interface FastifyInstance extends FastifyModule { }
}

export const middlewaresPlugin = fp(async (app, { root, middlewares }: { root: FastifyInstance, middlewares: ServerMiddlewares[] }) => {
  if (app[kHookInstalled]) {
    console.warn("middlewaresPlugin already installed");
    return;
  }

  app.decorate(kHookInstalled, false);

  // garante registries
  if (!root.middlewares) root.decorate("middlewares", {});
  if (!app.middlewares) app.decorate("middlewares", {});

  if (!root.beforeAllMiddlewares) root.decorate("beforeAllMiddlewares", []);
  if (!app.beforeAllMiddlewares) app.decorate("beforeAllMiddlewares", []);

  if (!root.afterAllMiddlewares) root.decorate("afterAllMiddlewares", []);
  if (!app.afterAllMiddlewares) app.decorate("afterAllMiddlewares", []);


  if (!Array.isArray(middlewares) || middlewares.length === 0) {
    console.log("No middlewares to register.");
  }

  // 1) Registra middlewares (apenas metadados + handlers)
  for (const middleware of middlewares) {
    const middlewareName = (middleware.name || `middleware_${Object.keys(app.middlewares).length + 1}`);

    const { dependencies = [], scope = "instance", strategy = "afterAllGuards" } = middleware;

    let globalHandlers = root.middlewares ? Object.values(root.middlewares).map(m => m?.handlers) : [] as any[];
    let handlers = Array.isArray(middleware.handlers) ? middleware.handlers : [middleware.handlers];


    // // se já existir, respeita o primeiro (evita sobrescrever config)
    if (app.middlewares[middlewareName] || root.middlewares[middlewareName]) {
      continue;
    };

    const target = scope === "global" ? root : app;

    // 2) Enfileira dependências (não registra aqui ainda)
    for (const { options, ...dep } of dependencies) {
      const { middlewares, plugin, scope = "instance" } = dep;

      const name = normalizeDependencyName(dep, middlewareName);

      if (middlewares) {
        const middlewaresArray = Array.isArray(middlewares) ? middlewares : [middlewares];

        handlers = [...middlewaresArray, ...handlers];
      }

      // se já existir, respeita o primeiro (evita sobrescrever config)
      if (!plugin || app.plugins[name]) continue;

      const target = scope === "global" ? root : app;

      target.plugins[name] = {
        plugin: plugin,
        scope,
        type: "dependency",
        registered: false,
        options: options ?? {},
      };
    }

    const middlewareCfg: MiddlewaresRegistryItem = {
      handlers: [...globalHandlers, ...handlers],
      type: "middleware",
      registered: false,
      strategy,
      scope: scope,
    }

    target.middlewares[middlewareName] = middlewareCfg;

    if (strategy === "beforeAllGuards") {
      target.beforeAllMiddlewares ? target.beforeAllMiddlewares.push(...middlewareCfg.handlers) : target.beforeAllMiddlewares = [middlewareCfg.handlers].flat();
    } else {
      target.afterAllMiddlewares ? target.afterAllMiddlewares.push(...middlewareCfg.handlers) : target.afterAllMiddlewares = [middlewareCfg.handlers].flat();
    }
  }

  // 3) Agora registra dependências no target correto
  // global -> root, instance -> app
  await registerGuardsDependencies(root, app);

  // Agora adiciona hook para aplicar middlewares nas rotas
  app.addHook('onRoute', async (routeOptions) => {
    setMiddlewares(app, routeOptions);
  });
},
  {
    name: "middlewaresPlugin",
  }
);
