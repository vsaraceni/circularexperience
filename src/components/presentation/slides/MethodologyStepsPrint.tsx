import circularExperienceLogo from "@/assets/circular-experience-logo.png";

const steps = [
  {
    number: "1",
    title: "Alinhando Conhecimentos",
    subtitle: "Palestra dialogada sobre Economia Circular com especialista",
    description:
      "Conceitos fundamentais, diferenças em relação ao modelo linear e exemplos inspiradores no Brasil e no mundo.",
    color: "hsl(174 72% 40%)",
  },
  {
    number: "2",
    title: "Identificando Oportunidades",
    subtitle: "Explorando os 7 R's da circularidade",
    description:
      "Recusar, Repensar, Reduzir, Reutilizar, Reparar, Regenerar e Reciclar aplicados ao seu negócio.",
    color: "hsl(307 44% 26%)",
  },
  {
    number: "3",
    title: "Criando Circularidade",
    subtitle: "Experiência mão-na-massa",
    description:
      "Oficina colaborativa e construção de um plano de ação prático e personalizado para sua organização.",
    color: "hsl(45 100% 50%)",
  },
];

const MethodologyStepsPrint = () => {
  return (
    <section
      className="w-full h-full flex flex-col justify-center px-16 py-10"
      style={{ fontFamily: "'Raleway', sans-serif", background: "hsl(248 0.7% 96.8%)" }}
    >
      <div className="text-center mb-10">
        <div className="flex justify-center mb-5">
          <img src={circularExperienceLogo} alt="Circular Experience" className="h-20 w-auto" />
        </div>
        <h2 className="text-4xl font-bold mb-3" style={{ color: "hsl(265 4% 12.9%)" }}>
          Nossa <span style={{ color: "hsl(307 44% 26%)" }}>Metodologia</span>
        </h2>
        <p className="text-lg" style={{ color: "hsl(257 4.6% 55.4%)" }}>
          Uma jornada em 3 etapas para capacitar sua equipe
        </p>
      </div>

      <div className="grid grid-cols-3 gap-10 px-8">
        {steps.map((step) => (
          <div key={step.number} className="flex flex-col items-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
              style={{ background: step.color }}
            >
              <span className="text-2xl font-bold text-white">{step.number}</span>
            </div>

            <div
              className="rounded-2xl p-6 h-full w-full"
              style={{ background: "white", border: "1px solid hsl(256 1.3% 92.9%)" }}
            >
              <h3 className="text-xl font-bold mb-2" style={{ color: "hsl(265 4% 12.9%)" }}>
                {step.title}
              </h3>
              <p className="font-semibold mb-3" style={{ color: "hsl(307 44% 26%)" }}>
                {step.subtitle}
              </p>
              <p className="leading-relaxed" style={{ color: "hsl(257 4.6% 55.4%)" }}>
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MethodologyStepsPrint;
