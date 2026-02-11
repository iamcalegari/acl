import type { FastifyInstance, FastifyPluginAsync, RouteOptions } from "fastify";
import fp from "fastify-plugin";
import { RoutesGuards } from '../../types/fastify';
import { setGuardsRoute } from "./helpers/route-visibility.helpers";

const kModuleName = Symbol("moduleName");
const kSubModuleName = Symbol("subModuleName");
const kHookInstalled = Symbol("moduleHookInstalled");

type ModuleConfig = {
  guards?: Set<keyof RoutesGuards['guards']>;
  isPublic?: boolean;
  module?: string;
  subModule?: string;
}

export interface FastifyModule {
  [kModuleName]?: string;
  [kSubModuleName]?: string;
  [kHookInstalled]?: boolean;
}

declare module "fastify" {
  interface FastifyInstance extends FastifyModule { }
}


export const moduleNamingPlugin: FastifyPluginAsync<ModuleConfig> = fp(async (fastify) => {

  if (fastify[kHookInstalled] || fastify[kModuleName] !== undefined || fastify[kSubModuleName] !== undefined) {
    //  console.log(`Module: ${fastify[kModuleName]} \nSubModule: ${fastify[kSubModuleName]}`);
    //  console.warn("moduleNamingPlugin already installed");
    return;
  }

  fastify.decorate(kModuleName, undefined);
  fastify.decorate(kSubModuleName, undefined);
  fastify.decorate(kHookInstalled, false);

  function ensureHook(fastify: FastifyInstance) {

    if (fastify[kHookInstalled]) return;
    fastify[kHookInstalled] = true;

    fastify.addHook("onRoute", (routeOptions: RouteOptions) => {
      const current = (routeOptions.config ?? {}) as Required<ModuleConfig>;
      //  console.log({ url: routeOptions.url, route: routeOptions, config: current }, "registered");

      //  console.log('moduleNamingPlugin onRoute', routeOptions);

      const module = fastify[kModuleName] as string | undefined;
      const subModule = fastify[kSubModuleName] as string | undefined;

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

      const { jwtGuard, aclGuard } = fastify?.guards || {};

      //  console.log('moduleNamingPlugin applying guards for route', routeOptions.url, { module, subModule, guards: current.guards });
      routeOptions.config = setGuardsRoute(routeOptions, { jwtGuard: jwtGuard.preHandler, aclGuard: aclGuard.preHandler });
    })
  }

  fastify.decorate("module", function (this: any, name: string) {
    //  console.log('moduleNamingPlugin [module]', name);

    fastify[kModuleName] = name;
    // this[kSubModuleName] = undefined; // opcional: reset subModule
    ensureHook(this);
  });

  fastify.decorate("subModule", function (this: any, name: string) {
    //  console.log('moduleNamingPlugin [subModule]', name);

    fastify[kSubModuleName] = name;
    ensureHook(this);
  });
});
