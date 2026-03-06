import { Clock, Users, Mic, Wrench, MessageCircle, Heart } from "lucide-react";

const agendaItems = [
  {
    time: "30 min",
    title: "Abertura e Conexão",
    description: "Boas-vindas, apresentação da atividade e dinâmica de integração para estimular a troca entre os participantes.",
    icon: Users,
  },
  {
    time: "1h",
    title: "Introdução à Economia Circular",
    description: "Conceitos fundamentais, diferenças em relação ao modelo linear e exemplos inspiradores no Brasil e no mundo.",
    icon: Mic,
  },
  {
    time: "1h 30min",
    title: "Vivência Prática",
    description: "Atividade mão na massa baseada nos princípios da circularidade aplicados ao seu contexto de negócio.",
    icon: Wrench,
  },
  {
    time: "40 min",
    title: "Conexão com Negócios",
    description: "Sistematização dos aprendizados e identificação de oportunidades de geração de valor para sua organização.",
    icon: MessageCircle,
  },
  {
    time: "20 min",
    title: "Encerramento",
    description: "Espaço para dúvidas, comentários, partilha de percepções e convite à rede do Movimento Circular.",
    icon: Heart,
  },
];

const Agenda = () => {
  return (
    <section id="agenda" className="py-5 bg-background">
      <div className="container mx-auto px-4 md:!px-[46px]">
        <div className="text-center mb-3">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            <span className="text-gradient-primary">Agenda</span> da Oficina
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            4 horas de imersão prática e transformadora
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-secondary via-primary to-accent lg:left-1/2 lg:-translate-x-1/2" />

            {agendaItems.map((item, index) => (
              <div 
                key={index}
                className={`relative flex gap-6 mb-1 ${
                  index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                }`}
              >
                {/* Timeline Dot */}
                <div className="absolute left-0 lg:left-1/2 lg:-translate-x-1/2 w-7 h-7 rounded-full gradient-hero flex items-center justify-center shadow-lg z-10">
                  <item.icon className="w-3 h-3 text-primary-foreground" />
                </div>

                {/* Content Card */}
                <div className={`ml-16 lg:ml-0 lg:w-[calc(50%-40px)] ${
                  index % 2 === 0 ? "lg:mr-auto lg:pr-8" : "lg:ml-auto lg:pl-8"
                }`}>
                  <div className="bg-card rounded-xl p-2.5 border border-border hover:border-primary/30 transition-all hover:shadow-lg">
                    {/* Time Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 mb-1">
                      <Clock className="w-3 h-3 text-primary" />
                      <span className="text-xs font-semibold text-primary">{item.time}</span>
                    </div>

                    <h3 className="font-display text-base font-bold text-foreground mb-0.5">
                      {item.title}
                    </h3>

                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Agenda;
