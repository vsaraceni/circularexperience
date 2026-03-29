export interface MessageTemplate {
  id: string;
  stage: string;
  channel: "email" | "whatsapp" | "linkedin";
  title: string;
  subject?: string; // for email
  body: string;
  order: number;
}

// Manual variables that need user input before copying
export const MANUAL_VARIABLES = [
  "{{dia1}}", "{{dia2}}", "{{horário}}", "{{mês}}", "{{prazo}}",
  "{{nome_especialista}}", "{{cargo_especialista}}", "{{data_envio_proposta}}",
];

export const CHANNEL_CONFIG: Record<string, { label: string; color: string }> = {
  email: { label: "E-mail", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  whatsapp: { label: "WhatsApp", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  linkedin: { label: "LinkedIn", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
};

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  // ===== NOVO =====
  {
    id: "novo-email-boasvindas",
    stage: "novo",
    channel: "email",
    title: "Boas-vindas",
    subject: "Circular Experience — próximos passos",
    body: `Olá, {{nome}}!

Vi que você pediu mais informações sobre o Circular Experience. Obrigada pelo interesse.

Sou a Lívia, do time comercial do Movimento Circular — o maior ecossistema de Economia Circular da América Latina.

Nos próximos minutos vou te chamar no WhatsApp para entender o contexto da {{empresa}} e te direcionar da melhor forma.

Enquanto isso, dois materiais rápidos:
- O que é o Circular Experience: https://experience.movimentocircular.io
- Quem é o Movimento Circular: https://movimentocircular.io

Até já!

Lívia Lins
Analista de Novos Negócios · Movimento Circular`,
    order: 1,
  },

  // ===== BOAS-VINDAS =====
  {
    id: "boasvindas-linkedin-conexao",
    stage: "boas_vindas",
    channel: "linkedin",
    title: "Pedido de conexão",
    body: `Olá, {{nome}}! Sou a Lívia, do Movimento Circular. Vi seu interesse no Circular Experience — vou te chamar no WhatsApp para conversarmos. Até já!`,
    order: 1,
  },
  {
    id: "boasvindas-whatsapp-empresa",
    stage: "boas_vindas",
    channel: "whatsapp",
    title: "Primeiro contato (com empresa)",
    body: `Olá, {{nome}}!

Sou a Lívia, do Movimento Circular. Enviei um e-mail agora há pouco — vi que você pediu informações sobre o Circular Experience.

Antes de te mandar qualquer material: qual é o contexto da {{empresa}} com economia circular ou sustentabilidade hoje? Tem alguma ação planejada ou ainda está mapeando possibilidades?

Lívia Lins · Movimento Circular`,
    order: 2,
  },
  {
    id: "boasvindas-whatsapp-sonome",
    stage: "boas_vindas",
    channel: "whatsapp",
    title: "Primeiro contato (só nome)",
    body: `Olá, {{nome}}!

Sou a Lívia, do Movimento Circular. Enviei um e-mail agora há pouco — vi que você pediu informações sobre o Circular Experience.

Me conta: tem alguma ação de sustentabilidade planejada para este ano ou ainda está explorando o tema?

Lívia Lins · Movimento Circular`,
    order: 3,
  },
  {
    id: "boasvindas-whatsapp-fup1",
    stage: "boas_vindas",
    channel: "whatsapp",
    title: "FUP 1 — 48h sem resposta",
    body: `{{nome}}, tudo bem?

Te mandei uma mensagem dois dias atrás sobre o Circular Experience. Sei que a agenda aperta — quer que eu te mande um resumo rápido do produto por aqui mesmo, ou prefere agendar 15 minutos com o time?

Lívia Lins · Movimento Circular`,
    order: 4,
  },
  {
    id: "boasvindas-whatsapp-fup2",
    stage: "boas_vindas",
    channel: "whatsapp",
    title: "FUP 2 — 96h sem resposta (última)",
    body: `{{nome}}, última tentativa por aqui.

Se o momento não é agora, sem problema — posso te procurar mais pra frente. Me avisa se faz sentido retomar em outro período e eu registro aqui.

Lívia Lins · Movimento Circular`,
    order: 5,
  },

  // ===== EM CONTATO =====
  {
    id: "emcontato-whatsapp-proporcall",
    stage: "em_contato",
    channel: "whatsapp",
    title: "Propor a call",
    body: `{{nome}}, pelo que você me contou, faz sentido conversar com o {{nome_especialista}} — ele é {{cargo_especialista}} do Movimento Circular e é quem conduz os projetos de Circular Experience.

A conversa é rápida (30 min), sem compromisso, e serve para entender o cenário de vocês e desenhar a melhor solução.

Tenho disponibilidade {{dia1}} ou {{dia2}} — qual funciona melhor?

Lívia Lins · Movimento Circular`,
    order: 1,
  },
  {
    id: "emcontato-whatsapp-maisinfo",
    stage: "em_contato",
    channel: "whatsapp",
    title: "Lead pediu mais informações",
    body: `Claro! Seguem dois materiais rápidos:

Como funciona na prática (2 min):
https://youtube.com/shorts/NLThGIMGUIY

Tudo sobre o produto:
https://experience.movimentocircular.io

Os números do Circular Experience:
→ +61 p.p. de aumento no nível de conhecimento em uma única sessão
→ 100% dos participantes com expectativas atendidas
→ NPS 98

Faz sentido agendar uma conversa rápida com o {{nome_especialista}}?

Lívia Lins · Movimento Circular`,
    order: 2,
  },

  // ===== CALL AGENDADA =====
  {
    id: "callagendada-whatsapp-warmup",
    stage: "call_agendada",
    channel: "whatsapp",
    title: "Warm-up D-1",
    body: `{{nome}}, lembrete da sua conversa amanhã com o {{nome_especialista}}, às {{horário}}.

Para aproveitar melhor o tempo, dois materiais curtos sobre o Circular Experience:

Como funciona na prática:
https://youtube.com/shorts/NLThGIMGUIY

Tudo sobre o produto:
https://experience.movimentocircular.io

Amanhã o {{nome_especialista}} vai entender o cenário de vocês e trazer as melhores opções. Até lá!

Lívia Lins · Movimento Circular`,
    order: 1,
  },
  {
    id: "callagendada-whatsapp-reagendar",
    stage: "call_agendada",
    channel: "whatsapp",
    title: "Cancelou / reagendamento",
    body: `Sem problema, {{nome}}! Tenho disponibilidade {{dia1}} ou {{dia2}} — qual funciona melhor?

Lívia Lins · Movimento Circular`,
    order: 2,
  },
  {
    id: "callagendada-whatsapp-noshow",
    stage: "call_agendada",
    channel: "whatsapp",
    title: "No-show",
    body: `{{nome}}, tudo bem? Não conseguimos nos conectar na call de hoje. Acontece!

Quer remarcar? Tenho {{dia1}} ou {{dia2}} disponível.

Lívia Lins · Movimento Circular`,
    order: 3,
  },

  // ===== NUTRIÇÃO =====
  {
    id: "nutricao-whatsapp-fup1",
    stage: "nutricao",
    channel: "whatsapp",
    title: "FUP 1 — D+5 após proposta",
    body: `{{nome}}, tudo bem?

Enviei a proposta do Circular Experience {{data_envio_proposta}}. Conseguiu avaliar? Se tiver alguma dúvida ou precisar de ajuste, estou à disposição.

{{nome_especialista}} · Movimento Circular`,
    order: 1,
  },
  {
    id: "nutricao-whatsapp-fup2",
    stage: "nutricao",
    channel: "whatsapp",
    title: "FUP 2 — D+10 (conteúdo de reforço)",
    body: `{{nome}}, compartilho um material que pode ajudar na avaliação:

Realizamos 11 oficinas em 3 estados com o Sebrae CSS. O relatório completo está aqui → [link]

Se precisar de algum ajuste na proposta ou quiser conversar novamente, estou por aqui.

{{nome_especialista}} · Movimento Circular`,
    order: 2,
  },
  {
    id: "nutricao-whatsapp-fup3",
    stage: "nutricao",
    channel: "whatsapp",
    title: "FUP 3 — D+15 (escassez + última)",
    body: `{{nome}}, última atualização: a agenda dos nossos especialistas para {{mês}} está com poucas vagas disponíveis.

Se o Circular Experience faz sentido para a {{empresa}}, consigo segurar a data até {{prazo}}. Se o momento não é agora, sem problema — me avisa e registro para retomar quando fizer sentido.

{{nome_especialista}} · Movimento Circular`,
    order: 3,
  },
];

export function getTemplatesForStage(stage: string): MessageTemplate[] {
  return MESSAGE_TEMPLATES.filter((t) => t.stage === stage).sort((a, b) => a.order - b.order);
}

export function replaceVariables(
  text: string,
  lead: { name: string; company?: string | null; cargo?: string | null },
  assignedProfile?: { full_name: string | null; cargo?: string | null } | null,
): string {
  let result = text;
  result = result.replace(/\{\{nome\}\}/g, lead.name || "");
  result = result.replace(/\{\{empresa\}\}/g, lead.company || "");
  result = result.replace(/\{\{cargo\}\}/g, lead.cargo || "");

  const specialistName = assignedProfile?.full_name || "nosso especialista";
  result = result.replace(/\{\{nome_especialista\}\}/g, specialistName);

  // Cargo specialist mapping
  let specialistRole = "do Movimento Circular";
  if (assignedProfile?.full_name?.toLowerCase().includes("vinicius")) {
    specialistRole = "Diretor Executivo do Movimento Circular";
  } else if (assignedProfile?.full_name?.toLowerCase().includes("alinye")) {
    specialistRole = "Gestora de Parcerias do Movimento Circular";
  }
  result = result.replace(/\{\{cargo_especialista\}\}/g, specialistRole);

  return result;
}

export function hasManualVariables(text: string): boolean {
  return MANUAL_VARIABLES.some((v) => text.includes(v));
}

export function highlightManualVariables(text: string): string {
  let result = text;
  for (const v of MANUAL_VARIABLES) {
    result = result.replace(
      new RegExp(v.replace(/[{}]/g, "\\$&"), "g"),
      `⟨${v.replace(/\{\{|\}\}/g, "")}⟩`
    );
  }
  return result;
}
