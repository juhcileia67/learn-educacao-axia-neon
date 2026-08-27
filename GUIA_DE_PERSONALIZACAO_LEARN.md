# Guia de personalização do Learn Educação — AXIA Neon

## Como evoluir o portal com segurança

O portal foi organizado para que **identidade visual, conteúdo pedagógico, acesso institucional e operações do banco** evoluam de forma separada. A regra mais importante é preservar a coerência entre interface e permissões: toda mudança visual pode ser rápida, mas qualquer mudança que exponha dados, crie papéis ou altere vínculos deve também ser validada no servidor.

> **Princípio de evolução:** a aparência pode mudar por área; as fronteiras de privacidade e autorização devem permanecer consistentes em toda a plataforma.

| Objetivo de personalização | Onde realizar | Cuidados necessários |
|---|---|---|
| Cores, tipografia e efeitos neon | `client/src/index.css` | Alterar os tokens `--midnight`, `--magenta`, `--cyan` e `--lime` em conjunto para manter contraste e acessibilidade. |
| Textos da landing page | `client/src/pages/Home.tsx` | Atualizar títulos, chamadas e seções públicas sem alterar links de entrada e identidade visual. |
| Textos e estrutura dos painéis | `client/src/pages/Portal.tsx` | Manter os estados de carregamento, vazio e erro próximos de cada consulta. |
| Menus por perfil | `studentNav`, `teacherNav` e `managementNav` em `Portal.tsx` | Sempre criar a proteção correspondente no servidor antes de tornar uma nova rota visível. |
| Papéis e permissões | `shared/platformRoles.ts` e `server/routers.ts` | Não basta esconder um botão; a permissão deve continuar aplicada no procedimento do servidor. |
| Dados e relacionamentos | `drizzle/schema.ts`, migrações e `server/db.ts` | Alterar o schema, gerar a migração e aplicar a mudança no banco antes de conectar a interface. |

## Personalizando o design

O visual atual usa uma linguagem **AXIA Neon**: fundo espacial escuro, magenta como cor de ação, ciano como cor de informação, verde-lima para estados positivos e superfícies translúcidas. Para uma identidade de outra escola, a forma mais segura é começar pelos tokens no início de `client/src/index.css`, preservando o contraste entre texto, fundo e componentes interativos.

Também é possível trocar o nome exibido, o símbolo visual e as mensagens de acolhimento. A marca usada no portal deve ser hospedada como ativo estático do projeto; em seguida, o endereço do ativo é aplicado nos componentes de cabeçalho e entrada. Evite inserir arquivos grandes diretamente dentro do código do portal.

## Personalizando o conteúdo pedagógico

O conteúdo de rotina é administrado pelos próprios fluxos do portal. Professores podem criar turmas, publicar atividades, definir matéria, instruções, prazo, XP, formato e modo de apoio da AXIA. A gestão pode criar instituições, atribuir papéis a contas já autenticadas e acompanhar recortes institucionais permitidos.

Quando a escola desejar novos campos — por exemplo, unidade curricular, etapa, objetivo de aprendizagem, rubrica de correção ou responsável pela turma — a evolução recomendada é:

1. Definir o novo campo e quem pode visualizá-lo ou editá-lo.
2. Adicionar o campo ao modelo de dados e aplicar a migração.
3. Atualizar as operações protegidas do servidor.
4. Exibir o campo nos formulários e relatórios com validação, estado de carregamento e erro.
5. Cobrir o fluxo com testes e revisar a responsividade.

## Usuários, contas e convites

O portal agora possui uma entrada própria e não oferece seleção livre de diretoria, professor ou aluno. Depois do login, a conta é direcionada pelo papel persistido. Uma conta sem papel institucional fica em uma tela de **vínculo pendente** até que a administração a associe corretamente.

Na configuração atual, o acesso usa o provedor de identidade conectado. Por isso, recuperação de senha, sessões e fatores de segurança são tratados no fluxo desse provedor. Para uma evolução posterior com **convites formais**, recomenda-se criar uma tabela de convites com instituição, papel permitido, e-mail, expiração, emissor e status de aceite. A atribuição de coordenação, diretoria e administração nunca deve ser uma escolha feita no cadastro público.

## O que manter em todas as alterações

| Regra de produto | Aplicação prática |
|---|---|
| Privacidade do estudante | O aluno visualiza apenas sua própria jornada; detalhes individuais ficam restritos a vínculos autorizados. |
| Decisão pedagógica humana | A AXIA pode orientar, resumir e sugerir, mas não aprova intervenções nem entrega respostas prontas em avaliações. |
| Controle de acesso no servidor | Toda rota e consulta sensível precisa usar procedimento protegido e validação de papel/vínculo. |
| Mobile como experiência própria | Em telas pequenas, preferir menu recolhível, uma coluna, botões confortáveis e tabelas transformadas em listas. |
| DEMO claramente identificado | Cenários sintéticos precisam usar marcação DEMO e nunca ser apresentados como dados de estudantes reais. |

## Sugestão de processo para próximos pedidos

Ao solicitar uma nova alteração, envie o objetivo, os perfis envolvidos, a tela que será afetada e um exemplo de como a ação deve funcionar. Por exemplo: “Somente a coordenação pode criar um comunicado institucional; professores devem confirmar leitura; alunos não podem receber o conteúdo desse comunicado”. Com essa estrutura, é possível alterar design e comportamento mantendo o produto seguro e coerente.
