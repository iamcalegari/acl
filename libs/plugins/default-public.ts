import type { FastifyPluginAsync, RouteOptions } from "fastify";
import fp from "fastify-plugin";
import { SetupRoutesPluginOptions } from "../../types/fastify";
import { getRouteConfig } from "./helpers/route-config.helpers";
import { setGuardsRoute } from "./helpers/route-visibility.helpers";


export const defaultPublicPlugin: FastifyPluginAsync = fp(async (app, { force, options }: { force?: boolean, options?: SetupRoutesPluginOptions } = {}) => {
  app.addHook("onRoute", (route: RouteOptions) => {

    const cfg = getRouteConfig(route, options);

    const { isPublic } = cfg;
    route.config = { ...cfg, isPublic: isPublic ?? !force };

    // console.log('DEFAULT PUBLIC PLUGIN - ON ROUTE: ', route.url, 'CONFIG: ', route.config, 'FORCE: ', force, 'GUARDS: ', app?.guards);

    route.config = setGuardsRoute(route, { jwtGuard: app?.guards?.jwtGuard?.preHandler }, force ?? false);
  });
});
