# Dependências específicas do Manus

Este documento separa o que é **portável** do que precisa ser substituído antes de uma hospedagem totalmente independente. O código é exportável; os serviços internos e as credenciais não são exportados.

## Resumo executivo

| Dependência | Onde é usada | Situação fora do Manus | Substituição necessária |
|---|---|---|---|
| OAuth Manus | `client/src/const.ts`, `server/_core/oauth.ts`, `server/_core/sdk.ts`, `client/src/_core/hooks/useAuth.ts` | Não funciona sem os endpoints e o contrato proprietário do provedor atual. | Adaptar para Auth.js, Keycloak, Auth0, Clerk, Cognito ou OAuth/OIDC próprio; manter o mapeamento para `users.openId` e `users.role`. |
| Forge/LLM | `server/_core/llm.ts`, procedure `platform.axiaChat` | O chat AXIA depende de `BUILT_IN_FORGE_API_URL` e `BUILT_IN_FORGE_API_KEY`. | Implementar um adaptador para a API de IA escolhida e guardar sua chave no servidor. |
| Storage interno | `server/storage.ts`, `server/_core/storageProxy.ts` e URLs `/manus-storage/*` | As URLs exigem autorização do storage atual e não são portáveis. | Migrar bytes para S3, Cloudflare R2, Google Cloud Storage ou serviço equivalente; servir URLs próprias/presignadas. |
| Runtime/Vite | `vite.config.ts`, pacote `vite-plugin-manus-runtime` | Plugin é específico do ambiente atual. | Remover o plugin e o coletor `__manus__`; manter React, Tailwind e Vite. |
| Analytics | `client/index.html` | O script lê variáveis provisionadas na infraestrutura atual. | Configurar uma instância própria de Umami ou remover o bloco de analytics. |
| Recursos de plataforma | `server/_core/heartbeat.ts`, `imageGeneration.ts`, `voiceTranscription.ts`, `map.ts`, `notification.ts`, `dataApi.ts`, `systemRouter.ts` | São adaptadores para APIs internas e não integram os fluxos principais do portal. | Remover se não forem usados ou reimplementar por serviço externo correspondente. |

## Assets não recuperados nesta cópia

O frontend referenciava seis PNGs pelo caminho `/manus-storage/`. A imagem principal da AXIA foi recuperada do arquivo enviado pelo usuário e será incluída como asset local na exportação atualizada. Os cinco recursos restantes não estavam presentes no filesystem desta cópia e o storage atual recusou a recuperação com a autorização deste novo projeto. Para não substituir arte visual por conteúdo inventado, eles não foram recriados.

| Asset referenciado | Pontos de uso | Ação necessária |
|---|---|---|
| `axia-hero-luminous-object_3b3784ba.png` | Hero e painel docente | Recuperado do arquivo `axiaAvatar.png` enviado pelo usuário; será salvo em `client/public/assets/`. |
| `axia-neon-activity-scene_49f4476b.png` | Landing | Exportar o PNG original e atualizar a referência para `/assets/...`. |
| `axia-neon-hero-city_78ca7d9b.png` | Landing | Exportar o PNG original e atualizar a referência para `/assets/...`. |
| `axia-neon-mark_befbeb3c.png` | Marca e portal | Exportar o PNG original e atualizar a referência para `/assets/...`. |
| `axia-neon-orbit-learning_4963663d.png` | Landing | Exportar o PNG original e atualizar a referência para `/assets/...`. |
| `axia-neon-tutor_93546aa8.png` | Landing | Exportar o PNG original e atualizar a referência para `/assets/...`. |

> Os cinco assets marcados como pendentes são a única lacuna conhecida de recursos visuais desta cópia. Não havia outros arquivos de imagem, fonte, vídeo ou SVG locais versionados no projeto no momento da preparação.

## Migração recomendada por domínio

### Autenticação e sessão

Mantenha a tabela `users`, seus papéis e `shared/platformRoles.ts`. Troque a obtenção de identidade do provedor atual por um callback OIDC/OAuth padrão que faça upsert de `openId`, nome e e-mail; depois assine ou valide uma sessão JWT com `JWT_SECRET`. Atualize `startLogin()` no cliente e a rota `/api/oauth/callback` no servidor. Remova também os itens de `localStorage` e `sessionStorage` que usam os nomes `manus-runtime-user-info` e `manus-cookie`.

### IA da AXIA

A procedure `platform.axiaChat` já concentra a chamada de IA do produto em `server/routers.ts`. Preserve suas instruções e substitua `invokeLLM` por um módulo com a mesma saída (`choices[0].message.content`) ou adapte diretamente a procedure. A chave da IA deve permanecer exclusivamente no backend.

### Arquivos e imagens

Substitua `storagePut`, `storageGet` e `storageGetSignedUrl` por um adaptador de objeto compatível. Mantenha no banco somente a chave/URL dos anexos (`attachmentKey`); não armazene bytes em colunas SQL. Atualize no cliente todas as URLs `/manus-storage/<arquivo>` para o seu caminho público ou CDN.

### Banco e dados

MySQL/TiDB e Drizzle são portáveis. Execute as migrations SQL em ordem e configure `DATABASE_URL`. Como esta cópia começa sem dados, será necessário criar o primeiro administrador e registros de instituições/vínculos antes de haver conteúdo real nos painéis. O modo DEMO é criado pela procedure `platform.createDemoScenario` para um administrador autorizado e não substitui dados de produção.

## Itens que não fazem parte do ZIP

As chaves privadas, tokens, URLs assinadas, banco de dados com conteúdo, sessões de usuários, deployment, domínio e histórico de checkpoints não são exportados. `node_modules`, diretórios de build, logs e caches também são propositalmente omitidos, pois podem ser recriados a partir de `package.json` e `pnpm-lock.yaml`.

Por limitação de segurança da plataforma, o repositório e o pacote mantêm o modelo sem segredos como `ENVIRONMENT_VARIABLES.example`, em vez de criar diretamente um arquivo chamado `.env.example`. O desenvolvedor responsável deve renomeá-lo para `.env.example` ou copiá-lo para `.env` e preencher os valores no ambiente de destino.
