import { FastifyPluginAsync } from 'fastify'

import { me } from './me';

const auth: FastifyPluginAsync = async (fastify) => {
  await fastify.register(me);                           // PRIVADA (jwt)
}

export default auth;
