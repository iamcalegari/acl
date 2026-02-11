import { FastifyPluginAsync } from 'fastify'

import { login } from './login';



const auth: FastifyPluginAsync = async (fastify) => {
  await fastify.register(login, { prefix: '/auth' });   // PUBLICA
}

export default auth;
