import { RouteOptions } from "fastify";
import { GuardName, ModuleConfig, SetupRoutesPluginOptions } from "../../../types/fastify";

export const getRouteConfig = (routeOptions: RouteOptions, options?: SetupRoutesPluginOptions) => {
  const routeConfig: Partial<ModuleConfig> = routeOptions.config && options?.allowRouteControl === true
    ? { ...routeOptions.config, guards: routeOptions.config?.guards || new Set<GuardName>([]) }
    : {
      guards: routeOptions.config?.guards || new Set<GuardName>([])
    };

  return routeConfig;
}
