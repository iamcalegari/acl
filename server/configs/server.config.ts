import jwt from "@fastify/jwt";
import path from 'path';
import { ServerSetupOptions } from "../../types/fastify";
import { aclGuard } from '../middlewares/guards/private/acl';
import { aclCache } from '../middlewares/guards/private/acl-cache';
import { jwtGuard } from '../middlewares/guards/private/jwt';

const apiPath = path.resolve(__dirname, '../api');
const publicPath = path.resolve(__dirname, '../public');


export const serverConfig: ServerSetupOptions = {
  apiRoutes: {
    path: apiPath,
    allowRouteControl: true,
    options: {
      prefix: '/api',
    },
  },
  publicRoutes: {
    path: publicPath,
    allowRouteControl: true,
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
    aclCache: {
      guard: aclCache,
    },
    aclGuard: {
      guard: aclGuard,
    },
  },
} as const;
