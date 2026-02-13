import type { FastifyInstance, FastifyPluginAsync, RouteOptions } from "fastify";
import fp from "fastify-plugin";
import { RoutesGuards, SetupRoutesPluginOptions } from '../../types/fastify';
import { setGuardsRoute } from "./helpers/route-visibility.helpers";
import { getRouteConfig } from "./helpers/route-config.helpers";

const kModuleName = Symbol("moduleName");
const kSubModuleName = Symbol("subModuleName");
const kHookInstalled = Symbol("moduleHookInstalled");

type ModuleConfig = {
  guards?: Set<keyof RoutesGuards['guards']>;
  isPublic?: boolean;
  module?: string;
  subModule?: string;
  options?: SetupRoutesPluginOptions
}

export interface FastifyModule {
  [kModuleName]?: string;
  [kSubModuleName]?: string;
  [kHookInstalled]?: boolean;
}

declare module "fastify" {
  interface FastifyInstance extends FastifyModule { }
}


export const moduleNamingPlugin: FastifyPluginAsync<ModuleConfig> = fp(async (app, { options }: { options?: SetupRoutesPluginOptions } = {}) => {

  if (app[kHookInstalled] || app[kModuleName] !== undefined || app[kSubModuleName] !== undefined) {
    console.log(`Module: ${app[kModuleName]} \nSubModule: ${app[kSubModuleName]}`);
    console.warn("moduleNamingPlugin already installed");
    return;
  }

  app.decorate(kModuleName, undefined);
  app.decorate(kSubModuleName, undefined);
  app.decorate(kHookInstalled, false);

  function ensureHook(app: FastifyInstance) {

    if (app[kHookInstalled]) return;

    app[kHookInstalled] = true;

    app.addHook("onRoute", (routeOptions: RouteOptions) => {
      const current = getRouteConfig(routeOptions, options);

      const module = app[kModuleName] || current.module || '*' as string;
      const subModule = app[kSubModuleName] || current.subModule || '*' as string;

      // Se o plugin NÃO definiu module/subModule nesse escopo:
      // => default é rota pública (isPublic: true), sem mexer em module/subModule.
      if (!module && !subModule) return;

      // se a rota foi explicitamente marcada como pública, respeita
      if (current.isPublic === true) {
        // Manter module/subModule para logs/observabilidade:
        routeOptions.config = {
          ...current,
          module: current.module ?? module,
          subModule: current.subModule ?? subModule,
          isPublic: true,
        };
        return;
      }

      routeOptions.config = {
        ...current,
        module: current.module ?? module,
        subModule: current.subModule ?? subModule,
      };

      const { jwtGuard, aclGuard } = app?.guards || {};

      //  console.log('moduleNamingPlugin applying guards for route', routeOptions.url, { module, subModule, guards: current.guards });
      routeOptions.config = setGuardsRoute(app, routeOptions, { jwtGuard: jwtGuard?.preHandler, aclGuard: aclGuard?.preHandler });
    })
  }


  app.decorate("module", function (this: any, name: string) {
    app[kModuleName] = name;
    // this[kSubModuleName] = undefined; // opcional: reset subModule
    ensureHook(this);
  });

  app.decorate("subModule", function (this: any, name: string) {
    app[kSubModuleName] = name;
    ensureHook(this);
  });
});
