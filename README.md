# Learn Educação — AXIA Neon

Este repositório contém a aplicação web Learn Educação / AXIA Neon, com uma página institucional e painéis protegidos para **aluno**, **professor**, **coordenação**, **diretoria** e **administração**. A cópia de banco associada a este projeto contém apenas o schema; não há dados de produção nem seeds neste pacote.

> **Estado da exportação.** O código é fornecido como fonte de migração. Ele preserva o funcionamento e as integrações existentes, mas o login, o chat da AXIA e o storage ainda possuem adaptadores específicos da infraestrutura Manus. Leia [`DEPENDENCIAS_MANUS.md`](./DEPENDENCIAS_MANUS.md) antes de publicar em outro provedor.

## Stack e arquitetura

| Camada | Tecnologia | Papel no projeto |
|---|---|---|
| Interface | React 19, TypeScript, Vite e Tailwind CSS 4 | Landing page, portal responsivo, componentes de interface e rotas do navegador. |
| API | Node.js, Express e tRPC 11 | API tipada em `/api/trpc`, autenticação e regras de autorização. |
| Dados | MySQL/TiDB, Drizzle ORM e Drizzle Kit | Schema, queries, índices e migrações SQL versionadas. |
| Sessão | JWT assinado com `jose` | Cookie de sessão após autenticação OAuth. |
| IA | Adaptador `invokeLLM` | Chat AXIA para aluno e professor; atualmente ligado ao Forge/Manus. |

Os módulos de produto estão em `client/src/pages/Portal.tsx`, `server/routers.ts`, `server/db.ts`, `drizzle/schema.ts` e `shared/platformRoles.ts`. As rotas de dados são mantidas como procedures tRPC, e as permissões são verificadas no servidor por papel e vínculo institucional.

## Conteúdo funcional

A aplicação inclui entrada institucional, autenticação por conta autorizada, roteamento por papel persistido, painéis de professor e gestão, turmas, atividades, entregas, intervenções, reconhecimento com origem verificável, chat AXIA e uma área privada do aluno com atividades, devolutivas, conquistas e linha do tempo. O modo DEMO é identificado e separado do papel real do usuário.

| Área | Código principal |
|---|---|
| Landing e acesso | `client/src/pages/Home.tsx`, `client/src/pages/Portal.tsx` |
| Layout e navegação | `client/src/components/DashboardLayout.tsx` |
| Procedures e autorização | `server/routers.ts`, `shared/platformRoles.ts` |
| Queries e persistência | `server/db.ts` |
| Schema e migrações | `drizzle/schema.ts`, `drizzle/*.sql` |
| Autenticação | `client/src/const.ts`, `server/_core/oauth.ts`, `server/_core/sdk.ts` |

## Pré-requisitos

Use **Node.js 22+**, `pnpm` compatível com a versão fixada em `package.json` e uma instância MySQL 8+/TiDB compatível. O modelo seguro de variáveis está em `ENVIRONMENT_VARIABLES.example`; ao migrar, renomeie-o para `.env` e nunca versione credenciais reais:

```bash
cp ENVIRONMENT_VARIABLES.example .env
pnpm install --frozen-lockfile
```

Defina ao menos `DATABASE_URL` e `JWT_SECRET`. Para executar o fluxo de login, substitua o adaptador Manus conforme descrito em [`DEPENDENCIAS_MANUS.md`](./DEPENDENCIAS_MANUS.md); preencher URLs arbitrárias no OAuth atual não é suficiente, porque ele chama endpoints proprietários.

## Banco de dados

As migrações Drizzle estão em `drizzle/0000_foamy_bishop.sql` até `drizzle/0003_noisy_mister_sinister.sql`. Em um banco novo, revise-as e aplique-as pelo seu pipeline de migrations. O projeto usa o dialect MySQL em `drizzle.config.ts`.

```bash
# Gere migrations ao alterar drizzle/schema.ts.
pnpm drizzle-kit generate

# Aplique as migrations no ambiente configurado.
pnpm drizzle-kit migrate
```

Não há arquivos de seed neste código. Crie as instituições, os papéis e os vínculos iniciais usando procedures administrativas ou um script próprio, depois de configurar autenticação e o primeiro administrador.

## Execução e validação

```bash
# Ambiente de desenvolvimento, com Vite e Express.
pnpm dev

# Verificações recomendadas antes de publicar.
pnpm check
pnpm test
pnpm build

# Produção: gera dist/public e dist/index.js.
NODE_ENV=production pnpm start
```

O servidor completo é `server/_core/index.ts`. Ele expõe o frontend compilado, `POST/GET /api/trpc/*`, `GET /api/oauth/callback` e, na configuração original, `/manus-storage/*`. O arquivo `server/index.ts` é apenas um servidor estático alternativo e não deve ser usado para hospedar as funcionalidades de API, login e storage.

## Deploy externo

Em qualquer provedor com serviço Node, configure a instalação com `pnpm install --frozen-lockfile`, o build com `pnpm build` e o comando de execução com `NODE_ENV=production pnpm start`. Exponha a porta definida por `PORT`, injete as variáveis pelo cofre de segredos do provedor e garanta que cookies sejam enviados apenas sobre HTTPS em produção.

Antes do deploy, remova `vite-plugin-manus-runtime` de `vite.config.ts`, remova o coletor de logs `__manus__` caso não seja necessário e substitua os adaptadores de OAuth, LLM e storage. As seis imagens da interface precisam ser recuperadas e servidas por `client/public/assets/` ou por um CDN próprio; a relação está em [`client/public/assets/ASSETS_PENDENTES.md`](./client/public/assets/ASSETS_PENDENTES.md).

## Estrutura de arquivos

```text
client/              frontend React/Vite e recursos públicos
server/              API tRPC, consultas de dados e integração de serviços
drizzle/             schema, relações e migrations SQL
shared/              papéis, permissões, tipos e constantes compartilhadas
patches/             patch necessário ao pacote wouter
```

O pacote de migração omite `node_modules`, builds, logs, caches, `.git` e credenciais. Por limitação de segurança da plataforma, o modelo é incluído como `ENVIRONMENT_VARIABLES.example`; no provedor externo, renomeie-o para `.env.example` ou copie-o para `.env` e preencha os valores. Consulte o manifesto incluso na raiz do pacote ZIP para o inventário final e checksums.
