import { Badge } from "@/components/ui/badge";
import { LogoImage } from "@/components/LogoImage";

import dowLogo from "@/assets/partners/dow.png";
import scaniaLogo from "@/assets/partners/scania.png";
import sebraeLogo from "@/assets/partners/sebrae.png";
import coopercapsLogo from "@/assets/partners/coopercaps.png";
import averyDennisonLogo from "@/assets/partners/avery-dennison.png";
import semilLogo from "@/assets/partners/semil.png";
import investspLogo from "@/assets/partners/investsp.png";
import wcefLogo from "@/assets/partners/wcef.png";
import agendaVerdeLogo from "@/assets/partners/agenda-verde.png";
import semanaFuturoLogo from "@/assets/partners/semana-futuro-sebrae.png";

const partners = [
  { name: "DOW", logo: dowLogo, height: "h-8 md:h-10" },
  { name: "Scania", logo: scaniaLogo, height: "h-8 md:h-10" },
  { name: "SEBRAE", logo: sebraeLogo, height: "h-10 md:h-14" },
  { name: "COOPERCAPS", logo: coopercapsLogo, height: "h-10 md:h-14" },
  { name: "Avery Dennison", logo: averyDennisonLogo, height: "h-8 md:h-10" },
  { name: "SEMIL", logo: semilLogo, height: "h-12 md:h-16" },
  { name: "InvestSP", logo: investspLogo, height: "h-10 md:h-14" },
];

const events = [
  { name: "Fórum Mundial de Economia Circular", logo: wcefLogo, height: "h-10 md:h-14" },
  { name: "Summit Agenda SP + Verde", logo: agendaVerdeLogo, height: "h-10 md:h-14" },
  { name: "Semana do Futuro – SEBRAE", logo: semanaFuturoLogo, height: "h-10 md:h-14" },
];

const categories = [
  "Capacitações",
  "Eventos corporativos",
  "Fóruns nacionais e internacionais",
];

const SocialProof = () => {
  return (
    <section id="social-proof" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 md:!px-[46px]">
        {/* Headline */}
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
            Metodologia testada e aprovada por mais de{" "}
            <span className="text-gradient-primary">500 profissionais</span>
          </h2>

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant="secondary"
                className="bg-primary/10 text-primary text-sm px-4 py-1.5"
              >
                {cat}
              </Badge>
            ))}
            <Badge
              variant="secondary"
              className="bg-primary/15 text-primary text-sm px-4 py-1.5 font-bold"
            >
              NPS: +98%
            </Badge>
          </div>
        </div>

        {/* Parceiros e clientes */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Parceiros e clientes
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
            {partners.map((p) => (
              <LogoImage
                key={p.name}
                src={p.logo}
                alt={p.name}
                className={`${p.height} w-auto object-contain opacity-70 hover:opacity-100 transition-all duration-300`}
              />
            ))}
          </div>
        </div>

        {/* Eventos */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Eventos
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
            {events.map((e) => (
              <LogoImage
                key={e.name}
                src={e.logo}
                alt={e.name}
                className={`${e.height} w-auto object-contain opacity-70 hover:opacity-100 transition-all duration-300`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
