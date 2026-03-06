const MethodologyBenefits = () => {
  const benefits = [
    "Conceitos básicos e premissas da Economia Circular com foco em operações corporativas",
    "Circularidade de diferentes materiais para evitar desperdícios e minimizar custos",
    "Mapeamento de oportunidades para construção de negócios mais circulares",
    "Ferramentas e estratégias para identificação de processos circulares",
    "Criação de um plano de ação individual e coletivo",
    "Conexão com a rede do Movimento Circular",
  ];

  return (
    <section className="py-16 bg-muted/30 w-full">
      <div className="container mx-auto px-4 md:!px-[46px]">
        <div className="bg-card rounded-2xl p-8 border border-border">
          <h3 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2 text-center">
            O que seu time vai aprender
          </h3>
          <p className="text-base md:text-lg text-muted-foreground text-center mb-6">
            Conteúdos práticos para transformar a operação da sua empresa
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                <div className="w-2 h-2 rounded-full gradient-primary mt-2 flex-shrink-0" />
                <p className="text-foreground text-sm">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MethodologyBenefits;
