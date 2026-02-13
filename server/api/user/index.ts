import { FastifyPluginAsync } from 'fastify'

import { me } from './me';
export const debug: FastifyPluginAsync = async (fastify) => {
  fastify.module('debug');

  fastify.get('/debug',
    async ({ user, acl, routeOptions }, res) => {
      res.status(200).send({
        status: 'ok',
        data: {
          ...routeOptions,
          config: {
            ...routeOptions.config,
            guards: [...(routeOptions.config.guards || new Set())],
            debugMiddlewares: [...(routeOptions.config.debugMiddlewares || new Set())]
          },
          user,
          acl,
        }
      })
    })
}
const user: FastifyPluginAsync = async (fastify) => {
  await fastify.register(me);                           // PRIVADA (jwt)
  await fastify.register(debug);                           // PRIVADA (jwt)
}

export default user;
