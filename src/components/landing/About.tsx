import { Button } from "@/components/ui/button";
import { Target, Lightbulb, Recycle, RefreshCw, Droplets, Wrench, TreeDeciduous, Hand } from "lucide-react";

const sevenRs = [
  { icon: Hand, label: "Recusar" },
  { icon: Lightbulb, label: "Repensar" },
  { icon: Droplets, label: "Reduzir" },
  { icon: RefreshCw, label: "Reutilizar" },
  { icon: Recycle, label: "Reciclar" },
  { icon: Wrench, label: "Reparar" },
  { icon: TreeDeciduous, label: "Regenerar" },
];
const About = () => {
  const scrollToContact = () => {
    const element = document.getElementById("contato");
    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
    }
  };
  return <section id="sobre" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Circular Experience</span>
            </div>

            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Uma oficina para colocar a{" "}
              <span className="text-gradient-primary">Economia Circular</span>{" "}
              em prática!
            </h2>

            <div className="space-y-4 text-muted-foreground mb-8">
              <p className="text-lg leading-relaxed">
                <strong className="text-foreground">Objetivo:</strong> Juntos, construiremos estratégias 
                viáveis para evitar que materiais se tornem resíduos, promovendo a utilização eficiente 
                e prolongada dos recursos.
              </p>
              <p className="leading-relaxed">
                Esta atividade colaborativa incentivará os participantes a desenvolver soluções 
                criativas e práticas, aplicáveis diretamente em seus negócios, para minimizar 
                o desperdício e maximizar a circularidade.
              </p>
              <p className="leading-relaxed">
                Criaremos um espaço de reflexão prática sobre a Economia Circular, explorando 
                como os <strong className="text-foreground">7 R's</strong> podem ser transformados 
                em oportunidades concretas para ações mais sustentáveis e circulares.
              </p>
            </div>

            <Button variant="hero" size="lg" onClick={scrollToContact}>
              Quero Participar
            </Button>
          </div>

          {/* 7 R's Visual - Circular Layout */}
          <div className="relative flex items-center justify-center">
          <div className="relative w-[400px] h-[400px] sm:w-[480px] sm:h-[480px] md:w-[560px] md:h-[560px]">
              {/* Círculo central */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-32 sm:h-32 rounded-full gradient-hero flex items-center justify-center shadow-glow-primary z-10">
                <span className="text-primary-foreground text-center text-[10px] sm:text-xs font-bold leading-tight">
                  Economia<br/>Circular
                </span>
              </div>
              
              {/* Círculo tracejado de conexão com animação */}
              <div className="absolute inset-16 sm:inset-20 rounded-full border-2 border-dashed border-primary/30 animate-slow-spin" />
              
              {/* Items posicionados em círculo */}
              {sevenRs.map((item, index) => {
                const angle = (index * 360) / 7 - 90; // Começa no topo
                const radius = 180; // Raio dobrado
                const radiusSm = 120; // Raio para tablet
                const radiusMd = 130; // Raio para desktop
                const x = Math.cos((angle * Math.PI) / 180);
                const y = Math.sin((angle * Math.PI) / 180);
                
                return (
                  <div
                    key={index}
                    className="absolute top-1/2 left-1/2 flex flex-col items-center group"
                    style={{
                      transform: `translate(calc(-50% + ${x * radius}px), calc(-50% + ${y * radius}px))`
                    }}
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-[72px] md:h-[72px] rounded-full gradient-hero flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 cursor-pointer">
                      <item.icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-primary-foreground" />
                    </div>
                    <span className="mt-1 sm:mt-2 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">
                      {item.label}
                    </span>
                  </div>
                );
              })}
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-secondary/20 blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
            </div>
          </div>
        </div>

        {/* Target Audience */}
        <div className="mt-16 p-8 rounded-2xl gradient-hero">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-2xl font-bold text-primary-foreground mb-2">
                A quem se destina?
              </h3>
              <p className="text-primary-foreground/90">
                Profissionais que desejam compreender como a Economia Circular pode ser aplicada em seus negócios, segmentos ou área de atuação.            
              </p>
            </div>
            <Button variant="accent" size="lg" onClick={scrollToContact}>
              Inscreva-se Agora
            </Button>
          </div>
        </div>
      </div>
    </section>;
};
export default About;