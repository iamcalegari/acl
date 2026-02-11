import { FastifyPluginAsync } from 'fastify'

export const checkModule: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async ({ routeOptions }, res) => {
    res.status(200).send({
      status: 'ok',
      data: routeOptions
    })
  })

  fastify.get('/debug-jwt', async (req, res) => {
    res.status(200).send({
      status: 'ok',
      data: {
        hasReplyJwtSign: typeof (res as any).jwtSign === "function",
        hasReqJwtVerify: typeof (req as any).jwtVerify === "function",
      }
    })
  })
}
