import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const faqItems = [
  {
    question: "O Circular Experience é mais uma palestra ou é diferente?",
    answer:
      "É um workshop imersivo — bem diferente de uma palestra. Os participantes não apenas ouvem: eles analisam produtos reais, trabalham em grupo com materiais concretos e produzem entregas ao longo da sessão. A metodologia combina teoria aplicada com dinâmicas mão na massa e encerramento estratégico, com um plano inicial de ação que cada participante leva para a realidade do seu trabalho.",
  },
  {
    question:
      "Qual é a duração? Dá para encaixar na grade da Semana do Meio Ambiente?",
    answer:
      "Sim. Existem duas modalidades: Edição Compacta (2h) — ideal para eventos ou programações mais curtas; e Imersão Completa (4h) — formato completo, com a Matriz de Intenções Estratégicas (Canvas exclusivo) e coffee break. O formato é escolhido conforme a disponibilidade e os objetivos da sua empresa. Nosso consultor vai te ajudar a decidir o melhor encaixe.",
  },
  {
    question: "Quantas pessoas podem participar?",
    answer:
      "Cada sessão comporta até 30 participantes. Esse limite garante qualidade na experiência e participação ativa nas dinâmicas — todo mundo fala, ninguém fica só assistindo. Para grupos maiores, é possível contratar múltiplas turmas no mesmo dia.",
  },
  {
    question: "O que está incluído? O que precisamos providenciar?",
    answer:
      "Incluso: metodologia completa, seleção e facilitação do especialista, materiais didáticos, divulgação nos canais do Movimento Circular e relatório pós-evento. Por conta da empresa: espaço físico (sala para até 30 pessoas com projetor, som e climatização), coffee break (apenas no formato 4h) e gerenciamento dos participantes (inscrições, confirmações, lista de presença).",
  },
  {
    question: "O que o time vai levar de concreto ao final da sessão?",
    answer:
      "Cada participante sai com nivelamento em Economia Circular suficiente para discutir o tema internamente, insights práticos sobre aplicações no seu contexto de trabalho e, no formato de 4 horas, um Canvas preenchido com encaminhamentos concretos. O Movimento Circular entrega também um Relatório de Intenções Estratégicas consolidando os aprendizados do grupo — uma base organizada para a gestão tomar decisões.",
  },
  {
    question:
      "Nossa empresa ainda não tem política de ESG. Faz sentido contratar?",
    answer:
      "Faz, e é exatamente para isso que o Circular Experience foi pensado. Ele é um ótimo ponto de partida para empresas que estão começando sua agenda de sustentabilidade — não é necessário ter um programa estruturado. Funciona tanto como iniciativa inaugural quanto como parte de um programa já em curso.",
  },
  {
    question:
      "Posso misturar equipes de diferentes áreas e cargos na mesma sessão?",
    answer:
      "Funciona muito bem assim. A diversidade de perspectivas dentro do grupo enriquece as dinâmicas — gestores, analistas, times de ESG, inovação e supply chain contribuem de formas diferentes. O facilitador conduz a sessão.",
  },
  {
    question:
      "Com quanto de antecedência preciso contratar para a Semana do Meio Ambiente?",
    answer:
      "Recomendamos pelo menos 3 a 4 semanas de antecedência para garantir personalização do conteúdo, produção dos materiais e alinhamento logístico. A Semana do Meio Ambiente é em junho — quanto antes o contato, melhor a chance de encaixar nas datas certas para você. Nossa agenda tende a fechar rápido nesse período.",
  },
];

const FAQSection = () => {
  const scrollToContact = () => {
    document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="faq" className="py-20 bg-muted/50">
      <div className="container max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-sm font-semibold tracking-widest uppercase text-secondary">
            Dúvidas Frequentes
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-3">
            Tudo o que você precisa saber antes da nossa conversa
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Respondemos as perguntas mais comuns de quem está avaliando o
            Circular Experience para a Semana do Meio Ambiente.
          </p>
        </div>

        {/* Accordion */}
        <Accordion
          type="single"
          collapsible
          defaultValue="item-0"
          className="space-y-3"
        >
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border rounded-lg px-5 bg-background transition-colors data-[state=open]:bg-primary/5 data-[state=open]:border-l-[3px] data-[state=open]:border-l-primary"
            >
              <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* CTA de fechamento */}
        <div className="mt-16 rounded-2xl bg-primary text-primary-foreground p-10 text-center">
          <h3 className="font-display text-2xl md:text-3xl font-bold mb-3">
            Ainda tem dúvidas?
          </h3>
          <p className="text-primary-foreground/80 mb-6">
            Fale com um dos nossos especialistas sem compromisso.
          </p>
          <Button
            variant="teal"
            size="lg"
            onClick={scrollToContact}
            className="gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            Falar com especialista
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
