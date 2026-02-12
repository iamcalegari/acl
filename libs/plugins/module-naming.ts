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


export const moduleNamingPlugin: FastifyPluginAsync<ModuleConfig> = fp(async (fastify, { options }: { options?: SetupRoutesPluginOptions } = {}) => {

  if (fastify[kHookInstalled] || fastify[kModuleName] !== undefined || fastify[kSubModuleName] !== undefined) {
    console.log(`Module: ${fastify[kModuleName]} \nSubModule: ${fastify[kSubModuleName]}`);
    console.warn("moduleNamingPlugin already installed");
    return;
  }

  fastify.decorate(kModuleName, undefined);
  fastify.decorate(kSubModuleName, undefined);
  fastify.decorate(kHookInstalled, false);

  function ensureHook(fastify: FastifyInstance) {

    if (fastify[kHookInstalled]) return;

    fastify[kHookInstalled] = true;

    fastify.addHook("onRoute", (routeOptions: RouteOptions) => {
      const current = getRouteConfig(routeOptions, options);

      const module = fastify[kModuleName] || current.module || '*' as string;
      const subModule = fastify[kSubModuleName] || current.subModule || '*' as string;

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

      const { jwtGuard, aclCache, aclGuard } = fastify?.guards || {};

      //  console.log('moduleNamingPlugin applying guards for route', routeOptions.url, { module, subModule, guards: current.guards });
      routeOptions.config = setGuardsRoute(routeOptions, { jwtGuard: jwtGuard?.preHandler, aclCache: aclCache?.preHandler, aclGuard: aclGuard?.preHandler });
    })
  }


  fastify.decorate("module", function (this: any, name: string) {
    fastify[kModuleName] = name;
    // this[kSubModuleName] = undefined; // opcional: reset subModule
    ensureHook(this);
  });

  fastify.decorate("subModule", function (this: any, name: string) {
    fastify[kSubModuleName] = name;
    ensureHook(this);
  });
});
