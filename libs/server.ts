import AutoLoad from "@fastify/autoload";
import Fastify, { FastifyInstance } from "fastify";
import { RouteConfig, RouteOptions, ServerGuards, ServerMiddlewares, ServerSetupOptions } from "../types/fastify";
import { defaultPublicPlugin } from "./plugins/default-public";
import { guardsPlugin } from "./plugins/guards";
import { moduleNamingPlugin } from './plugins/module-naming';
import { middlewaresPlugin } from "./plugins/middlewares";

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
    console.log("Setting up private routes on path: " + apiRoutes?.path + "...");
    if (apiRoutes) {
      const { path, allowRouteControl = false, options, guards = {}, middlewares = [] } = apiRoutes;

      await this.setupFastify(path,
        {
          routeOptions: { allowRouteControl, options },
          guardsOptions: guards,
          middlewaresOptions: middlewares,
          defaultPublicOptions: { force: true }
        }
      );
    } else console.warn("API path not provided. Skipping route setup...");

    console.log("Setting up public routes on path: " + publicRoutes?.path + "...");
    if (publicRoutes) {
      const { path, allowRouteControl = false, options, guards = {}, middlewares = [] } = publicRoutes;

      await this.setupFastify(path, {
        routeOptions: { allowRouteControl, options },
        guardsOptions: guards,
        middlewaresOptions: middlewares,
        defaultPublicOptions: { force: false }
      });
    } else console.warn("Public path not provided. Skipping route setup...");
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
    await app.register(AutoLoad, { dir: routesPath, dirNameRoutePrefix: false, maxDepth: 3, autoHooks: true, cascadeHooks: true, ...options });
  }


  private async setPlugins(app: FastifyInstance, guardsOptions: ServerGuards, defaultPublicOptions: Parameters<typeof defaultPublicPlugin>[1] = {}, middlewaresOptions: ServerMiddlewares[] = []) {


    console.log(`\t\t\tRegistering guards ${Object.keys(guardsOptions).join(', ')} plugins...`);
    await app.register(guardsPlugin, {
      root: this.app,           // passa a instância global para o plugin de guards
      guards: guardsOptions,
    });                         // expõe jwtGuard/aclGuard

    console.log(`\t\t\tRegistering default public plugin with options: ${JSON.stringify(defaultPublicOptions)}...`);
    await app.register(defaultPublicPlugin, defaultPublicOptions);   // seta as rotas como default public

    console.log(`\t\t\tRegistering module naming plugin...`);
    await app.register(moduleNamingPlugin, defaultPublicOptions);                          // injeta nas rotas marcadas

    // middlewares globais (sem strategy, ou strategy "beforeAllGuards" para aplicar antes dos guards, ou "afterAllGuards" para aplicar depois dos guards)
    console.log(`\t\t\tRegistering middlewares plugins...`);
    // middlewares globais (aplicados a todas as rotas, antes ou depois dos guards)
    // middlewares específicos de guards (definidos na configuração do guard, aplicados apenas às rotas protegidas por aquele guard)
    // middlewares específicos de rota (definidos na configuração da rota, aplicados apenas àquela rota)
    // ordem de aplicação: middlewares globais -> middlewares de guards -> middlewares de rota
    // dentro de cada categoria, a ordem é definida pela configuração (ex: strategy para globais, ou ordem no array para guards/rota)

    // exemplo: se um guard tem um middleware com strategy "beforeAllGuards", ele será aplicado antes dos guards, mas depois dos middlewares globais com strategy "beforeAllGuards". Se for "afterAllGuards", será aplicado depois dos guards, mas antes dos middlewares globais com strategy "afterAllGuards".

    await app.register(middlewaresPlugin, {
      root: this.app,
      middlewares: middlewaresOptions,
    });

    console.log(`\t\t\tAll plugins registered.`);
  }

  private async setupFastify(routesPath: string, { routeOptions, guardsOptions, defaultPublicOptions, middlewaresOptions }: SetupFastifyOptions = {}) {
    await this.app.register(async (app) => {

      await this.setPlugins(app, guardsOptions || {}, { ...defaultPublicOptions, options: routeOptions || {} }, middlewaresOptions || []);

      await this.setRoutes(app, routesPath, { options: routeOptions?.options });
    })
  }


}
