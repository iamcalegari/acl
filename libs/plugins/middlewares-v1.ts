import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { GuardFunction, MiddlewaresRegistryItem, ServerMiddlewares } from "../../types/fastify";
import { setMiddlewares } from "./helpers/middlewares.helpers-v1";
import { normalizeDependencyName, registerGuardsDependencies } from "./helpers/plugin.helpers";


const kAfterAllMiddlewares = Symbol("kAfterAllMiddlewares");
const kBeforeAllMiddlewares = Symbol("kBeforeAllMiddlewares");
const kHookInstalled = Symbol("moduleName");
export interface FastifyModule {
  [kHookInstalled]?: boolean;
  [kBeforeAllMiddlewares]?: GuardFunction[];
  [kAfterAllMiddlewares]?: GuardFunction[];
  afterAllMiddlewares?: GuardFunction[];
  beforeAllMiddlewares?: GuardFunction[];
  kHookInstalled?: boolean;
  kBeforeAllMiddlewares?: GuardFunction[];
  kAfterAllMiddlewares?: GuardFunction[];
}

console.log('[MIDDLEWARES PLUGIN] Loading...');

declare module "fastify" {
  interface FastifyInstance extends FastifyModule { }
}

export const middlewaresPluginV1 = fp(async (app, { root, middlewares }: { root: FastifyInstance, middlewares: ServerMiddlewares[] }) => {
  if (app[kHookInstalled]) {
    console.warn("middlewaresPlugin already installed");
    return;
  }
  app.decorate('kHookInstalled', true);

  // console.log('\n[A] [kHookInstalled] [MIDDLEWARES PLUGIN]', root['kHookInstalled'], app['kHookInstalled']);
  // console.log('[A] [kBeforeAllMiddlewares] [MIDDLEWARES PLUGIN]', root['kBeforeAllMiddlewares'], app['kBeforeAllMiddlewares']);
  // console.log('[A] [kAfterAllMiddlewares] [MIDDLEWARES PLUGIN]', root['kAfterAllMiddlewares'], app['kAfterAllMiddlewares']);
  // app.decorate('kBeforeAllMiddlewares', []);
  // app.decorate('kAfterAllMiddlewares', []);


  // console.log('\n[B] [kHookInstalled] [MIDDLEWARES PLUGIN]', root['kHookInstalled'], app['kHookInstalled']);
  // console.log('[B] [kBeforeAllMiddlewares] [MIDDLEWARES PLUGIN]', root['kBeforeAllMiddlewares'], app['kBeforeAllMiddlewares']);
  // console.log('[B] [kAfterAllMiddlewares] [MIDDLEWARES PLUGIN]', root['kAfterAllMiddlewares'], app['kAfterAllMiddlewares']);
  // root.decorate('kHookInstalled', false);
  // root.decorate('kBeforeAllMiddlewares', []);
  // root.decorate('kAfterAllMiddlewares', []);

  // console.log('\n[B] [kHookInstalled] [MIDDLEWARES PLUGIN]', root['kHookInstalled'], app['kHookInstalled']);
  // console.log('[B] [kBeforeAllMiddlewares] [MIDDLEWARES PLUGIN]', root['kBeforeAllMiddlewares'], app['kBeforeAllMiddlewares']);
  // console.log('[B] [kAfterAllMiddlewares] [MIDDLEWARES PLUGIN]', root['kAfterAllMiddlewares'], app['kAfterAllMiddlewares']);

  // root.decorate('kHookInstalled', false);
  // root.decorate('kBeforeAllMiddlewares', []);
  // root.decorate('kAfterAllMiddlewares', []);

  // console.log('\n[C] [kHookInstalled] [MIDDLEWARES PLUGIN]', root['kHookInstalled'], app['kHookInstalled']);
  // console.log('[C] [kBeforeAllMiddlewares] [MIDDLEWARES PLUGIN]', root['kBeforeAllMiddlewares'], app['kBeforeAllMiddlewares']);
  // console.log('[C] [kAfterAllMiddlewares] [MIDDLEWARES PLUGIN]', root['kAfterAllMiddlewares'], app['kAfterAllMiddlewares']);

  console.log("[MIDDLEWARES PLUGIN] Initializing plugin with middlewares:", middlewares);

  // garante registries
  if (!root.middlewares) root.decorate("middlewares", {});
  if (!root.afterAllMiddlewares) root.decorate("afterAllMiddlewares", []);
  if (!root.beforeAllMiddlewares) root.decorate("beforeAllMiddlewares", []);


  if (!Object.keys(app?.middlewares)?.length) app.decorate("middlewares", { ...root.middlewares });
  if (!app.beforeAllMiddlewares) app.decorate("beforeAllMiddlewares", [...root?.beforeAllMiddlewares || []]);
  if (!app.afterAllMiddlewares) app.decorate("afterAllMiddlewares", [...root?.afterAllMiddlewares || []]);

  console.log('\n[C] [beforeAllMiddlewares] [MIDDLEWARES PLUGIN]', root['beforeAllMiddlewares'], app['beforeAllMiddlewares']);
  console.log('[C] [afterAllMiddlewares] [MIDDLEWARES PLUGIN]', root['afterAllMiddlewares'], app['afterAllMiddlewares']);


  console.log("[MIDDLEWARES PLUGIN] Registering middlewares...");
  console.log("[MIDDLEWARES PLUGIN] middlewares.length:", middlewares.length);
  console.log("\n[MIDDLEWARES PLUGIN] root.middlewares:", root.middlewares);
  console.log("[MIDDLEWARES PLUGIN] app.middlewares:", app.middlewares);


  console.log("\n\n[MIDDLEWARES PLUGIN] root.middlewares:", !!Object.keys(root.middlewares).length);
  console.log("[MIDDLEWARES PLUGIN] app.middlewares:", !!Object.keys(app.middlewares).length);


  if ((!Array.isArray(middlewares) || !middlewares.length) && !Object.keys(root.middlewares).length) {
    console.log("No middlewares to register.");
    return;
  }

  let instanceHandlers: GuardFunction[] = [];
  let instanceBeforeHandlers: GuardFunction[] = [];
  let instanceAfterHandlers: GuardFunction[] = [];

  // 1) Registra middlewares (apenas metadados + handlers)
  for (const middleware of middlewares) {
    const middlewareName = (middleware.name || `middleware_${Object.keys(app.middlewares).length + 1}`);

    const { dependencies = [], scope = "instance", strategy = "afterAllGuards" } = middleware;

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

      handlers: [...handlers].flat(),
      type: "middleware",
      registered: true,
      strategy,
      scope: scope,
    }

    console.log(`[MIDDLEWARES PLUGIN] Registering middleware "${middlewareName}" with strategy "${strategy}" and scope "${scope}". Handlers:`, middlewareCfg.handlers);

    if (scope === "global") {
      root.middlewares[middlewareName] = middlewareCfg;
      console.log(`\n\n[X] [MIDDLEWARES PLUGIN] Updated ${scope} middlewares:\nBEFORE`, root['beforeAllMiddlewares'], '\nAFTER', root['afterAllMiddlewares']);
      console.log(`\n[X] [MIDDLEWARES PLUGIN] NOT UPDATED ${scope} middlewares:\nBEFORE`, app['beforeAllMiddlewares'], '\nAFTER', app['afterAllMiddlewares']);


      if (strategy === "beforeAllGuards") {
        root.beforeAllMiddlewares ? root.beforeAllMiddlewares.push(...middlewareCfg.handlers) : root.beforeAllMiddlewares = [...middlewareCfg.handlers].flat();
      } else {
        root.afterAllMiddlewares ? root.afterAllMiddlewares.push(...middlewareCfg.handlers) : root.afterAllMiddlewares = [...middlewareCfg.handlers].flat();
      }
      console.log(`\n[Y] [MIDDLEWARES PLUGIN] Updated ${scope} middlewares:\nBEFORE`, root['beforeAllMiddlewares'], '\nAFTER', root['afterAllMiddlewares']);
      console.log(`\n[Y] [MIDDLEWARES PLUGIN] NOT UPDATED ${scope} middlewares:\nBEFORE`, app['beforeAllMiddlewares'], '\nAFTER', app['afterAllMiddlewares']);

    } else {
      app.middlewares[middlewareName] = middlewareCfg;

      console.log(`\n\n[A] [MIDDLEWARES PLUGIN] Updated ${scope} middlewares:\nBEFORE`, app['beforeAllMiddlewares'], '\nAFTER', app['afterAllMiddlewares']);
      console.log(`\n[A] [MIDDLEWARES PLUGIN] NOT UPDATED ${scope} middlewares:\nBEFORE`, root['beforeAllMiddlewares'], '\nAFTER', root['afterAllMiddlewares']);

      if (strategy === "beforeAllGuards") {
        app.beforeAllMiddlewares ? app.beforeAllMiddlewares.push(...middlewareCfg.handlers) : app.beforeAllMiddlewares = [...middlewareCfg.handlers].flat();
      } else {
        app.afterAllMiddlewares ? app.afterAllMiddlewares.push(...middlewareCfg.handlers) : app.afterAllMiddlewares = [...middlewareCfg.handlers].flat();
      }
      console.log(`\n[B] [MIDDLEWARES PLUGIN] Updated ${scope} middlewares:\nBEFORE`, app['beforeAllMiddlewares'], '\nAFTER', app['afterAllMiddlewares']);
      console.log(`\n[B] [MIDDLEWARES PLUGIN] NOT UPDATED ${scope} middlewares:\nBEFORE`, root['beforeAllMiddlewares'], '\nAFTER', root['afterAllMiddlewares']);
    }

    // console.log(`\n[A] [MIDDLEWARES PLUGIN] INSTANCE HANDLERS:`, instanceHandlers);
    // console.log(`[A] [MIDDLEWARES PLUGIN] INSTANCE BEFORE HANDLERS:`, instanceBeforeHandlers);
    // console.log(`[A] [MIDDLEWARES PLUGIN] INSTANCE AFTER HANDLERS:`, instanceAfterHandlers);

    // if (strategy === "beforeAllGuards") {
    //   target.beforeAllMiddlewares ? target.beforeAllMiddlewares.push(...middlewareCfg.handlers) : target.beforeAllMiddlewares = [middlewareCfg.handlers].flat();
    //   instanceBeforeHandlers = [...instanceBeforeHandlers, ...middlewareCfg.handlers];
    // } else if (strategy === "afterAllGuards") {
    //   target.afterAllMiddlewares ? target.afterAllMiddlewares.push(...middlewareCfg.handlers) : target.afterAllMiddlewares = [middlewareCfg.handlers].flat();
    //   instanceAfterHandlers = [...instanceAfterHandlers, ...middlewareCfg.handlers];
    // } else {
    //   instanceHandlers = [...instanceHandlers, ...middlewareCfg.handlers];
    // }

    // console.log(`\n\n[B] [MIDDLEWARES PLUGIN] INSTANCE HANDLERS:`, instanceHandlers);
    // console.log(`[B] [MIDDLEWARES PLUGIN] INSTANCE BEFORE HANDLERS:`, instanceBeforeHandlers);
    // console.log(`[B] [MIDDLEWARES PLUGIN] INSTANCE AFTER HANDLERS:`, instanceAfterHandlers);

    // console.log(`[1] [ROOT] [MIDDLEWARES PLUGIN] ${scope.toUpperCase()} middlewares before registering "${middlewareName}":`, root.middlewares);
    // console.log(`[1] [APP] [MIDDLEWARES PLUGIN] ${scope.toUpperCase()} middlewares before registering "${middlewareName}":`, app.middlewares);

    // Se for escopo de instância, remove do outro escopo para evitar conflitos

    // if (scope === "instance") {
    //   delete app.middlewares[middlewareName];
    // }
    // console.log(`[2] [ROOT] [MIDDLEWARES PLUGIN] ${scope.toUpperCase()} middlewares after registering "${middlewareName}":`, root.middlewares);
    // console.log(`[2] [APP] [MIDDLEWARES PLUGIN] ${scope.toUpperCase()} middlewares after registering "${middlewareName}":`, app.middlewares);


  }

  // 3) Agora registra dependências no target correto
  // global -> root, instance -> app
  await registerGuardsDependencies(root, app);

  // Agora adiciona hook para aplicar middlewares nas rotas
  root.addHook('onRoute', async (routeOptions) => {
    const handlers = instanceHandlers.length > 0 ? instanceHandlers : [];
    // const beforeHandlers = instanceBeforeHandlers.length > 0 ? instanceBeforeHandlers : [];
    // const afterHandlers = instanceAfterHandlers.length > 0 ? instanceAfterHandlers : [];

    // console.log("[onRoute] [MIDDLEWARES PLUGIN] onRoute hook called");
    // console.log("[onRoute] [MIDDLEWARES PLUGIN] [APP]", app.middlewares);
    // console.log("[onRoute] [MIDDLEWARES PLUGIN] [ROOT]", root.middlewares);
    // console.log("[onRoute] [MIDDLEWARES PLUGIN] [MEMORY]", handlers);

    setMiddlewares(app, routeOptions, handlers, instanceBeforeHandlers, instanceAfterHandlers);

    // console.log("[onRoute] [MIDDLEWARES PLUGIN] routeOptions.preHandler after setMiddlewares:", routeOptions.preHandler);

  });
},
  {
    name: "middlewaresPluginV1",
  }
);
