import { ServerSetupOptions } from "../../types/fastify";
import { aclGuard } from '../middlewares/guards/private/acl';
import { jwtGuard } from '../middlewares/guards/private/jwt';
import path from 'path';
import jwt from "@fastify/jwt";

const apiPath = path.resolve(__dirname, '../api');
const publicPath = path.resolve(__dirname, '../public');


export const serverConfig: ServerSetupOptions = {
  apiPath,
  publicPath,
  guards: {
    jwtGuard: {
      guard: jwtGuard,
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
    }
  }
} as const;
