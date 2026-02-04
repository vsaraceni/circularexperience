import { Button } from "@/components/ui/button";
import { Target, Lightbulb, Recycle, RefreshCw, Leaf, Wrench, Brain } from "lucide-react";
const sevenRs = [{
  icon: Recycle,
  label: "Reduzir"
}, {
  icon: RefreshCw,
  label: "Reutilizar"
}, {
  icon: Recycle,
  label: "Reciclar"
}, {
  icon: Lightbulb,
  label: "Redefinir"
}, {
  icon: Leaf,
  label: "Reaproveitar"
}, {
  icon: Wrench,
  label: "Recuperar"
}, {
  icon: Brain,
  label: "Repensar"
}];
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

          {/* 7 R's Visual */}
          <div className="relative">
            <div className="bg-card rounded-3xl p-8 border border-border shadow-lg">
              <h3 className="font-display text-xl font-bold text-foreground mb-6 text-center">
                Os 7 R's da Economia Circular
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {sevenRs.map((item, index) => <div key={index} className="group flex flex-col items-center p-4 rounded-xl bg-muted/50 hover:bg-primary/10 transition-all duration-300" style={{
                animationDelay: `${index * 0.1}s`
              }}>
                    <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <item.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="text-sm font-semibold text-foreground text-center">
                      {item.label}
                    </span>
                  </div>)}
              </div>

              {/* Decorative circle */}
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-secondary/20 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
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