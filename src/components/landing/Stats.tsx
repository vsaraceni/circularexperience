import { TrendingUp, AlertCircle, DollarSign } from "lucide-react";

const stats = [
  {
    icon: DollarSign,
    value: "US$ 4,5",
    suffix: "trilhões",
    description: "Benefícios econômicos potenciais da Economia Circular até 2030",
    source: "Fórum Econômico Mundial",
    color: "secondary" as const,
  },
  {
    icon: AlertCircle,
    value: "83%",
    suffix: "",
    description: "Dos pequenos empresários ainda não compreendem bem o que é Economia Circular",
    source: "Pesquisa SEBRAE, 2024",
    color: "primary" as const,
  },
  {
    icon: TrendingUp,
    value: "+20%",
    suffix: "",
    description: "Aumento potencial nas margens de lucro com modelos de negócios circulares",
    source: "Fundação Ellen MacArthur, 2021",
    color: "accent" as const,
  },
];

const Stats = () => {
  const getColorClasses = (color: "primary" | "secondary" | "accent") => {
    switch (color) {
      case "primary":
        return {
          bg: "gradient-primary",
          text: "text-primary",
        };
      case "secondary":
        return {
          bg: "gradient-secondary",
          text: "text-secondary",
        };
      case "accent":
        return {
          bg: "gradient-accent",
          text: "text-accent-foreground",
        };
    }
  };

  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto !px-[36px]">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            A Oportunidade <span className="text-gradient-primary">Histórica</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A transição para uma Economia Circular representa uma das maiores oportunidades 
            de negócio da nossa geração.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, index) => {
            const colors = getColorClasses(stat.color);
            return (
              <div 
                key={index} 
                className="group relative bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center mb-6`}>
                  <stat.icon className="w-7 h-7 text-primary-foreground" />
                </div>

                {/* Value */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className={`font-display text-4xl md:text-5xl font-bold ${colors.text}`}>
                    {stat.value}
                  </span>
                  {stat.suffix && (
                    <span className="text-lg text-muted-foreground font-medium">
                      {stat.suffix}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-foreground font-medium mb-4 leading-relaxed">
                  {stat.description}
                </p>

                {/* Source */}
                <p className="text-sm text-muted-foreground">
                  Fonte: {stat.source}
                </p>

                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Stats;
