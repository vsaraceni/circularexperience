import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Award, Hammer } from "lucide-react";
import heroImage from "@/assets/hero-workshop.jpg";

import logoDow from "@/assets/partners/dow.png";
import logoScania from "@/assets/partners/scania.png";
import logoSebrae from "@/assets/partners/sebrae.png";
import logoCoopercaps from "@/assets/partners/coopercaps.png";
import logoAvery from "@/assets/partners/avery-dennison.png";
import logoSemil from "@/assets/partners/semil.png";
import logoInvestsp from "@/assets/partners/investsp.png";

const partnerLogos = [
  { src: logoDow, alt: "DOW", height: "h-8 md:h-10" },
  { src: logoScania, alt: "Scania", height: "h-8 md:h-10" },
  { src: logoSebrae, alt: "SEBRAE", height: "h-10 md:h-14" },
  { src: logoCoopercaps, alt: "COOPERCAPS", height: "h-10 md:h-14" },
  { src: logoAvery, alt: "Avery Dennison", height: "h-8 md:h-10" },
  { src: logoSemil, alt: "SEMIL", height: "h-12 md:h-16" },
  { src: logoInvestsp, alt: "InvestSP", height: "h-10 md:h-14" },
];

const Hero = ({ printMode = false, proposalTitle }: { printMode?: boolean; proposalTitle?: string }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
    }
  };
  return <section className="relative min-h-screen flex items-center overflow-hidden pt-28 md:pt-32 pb-16 md:pb-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="Economia Circular" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/40" />
      </div>

      <div className="container mx-auto px-4 md:!px-[46px] relative z-10">
        <div className="max-w-3xl">
          {/* Badge Metodologia */}
          <div className="mb-6 animate-fade-up">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20">
              <span className="text-sm font-medium text-white">Workshop personalizado in-company</span>
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-up" style={{
          animationDelay: "0.1s"
        }}>
            E se a Semana do Meio Ambiente da sua empresa virasse uma{" "}
            <span className="text-accent font-extrabold">experiência que o time nunca esquece?</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed animate-fade-up" style={{
          animationDelay: "0.2s"
        }}>Uma experiência prática e imersiva que transforma a pauta ambiental em ação real — hands-on, com o seu time.</p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-fade-up" style={{
          animationDelay: "0.3s"
        }}>
            <Button variant="hero" size="xl" onClick={() => scrollToSection("contato")}>
              {printMode ? (proposalTitle || "Proposta Circular Experience") : "Fale com nossos especialistas →"}
            </Button>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up" style={{
          animationDelay: "0.4s"
        }}>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="w-10 h-10 rounded-lg gradient-secondary flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="font-bold text-white">Compacto</p>
                <p className="text-xs text-white/70">A partir de 2h de duração</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-white">Até 30</p>
                <p className="text-xs text-white/70">Colaboradores por edição</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-bold text-white">Certificado</p>
                <p className="text-xs text-white/70">Incluso</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                <Hammer className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-white">100%</p>
                <p className="text-xs text-white/70">Prático</p>
              </div>
            </div>
          </div>

          {/* Social Proof Marquee */}
          <div className="mt-8 animate-fade-up" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                NPS +98%
              </Badge>
              <p className="text-sm text-white/70 text-center">
                Confiado por <span className="font-semibold text-white">+500 profissionais</span> de empresas como:
              </p>
            </div>
            <div className="overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/15 py-4 px-2">
              <div className="flex animate-marquee w-max">
                {[...partnerLogos, ...partnerLogos].map((logo, i) => (
                  <img
                    key={i}
                    src={logo.src}
                    alt={logo.alt}
                    className={`${logo.height} mx-6 md:mx-8 object-contain opacity-70 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-white/10 blur-3xl animate-float hidden lg:block" />
      <div className="absolute top-40 right-20 w-32 h-32 rounded-full bg-primary/20 blur-2xl animate-float hidden lg:block" style={{
      animationDelay: "1s"
    }} />
    </section>;
};
export default Hero;
