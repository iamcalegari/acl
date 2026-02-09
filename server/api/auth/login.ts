import { FastifyPluginAsync } from 'fastify';
import { ACLPolicy, ACLRole, AuthUser, CompiledPolicy, TargetModuleConfig } from '../../../types/fastify';
import ACLs from './collection.acl.documents.json';

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
  fastify.post('/login', { schema }, async ({ body }, reply) => {
    const { email, acl: aclId, id } = body as any;

    try {
      const payload: AuthUser = {
        id
      };

      const acl = ACLs.find(acl => acl._id === aclId);

      if (!!acl) {
        const CompiledPolicies = compilePolicies(acl.policies as ACLPolicy[]);

        payload.acl = {
          _id: acl._id,
          role: acl.role as ACLRole,
          policies: CompiledPolicies
        }
      }

      const accessToken = await reply.jwtSign(payload, {
        expiresIn: accessTokenExpiresIn,
        jti: crypto.randomUUID(),
        sub: id,
      });

      console.log('USER ACL:', JSON.stringify(payload.acl, null, 2));

      usersMap.set(id, { ...payload, email });

      console.log('USERS MAP:', JSON.stringify({ ...usersMap }, null, 2));


      return {
        accessToken,
        user: {
          _id: id,
          email: email,
        },
        accessTokenExpiresIn,
      };
    } catch (error) {
      throw error;
    }
  });
}

function parseAclModule(input: string, separator = ":"): TargetModuleConfig {
  const raw = (input ?? "").trim();
  const idx = raw.indexOf(separator);

  if (idx === -1) return { module: raw || "*", subModule: "*" };

  const module = raw.slice(0, idx).trim() || "*";
  const subModule = raw.slice(idx + 1).trim() || "*";
  return { module, subModule };
}

function toArray<T>(v: T | T[]): T[] {
  return Array.isArray(v) ? v : [v];
}

export function compilePolicies(policies: ACLPolicy[], separator = ":"): CompiledPolicy[] {
  if (policies.length === 0) return [];

  console.log('COMPILE POLICIES', JSON.stringify(policies, null, 2));
  return policies.map((p) => {
    return {
      ...p,
      __modules: toArray(p.module).map((m) => parseAclModule(m, separator)),
      __actions: toArray(p.action),
    }
  });
}
