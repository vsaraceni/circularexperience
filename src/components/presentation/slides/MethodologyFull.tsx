import { Lightbulb, Search, Wrench } from "lucide-react";
import circularExperienceLogo from "@/assets/circular-experience-logo.png";

const steps = [
  {
    number: "1",
    title: "Alinhando Conhecimentos",
    subtitle: "Palestra dialogada com especialista",
    description: "Conceitos fundamentais, diferenças em relação ao modelo linear e exemplos inspiradores.",
    icon: Lightbulb,
    color: "secondary",
  },
  {
    number: "2",
    title: "Identificando Oportunidades",
    subtitle: "Explorando os 7 R's da circularidade",
    description: "Recusar, Repensar, Reduzir, Reutilizar, Reparar, Regenerar e Reciclar aplicados ao seu negócio.",
    icon: Search,
    color: "primary",
  },
  {
    number: "3",
    title: "Criando Circularidade",
    subtitle: "Experiência mão-na-massa",
    description: "Oficina colaborativa e construção de um plano de ação prático e personalizado.",
    icon: Wrench,
    color: "accent",
  },
];

const benefits = [
  "Conceitos básicos e premissas da Economia Circular com foco em operações corporativas",
  "Circularidade de diferentes materiais para evitar desperdícios e minimizar custos",
  "Mapeamento de oportunidades para construção de negócios mais circulares",
  "Ferramentas e estratégias para identificação de processos circulares",
  "Criação de um plano de ação individual e coletivo",
  "Conexão com a rede do Movimento Circular",
];

const getColorClass = (color: string) => {
  switch (color) {
    case "primary": return "gradient-primary";
    case "secondary": return "gradient-secondary";
    case "accent": return "gradient-accent";
    default: return "gradient-primary";
  }
};

const MethodologyFull = () => {
  return (
    <section className="w-full py-6">
      <div className="container mx-auto px-4 md:!px-[46px]">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex justify-center mb-3">
            <img src={circularExperienceLogo} alt="Circular Experience" className="h-14 w-auto" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-1">
            Nossa <span className="text-gradient-primary">Metodologia</span>
          </h2>
          <p className="text-muted-foreground text-base">
            Uma jornada em 3 etapas para capacitar sua equipe
          </p>
        </div>

        {/* 3 Steps */}
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className={`w-12 h-12 ${getColorClass(step.color)} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg z-10 relative`}>
                <span className="text-xl font-bold text-primary-foreground">{step.number}</span>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border h-full">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-1">{step.title}</h3>
                <p className="text-primary font-medium text-sm mb-2">{step.subtitle}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="font-display text-xl font-bold text-foreground mb-3 text-center">
            O que seu time vai aprender
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                <div className="w-2 h-2 rounded-full gradient-primary mt-1.5 flex-shrink-0" />
                <p className="text-foreground text-xs">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MethodologyFull;
