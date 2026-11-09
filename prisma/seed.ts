import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { computeDueAt } from "../lib/sla";
import { formatProtocol } from "../lib/protocol";
import { CALDAS_CENTER, PRIORITIES, type Priority, type Status } from "../lib/constants";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Iluminação pública", slaHours: 72 },
  { name: "Buraco na via", slaHours: 168 },
  { name: "Coleta de lixo", slaHours: 48 },
  { name: "Água e esgoto", slaHours: 24 },
  { name: "Poda de árvore", slaHours: 120 },
  { name: "Outros", slaHours: 168 },
];

const SAMPLES: Record<string, { title: string; description: string }[]> = {
  "Iluminação pública": [
    { title: "Poste apagado na rua principal", description: "Poste em frente ao número 120 está apagado há uma semana." },
    { title: "Lâmpada piscando na praça", description: "Lâmpada da praça central fica piscando a noite toda." },
  ],
  "Buraco na via": [
    { title: "Buraco grande perto da escola", description: "Buraco profundo próximo à entrada da escola, perigoso para motos." },
    { title: "Asfalto afundando", description: "Trecho de asfalto cedendo após as chuvas." },
  ],
  "Coleta de lixo": [
    { title: "Lixo não recolhido", description: "O caminhão não passou nesta semana na minha rua." },
    { title: "Entulho na calçada", description: "Descarte irregular de entulho bloqueando a calçada." },
  ],
  "Água e esgoto": [
    { title: "Vazamento de água", description: "Água vazando no meio-fio há dois dias." },
    { title: "Bueiro entupido", description: "Bueiro entupido causando alagamento quando chove." },
  ],
  "Poda de árvore": [
    { title: "Galho encostando na fiação", description: "Galhos de árvore estão tocando os fios de energia." },
  ],
  Outros: [{ title: "Placa de rua caída", description: "Placa com nome da rua caída na esquina." }],
};

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
const HOUR = 3_600_000;

async function main() {
  await prisma.ticketEvent.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash("caldas123", 10);
  const admin = await prisma.user.create({
    data: { name: "Admin Prefeitura", email: "admin@caldas.mg.gov.br", passwordHash: hash, role: "ADMIN" },
  });
  const agent = await prisma.user.create({
    data: { name: "Ana Atendente", email: "atendente@caldas.mg.gov.br", passwordHash: hash, role: "AGENT" },
  });
  const citizens = await Promise.all(
    [
      { name: "Maria Morador", email: "maria@exemplo.com" },
      { name: "José Silva", email: "jose@exemplo.com" },
      { name: "Carla Souza", email: "carla@exemplo.com" },
    ].map((c) => prisma.user.create({ data: { ...c, passwordHash: hash, role: "CITIZEN" } })),
  );

  const cats = await Promise.all(CATEGORIES.map((c) => prisma.category.create({ data: c })));

  const now = Date.now();
  const year = new Date().getFullYear();
  for (let i = 1; i <= 30; i++) {
    const cat = pick(cats);
    const sample = pick(SAMPLES[cat.name]);
    const priority = pick(PRIORITIES) as Priority;
    const createdAt = new Date(now - rand(1, 24 * 20) * HOUR);
    const dueAt = computeDueAt(createdAt, cat.slaHours, priority);
    const author = pick(citizens);

    // Distribuição de status: chamados mais antigos tendem a estar resolvidos
    const ageH = (now - createdAt.getTime()) / HOUR;
    let status: Status;
    const r = Math.random();
    if (ageH > 24 * 7) status = r < 0.7 ? "CLOSED" : r < 0.85 ? "RESOLVED" : "IN_PROGRESS";
    else status = r < 0.35 ? "OPEN" : r < 0.65 ? "IN_PROGRESS" : r < 0.75 ? "WAITING_CITIZEN" : r < 0.95 ? "RESOLVED" : "REJECTED";

    const done = status === "RESOLVED" || status === "CLOSED";
    const slaMs = dueAt.getTime() - createdAt.getTime();
    const resolvedAt = done
      ? new Date(Math.min(now, createdAt.getTime() + slaMs * rand(0.3, 1.4)))
      : null;
    const assigneeId = status === "OPEN" ? null : agent.id;

    const events: { actorId: string; type: string; fromStatus?: string; toStatus?: string; message?: string; createdAt: Date }[] = [
      { actorId: author.id, type: "CREATED", toStatus: "OPEN", createdAt },
    ];
    if (status !== "OPEN") {
      const t = new Date(createdAt.getTime() + HOUR * rand(1, 6));
      events.push({ actorId: agent.id, type: "ASSIGNED", message: `Atribuído a ${agent.name}`, createdAt: t });
      events.push({
        actorId: agent.id,
        type: "STATUS_CHANGE",
        fromStatus: "OPEN",
        toStatus: status === "REJECTED" ? "REJECTED" : "IN_PROGRESS",
        message: status === "REJECTED" ? "Chamado duplicado." : "Equipe acionada.",
        createdAt: t,
      });
    }
    if (status === "WAITING_CITIZEN") {
      events.push({ actorId: agent.id, type: "STATUS_CHANGE", fromStatus: "IN_PROGRESS", toStatus: "WAITING_CITIZEN", message: "Pode informar um ponto de referência?", createdAt: new Date(now - HOUR) });
    }
    if (done && resolvedAt) {
      events.push({ actorId: agent.id, type: "STATUS_CHANGE", fromStatus: "IN_PROGRESS", toStatus: "RESOLVED", message: "Serviço executado.", createdAt: resolvedAt });
      if (status === "CLOSED") {
        events.push({ actorId: author.id, type: "STATUS_CHANGE", fromStatus: "RESOLVED", toStatus: "CLOSED", message: "Morador confirmou a resolução.", createdAt: new Date(Math.min(now, resolvedAt.getTime() + HOUR * 12)) });
      }
    }

    await prisma.ticket.create({
      data: {
        protocol: formatProtocol(year, i),
        title: sample.title,
        description: sample.description,
        status,
        priority,
        lat: CALDAS_CENTER[0] + rand(-0.012, 0.012),
        lng: CALDAS_CENTER[1] + rand(-0.012, 0.012),
        address: null,
        categoryId: cat.id,
        authorId: author.id,
        assigneeId,
        createdAt,
        dueAt,
        resolvedAt,
        events: { create: events },
      },
    });
  }

  console.log("Seed concluído. Senha de todos os usuários: caldas123");
  console.log(`  admin:     ${admin.email}`);
  console.log(`  atendente: ${agent.email}`);
  console.log(`  morador:   ${citizens[0].email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
