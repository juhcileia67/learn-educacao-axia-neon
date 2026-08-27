# Pesquisa de arquitetura em tempo real — Learn Educação

## Fontes oficiais consultadas

O Cloud Firestore disponibiliza listeners por documento ou consulta com `onSnapshot()`. O cliente recebe um estado inicial e atualizações subsequentes quando os dados mudam. Escritas locais também acionam o listener antes da confirmação do servidor, e o metadado `hasPendingWrites` permite distinguir mudanças ainda pendentes de sincronização. [1]

O Firebase Cloud Messaging (FCM) atende a notificações cross-platform para Android, iOS e web. O envio deve ocorrer em ambiente confiável, como um servidor de aplicação ou Cloud Functions. A plataforma permite direcionamento por dispositivo, grupo ou tópico. [2]

Para comunicação ativa no navegador, Socket.IO oferece comunicação bidirecional, baseada em eventos, com reconexão, acknowledgements e broadcasting para subconjuntos de clientes. A documentação alerta que conexões persistentes não são adequadas como serviço de fundo em dispositivos móveis; para esse cenário, recomenda uma plataforma dedicada como o FCM. [3]

## Aplicação recomendada ao Learn

O banco do portal permanece como fonte de verdade para permissões, auditoria, turmas e registros. O Firestore pode espelhar apenas o fluxo conversacional e a presença em tempo real, com regras por instituição, turma e papel. O FCM entrega alertas fora do aplicativo, e o Socket.IO pode ser usado apenas na sessão web ativa quando uma conversa precisa de baixa latência.

### Referências

[1] Firebase. *Get realtime updates with Cloud Firestore*. https://firebase.google.com/docs/firestore/query-data/listen

[2] Firebase. *Firebase Cloud Messaging*. https://firebase.google.com/docs/cloud-messaging

[3] Socket.IO. *Introduction*. https://socket.io/docs/v4/
