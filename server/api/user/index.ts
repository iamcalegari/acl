import { FastifyPluginAsync } from 'fastify';

import { me } from './me';
import { userInfo } from './user-info';

const user: FastifyPluginAsync = async (fastify) => {
  await fastify.register(userInfo);               // PRIVADA (jwt)
  await fastify.register(me);                     // PRIVADA (jwt + acl)
}

export default user;
