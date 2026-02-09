import { FastifyPluginAsync } from 'fastify'

export const submoduleY: FastifyPluginAsync = async (fastify) => {
  fastify.subModule('submodule-y')

  fastify.post('/module-b/submodule-y', async ({ routeOptions }, res) => {
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

  fastify.put('/module-b/submodule-y/:paramId', async ({ params, routeOptions }, res) => {

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

  fastify.get('/module-b/submodule-y', async ({ routeOptions }, res) => {
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
}
