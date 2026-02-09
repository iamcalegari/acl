import { FastifyRequest } from 'fastify';
import { AuthUser } from '../types/fastify';

export async function jwtGuard(
  request: FastifyRequest
): Promise<void> {
  try {
    console.log('JWT', request.routeOptions)

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
