# CredUp

Plataforma colaborativa para gestão de inadimplência entre comerciantes. Esta entrega
implementa a **Fase 1 (MVP)** descrita no documento do projeto.

## Arquitetura

O repositório é um monorepo com uma aplicação backend e uma aplicação frontend. O
backend é um **monólito modular**: há um único artefato e um único banco, mas o código
é dividido por capacidade de negócio.

```text
backend/src/main/java/br/com/credup/
├── auth/          cadastro e login
├── identity/      usuários e comerciantes
├── commerce/      comércios e aprovação
├── defaults/      clientes inadimplentes e dívidas
├── audit/         trilha de acesso sensível
├── billing/       modelo de assinatura
├── security/      JWT e RBAC
└── shared/        tipos e tratamento de erros compartilhados

frontend/src/
├── pages/
├── services/
├── hooks/
└── types/
```

As entidades previstas para as fases seguintes já estão modeladas, mas seus fluxos
(notificação, contestação, comentários e PDF) não foram ativados. Isso evita avançar
além da Fase 1 sem confirmação.

## Funcionalidades do MVP

- cadastro e login de comerciante com senha BCrypt e token JWT;
- cadastro de comércio com estado inicial `PENDING`;
- aprovação ou reprovação por `ADMIN_REDE`;
- cadastro de cliente e dívida, reaproveitando o cliente pelo CPF;
- consulta paginada por nome parcial ou CPF exato;
- filtros por comércio, estado da dívida e faixa de valor;
- CPF mascarado nas listagens;
- consulta de CPF completo com registro em `AuditLog`;
- baixa lógica de dívida, alterando o estado para `PAID`;
- RBAC nos endpoints;
- recuperação de senha sem serviço externo, com aprovação administrativa e senha temporária;
- migration Flyway com índices PostgreSQL e `pg_trgm`;
- interface React responsiva para os principais fluxos.

## Executar com Docker

Requisitos: Docker com Docker Compose.

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:8080
- PostgreSQL: localhost:5432

O administrador inicial é criado na primeira inicialização:

- e-mail: `admin@credup.local`
- senha: `change-me-now`

Defina `ADMIN_EMAIL`, `ADMIN_PASSWORD` e um `JWT_SECRET` seguro em um arquivo `.env`
antes de usar fora do ambiente local. Há um modelo em `.env.example`.

## Desenvolvimento sem Docker

Use Java 17, Maven 3.9+, Node.js 22+ e PostgreSQL 17+.

```bash
cd backend
mvn spring-boot:run
```

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O backend usa por padrão o banco `jdbc:postgresql://localhost:5432/credup`, usuário e
senha `credup`. Essas opções podem ser alteradas por `DATABASE_URL`,
`DATABASE_USER` e `DATABASE_PASSWORD`.

## Endpoints principais

| Método | Caminho | Acesso |
|---|---|---|
| POST | `/api/auth/register` | público |
| POST | `/api/auth/login` | público |
| POST | `/api/auth/forgot-password` | público |
| POST | `/api/auth/change-password` | usuário com senha temporária |
| GET | `/api/auth/password-resets` | admin |
| POST | `/api/auth/password-resets/{id}/approve` | admin |
| POST | `/api/commerces` | comerciante |
| GET | `/api/commerces` | autenticado |
| PATCH | `/api/commerces/{id}/review` | admin |
| POST | `/api/debts` | comerciante |
| GET | `/api/defaults` | autenticado |
| GET | `/api/clients/{id}` | autenticado, auditado |
| PATCH | `/api/debts/{id}/settle` | comerciante responsável |

Envie o token como `Authorization: Bearer <token>`.

## Testes e build

```bash
cd backend
mvn test

cd ../frontend
npm install
npm run build
```

## Próxima etapa

A Fase 2 (notificação obrigatória, prazo de visibilidade, contestação pública,
auditoria completa e histórico em PDF) deve ser iniciada somente após confirmação.
