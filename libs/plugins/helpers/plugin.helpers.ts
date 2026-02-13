import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { GuardDependency, PluginsRegistryItem } from "../../../types/fastify";

export const normalizeDependencyName = (dep: GuardDependency, guardName: string) => {
  if (dep.name) return dep.name;

  const fnName = dep.plugin?.name?.trim();
  return fnName && fnName.length > 0 ? fnName : `dep_for_${guardName}_${Math.random().toString(16).slice(2)}`;
}


export const registerDependency = async (target: FastifyInstance, name: string, item: PluginsRegistryItem) => {
  const isRegistred = target.hasPlugin(name);

  if (isRegistred) {
    return;
  }

  const plugin = fp(item.plugin, { name });

  await target.register(plugin, item.options);

  target.plugins[name]
    ? target.plugins[name].registered = true
    : target.plugins = { ...target.plugins, [name]: { plugin: item.plugin, scope: item.scope, type: item.type, registered: true, options: item.options } };


  target.log?.info?.({ name, scope: item.scope }, "dependency registered");
}

export const registerGuardsDependencies = async (root: FastifyInstance, app: FastifyInstance) => {
  const pluginsMap = { ...root.plugins, ...app.plugins };
  const entries = Object.entries(pluginsMap);

  if (entries.length === 0) return;

  // registra só dependencies (não guards)
  for (const [name, item] of entries) {

    if (item.type !== "dependency") continue;

    const isGlobal = item.scope === "global";

    if (!isGlobal && item.registered) continue;

    await registerDependency(app, name, item);

    if (isGlobal) root.plugins[name].registered = true; // marca como registrado no root também
  }
}
