import { Button } from "@/components/ui/button";
import { Clock, Users, Award, Hammer } from "lucide-react";
import heroImage from "@/assets/hero-circular-new.png";
const Hero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
    }
  };
  return <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="Economia Circular" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
      </div>

      <div className="container mx-auto px-4 md:!px-[46px] relative z-10">
        <div className="max-w-3xl">
          {/* Badge Metodologia */}
          <div className="mb-6 animate-fade-up">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-sm font-medium text-primary">Metodologia Mão na Massa Circular Experience</span>
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-up" style={{
          animationDelay: "0.1s"
        }}>
            Abra as portas da sua organização para a{" "}
            <span className="text-gradient-primary">Economia Circular</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed animate-fade-up" style={{
          animationDelay: "0.2s"
        }}>Uma experiência imersiva e prática que capacita seu time a aplicar os princípios da circularidade, gerando valor e inovação para sua organização.</p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-fade-up" style={{
          animationDelay: "0.3s"
        }}>
            <Button variant="hero" size="xl" onClick={() => scrollToSection("contato")}>
              Solicitar Proposta
            </Button>
            <Button variant="heroOutline" size="xl" onClick={() => scrollToSection("sobre")}>
              Saiba Mais
            </Button>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up" style={{
          animationDelay: "0.4s"
        }}>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border">
              <div className="w-10 h-10 rounded-lg gradient-secondary flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground">4 Horas</p>
                <p className="text-xs text-muted-foreground">Duração</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground">Até 40</p>
                <p className="text-xs text-muted-foreground">Colaboradores por edição</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border">
              <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground">Gratuito</p>
                <p className="text-xs text-muted-foreground">Certificado</p>
              </div>
            </div>


            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                <Hammer className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground">100%</p>
                <p className="text-xs text-muted-foreground">Prático</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-float hidden lg:block" />
      <div className="absolute top-40 right-20 w-32 h-32 rounded-full bg-secondary/20 blur-2xl animate-float hidden lg:block" style={{
      animationDelay: "1s"
    }} />
    </section>;
};
export default Hero;