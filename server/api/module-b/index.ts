import { FastifyPluginAsync } from 'fastify'
import { submoduleX } from './submodule-x';
import { submoduleY } from './submodule-y';


const moduleA: FastifyPluginAsync = async (fastify) => {
  fastify.module('module-b')

  await fastify.register(submoduleX, { prefix: '/api' });
  await fastify.register(submoduleY, { prefix: '/api' });
}

export default moduleA
