import { RouteOptions } from "fastify";
import { GuardFunction, GuardName, ModuleConfig } from "../../../types/fastify";


// TODO: improve it
const PUBLIC_ROUTES = ['health', 'auth', 'public', 'debug-jwt'];

export type RouteGuardsPlugins = Record<GuardName, GuardFunction>;

export const setGuardsRoute = (route: RouteOptions, routeGuards: Partial<RouteGuardsPlugins>, force?: boolean): ModuleConfig => {
  let guards = new Set<GuardFunction>();

  const { isPublic, url, ...cfg } = needsGuards(route, force);

  if (isPublic) {
    return { ...cfg, isPublic: true };
  }

  const { alreadyGuards: newAlreadyGuards, guardsToSet } = setupGuards(routeGuards, cfg.guards, guards);

  guards = guardsToSet;
  setGuards(route, Array.from(guards));

  //  console.log('SET GUARDS: ', JSON.stringify({ ...cfg, guards: [...newAlreadyGuards] }, null, 2), 'FOR ROUTE: ', url);

  return { ...cfg, guards: newAlreadyGuards, isPublic: false };
}

const setupGuards = (guards: Partial<RouteGuardsPlugins> = {}, alreadyGuards: Set<GuardName>, guardsToSet: Set<GuardFunction>) => {
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

// TODO: improve it
const needsGuards = (route: RouteOptions, force?: boolean) => {
  const { url, config: { isPublic, ...cfg } } = route as { url: string, config: ModuleConfig };

  const routePrefix = url.split('/')[1];

  const isPublicRouteByPrefix = PUBLIC_ROUTES.includes(routePrefix);

  //  console.log('[NEEDS GUARDS] force:', force, 'url:', url, 'prefix:', routePrefix, 'isPublic:', isPublic, 'isPublicRouteByPrefix:', isPublicRouteByPrefix,);

  if (!force && (isPublic || isPublicRouteByPrefix)) {
    return { ...cfg, url, isPublic: true };
  }

  return { ...cfg, url, isPublic: false };
}
