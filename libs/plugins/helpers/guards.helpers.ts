import { FastifyInstance, RouteOptions } from "fastify";
import { GuardFunction, GuardName, GuardsRegistry, GuardsRegistryItem, ModuleConfig } from "../../../types/fastify";
import { setMiddlewares } from "./middlewares.helpers";


// TODO: improve it
const PUBLIC_ROUTES = ['health', 'auth', 'public'];


export const setGuardsRoute = (target: FastifyInstance, route: RouteOptions, routeGuards: GuardsRegistry, force?: boolean): ModuleConfig => {
  let guards = new Set<GuardFunction>();

  const { isPublic, url, ...cfg } = needsGuards(route, force);
  // console.log('[SET GUARDS] force:', force, 'url:', url, 'isPublic:', isPublic, 'cfg:', cfg);
  if (isPublic) {
    return { ...cfg, isPublic: true };
  }
  // console.log(`\n\n----------${url} ROUTE GUARDS ----------\n`, routeGuards, `\n\n`);

  const { guardsToSet, alreadyGuards: newAlreadyGuards, } = setupGuards(routeGuards, cfg.guards, guards);
  // console.log('[1] [SET GUARDS] new CONFIG: ', JSON.stringify({ ...cfg, guards: [...newAlreadyGuards], isPublic: false }, null, 2), 'FOR ROUTE: ', url);

  const { config: newConfig } = setMiddlewares(target, route, [...guardsToSet]);

  // console.log('[2] [SET GUARDS] new CONFIG: ', JSON.stringify({ ...newConfig, guards: [...newAlreadyGuards], isPublic: false }, null, 2), 'FOR ROUTE: ', url);

  return { ...newConfig, guards: newAlreadyGuards, isPublic: false };
}


const setupGuards = (guards: GuardsRegistry = {}, alreadyGuards: Set<GuardName>, guardsToSet: Set<GuardFunction>) => {

  const guardsArr = Object.entries(guards) as [GuardName, GuardsRegistryItem][];
  // console.log('SETUP GUARDS', guardsArr);
  for (const [guardName, { preHandler: guardFn }] of guardsArr) {

    if (!guardFn) continue;

    if (Array.isArray(guardFn)) {
      guardFn.forEach(fn => guardsToSet.add(fn));
    } else {
      guardsToSet.add(guardFn);
    }

    alreadyGuards.add(guardName);
  }

  return { guardsToSet, alreadyGuards };
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
