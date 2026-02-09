import type { FastifyPluginAsync, RouteOptions } from "fastify";
import fp from "fastify-plugin";
import { setGuardsRoute } from "./helpers/route-visibility.helpers";
import { GuardName } from "../../types/fastify";

export const defaultPublicPlugin: FastifyPluginAsync = fp(async (app) => {
  app.addHook("onRoute", (route: RouteOptions) => {
    const cfg = (route.config ?? {}) as any;

    route.config = { ...cfg, guards: new Set<GuardName>([]) };

    route.config = setGuardsRoute(route, { jwtGuard: app.jwtGuard });

    console.log("DEFAULT PUBLIC ROUTE", JSON.stringify(route, null, 2));
  });
});
