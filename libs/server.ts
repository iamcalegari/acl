import AutoLoad from "@fastify/autoload";
import Fastify, { FastifyInstance } from "fastify";
import { ServerGuards, ServerSetupOptions } from "../types/fastify";
import { defaultPublicPlugin } from "./plugins/default-public";
import { guardsPlugin } from "./plugins/guards";
import { moduleNamingPlugin } from './plugins/module-naming';

export interface SetupFastifyOptions {
  guardsOptions?: ServerGuards,
  defaultPublicOptions?: {
    force?: boolean
  }
}

export class Server {
  protected app: FastifyInstance;

  constructor(protected port = process.env.PORT || 3000) {
    this.port = port;
    this.app = Fastify({ logger: true });
  }

  public async init({ apiPath, publicPath, guards }: ServerSetupOptions): Promise<void> {
    console.log("Setting up private routes on path: " + apiPath + "...");
    if (apiPath) await this.setupFastify(apiPath, { guardsOptions: guards, defaultPublicOptions: { force: true } });
    else console.warn("API path not provided. Skipping route setup...");

    console.log("Setting up public routes on path: " + publicPath + "...");
    if (publicPath) await this.setupFastify(publicPath, { defaultPublicOptions: { force: false } });
    else console.warn("Public path not provided. Skipping route setup...");
  }

  public getApp(): FastifyInstance {
    return this.app;
  }

  public start(): void {
    this.app.listen({ port: +this.port }, () => {
      console.info(`Server listening on http://localhost:${this.port}`);
    });
  }

  private async setRoutes(app: FastifyInstance, routesPath: string) {
    console.log(`Registering routes from path: ${routesPath}...`);
    await app.register(AutoLoad, { dir: routesPath, dirNameRoutePrefix: false, maxDepth: 3, autoHooks: true, cascadeHooks: true });
  }


  private async setPlugins(app: FastifyInstance, guardsOptions: ServerGuards, defaultPublicOptions: Parameters<typeof defaultPublicPlugin>[1] = {}) {
    console.log(`Registering guards ${Object.keys(guardsOptions).join(', ')} plugins...`);
    await app.register(guardsPlugin, {
      root: this.app,           // passa a instância global para o plugin de guards
      guards: guardsOptions,
    });                         // expõe jwtGuard/aclGuard

    console.log(`Registering default public plugin with options: ${JSON.stringify(defaultPublicOptions)}...`);
    await app.register(defaultPublicPlugin, defaultPublicOptions);   // seta as rotas como default public

    console.log(`Registering module naming plugin...`);
    await app.register(moduleNamingPlugin);                          // injeta nas rotas marcadas
  }

  private async setupFastify(routesPath: string, { guardsOptions, defaultPublicOptions }: SetupFastifyOptions = {}) {
    await this.app.register(async (app) => {

      await this.setPlugins(app, guardsOptions || {}, defaultPublicOptions);

      await this.setRoutes(app, routesPath);
    })
  }


}
