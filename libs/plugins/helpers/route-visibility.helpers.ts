import { RouteOptions } from "fastify";
import { GuardFunction, GuardName, RoutesGuards } from "../guards";
import { ModuleConfig } from "../../types/fastify";


const PUBLIC_ROUTES = ['health', 'auth', 'public'];

export const setGuardsRoute = (route: RouteOptions, routeGuards: Partial<RoutesGuards>): ModuleConfig => {
  let guards = new Set<GuardFunction>();

  const { url, config } = route;

  const { isPublic, ...cfg } = config as ModuleConfig;

  const { guards: alreadyGuards } = cfg;

  const routePrefix = url.split('/')[1];

  const isPublicRouteByPrefix = PUBLIC_ROUTES.includes(routePrefix);

  if (isPublic || isPublicRouteByPrefix) {
    return { ...cfg, isPublic: true };
  }

  const { alreadyGuards: newAlreadyGuards, guardsToSet } = setupGuards(routeGuards, alreadyGuards, guards);

  guards = guardsToSet;
  setGuards(route, Array.from(guards));

  console.log('SET GUARDS: ', JSON.stringify({ ...cfg, guards: [...newAlreadyGuards] }, null, 2), 'FOR ROUTE: ', url);

  return { ...cfg, guards: newAlreadyGuards, isPublic: false };
}

const setupGuards = (guards: Partial<RoutesGuards>, alreadyGuards: Set<GuardName>, guardsToSet: Set<GuardFunction>) => {
  const guardsArr = Object.entries(guards) as [GuardName, GuardFunction][];

  for (const [guardName, guardFn] of guardsArr) {
    if (!alreadyGuards.has(guardName)) {
      guardsToSet.add(guardFn);
      alreadyGuards.add(guardName);
    }
  }

  return { guardsToSet, alreadyGuards };
}

export const setGuards = (routeOptions: RouteOptions, guards: GuardFunction | GuardFunction[], ...rest: GuardFunction[]) => {
  const _guards = Array.isArray(guards) ? guards : [guards];
  const _rest = Array.isArray(rest) ? rest : [rest];

  const newGuards = [..._guards, ..._rest];

  const existing = routeOptions.preHandler;
  if (!existing) routeOptions.preHandler = newGuards;
  else routeOptions.preHandler = Array.isArray(existing) ? [...existing, ...newGuards] : [existing, ...newGuards];

  return routeOptions;
}
