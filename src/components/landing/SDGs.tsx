const sdgs = [
  {
    number: 9,
    title: "Indústria, Inovação e Infraestrutura",
    description: "Incentiva a inovação e criação de soluções práticas para a economia circular.",
    color: "hsl(25, 100%, 50%)",
  },
  {
    number: 11,
    title: "Cidades e Comunidades Sustentáveis",
    description: "Contribui para tornar as cidades mais sustentáveis com melhor gestão de recursos.",
    color: "hsl(38, 100%, 50%)",
  },
  {
    number: 12,
    title: "Consumo e Produção Responsáveis",
    description: "Promove práticas que minimizam o desperdício e maximizam a reutilização.",
    color: "hsl(32, 100%, 45%)",
  },
  {
    number: 13,
    title: "Ação Contra Mudança do Clima",
    description: "Estratégias para reduzir o desperdício ajudam a mitigar as mudanças climáticas.",
    color: "hsl(150, 60%, 40%)",
  },
  {
    number: 17,
    title: "Parcerias e Meios de Implementação",
    description: "Incentiva a formação de parcerias e cooperação entre stakeholders.",
    color: "hsl(220, 60%, 45%)",
  },
];

const SDGs = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto !px-[36px]">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Diálogo com os <span className="text-gradient-primary">ODS</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            O Circular Experience colabora diretamente para o atingimento das metas dos 
            Objetivos de Desenvolvimento Sustentável da ONU
          </p>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
          {sdgs.map((sdg) => (
            <div 
              key={sdg.number}
              className="group relative bg-card rounded-xl p-5 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg overflow-hidden"
            >
              {/* Number Badge */}
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: sdg.color }}
              >
                <span className="text-xl font-bold text-primary-foreground">{sdg.number}</span>
              </div>

              <h3 className="font-display text-sm font-bold text-foreground mb-2 line-clamp-2">
                {sdg.title}
              </h3>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {sdg.description}
              </p>

              {/* Decorative */}
              <div 
                className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: sdg.color }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SDGs;
