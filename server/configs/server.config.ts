import jwt from "@fastify/jwt";
import path from 'path';
import { ServerSetupOptions } from "../../types/fastify";
import { aclGuard } from '../middlewares/guards/private/acl';
import { aclCache } from '../middlewares/guards/private/acl-cache';
import { jwtGuard } from '../middlewares/guards/private/jwt';
import { loggerMiddleware, loggerMiddleware2, loggerMiddleware3 } from '../middlewares/handlers/logger';

const apiPath = path.resolve(__dirname, '../api');
const publicPath = path.resolve(__dirname, '../public');


export const serverConfig: ServerSetupOptions = {
  /**
   * SETUP DAS ROTAS PRIVADAS
   */
  apiRoutes: {
    path: apiPath,              /** CAMINHO DAS ROTAS DO ESCOPO */
    options: {                  /** OPTIONS UTILIZADAS NO AUTOLOAD PARA CONFIGURAR AS ROTAS DO ESCOPO */
      prefix: '/api',
    },

    /**
     * HABILITAR CONTROLE A NIVEL DE ROTAS
     * 
     * - true:    Habilita o controle interno de rotas, garantindo que as configurações personalizadas feitas 
     *            a nivel de rota sobrescrevam as configurações globais do escopo.
     * - false:   Desabilita o controle interno de rotas, garantindo que todas as rotas possuam as configurações 
     *            globais do escopo.
     * 
     * 
     * Default: false
     */
    allowRouteControl: false,

    /**
     * SETUP DOS GUARDS PARA ROTAS DO ESCOPO
     * 
     * A ordem das configurações abaixo NÃO influenciam na ordem de execução dos guards,
     * essa ordem é definida dentro dos plugins onde os guards são registrados
     */
    guards: {
      jwtGuard: {               /** NOME DO GUARD (ex: aclGuard) */
        guard: jwtGuard,        /** FUNÇÃO DO GUARD (ex: aclGuard) */

        /**
         * SCOPE DO GUARD (ex: instance ou global)
         * 
         * Se for "instance", o guard será registrado apenas para as rotas do seu escopo.
         * Ou seja, se o guard for definido no escopo de configuração das rotas privadas (apiRutes),
         * ele será registrado apenas para as rotas privadas.
         * 
         * Se for "global", o guard será registrado para todas as rotas, independentemente do escopo. 
         * Mesmo ela sendo definida no escopo das rotas privadas, ela será registrada para todas as rotas.
         * 
         * Default: "instance"
         */
        scope: "global",

        /**
         * DEPENDENCIAS DO GUARD (ex: `@fastify/jwt`)
         * 
         * Podendo ser plugin ou middlewares.
         * 
         * Aqui devem ser passadas as dependências para que o guard, funcione corretamente.
         * Cadas dependência deve ser um objeto com as seguintes propriedades:
         * 
         * - scope (optional):    o escopo do plugin (default: "instance")
         * - options (optional):  as opções a serem passadas para o plugin, caso ele seja definido
         */
        dependencies: [
          {
            plugin: jwt,        /** FUNCAO DO PLUGIN (ex: `@fastify/jwt`) */
            scope: "global",
            options: {
              secret: process.env.JWT_SECRET || "default_secret",
            }
          }
        ]
      },
      aclGuard: {
        guard: aclGuard,
        scope: "instance",
        dependencies: [
          {
            middlewares: aclCache,
          }
        ]
      },

    },

    /**
     * SETUP DOS MIDDLEWARES PARA ROTAS DO ESCOPO
     * 
     * A ordem das configurações abaixo SOMENTE influenciam na ordem de dos middlewares definidos
     * nessa configuração.
     * 
     * Eles podem ser definidos para os scopes "instance" ou "global":
     * 
     * - "global":      middlewares globais (aplicados a todas as de todos os escopos)
     * - "instance":    middlewares de rotas do escopo da instância (aplicados apenas aos escopos 
     *                  das rotas privadas/publicas).  
     */
    middlewares: [
      {
        handlers: loggerMiddleware,
        scope: "global",

        /**
         *  ESTRATEGIA APLICADA PARA O MIDDLEWARE
         * 
         * - "beforeAllGuards":   o middleware será executado antes de todos os guards e seus middlewares
         * - "afterAllGuards":    o middleware será executado depois de todos os guards e seus middlewares
         * 
         * Default: "afterAllGuards"
         */
        strategy: "afterAllGuards",
      },
      {
        handlers: loggerMiddleware2,
        scope: "instance",
        strategy: "beforeAllGuards",
      },
    ]
  },
  publicRoutes: {
    path: publicPath,
    options: {
      prefix: '/api',
    },
    middlewares: [
      {
        handlers: loggerMiddleware3,
        scope: "instance",
        strategy: "beforeAllGuards",
      }
    ]
  },
} as const;
