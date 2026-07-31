# Publicação da CredUp na VPS Integrator

Este projeto está preparado para publicação com Docker Compose, PostgreSQL
persistente, frontend Nginx, backend Spring Boot e proxy interno para `/api`.

## 1. Informações necessárias

- IP público da VPS;
- acesso ao painel ICP ou ao SSH;
- domínio ou subdomínio;
- acesso ao DNS do domínio;
- repositório Git privado ou arquivos do projeto na VPS.

Nunca envie a senha root da VPS por mensagem e nunca publique
`.env.production` no Git.

## 2. DNS

No provedor do domínio, crie um registro:

```text
Tipo: A
Nome: credup
Valor: IP_PUBLICO_DA_VPS
TTL: 300
```

O endereço resultante será semelhante a:

```text
https://credup.seudominio.com.br
```

Espere a propagação antes de ativar o SSL.

## 3. Enviar o projeto

Com Git:

```bash
git clone URL_DO_REPOSITORIO
cd Credup
```

Também é possível cadastrar o repositório pela função de Git/CI/CD do ICP.

## 4. Configurar os segredos

Na raiz do projeto:

```bash
cp .env.production.example .env.production
nano .env.production
```

Substitua todos os valores `CHANGE_ME`. Para gerar valores seguros:

```bash
openssl rand -base64 48
```

Use um resultado diferente para `DATABASE_PASSWORD`, `JWT_SECRET` e
`ADMIN_PASSWORD`. Em `APP_ORIGIN`, informe a URL HTTPS final sem barra no fim.

Proteja o arquivo:

```bash
chmod 600 .env.production
chmod +x scripts/deploy-production.sh scripts/backup-postgres.sh
```

## 5. Subir a aplicação

```bash
./scripts/deploy-production.sh
```

Verifique os serviços:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  ps
```

Verifique os logs:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  logs -f --tail=200
```

O frontend ficará disponível somente no endereço local
`127.0.0.1:8088`. PostgreSQL e backend não possuem portas públicas.

## 6. Configurar domínio e HTTPS no ICP

No painel ICP:

1. cadastre o domínio definido em `APP_ORIGIN`;
2. selecione proxy reverso para `http://127.0.0.1:8088`;
3. ative o certificado SSL gratuito;
4. habilite o redirecionamento de HTTP para HTTPS;
5. teste `https://SEU_DOMINIO/health`;
6. acesse a página e faça login com `ADMIN_EMAIL` e `ADMIN_PASSWORD`.

Se o ICP executar o proxy dentro de outro container e não conseguir acessar
`127.0.0.1:8088`, troque no Compose:

```yaml
ports:
  - "${APP_HTTP_PORT:-8088}:80"
```

Depois limite a porta `8088` no firewall para não deixá-la pública.

## 7. Firewall

Deixe públicas somente:

```text
22/tcp   SSH
80/tcp   HTTP
443/tcp  HTTPS
```

Não publique as portas `5432`, `5433`, `8080` ou `8088`.

## 8. Backup

Teste o backup:

```bash
./scripts/backup-postgres.sh
```

Agende diariamente:

```bash
crontab -e
```

Exemplo para executar às 03:00:

```cron
0 3 * * * /CAMINHO/Credup/scripts/backup-postgres.sh >> /CAMINHO/Credup/backup.log 2>&1
```

Mantenha também uma cópia fora da VPS. Um backup armazenado apenas no mesmo
servidor não protege contra perda total da máquina.

## 9. Atualizações

```bash
cd /CAMINHO/Credup
git pull
./scripts/deploy-production.sh
```

Antes de uma atualização importante:

```bash
./scripts/backup-postgres.sh
```

## 10. Verificação final

- domínio abre somente em HTTPS;
- `/health` retorna `ok`;
- login do administrador funciona;
- cadastro e aprovação de comércio funcionam;
- primeiro acesso do funcionário solicita troca de senha;
- geração de PDF funciona;
- PostgreSQL não está exposto;
- reiniciar a VPS não apaga os dados;
- backup foi copiado e restaurado em ambiente de teste.
