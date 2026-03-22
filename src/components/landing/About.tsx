import { Button } from "@/components/ui/button";
import { Target, Lightbulb, Recycle, RefreshCw, Droplets, Wrench, TreeDeciduous, Hand, Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  return <section id="sobre" className="pt-20 pb-10 bg-background">
      <div className="container mx-auto px-4 md:!px-[46px]">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Circular Experience</span>
            </div>

            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Capacite seu time para colocar a{" "}
              <span className="text-gradient-primary">Economia Circular</span>{" "}
              em prática
            </h2>

            <ul className="space-y-4 text-muted-foreground mb-8">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-secondary flex-shrink-0">✓</span>
                <span className="text-lg leading-relaxed">Construa estratégias para evitar que materiais virem resíduos</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-secondary flex-shrink-0">✓</span>
                <span className="text-lg leading-relaxed">Desenvolva soluções criativas aplicáveis diretamente ao seu negócio</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-secondary flex-shrink-0">✓</span>
                <span className="text-lg leading-relaxed">Explore os <strong className="text-foreground">7 R's</strong> da circularidade com dinâmicas mão na massa</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-secondary flex-shrink-0">✓</span>
                <span className="text-lg leading-relaxed">Crie um plano de ação personalizado para a sua organização</span>
              </li>
            </ul>

            <Button variant="hero" size="lg" onClick={scrollToContact}>
              Fale com nossos especialistas →
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
                Líderes, gestores, colaboradores, fornecedores, clientes que se conectam direta ou indiretamente com o tema mas que precisam compreender o seu papel na transição para a circularidade.
              </p>
            </div>
            <Button variant="accent" size="lg" onClick={scrollToContact}>
              Fale com nossos especialistas →
            </Button>
          </div>
        </div>
      </div>
    </section>;
};
export default About;