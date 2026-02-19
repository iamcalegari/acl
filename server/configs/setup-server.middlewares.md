```ts
export const serverConfig: ServerSetupOptions = {
  apiRoutes: {
    //...
    guards: {
      jwtGuard: {
        //...
      },
      aclGuard: {
        // ...
        dependencies: [
          {
            middlewares: aclCache,
          },
        ],
      },
    },
    middlewares, // <-- VARIAÇÕES
  },
  publicRoutes: {
    path: publicPath,
  },
} as const;
```

VARIAÇÕES:

## 1 - MESMO SCOPE

### 1.1 - SCOPE: `"instance"`:

-> loggerMiddleware STRATEGY: `"afterAllGuards"`;

-> loggerMiddleware2 STRATEGY: `"afterAllGuards"`;

```
middlewares: [
  {
    handlers: loggerMiddleware,
    scope: "instance",
    strategy: "afterAllGuards",
  },
  {
    handlers: loggerMiddleware2,
    scope: "instance",
    strategy: "afterAllGuards",
  },
]
```

#### Ordem dos middlewares:

- Api Routes: [jwtGuard, aclCache, aclGuard, **loggerMiddleware**, **loggerMiddleware2**]
- Public Routes: []

---

-> loggerMiddleware STRATEGY: `"afterAllGuards"`;

-> loggerMiddleware2 STRATEGY: `"beforeAllGuards"`;

```
middlewares: [
  {
    handlers: loggerMiddleware,
    scope: "instance",
    strategy: "afterAllGuards",
  },
  {
    handlers: loggerMiddleware2,
    scope: "instance",
    strategy: "beforeAllGuards",
  },
]
```

#### Ordem dos middlewares:

- Api Routes: [**loggerMiddleware2**, jwtGuard, aclCache, aclGuard, **loggerMiddleware**]
- Public Routes: []

### 1.2 - SCOPE: `"global"`:

-> loggerMiddleware STRATEGY: `"afterAllGuards"`;

-> loggerMiddleware2 STRATEGY: `"afterAllGuards"`;

```
middlewares: [
  {
    handlers: loggerMiddleware,
    scope: "global",
    strategy: "afterAllGuards",
  },
  {
    handlers: loggerMiddleware2,
    scope: "global",
    strategy: "afterAllGuards",
  },
]
```

#### Ordem dos middlewares:

- Api Routes: [jwtGuard, aclCache, aclGuard, **loggerMiddleware**, **loggerMiddleware2**]
- Public Routes: [ **loggerMiddleware**, **loggerMiddleware2**]

---

-> loggerMiddleware STRATEGY: `"afterAllGuards"`;

-> loggerMiddleware2 STRATEGY: `"beforeAllGuards"`;

```
middlewares: [
  {
    handlers: loggerMiddleware,
    scope: "global",
    strategy: "afterAllGuards",
  },
  {
    handlers: loggerMiddleware2,
    scope: "global",
    strategy: "beforeAllGuards",
  },
]
```

#### Ordem dos middlewares:

- Api Routes: [**loggerMiddleware2**, jwtGuard, aclCache, aclGuard, **loggerMiddleware**]
- Public Routes: [**loggerMiddleware2**, **loggerMiddleware**]

## 2 - ESCOPE DIFERENTE

### 2.1 - STRATEGY IGUAL:

-> loggerMiddleware SCOPE: `"global"`;

-> loggerMiddleware2 SCOPE: `"instance"`;

```
middlewares: [
  {
    handlers: loggerMiddleware,
    scope: "global",
    strategy: "afterAllGuards",
  },
  {
    handlers: loggerMiddleware2,
    scope: "instance",
    strategy: "afterAllGuards",
  },
]
```

#### Ordem dos middlewares:

- Api Routes: [jwtGuard, aclCache, aclGuard, **loggerMiddleware**, **loggerMiddleware2**]
- Public Routes: [ **loggerMiddleware**]

---

-> loggerMiddleware SCOPE: `"instance"`;

-> loggerMiddleware2 SCOPE: `"global"`;

```
middlewares: [
  {
    handlers: loggerMiddleware,
    scope: "instance",
    strategy: "beforeAllGuards",
  },
  {
    handlers: loggerMiddleware2,
    scope: "global",
    strategy: "beforeAllGuards",
  },
]
```

#### Ordem dos middlewares:

- Api Routes: [**loggerMiddleware**, **loggerMiddleware2**, jwtGuard, aclCache, aclGuard]
- Public Routes: [ **loggerMiddleware2**]

### 2.2 - STRATEGY DIFERENTE:

-> loggerMiddleware SCOPE: `"global"`;

-> loggerMiddleware2 SCOPE: `"instance"`;

```
middlewares: [
  {
    handlers: loggerMiddleware,
    scope: "global",
    strategy: "afterAllGuards",
  },
  {
    handlers: loggerMiddleware2,
    scope: "instance",
    strategy: "beforeAllGuards",
  },
]
```

#### Ordem dos middlewares:

- Api Routes: [ **loggerMiddleware2**, jwtGuard, aclCache, aclGuard, **loggerMiddleware**]
- Public Routes: [ **loggerMiddleware**]

---

-> loggerMiddleware SCOPE: `"instance"`;

-> loggerMiddleware2 SCOPE: `"global"`;

```
middlewares: [
  {
    handlers: loggerMiddleware,
    scope: "instance",
    strategy: "afterAllGuards",
  },
  {
    handlers: loggerMiddleware2,
    scope: "global",
    strategy: "beforeAllGuards",
  },
]
```

#### Ordem dos middlewares:

- Api Routes: [ **loggerMiddleware2**, jwtGuard, aclCache, aclGuard, **loggerMiddleware**]
- Public Routes: [ **loggerMiddleware2**]
