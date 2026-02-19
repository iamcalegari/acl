# ACL

A ACL system for fastify

## TODO

- [x] Remover as policies compiladas do payload do jwt
  - [x] Passar as policies compiladas para um cache para cada user/aclId

- [x] O que cada middleware faz deve ser definido na aplicaçao

- [x] Separar rotas publicas e privadas por pastas.
  - [x] Garantir que falhas de segurança não serão introduzidas durante fluxo de desenvolvimento

- [x] Alterar para nome middlewares

- [x] Colocar defaults nos "guards"/middlewares para evitar parametrizar demais

- [ ] Incluir enums para: actions, effects e modules. Vamos simplificar e colocar actions = metodos HTTP (1:1), para facilitar correllação em manutenções.

- [x] Precisamos pensar no front: deve ter alguma rota para retonar essas permissões ao front para rendereizar os componentes condicionalmente às permissões/perfil

### NEXT STEPS:

- [ ] Importante: Cache da ACL - o que acontece quando atualizarmos um perfil no DB? Garantir que usuários logados tenham os perfis atualizados.

- [ ] Feature bem vinda: Tirar o conceiro de submodule e tratar module que possui modulo pai
