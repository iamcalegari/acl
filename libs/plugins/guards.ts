import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { GuardName, RoutesGuardOptions, RoutesPluginOptions, ServerGuardOptions, ServerGuards } from "../../types/fastify";


async function registerPlugin(target: FastifyInstance, name: string, plugin: any, scope: "global" | "instance", type: "guard" | "dependency", options: any) {


  await target.register(plugin, options);

  target.plugins
    ? target.plugins = { ...target.plugins, [name]: { plugin, scope, type, registered: false, options: options || {} } }
    : target.decorate('plugins', { [name]: { plugin, scope, type, registered: false, options: options || {} } });
}

export async function registerGuardsPlugins(root: FastifyInstance, app: FastifyInstance) {
  console.log("Registering guards plugin...");
  console.log("Setting up guards plugin with plugins:", app.plugins);

  const pluginsToRegister = Object.entries(app.plugins || {});
  const dependencies = pluginsToRegister.filter(([_, cfg]) => cfg.type === "dependency");

  for (const [name, cfg] of dependencies) {
    const target = cfg.scope === "global" ? root : app;
    const targetName = cfg.scope === "global" ? "ROOT" : "APP";

    console.log(`[${targetName}] Registering plugin: ${name}`);

    if (cfg.registered) {
      console.log(`[${targetName}] Dependency ${name} already registered, skipping...`);
      continue;
    }


    await registerPlugin(target, name, cfg.plugin, cfg.scope, cfg.type, cfg.options);

    // cfg.registered = true;
    target.plugins![name].registered = true;

    console.log(`[GLOBAL] Plugin ${name} registered successfully`);
    console.log(`[GLOBAL] Current plugins state:`, root.plugins);

    console.log(`[INSTANCE] Plugin ${name} registered successfully`);
    console.log(`[INSTANCE] Current plugins state:`, app.plugins);
  }
}

// async function registerPlugin(this: FastifyInstance, plugin: FastifyPluginCallback, config: Omit<RoutesCommonOptions, "registered"> & { name: string }) {
//   const { name, scope, type } = config;

//   console.log(`Registering plugin in scope: ${scope}`);

//   if (scope === "global") {
//     this.plugins
//       ? this.plugins = { ...this.plugins, [name]: { plugin, scope, type, registered: false, options: config.options || {} } }
//       : this.decorate('plugins', { [name]: { plugin, scope, type, registered: false, options: config.options || {} } });
//   }

//   await this.register(plugin, config.options);

//   this.plugins![name].registered = true;

//   console.log(`Plugin ${name} registered successfully`);
//   console.log("Current plugins state:", this.plugins);
// }

// export async function registerGuardsPlugins(this: FastifyInstance, app: FastifyInstance) {
//   console.log("Registering guards plugin...");
//   console.log("Setting up guards plugin with plugins:", app.plugins);

//   const pluginsToRegister = Object.entries(app.plugins || {});

//   if (pluginsToRegister.length === 0) {
//     console.log("No plugins to register");
//     return;
//   }

//   const dependencies = pluginsToRegister.filter(([_, { type }]) => type === 'dependency');

//   for (const [name, config] of dependencies) {
//     console.log(`Registering plugin: ${name}`);

//     const { plugin, registered, scope, type, options } = config;
//     if (registered) {
//       console.log(`Dependency ${name} already registered, skipping...`);
//       continue;

//     }
//     console.log(`Registering dependency: ${name} in scope: ${scope}`);
//     const target = scope === "global" ? this : app;
//     await registerPlugin.bind(target)(plugin, { name, scope, type, options });
//   }

//   console.log("All guards registered:", Object.keys(app.guards || {}));
//   console.log("All plugins registered:", Object.keys(app.plugins || {}));
// }



function registerGuards(target: FastifyInstance, guardsConfig: [GuardName, ServerGuardOptions][]) {
  for (const [guardName, guardConfig] of guardsConfig) {
    const { guard, dependencies = [] } = guardConfig;

    console.log(`Registering guard: ${guardName} with config:`, guardConfig);

    const guardDetails: RoutesGuardOptions = { preHandler: guard, scope: 'instance', type: "guard", registered: false }

    target.guards
      ? target.guards = { ...target.guards, [guardName]: guardDetails }
      : target.decorate('guards', { [guardName]: guardDetails });

    console.log(`Resolving dependencies for guard: ${guardName}`, dependencies);

    for (const dependency of dependencies) {
      const { plugin, scope = 'instance', options = {} } = dependency;

      const pluginDetails: RoutesPluginOptions = { plugin: dependency.plugin, scope, type: "dependency", registered: false, options }

      const depName = (plugin).name || `dependency_for_${guardName}`;

      console.log(`Configuring dependency: ${depName} for guard: ${guardName}`);
      target.plugins
        ? target.plugins = { ...target.plugins, [depName]: pluginDetails }
        : target.decorate('plugins', { [depName]: pluginDetails });
    }

    target.guards![guardName].registered = true;

    console.log(`Guard ${guardName} configured successfully`);
  }
}

export const guardsPlugin = fp(async (app, { root, guards }: { root: FastifyInstance, guards: ServerGuards }) => {
  console.log("\n\nSetting up guards plugin with guards:", guards);
  const guardsConfig = Object.entries(guards || {});

  registerGuards(app, guardsConfig);

  await registerGuardsPlugins(root, app);

  console.log("All guards registered:", Object.keys(app.guards || {}), "\n\n");
});
