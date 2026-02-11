import AutoLoad from "@fastify/autoload";
import Fastify, { FastifyInstance } from "fastify";
import { ServerGuards } from "../types/fastify";
import { defaultPublicPlugin } from "./plugins/default-public";
import { guardsPlugin } from "./plugins/guards-v2";
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


  public async init({ apiPath, publicPath, guards }: { apiPath: string, publicPath: string, guards: ServerGuards }): Promise<void> {
    //  console.log("Setting up private routes on path: " + apiPath + "...");
    if (apiPath) await this.setupFastify(apiPath, { guardsOptions: guards, defaultPublicOptions: { force: true } });
    else console.warn("API path not provided. Skipping route setup...");

    console.log('[AFTER API ROUTES] Guards configured:', this.app.guards || {});
    console.log('[AFTER API ROUTES] Plugins configured:', this.app.plugins || {});

    //  console.log("Setting up public routes on path: " + publicPath + "...");
    if (publicPath) await this.setupFastify(publicPath, { defaultPublicOptions: { force: false } });
    else console.warn("Public path not provided. Skipping route setup...");

    console.log('[AFTER PUBLIC ROUTES] Guards configured:', this.app.guards || {});
    console.log('[AFTER PUBLIC ROUTES] Plugins configured:', this.app.plugins || {});
  }

  public getApp(): FastifyInstance {
    return this.app;
  }

  public start(): void {
    this.app.listen({ port: +this.port }, () => {
      //  console.info(`Server listening on http://localhost:${this.port}`);
    });
  }

  private async setRoutes(app: FastifyInstance, routesPath: string) {
    //  console.log(`Registering routes from path: ${routesPath}...`);
    await app.register(AutoLoad, { dir: routesPath, dirNameRoutePrefix: false, maxDepth: 3, autoHooks: true, cascadeHooks: true });
  }

  // private async setGuardsPlugins(app: FastifyInstance) {
  //   await registerGuardsPlugins.bind(this.app)(app);
  // }

  private async setPlugins(app: FastifyInstance, guardsOptions: ServerGuards, defaultPublicOptions: Parameters<typeof defaultPublicPlugin>[1] = {}) {

    //  console.log(`Registering guards ${Object.keys(guardsOptions).join(', ')} plugins...`);

    await app.register(guardsPlugin, {
      root: this.app, // passa a instância global para o plugin de guards
      guards: guardsOptions,
    });          // expõe jwtGuard/aclGuard

    //  console.log(`Registering default public plugin with options: ${JSON.stringify(defaultPublicOptions)}...`);
    await app.register(defaultPublicPlugin, defaultPublicOptions);   // seta as rotas como default public

    //  console.log(`Registering module naming plugin...`);
    await app.register(moduleNamingPlugin);    // injeta nas rotas marcadas
  }

  private async setupFastify(routesPath: string, { guardsOptions, defaultPublicOptions }: SetupFastifyOptions = {}) {
    await this.app.register(async (app) => {

      await this.setPlugins(app, guardsOptions || {}, defaultPublicOptions);

      // await this.setGuardsPlugins(app);                                    // registra as dependências dos guards (ex: jwt)

      // console.log('\n\nINSTANCE guards after registering guardsPlugin:', app.guards);
      // console.log('\n\nINSTANCE plugins after registering guardsPlugin:', app.plugins);



      // console.log('\n\nGLOBAL guards after registering guardsPlugin:', this.app.guards);
      // console.log('\n\nGLOBAL plugins after registering guardsPlugin:', this.app.plugins, '\n\n');



      // if (!this.app.plugins) {
      //   console.warn("Global app plugins not set. Setting from instance plugins...");
      //   this.app.decorate('plugins', app.plugins || {});
      // } else {
      //   console.log("Global app plugins already set.");
      //   this.app.plugins = { ...this.app.plugins, ...app.plugins || {} };
      // }



      // console.log('GLOBAL plugins after registering guardsPlugin:', this.app.plugins, '\n\n');

      await this.setRoutes(app, routesPath);
    })
  }


}
