import type { FastifyPluginAsync, RouteOptions } from "fastify";
import fp from "fastify-plugin";
import { GuardName } from "../../types/fastify";
import { setGuardsRoute } from "./helpers/route-visibility.helpers";


export const defaultPublicPlugin: FastifyPluginAsync = fp(async (app, { force }: { force?: boolean } = {}) => {
  app.addHook("onRoute", (route: RouteOptions) => {
    const cfg = (route.config ?? {}) as any;
    route.config = { ...cfg, guards: new Set<GuardName>([]) };

    // console.log('DEFAULT PUBLIC PLUGIN - ON ROUTE: ', route.url, 'CONFIG: ', route.config, 'FORCE: ', force, 'GUARDS: ', app?.guards);
    route.config = setGuardsRoute(route, { jwtGuard: app?.guards?.jwtGuard?.preHandler }, force ?? false);
  });
});
