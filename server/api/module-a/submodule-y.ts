import { FastifyPluginAsync } from 'fastify'

export const submoduleY: FastifyPluginAsync = async (fastify) => {
  fastify.subModule('submodule-y')

  fastify.post('/module-a/submodule-y', async ({ routeOptions }, res) => {
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

  fastify.put('/module-a/submodule-y/:paramId', async ({ params, routeOptions }, res) => {

    res.status(200).send({
      status: 'ok',
      data: {
        params,
        ...routeOptions,
        config: {
          ...routeOptions.config,
          guards: [...(routeOptions.config.guards || new Set())]
        }
      }
    })
  })
}
