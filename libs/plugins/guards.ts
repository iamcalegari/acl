import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { DependencyScope, GuardDefinition, GuardName, GuardsRegistryItem, ServerGuards } from "../../types/fastify";
import { normalizeDependencyName, registerGuardsDependencies } from "./helpers/plugins.helpers";

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
      let handlers = !Array.isArray(guardDef.handlers) ? [guardDef.handlers] : guardDef.handlers;

      const dependencies = guardDef.dependencies ?? [];
      const scope = guardDef.scope ?? "instance";

      // // se já existir, respeita o primeiro (evita sobrescrever config)
      if (app.guards[guardName as GuardName] || root.guards[guardName as GuardName]) continue;

      // 2) Enfileira dependências (não registra aqui ainda)
      for (const { options, ...dep } of dependencies) {
        const { middlewares, plugin, middlewaresStrategy = 'before' } = dep;

        const scope: DependencyScope = dep.scope ?? "instance";
        const name = normalizeDependencyName(dep, guardName);

        if (middlewares) {
          const middlewaresArray = Array.isArray(middlewares) ? middlewares : [middlewares];

          handlers = middlewaresStrategy === 'before'
            ? [...middlewaresArray, ...handlers]
            : [...handlers, ...middlewaresArray];
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
        preHandler: handlers,
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
