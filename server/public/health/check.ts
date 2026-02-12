import { FastifyPluginAsync } from 'fastify'

export const checkModule: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async ({ routeOptions }, res) => {
    res.status(200).send({
      status: 'ok',
      data: {
        ...routeOptions,
        config: {
          ...routeOptions.config,
          guards: [...(routeOptions.config.guards || new Set())]
        }
      }
    })
  })

  fastify.get('/debug-jwt', async ({ jwtVerify, routeOptions }, res) => {
    res.status(200).send({
      status: 'ok',
      data: {
        hasReplyJwtSign: typeof (res as any).jwtSign === "function",
        hasReqJwtVerify: typeof jwtVerify === "function",
        ...routeOptions,
        config: {
          ...routeOptions.config,
          guards: [...(routeOptions.config.guards || new Set())]
        }
      }
    })
  })
}
