import jwt from "@fastify/jwt";
import path from 'path';
import { ServerSetupOptions } from "../../types/fastify";
import { aclGuard } from '../middlewares/guards/private/acl';
import { aclCache } from '../middlewares/guards/private/acl-cache';
import { jwtGuard } from '../middlewares/guards/private/jwt';
import { loggerMiddleware } from '../middlewares/handlers/logger';

const apiPath = path.resolve(__dirname, '../api');
const publicPath = path.resolve(__dirname, '../public');


export const serverConfig: ServerSetupOptions = {
  apiRoutes: {
    path: apiPath,
    options: {
      prefix: '/api',
    },
    guards: {
      jwtGuard: {
        guard: jwtGuard,
        scope: "global",
        dependencies: [
          {
            plugin: jwt,
            scope: "global",
            options: {
              secret: process.env.JWT_SECRET || "default_secret",
            }
          }
        ]
      },
      aclGuard: {
        guard: aclGuard,
        scope: "instance",
        dependencies: [
          {
            middlewares: aclCache,
          }
        ]
      },
    },
    middlewares: [
      {
        handlers: loggerMiddleware,
        scope: "global",
        strategy: "beforeAllGuards",
      }
    ]
  },
  publicRoutes: {
    path: publicPath,
  },
  // guards: {
  //   jwtGuard: {
  //     guard: jwtGuard,
  //     scope: "global",
  //     dependencies: [
  //       {
  //         plugin: jwt,
  //         scope: "global",
  //         options: {
  //           secret: process.env.JWT_SECRET || "default_secret",
  //         }
  //       }
  //     ]
  //   },
  //   aclGuard: {
  //     guard: aclGuard,
  //     scope: "instance",
  //     dependencies: [
  //       {
  //         middlewares: aclCache,
  //       }
  //     ]
  //   },
  // },
} as const;
