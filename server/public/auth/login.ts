import { FastifyPluginAsync } from 'fastify';
import { AuthUser } from '../../../types/fastify';

export const accessTokenExpiresIn = Number(process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? 60 * 5); // 5m
export const definicaoSenhaTokenExpiresIn = Number(process.env.TOKEN_DEFINICAO_SENHA_EXPIRES_IN || 5 * 60);

const schema = {
  body: {
    type: 'object',
    properties: {
      email: { type: 'string' },
      senha: { type: 'string' },
      acl: { type: 'string' },
      id: { type: 'string' },
    },
    required: ['id', 'email', 'senha'],
  }
} as const


const usersMap = new Map<string, { email: string } & AuthUser>([])

export const login: FastifyPluginAsync = async (fastify) => {
  fastify.post('/login', { schema }, async ({ body, routeOptions }, reply) => {
    const { email, acl: aclId, id } = body as any;

    try {
      const payload: AuthUser = {
        id,
        acl: aclId
      };

      const accessToken = fastify.jwt.sign(payload, {
        expiresIn: accessTokenExpiresIn,
        jti: crypto.randomUUID(),
        sub: id,
      });

      usersMap.set(id, { ...payload, email });

      return {
        accessToken,
        user: {
          _id: id,
          email: email,
        },
        accessTokenExpiresIn,
        routeOptions
      };
    } catch (error) {
      throw error;
    }
  });
}
