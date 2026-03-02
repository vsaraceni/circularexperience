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
  { name: "DOW", logo: dowLogo },
  { name: "Scania", logo: scaniaLogo },
  { name: "SEBRAE", logo: sebraeLogo },
  { name: "COOPERCAPS", logo: coopercapsLogo },
  { name: "Avery Dennison", logo: averyDennisonLogo },
  { name: "SEMIL", logo: semilLogo },
  { name: "InvestSP", logo: investspLogo },
];

const events = [
  { name: "Fórum Mundial de Economia Circular", logo: wcefLogo },
  { name: "Summit Agenda SP + Verde", logo: agendaVerdeLogo },
  { name: "Semana do Futuro – SEBRAE", logo: semanaFuturoLogo },
];

const categories = [
  "Capacitações",
  "Eventos corporativos",
  "Fóruns nacionais e internacionais",
];

const SocialProof = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 md:!px-[46px]">
        {/* Headline */}
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
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
              className="bg-accent/20 text-accent-foreground text-sm px-4 py-1.5 font-bold"
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

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 items-center justify-items-center">
            {partners.map((p) => (
              <LogoImage
                key={p.name}
                src={p.logo}
                alt={p.name}
                className="h-10 md:h-14 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-center justify-items-center">
            {events.map((e) => (
              <LogoImage
                key={e.name}
                src={e.logo}
                alt={e.name}
                className="h-10 md:h-14 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
