import { FastifyPluginAsync } from 'fastify'
import { submoduleX } from './submodule-x';
import { submoduleY } from './submodule-y';


const moduleA: FastifyPluginAsync = async (fastify) => {
  fastify.module('module-a')      // PRIVADA (jwt + acl)

  await fastify.register(submoduleX, { prefix: '/api' });
  await fastify.register(submoduleY, { prefix: '/api' });
}

export default moduleA
