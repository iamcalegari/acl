import { aclGuard } from './middlewares/guards/private/acl';
import { jwtGuard } from './middlewares/guards/private/jwt';
import { Server } from '../libs/server';
import path from 'path';
import jwt from "@fastify/jwt";

const apiServer = new Server();

const apiPath = path.resolve(__dirname, './api');
const publicPath = path.resolve(__dirname, './public');

apiServer.init({
  apiPath, publicPath, guards: {
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
}).then(() => {
  apiServer.start();
});
