import { Lightbulb, Search, Wrench } from "lucide-react";
import circularExperienceLogo from "@/assets/circular-experience-logo.png";

const steps = [
  {
    number: "1",
    title: "Alinhando Conhecimentos",
    subtitle: "Palestra dialogada sobre Economia Circular com especialista",
    description: "Conceitos fundamentais, diferenças em relação ao modelo linear e exemplos inspiradores no Brasil e no mundo.",
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
    description: "Oficina colaborativa e construção de um plano de ação prático e personalizado para sua organização.",
    icon: Wrench,
    color: "accent",
  },
];

const getColorClass = (color: string) => {
  switch (color) {
    case "primary": return "gradient-primary";
    case "secondary": return "gradient-secondary";
    case "accent": return "gradient-accent";
    default: return "gradient-primary";
  }
};

const MethodologySteps = () => {
  return (
    <section className="py-10 bg-muted/30 w-full">
      <div className="container mx-auto px-4 md:!px-[46px]">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img src={circularExperienceLogo} alt="Circular Experience" className="h-[83px] md:h-[104px] w-auto" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Nossa <span className="text-gradient-primary">Metodologia</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Uma jornada em 3 etapas para capacitar sua equipe
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary to-accent/70" style={{ width: "calc(100% - 200px)", marginLeft: "100px" }} />
          <div className="grid lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                <div className={`w-16 h-16 ${getColorClass(step.color)} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform z-10 relative`}>
                  <span className="text-2xl font-bold text-primary-foreground">{step.number}</span>
                </div>
                <div className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg h-full">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-primary font-medium mb-3">{step.subtitle}</p>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MethodologySteps;
