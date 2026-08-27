# Manifesto de exportação independente

## Identificação do snapshot

| Item | Valor |
|---|---|
| Projeto | Learn Educação — AXIA Neon |
| Commit-base da cópia | `af68c5ae8ae38ac7361a5fd50385d4fb5fc7678a` |
| Gerenciador de pacotes | pnpm (lockfile incluído) |
| Data de preparação | 2026-08-27 |
| Banco suportado | MySQL/TiDB via Drizzle ORM |

O pacote contém o código-fonte atual da cópia, incluindo frontend, backend, schema e migrations. A preparação adiciona documentação de migração e um modelo seguro de variáveis, sem modificar a lógica de produto.

## Validações executadas

| Comando | Resultado |
|---|---|
| `pnpm check` | Aprovado — TypeScript sem erros. |
| `pnpm test` | Aprovado — 3 arquivos e 6 testes. |
| `pnpm build` | Aprovado — frontend Vite e bundle Node gerados. |

O build emite apenas o aviso de tamanho de chunk do Vite para o bundle JavaScript acima de 500 kB. Esse aviso não interrompeu a geração e não altera a funcionalidade do código exportado.

## Conteúdo incluído

| Grupo | Conteúdo |
|---|---|
| Frontend | `client/`, com páginas, componentes, CSS, rotas e arquivos públicos. |
| Backend | `server/`, com tRPC, Express, helpers de dados, autenticação e adaptadores de serviços. |
| Banco | `drizzle/schema.ts`, `drizzle/relations.ts` e migrations SQL numeradas. |
| Código compartilhado | `shared/`, permissões, tipos e constantes. |
| Build | `package.json`, `pnpm-lock.yaml`, `tsconfig*.json`, `vite.config.ts`, `vitest.config.ts`, `drizzle.config.ts`, patch do Wouter e demais configurações versionadas. |
| Migração | `README.md`, `DEPENDENCIAS_MANUS.md`, `ENVIRONMENT_VARIABLES.example` e `client/public/assets/ASSETS_PENDENTES.md`. |

## Conteúdo intencionalmente excluído

| Item | Motivo |
|---|---|
| `node_modules/` | Dependências reproduzíveis por `pnpm install --frozen-lockfile`. |
| `dist/` | Artefato de build reproduzível por `pnpm build`. |
| `.manus-logs/` e caches | Arquivos temporários de execução e diagnóstico. |
| `.git/` | Histórico da cópia não é necessário à migração e aumenta o pacote. |
| `.project-config.json` | Metadados específicos do ambiente atual. |
| `.env` e credenciais | Segredos e dados sensíveis não podem ser exportados. |
| Banco com dados, sessões e URLs assinadas | Esta cópia preserva o schema, mas suas tabelas começam vazias. |

## Limitação de assets

Um dos seis PNGs externos — `axia-hero-luminous-object_3b3784ba.png` — foi recuperado do arquivo original enviado pelo usuário e está incluído no pacote atualizado. Os cinco recursos restantes retornaram autorização negada no storage atual; seus nomes e caminhos estão documentados em `DEPENDENCIAS_MANUS.md` e `client/public/assets/ASSETS_PENDENTES.md`. O pacote não contém substitutos artificiais para esses cinco recursos.
