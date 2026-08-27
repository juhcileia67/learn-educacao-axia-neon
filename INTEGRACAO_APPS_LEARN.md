# Integração progressiva dos apps Learn

O portal web já possui a estrutura de dados para **instituições**, **turmas**, **matrículas**, **atividades**, **entregas**, **sinais de aprendizagem** e **intervenções**. A sincronização com os apps Learn será ativada somente depois que a instituição disponibilizar sua configuração Firebase e definir um endpoint seguro de sincronização.

| Recurso sincronizado | Origem principal | Uso no portal |
|---|---|---|
| `classrooms` e `enrollments` | Learn Professor | Turmas, permissões e vínculo de estudantes |
| `activities` e `submissions` | Apps de professor e aluno | Entregas, prazos, XP e devolutivas |
| `learningSignals` | Evidências agregadas | Mapa de aprendizagem, radar e central de atenção |
| `interventions` | Professor + AXIA revisada | Histórico e encaminhamentos autorizados |

## Configuração necessária

O ambiente do servidor deverá receber `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`, `FIREBASE_PUBLIC_API_KEY` e `LEARN_SYNC_ENDPOINT`. Credenciais de conta de serviço **não devem** ser inseridas no cliente web, nos apps móveis ou no repositório. A integração permanece inativa, explicitamente sinalizada e sem dados reais até que os valores sejam fornecidos.

> O portal não realiza sincronização, cria documentos externos ou acessa contas Firebase enquanto essa configuração não estiver presente e validada.
