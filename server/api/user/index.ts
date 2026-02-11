import { FastifyPluginAsync } from 'fastify'

import { me } from './me';

const user: FastifyPluginAsync = async (fastify) => {
  await fastify.register(me);                           // PRIVADA (jwt)
}

export default user;
