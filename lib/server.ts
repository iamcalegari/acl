import AutoLoad from "@fastify/autoload";
import Fastify, { FastifyInstance } from "fastify";
import { guardsPlugin } from "./plugins/guards";
import { moduleNamingPlugin } from './plugins/module-naming';
import { defaultPublicPlugin } from "./plugins/default-public";

export class Server {
  protected app: FastifyInstance;
  constructor(protected port = process.env.PORT || 3000) {
    this.port = port;
    this.app = Fastify({ logger: true });
  }

  public async init(apiPath: string): Promise<void> {
    await this.setupFastify(apiPath);
  }

  public getApp(): FastifyInstance {
    return this.app;
  }

  public start(): void {
    this.app.listen({ port: +this.port }, () => {
      console.info(`Server listening on http://localhost:${this.port}`);
    });
  }
  private async setRoutes(apiPath: string) {
    await this.app.register(AutoLoad, { dir: apiPath, dirNameRoutePrefix: false, maxDepth: 3 });
  }

  private async setPlugins() {

    await this.app.register(guardsPlugin);          // expõe jwtGuard/aclGuard
    await this.app.register(defaultPublicPlugin);   // seta as rotas como default public
    await this.app.register(moduleNamingPlugin);    // injeta nas rotas marcadas
  }
  private async setupFastify(apiPath: string) {
    await this.setPlugins();

    await this.setRoutes(apiPath);
  }
}
