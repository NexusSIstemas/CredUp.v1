# Integração do CREDUP com n8n, Chatwoot e Evolution API

Este documento registra o passo a passo para uma futura integração do CREDUP com:

- **n8n:** automações e orquestração dos fluxos.
- **Chatwoot:** chat do sistema e central de conversas.
- **Evolution API:** comunicação pelo WhatsApp.
- **CREDUP:** regras de negócio, autenticação e decisão final sobre aprovações.

## Arquitetura sugerida

```text
Comerciante solicita aprovação de um comércio
        ↓
CREDUP registra a solicitação
        ↓
n8n recebe um webhook autenticado
        ↓
Chatwoot cria ou atualiza uma conversa
        ↓
n8n coleta e confere as informações
        ↓
Evolution API envia avisos pelo WhatsApp
        ↓
Administrador confirma ou rejeita no CREDUP
```

Inicialmente, o n8n deve apenas analisar a solicitação e recomendar uma decisão. A aprovação definitiva deve continuar sendo realizada pelo administrador no CREDUP.

## 1. Configurar o n8n

### Obter `N8N_URL`

É o endereço onde o n8n está disponível.

Exemplo local:

```env
N8N_URL=http://localhost:5678
```

Quando o CREDUP e o n8n estiverem na mesma rede Docker:

```env
N8N_URL=http://n8n:5678
```

Em produção:

```env
N8N_URL=https://n8n.seudominio.com
```

### Obter `N8N_WEBHOOK_URL`

1. Entrar no n8n.
2. Criar um workflow.
3. Adicionar o nó `Webhook`.
4. Selecionar o método `POST`.
5. Definir o caminho:

```text
credup/aprovacao-comercio
```

6. Salvar e ativar o workflow.
7. Copiar a `Production URL`.

Exemplo:

```env
N8N_WEBHOOK_URL=https://n8n.seudominio.com/webhook/credup/aprovacao-comercio
```

Não utilizar a `Test URL` na integração definitiva. Ela só funciona enquanto o n8n está aguardando um teste.

### Gerar `N8N_WEBHOOK_SECRET`

No PowerShell:

```powershell
[guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
```

Salvar o resultado:

```env
N8N_WEBHOOK_SECRET=CHAVE_GERADA
```

O CREDUP deverá enviar essa chave em um cabeçalho HTTP. O workflow deverá comparar a chave recebida antes de processar a solicitação.

## 2. Configurar o Chatwoot

### Obter `CHATWOOT_URL`

Para uma instalação própria:

```env
CHATWOOT_URL=https://chat.seudominio.com
```

Para o Chatwoot Cloud:

```env
CHATWOOT_URL=https://app.chatwoot.com
```

Dentro da mesma rede Docker:

```env
CHATWOOT_URL=http://chatwoot:3000
```

### Obter `CHATWOOT_ACCOUNT_ID`

Abrir o painel do Chatwoot e observar a URL:

```text
https://chat.seudominio.com/app/accounts/1/dashboard
```

Nesse exemplo:

```env
CHATWOOT_ACCOUNT_ID=1
```

### Gerar `CHATWOOT_API_TOKEN`

1. Criar preferencialmente um usuário exclusivo chamado `integracao-credup`.
2. Entrar no Chatwoot com esse usuário.
3. Clicar no avatar.
4. Abrir as configurações do perfil.
5. Localizar `Access Token` ou `Token de acesso`.
6. Copiar o token.

```env
CHATWOOT_API_TOKEN=TOKEN_COPIADO
```

Não usar o token da conta pessoal do administrador quando for possível criar um usuário exclusivo para a integração.

### Obter `CHATWOOT_INBOX_ID`

1. Acessar `Configurações`.
2. Entrar em `Caixas de entrada`.
3. Criar uma caixa do tipo `Website`.
4. Usar o nome `Suporte CREDUP`.
5. Abrir a caixa criada.
6. Identificar o ID na URL ou consultar a lista de caixas pela API.

```env
CHATWOOT_INBOX_ID=1
```

### Obter o widget do chat

Na configuração da caixa `Website`, copiar o script fornecido pelo Chatwoot.

Esse script será adicionado posteriormente ao frontend do CREDUP. O widget deverá identificar o usuário autenticado sem expor tokens administrativos.

## 3. Configurar a Evolution API

### Obter `EVOLUTION_API_URL`

Em produção:

```env
EVOLUTION_API_URL=https://evolution.seudominio.com
```

Dentro da mesma rede Docker:

```env
EVOLUTION_API_URL=http://evolution-api:8080
```

### Gerar `EVOLUTION_API_KEY`

Em uma instalação própria, definir uma chave forte na configuração da Evolution API:

```env
AUTHENTICATION_API_KEY=CHAVE_FORTE
```

Para gerar uma chave no PowerShell:

```powershell
[guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
```

Usar o mesmo valor na configuração do CREDUP:

```env
EVOLUTION_API_KEY=CHAVE_FORTE
```

### Criar `EVOLUTION_INSTANCE`

O nome da instância é escolhido durante sua criação.

Sugestão:

```env
EVOLUTION_INSTANCE=credup-atendimento
```

Passos:

1. Entrar no painel da Evolution API.
2. Criar uma instância chamada `credup-atendimento`.
3. Gerar o QR Code.
4. Abrir o WhatsApp no celular.
5. Acessar `Aparelhos conectados`.
6. Escanear o QR Code.
7. Confirmar que a instância aparece como conectada.

## 4. Variáveis de ambiente

Adicionar ao arquivo `.env` sem versionar os valores reais:

```env
N8N_URL=http://n8n:5678
N8N_WEBHOOK_URL=http://n8n:5678/webhook/credup/aprovacao-comercio
N8N_WEBHOOK_SECRET=

CHATWOOT_URL=http://chatwoot:3000
CHATWOOT_ACCOUNT_ID=
CHATWOOT_INBOX_ID=
CHATWOOT_API_TOKEN=

EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_INSTANCE=credup-atendimento
EVOLUTION_API_KEY=
```

Adicionar somente os nomes das variáveis ao `.env.example`. Nunca colocar tokens verdadeiros nesse arquivo.

## 5. Segurança

- Nunca enviar tokens ou chaves secretas em conversas.
- Nunca colocar segredos diretamente no código-fonte.
- Não versionar o arquivo `.env`.
- Usar HTTPS em produção.
- Validar o segredo recebido por todos os webhooks.
- Registrar nos logs do CREDUP as automações executadas.
- Não enviar CPF completo, senha ou token de sessão para n8n, Chatwoot ou Evolution API.
- Enviar apenas os dados estritamente necessários.
- Manter a aprovação final com o administrador durante a primeira fase.
- Criar usuários e tokens exclusivos para integrações.
- Definir limites de tempo e tentativas nas chamadas externas.

## 6. Primeiro workflow do n8n

O primeiro workflow deverá:

1. Receber a solicitação do CREDUP pelo nó `Webhook`.
2. Validar `N8N_WEBHOOK_SECRET`.
3. Rejeitar requisições sem o segredo correto.
4. Ler o identificador da solicitação e do comércio.
5. Consultar os dados permitidos no backend CREDUP.
6. Criar ou localizar um contato no Chatwoot.
7. Criar uma conversa sobre a aprovação.
8. Enviar uma mensagem inicial com as informações não sensíveis.
9. Opcionalmente avisar o responsável pelo WhatsApp usando a Evolution API.
10. Aguardar a interação ou decisão.
11. Enviar a recomendação ao CREDUP.
12. Registrar sucesso ou falha no log de auditoria.

## 7. Chat dentro do CREDUP

O chat poderá aparecer para:

- Donos de comércio.
- Funcionários, se essa permissão for aprovada posteriormente.
- Administradores.

Recomendação inicial:

- Donos conversam sobre cadastros e aprovações.
- Funcionários não acessam assuntos administrativos.
- Administradores acompanham todas as conversas pelo Chatwoot.
- n8n responde dúvidas conhecidas e encaminha exceções para atendimento humano.

O n8n não deve ser usado como interface de chat. Ele será o automatizador por trás do Chatwoot.

## 8. Ordem recomendada de implantação

1. Instalar e abrir o n8n.
2. Instalar e configurar o Chatwoot.
3. Criar a caixa `Suporte CREDUP`.
4. Criar o usuário de integração do Chatwoot.
5. Instalar a Evolution API.
6. Criar a instância `credup-atendimento`.
7. Conectar o WhatsApp pelo QR Code.
8. Preencher as variáveis no `.env`.
9. Criar o workflow de aprovação no n8n.
10. Criar os webhooks no backend CREDUP.
11. Adicionar o widget do Chatwoot ao frontend.
12. Testar em ambiente local.
13. Publicar os serviços com HTTPS.
14. Manter a aprovação manual até validar a automação.

## 9. Checklist antes de começar a implementação

- [ ] n8n instalado e acessível.
- [ ] Workflow criado e ativado.
- [ ] URL de produção do webhook copiada.
- [ ] Segredo do webhook gerado.
- [ ] Chatwoot instalado ou conta Cloud criada.
- [ ] ID da conta do Chatwoot identificado.
- [ ] Caixa `Suporte CREDUP` criada.
- [ ] ID da caixa identificado.
- [ ] Usuário de integração criado.
- [ ] Token do Chatwoot gerado.
- [ ] Evolution API instalada.
- [ ] Chave da Evolution definida.
- [ ] Instância criada.
- [ ] WhatsApp conectado.
- [ ] Variáveis adicionadas ao `.env`.
- [ ] Nenhum segredo colocado no Git.
- [ ] Decidido quais perfis terão acesso ao chat.
- [ ] Definido que a aprovação inicial será manual.

## Referências

- [Documentação do n8n](https://docs.n8n.io/)
- [Documentação da API do Chatwoot](https://developers.chatwoot.com/)
- [Documentação da Evolution API](https://doc.evolution-api.com/)

