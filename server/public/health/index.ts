import { FastifyPluginAsync } from 'fastify'
import { checkModule } from './check';


const healthCheck: FastifyPluginAsync = async (fastify) => {
  await fastify.register(checkModule); // PUBLICA
}

export default healthCheck;
