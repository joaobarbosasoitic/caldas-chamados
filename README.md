# Caldas Chamados (MVP)

Canal para moradores de Caldas (MG) relatarem problemas urbanos e acompanharem a resolução, com prazos (SLA) por categoria — como um helpdesk, mas para a cidade.

## Funcionalidades

**Morador**
- Cadastro/login com e-mail e senha
- Abrir chamado: categoria, título, descrição, foto (JPG/PNG/WEBP até 5 MB) e local no mapa (toque no mapa ou "usar minha localização")
- Protocolo `CAL-AAAA-NNNNNN` e e-mail de confirmação
- Acompanhar status, prazo e histórico; responder quando a prefeitura pedir informação
- Confirmar a resolução (encerra) ou reabrir

**Prefeitura (atendente / admin)**
- Painel de SLA: ativos, atrasados, em risco, sem responsável, % resolvido no prazo (30 dias), tempo médio por categoria, mapa e listas de urgência
- Fila ordenada por vencimento, com filtros (status, categoria, SLA, responsável, busca por protocolo)
- Atribuir responsável, mudar status/prioridade, mensagens públicas ou notas internas
- Admin: cadastrar categorias e definir o SLA (horas) de cada uma

**SLA**
- Prazo = SLA da categoria × fator da prioridade (alta 0,5 · média 1 · baixa 1,5), corrido (24×7)
- Estados: *No prazo*, *Em risco* (<20% do prazo restante), *Atrasado*, *Cumprido*, *Fora do prazo*
- Regras em `lib/sla.ts`

**E-mails** ao abrir chamado, a cada mudança de status e a cada mensagem pública. Sem `SMTP_HOST` configurado, os e-mails são apenas impressos no console do servidor.

## Stack

Next.js 15 (App Router, Server Actions) · Prisma + SQLite · Auth.js v5 (credenciais, JWT) · Tailwind CSS v4 · Leaflet/OpenStreetMap · Recharts · Nodemailer · Vitest

## Rodando

```bash
npm install
cp .env.example .env          # e gere AUTH_SECRET: openssl rand -base64 32
npx prisma migrate dev        # cria prisma/dev.db
npm run db:seed               # categorias, usuários e 30 chamados de exemplo
npm run dev                   # http://localhost:3000
```

Usuários do seed (senha `caldas123`):

| Papel     | E-mail                       |
|-----------|------------------------------|
| Admin     | admin@caldas.mg.gov.br       |
| Atendente | atendente@caldas.mg.gov.br   |
| Morador   | maria@exemplo.com            |

Outros scripts: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run db:reset`.

## Estrutura

```
app/
  page.tsx                     página pública + mapa de chamados abertos
  login/ register/ inicio/     autenticação (inicio redireciona por papel)
  chamados/                    área do morador (lista, novo, detalhe)
  painel/                      área da prefeitura (dashboard, fila, detalhe, categorias)
  actions/                     server actions (auth e chamados)
  uploads/[file]/route.ts      serve as fotos enviadas
lib/                           sla, protocolo, e-mail, upload, prisma, permissões
components/                    badges, mapa, timeline, gráfico, formulários
auth.ts / auth.config.ts       Auth.js (config edge-safe usada pelo middleware)
middleware.ts                  protege /chamados e /painel por papel
prisma/                        schema e seed
```

As fotos ficam em `uploads/` (fora de `public/`, que em produção só serve arquivos existentes no build).

## Fora do MVP (próximos passos)

- Deploy + Postgres (trocar `provider` em `prisma/schema.prisma`) e storage de fotos em nuvem (S3/R2)
- SLA em horário útil / feriados municipais; pausar o relógio em "Aguardando morador"
- Secretarias/equipes e roteamento automático por categoria
- Notificações por WhatsApp/push; recuperação de senha por e-mail
- Moderação de chamados duplicados; votos/"também vi isso"
- LGPD: termo de uso, exportação e exclusão de dados
- Rate limiting no cadastro/login e na abertura de chamados
