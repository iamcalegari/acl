import AutoLoad from "@fastify/autoload";
import Fastify, { FastifyInstance } from "fastify";
import { RouteConfig, RouteOptions, ServerGuards, ServerMiddlewares, ServerSetupOptions } from "../types/fastify";
import { authGuardsPlugin } from "./plugins/auth-guards";
import { guardsPlugin } from "./plugins/guards";
import { middlewaresPlugin } from "./plugins/middlewares";
import { moduleNamingPlugin } from './plugins/module-naming';

export type SetupRoutesOptions = Omit<RouteConfig, 'path'>

export interface SetupFastifyOptions {
  guardsOptions?: ServerGuards,
  middlewaresOptions?: ServerMiddlewares[],
  defaultPublicOptions?: {
    force?: boolean
  },
  routeOptions?: SetupRoutesOptions
}

export class Server {
  protected app: FastifyInstance;

  constructor(protected port = process.env.PORT || 3000) {
    this.port = port;
    this.app = Fastify({ logger: true });
  }

  public async init({ apiRoutes, publicRoutes }: ServerSetupOptions): Promise<void> {
    // 1) Coleta todos os middlewares globais (api + public)
    const apiMws = apiRoutes?.middlewares ?? [];
    const pubMws = publicRoutes?.middlewares ?? [];

    const { global: apiGlobal } = this.splitMiddlewaresByScope(apiMws);
    const { global: pubGlobal } = this.splitMiddlewaresByScope(pubMws);

    const allGlobal = [...apiGlobal, ...pubGlobal];
    console.log(`\n\n GLOBAL MIDDLEWARES:`, allGlobal, `\n\n`);

    // 2) Registra o plugin de middlewares no ROOT antes de qualquer rota
    await this.app.register(middlewaresPlugin, { root: this.app, middlewares: allGlobal });


    // 3) Agora registra os escopos normalmente (api/public)
    console.log("Setting up private routes on path: " + apiRoutes?.path + "...");
    if (apiRoutes) {
      const { path, allowRouteControl = false, options, guards = {}, middlewares = [] } = apiRoutes;

      const { instance: apiInstance } = this.splitMiddlewaresByScope(middlewares);

      await this.setupFastify(path, {
        routeOptions: { allowRouteControl, options },
        guardsOptions: guards,
        middlewaresOptions: apiInstance,      //  só instance aqui
        defaultPublicOptions: { force: true },
      });
    } else {
      console.warn("API path not provided. Skipping route setup...");
    }

    console.log("Setting up public routes on path: " + publicRoutes?.path + "...");
    if (publicRoutes) {
      const { path, allowRouteControl = false, options, guards = {}, middlewares = [] } = publicRoutes;

      const { instance: pubInstance } = this.splitMiddlewaresByScope(middlewares);

      console.log(`\n\n PUBLIC MIDDLEWARES:`, pubInstance, `\n\n`);

      await this.setupFastify(path, {
        routeOptions: { allowRouteControl, options },
        guardsOptions: guards,
        middlewaresOptions: pubInstance,      //  só instance aqui
        defaultPublicOptions: { force: false },
      });
    } else {
      console.warn("Public path not provided. Skipping route setup...");
    }
  }

  public getApp(): FastifyInstance {
    return this.app;
  }

  public start(): void {
    this.app.listen({ port: +this.port }, () => {
      console.info(`Server listening on http://localhost:${this.port}`);
    });
  }

  private async setRoutes(app: FastifyInstance, routesPath: string, { options }: { options?: RouteOptions } = {}) {
    console.log(`Registering routes from path: ${routesPath}...`);
    await app.register(AutoLoad, { dir: routesPath, dirNameRoutePrefix: false, maxDepth: 3, options });
  }


  private async setPlugins(
    app: FastifyInstance,
    guardsOptions: ServerGuards,
    defaultPublicOptions: Parameters<typeof authGuardsPlugin>[1] = {},
    middlewaresOptions: ServerMiddlewares[] = []
  ) {
    await app.register(guardsPlugin, {
      root: this.app,
      guards: guardsOptions,
    });

    await app.register(authGuardsPlugin, defaultPublicOptions);

    // moduleNaming aplica guards (setGuardsRoute) e monta o chain
    await app.register(moduleNamingPlugin, defaultPublicOptions);

    // agora “abraça” com before/after (instance do escopo + globais do root)
    if (middlewaresOptions.length > 0) {
      await app.register(middlewaresPlugin, {
        root: this.app,
        middlewares: middlewaresOptions, // aqui só instance (já filtrado no init)
      });
    }
  }

  private async setupFastify(routesPath: string, { routeOptions, guardsOptions, defaultPublicOptions, middlewaresOptions }: SetupFastifyOptions = {}) {
    await this.app.register(async (app) => {
      await this.setPlugins(app, guardsOptions || {}, { ...defaultPublicOptions, options: routeOptions || {} }, middlewaresOptions || []);

      await this.setRoutes(app, routesPath, { options: routeOptions?.options });
    })
  }

  private splitMiddlewaresByScope(mws: ServerMiddlewares[] = []) {
    const global: ServerMiddlewares[] = [];
    const instance: ServerMiddlewares[] = [];

    for (const mw of mws) {
      (mw.scope === "global" ? global : instance).push(mw);
    }

    return { global, instance };
  };
}
