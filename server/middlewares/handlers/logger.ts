import { FastifyReply, FastifyRequest } from 'fastify';


export async function loggerMiddleware(request: FastifyRequest, reply: FastifyReply) {
  request.routeOptions.config.debugMiddlewares
    ? request.routeOptions.config.debugMiddlewares.add('loggerMiddleware-1')
    : request.routeOptions.config.debugMiddlewares = new Set(['loggerMiddleware-1']);

  const { method, url, params, query, body, user } = request;
  const userId = user?.id || 'Guest';

  console.log(`\n\n[1] [LOGGER] ${method} ${url} - User: ${userId}`);
  console.log(`[1] [LOGGER] Params: ${JSON.stringify(params)}`);
  console.log(`[1] [LOGGER] Query: ${JSON.stringify(query)}`);
  console.log(`[1] [LOGGER] Body: ${JSON.stringify(body)}\n\n`);

}

export async function loggerMiddleware2(request: FastifyRequest, reply: FastifyReply) {
  request.routeOptions.config.debugMiddlewares
    ? request.routeOptions.config.debugMiddlewares.add('loggerMiddleware-2')
    : request.routeOptions.config.debugMiddlewares = new Set(['loggerMiddleware-2']);

  const { method, url, params, query, body, user } = request;
  const userId = user?.id || 'Guest';

  console.log(`\n\n[2] [LOGGER] ${method} ${url} - User: ${userId}`);
  console.log(`[2] [LOGGER] Params: ${JSON.stringify(params)}`);
  console.log(`[2] [LOGGER] Query: ${JSON.stringify(query)}`);
  console.log(`[2] [LOGGER] Body: ${JSON.stringify(body)}\n\n`);

}

export async function loggerMiddleware3(request: FastifyRequest, reply: FastifyReply) {
  request.routeOptions.config.debugMiddlewares
    ? request.routeOptions.config.debugMiddlewares.add('loggerMiddleware-3')
    : request.routeOptions.config.debugMiddlewares = new Set(['loggerMiddleware-3']);

  const { method, url, params, query, body, user } = request;
  const userId = user?.id || 'Guest';

  console.log(`\n\n[3] [LOGGER] ${method} ${url} - User: ${userId}`);
  console.log(`[3] [LOGGER] Params: ${JSON.stringify(params)}`);
  console.log(`[3] [LOGGER] Query: ${JSON.stringify(query)}`);
  console.log(`[3] [LOGGER] Body: ${JSON.stringify(body)}\n\n`);

}
