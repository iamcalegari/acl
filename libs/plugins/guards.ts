import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { DependencyScope, GuardDefinition, GuardDependency, GuardName, GuardsRegistryItem, PluginsRegistryItem, ServerGuards } from "../../types/fastify";

function normalizeName(dep: GuardDependency, guardName: string) {
  if (dep.name) return dep.name;

  const fnName = dep.plugin?.name?.trim();
  return fnName && fnName.length > 0 ? fnName : `dep_for_${guardName}_${Math.random().toString(16).slice(2)}`;
}

async function registerDependency(target: FastifyInstance, name: string, item: PluginsRegistryItem) {
  // registra o plugin (dependency) no target
  await target.register(item.plugin, item.options);
  target.plugins[name]
    ? target.plugins[name].registered = true
    : target.plugins = { ...target.plugins, [name]: { plugin: item.plugin, scope: item.scope, type: item.type, registered: true, options: item.options } };


  target.log?.info?.({ name, scope: item.scope }, "dependency registered");
}

export async function registerGuardsDependencies(root: FastifyInstance, app: FastifyInstance) {
  const pluginsMap = { ...root.plugins, ...app.plugins };
  const entries = Object.entries(pluginsMap);

  if (entries.length === 0) return;

  // registra só dependencies (não guards)
  for (const [name, item] of entries) {
    if (item.type !== "dependency") continue;

    const isGlobal = item.scope === "global";

    if (!isGlobal && item.registered) continue;

    await registerDependency(app, name, item);

    // console.log("Registered dependency:", name, "\nin scope:", item.scope, "\nisGlobal:", isGlobal, "\nRoot plugins:", root.plugins, "\nApp plugins:", app.plugins);

    if (isGlobal) root.plugins[name].registered = true; // marca como registrado no root também
  }
}

export const guardsPlugin = fp(
  async (app, { root, guards }: { root: FastifyInstance, guards: ServerGuards }) => {
    // garante registries
    if (!root.guards) root.decorate("guards", {});
    if (!app.guards) app.decorate("guards", {});

    if (!root.plugins) root.decorate("plugins", {});
    if (!app.plugins) app.decorate("plugins", {});

    // 1) Registra guards (apenas metadados + preHandler guard)
    for (const [guardName, def] of Object.entries({ ...guards })) {
      const guardDef = def as GuardDefinition;
      let guard = [guardDef.guard];
      const dependencies = guardDef.dependencies ?? [];
      const scope = guardDef.scope ?? "instance";

      // // se já existir, respeita o primeiro (evita sobrescrever config)
      if (app.guards[guardName as GuardName] || root.guards[guardName as GuardName]) continue;

      // 2) Enfileira dependências (não registra aqui ainda)
      for (const { options, ...dep } of dependencies) {
        const { middlewares, plugin } = dep;

        const scope: DependencyScope = dep.scope ?? "instance";
        const name = normalizeName(dep, guardName);

        if (middlewares) {
          const middlewaresArray = Array.isArray(middlewares) ? middlewares : [middlewares];

          guard = [...middlewaresArray, ...guard];
        }

        // se já existir, respeita o primeiro (evita sobrescrever config)
        if (!plugin || app.plugins[name]) continue;

        const target = scope === "global" ? root : app;

        target.plugins[name] = {
          plugin: plugin,
          scope,
          type: "dependency",
          registered: false,
          options: options ?? {},
        };
      }

      const guardCfg: GuardsRegistryItem = {
        preHandler: guard,
        type: "guard",
        registered: true,
        scope: scope,
      }

      app.guards[guardName as GuardName] = guardCfg;
    }

    // 3) Agora registra dependências no target correto
    // global -> root, instance -> app
    await registerGuardsDependencies(root, app);
  },
  {
    name: "guardsPlugin",
  }
);
