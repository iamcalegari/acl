import fp from "fastify-plugin";
import type { FastifyPluginAsync, RouteOptions } from "fastify";

export const routeDebugPlugin: FastifyPluginAsync = fp(async (app) => {
  app.addHook("onRoute", (route: RouteOptions) => {
    app.log.info(
      {
        method: route.method,
        url: route.url,
        config: route.config,
        hasPreHandler: Boolean(route.preHandler),
      },
      "route registered"
    );
  });
});
