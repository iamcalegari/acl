import { FastifyInstance, RouteOptions } from "fastify";
import { GuardFunction, GuardName, ModuleConfig } from "../../../types/fastify";


// TODO: improve it
const PUBLIC_ROUTES = ['health', 'auth', 'public'];

export type RouteGuardsPlugins = Record<GuardName, GuardFunction[] | GuardFunction>;

export const setGuardsRoute = (target: FastifyInstance, route: RouteOptions, routeGuards: Partial<RouteGuardsPlugins>, force?: boolean): ModuleConfig => {
  let guards = new Set<GuardFunction>();

  const { isPublic, url, ...cfg } = needsGuards(route, force);

  if (isPublic) {
    return { ...cfg, isPublic: true };
  }

  const { guardsToSet, alreadyGuards: newAlreadyGuards, } = setupGuards(routeGuards, cfg.guards, guards);

  guards = guardsToSet;
  const { config: newConfig } = setMiddlewares(target, route, ...guards);

  // console.log('[SET GUARDS] new CONFIG: ', JSON.stringify({ ...newConfig, guards: [...newAlreadyGuards], isPublic: false }, null, 2), 'FOR ROUTE: ', url);

  return { ...newConfig, guards: newAlreadyGuards, isPublic: false };
}

const setupGuards = (guards: Partial<RouteGuardsPlugins> = {}, alreadyGuards: Set<GuardName>, guardsToSet: Set<GuardFunction>) => {
  const guardsArr = Object.entries(guards) as [GuardName, GuardFunction[] | GuardFunction][]

  for (const [guardName, guardFn] of guardsArr) {
    if (!alreadyGuards.has(guardName)) {

      if (Array.isArray(guardFn)) {
        guardFn.forEach(fn => guardsToSet.add(fn));
      } else {
        guardsToSet.add(guardFn);
      }

      alreadyGuards.add(guardName);
    }
  }

  return { guardsToSet, alreadyGuards };
}

export const setMiddlewares = (target: FastifyInstance, routeOptions: RouteOptions, ...guards: GuardFunction[]) => {
  console.log('\n\n[SET GUARDS] middlewares to set:', guards);

  const _guards = Array.from(new Set([...guards.flat()]));

  const preHandlersSet = new Set(Array.isArray(routeOptions.preHandler) ? routeOptions.preHandler : [routeOptions.preHandler]);
  const beforeAndAfterMiddlewaresSet = new Set([...target.beforeAllMiddlewares || [], ...target.afterAllMiddlewares || []]);
  const existingPreHandlersOnly: GuardFunction[] = Array.from(preHandlersSet.difference(beforeAndAfterMiddlewaresSet)).filter((fn): fn is GuardFunction => fn !== undefined)
  console.log('[SET GUARDS] existing preHandler:', existingPreHandlersOnly);

  routeOptions.preHandler = existingPreHandlersOnly.length > 0
    ? [...target.beforeAllMiddlewares || [], ...existingPreHandlersOnly, ..._guards, ...target.afterAllMiddlewares || []]
    : [...target.beforeAllMiddlewares || [], ..._guards, ...target.afterAllMiddlewares || []];

  console.log('[SET GUARDS] new preHandler:', routeOptions.preHandler, '\n\n');
  return routeOptions;
}

// TODO: improve it
const needsGuards = (route: RouteOptions, force?: boolean) => {
  const { url, config: { isPublic, ...cfg } } = route as { url: string, config: ModuleConfig };

  if (typeof isPublic === "boolean") {
    return { ...cfg, url, isPublic };
  }

  const routePrefix = url.split('/')[1];

  const isPublicRouteByPrefix = PUBLIC_ROUTES.includes(routePrefix);

  //  console.log('[NEEDS GUARDS] force:', force, 'url:', url, 'prefix:', routePrefix, 'isPublic:', isPublic, 'isPublicRouteByPrefix:', isPublicRouteByPrefix,);

  if (!force && (isPublic || isPublicRouteByPrefix)) {
    return { ...cfg, url, isPublic: true };
  }

  return { ...cfg, url, isPublic: isPublic ?? false };
}
