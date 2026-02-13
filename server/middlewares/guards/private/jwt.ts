import { FastifyRequest } from 'fastify';
import { AuthUser } from '../../../../types/fastify';

export async function jwtGuard(
  request: FastifyRequest
): Promise<void> {
  try {
    //  console.warn('---- ---- ---- JWT GUARD ---- ---- ----',)
    request.routeOptions.config.debugMiddlewares
      ? request.routeOptions.config.debugMiddlewares.add('jwtGuard')
      : request.routeOptions.config.debugMiddlewares = new Set(['jwtGuard']);

    const auth = request.headers.authorization

    if (!auth?.startsWith("Bearer ")) {
      throw new Error("Invalid Authorization header");
    };

    const payload = await request.jwtVerify<AuthUser>({});

    // eslint-disable-next-line require-atomic-updates
    request.user = payload;
  } catch (error) {
    throw error;
  }
};
