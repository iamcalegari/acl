import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { DependencyScope, GuardDefinition, GuardDependency, GuardName, PluginsRegistryItem, ServerGuards } from "../../types/fastify";

function normalizeName(dep: GuardDependency, guardName: string) {
  if (dep.name) return dep.name;
  const pluginFnName = dep.plugin?.name?.trim();
  return pluginFnName && pluginFnName.length > 0 ? pluginFnName : `dep_for_${guardName}_${Math.random().toString(16).slice(2)}`;
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
    console.log("Registered dependency:", name, "\nin scope:", item.scope, "\nisGlobal:", isGlobal, "\nRoot plugins:", root.plugins, "\nApp plugins:", app.plugins);
    if (isGlobal) root.plugins[name].registered = true; // marca como registrado no root também
  }
}

export const guardsPlugin = fp(
  async (app, { root, guards }: { root: FastifyInstance, guards: ServerGuards }) => {

    // garante registries
    if (!app.guards) app.decorate("guards", {});
    if (!app.plugins) app.decorate("plugins", {});
    if (!root.guards) root.decorate("guards", {});
    if (!root.plugins) root.decorate("plugins", {});

    // 1) Registra guards (apenas metadados + preHandler guard)
    for (const [guardName, def] of Object.entries({ ...guards })) {
      const guardDef = def as GuardDefinition;
      const guard = guardDef.guard;
      const dependencies = guardDef.dependencies ?? [];

      app.guards[guardName as GuardName] = {
        preHandler: guard,
        type: "guard",
        registered: true,
        scope: "instance",
      };

      // 2) Enfileira dependências (não registra aqui ainda)
      for (const dep of dependencies) {
        const scope: DependencyScope = dep.scope ?? "instance";
        const name = normalizeName(dep, guardName);

        // se já existir, respeita o primeiro (evita sobrescrever config)
        if (app.plugins[name] || root.plugins[name]) continue;


        const target = scope === "global" ? root : app;

        target.plugins[name] = {
          plugin: dep.plugin,
          scope,
          type: "dependency",
          registered: false,
          options: dep.options ?? {},
        };
      }
    }

    // 3) Agora registra dependências no target correto
    // global -> root, instance -> app
    await registerGuardsDependencies(root, app);
  },
  {
    name: "guardsPlugin",
  }
);
