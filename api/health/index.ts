import { FastifyPluginAsync } from 'fastify'

const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (_, res) => {
    res.status(200).send({
      status: 'ok',
      data: _.routeOptions
    })
  })
}

const healthCheck: FastifyPluginAsync = async (fastify) => {
  await fastify.register(healthRoute); // PUBLICA
}

export default healthCheck;
