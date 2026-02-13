import { FastifyReply, FastifyRequest } from 'fastify';


export async function loggerMiddleware(request: FastifyRequest, reply: FastifyReply) {
  request.routeOptions.config.debugMiddlewares
    ? request.routeOptions.config.debugMiddlewares.add('loggerMiddleware')
    : request.routeOptions.config.debugMiddlewares = new Set(['loggerMiddleware']);

  const { method, url, params, query, body, user } = request;
  const userId = user?.id || 'Guest';

  console.log(`\n\n[LOGGER] ${method} ${url} - User: ${userId}`);
  console.log(`[LOGGER] Params: ${JSON.stringify(params)}`);
  console.log(`[LOGGER] Query: ${JSON.stringify(query)}`);
  console.log(`[LOGGER] Body: ${JSON.stringify(body)}\n\n`);

}
