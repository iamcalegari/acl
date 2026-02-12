import { FastifyPluginAsync } from "fastify"

export const me: FastifyPluginAsync = async (fastify) => {
  fastify.get('/user/me',
    async ({ user, routeOptions }, res) => {
      res.status(200).send({
        status: 'ok',
        data: {
          user,
          ...routeOptions,
          config: {
            ...routeOptions.config,
            guards: [...(routeOptions.config.guards || new Set())]
          }
        }
      })
    })
}
