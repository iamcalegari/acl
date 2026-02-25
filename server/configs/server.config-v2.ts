import jwt from "@fastify/jwt";
import path from 'path';
import { ServerSetupOptions } from "../../types/fastify";
import { aclGuard } from '../middlewares/guards/private/acl';
import { aclCache } from '../middlewares/guards/private/acl-cache';
import { jwtGuard } from '../middlewares/guards/private/jwt';
import { loggerMiddleware, loggerMiddleware2, loggerMiddleware3 } from '../middlewares/handlers/logger';

const apiPath = path.resolve(__dirname, '../api');
const publicPath = path.resolve(__dirname, '../public');


export const serverConfig: ServerSetupOptions = {
  /**
   * SETUP DAS ROTAS PRIVADAS
   */
  apiRoutes: {
    path: apiPath,              /** CAMINHO DAS ROTAS DO ESCOPO */
    options: {                  /** OPTIONS UTILIZADAS NO AUTOLOAD PARA CONFIGURAR AS ROTAS DO ESCOPO */
      prefix: '/api',
    },
    allowRouteControl: false,
    middlewares: [
      {
        handlers: loggerMiddleware,
      },
      {
        handlers: loggerMiddleware2,
      },
      {
        handlers: [jwtGuard],
        dependencies: [{ plugin: jwt, scope: "global", options: { secret: process.env.JWT_SECRET || "default_secret" } }],
      },
      {
        handlers: [aclCache, aclGuard],
      }
    ]
  },
  publicRoutes: {
    path: publicPath,
    options: {
      prefix: '/api',
    },
    middlewares: [
      {
        handlers: loggerMiddleware3,
        scope: "instance",
        strategy: "beforeAllGuards",
      }
    ]
  },
} as const;
