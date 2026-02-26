import { FastifyPluginAsync } from "fastify";
import { buildAclIndexFromACL } from "../../helpers/acl.helpers";

export const userInfo: FastifyPluginAsync = async (fastify) => {
  fastify.get('/user/me',
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
