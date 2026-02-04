import { FastifyPluginAsync } from 'fastify'

export const submoduleX: FastifyPluginAsync = async (fastify) => {
  fastify.subModule('submodule-x')

  fastify.get('/module-b/submodule-x', async ({ routeOptions }, res) => {
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

  fastify.get('/module-b/submodule-x/:paramId', async ({ params, routeOptions }, res) => {

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

  fastify.post('/module-b/submodule-x', async ({ routeOptions }, res) => {
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
