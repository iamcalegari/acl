import type { FastifyPluginAsync, RouteOptions } from "fastify";
import fp from "fastify-plugin";
import { SetupRoutesPluginOptions } from "../../types/fastify";
import { getRouteConfig } from "./helpers/route-config.helpers";
import { setGuardsRoute } from "./helpers/guards.helpers";


export const authGuardsPlugin: FastifyPluginAsync = fp(async (app, { force, options }: { force?: boolean, options?: SetupRoutesPluginOptions } = {}) => {
  app.addHook("onRoute", (route: RouteOptions) => {

    const cfg = getRouteConfig(route, options);
    // console.log('\n[DEFAULT PUBLIC PLUGIN] ON ROUTE: ', route.url, 'CONFIG: ', route.config, 'FORCE: ', force, 'GUARDS: ', app?.guards);

    const { isPublic } = cfg;
    route.config = { ...cfg, isPublic: isPublic ?? !force };


    const { auth } = app?.guards || {};

    route.config = setGuardsRoute(app, route, { auth }, force ?? false);
  });
}, { name: 'authGuardsPlugin' });
