import { FastifyPluginAsync } from 'fastify'

import { login } from './login';
import { me } from './me';

const auth: FastifyPluginAsync = async (fastify) => {
  await fastify.register(login, { prefix: '/auth' });   // PUBLICA
  await fastify.register(me);                           // PRIVADA (jwt)
}

export default auth;
