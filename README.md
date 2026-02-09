# acl

A ACL system for fastify

## TODO

- Avaliar o tamanho do payload usado para assinar o JWT no login.

- [ ] Remover as policies compiladas do payload do jwt
  - [ ] Passar as policies compiladas para um cache para cada user/aclId

- [ ] O que cada middleware faz deve ser definido na aplicaçao

- [ ] Separar rotas publicas e privadas por pastas.
  - [ ] Garantir que falhas de segurança não serão introduzidas durante fluxo de desenvolvimento
