import jwt from "@fastify/jwt";
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import { aclGuard } from "./acl";
import { jwtGuard } from "./jwt";

export type GuardFunction = ((request: FastifyRequest, reply: FastifyReply) => Promise<void>)
  | ((request: FastifyRequest, reply?: FastifyReply) => Promise<void>)

export type GuardName = "jwtGuard" | "aclGuard";

export type RoutesGuards = {
  [guardName in GuardName]: GuardFunction;
};

declare module "fastify" {
  interface FastifyInstance extends RoutesGuards { }
}

export const guardsPlugin: FastifyPluginAsync = fp(async (app) => {
  app.register(jwt, { secret: process.env.JWT_SECRET! || "secret" });

  app.decorate("jwtGuard", jwtGuard);

  app.decorate("aclGuard", aclGuard);
});
