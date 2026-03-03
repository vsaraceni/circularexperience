import { Mail, Phone, MapPin, Linkedin, Users, TrendingUp, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import LeadForm from "./LeadForm";

const CTA = () => {
  return (
    <section id="contato" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4 md:!px-[46px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6">
            <span className="text-sm font-medium text-primary">Receba mais informações</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Leve o <span className="text-gradient-primary">Circular Experience</span> para sua empresa
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Preencha o formulário e nossa equipe entrará em contato com mais informações sobre o programa.
          </p>
        </div>

        {/* Social proof compact strip */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">500+ profissionais capacitados</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-accent">NPS +98%</span>
          </div>
          <Badge className="bg-accent text-accent-foreground px-4 py-2 text-sm font-bold">
            <CalendarClock className="w-4 h-4 mr-1.5" />
            Agenda Limitada
          </Badge>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Form Card */}
          <div className="bg-card rounded-3xl p-8 border border-border shadow-xl relative overflow-hidden order-2 lg:order-1">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-secondary/10 blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <h3 className="font-display text-xl font-bold text-foreground mb-6">
                Receber mais informações
              </h3>
              <LeadForm />
            </div>
          </div>

          {/* Contact Info */}
          <div className="order-1 lg:order-2">
            <div className="bg-card rounded-3xl p-8 border border-border mb-6">
              <h3 className="font-display text-xl font-bold text-foreground mb-6">
                Fale Conosco
              </h3>
              
              <div className="space-y-4">
                <a href="mailto:vinicius@atinaedu.com.br" className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-primary/10 transition-colors group">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">E-mail</p>
                    <p className="text-sm text-muted-foreground">contato@movimentocircular.io</p>
                  </div>
                </a>

                <a href="tel:+5511981272111" className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-secondary/10 transition-colors group">
                  <div className="w-12 h-12 rounded-full gradient-secondary flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                    <Phone className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Whatsapp</p>
                    <p className="text-sm text-muted-foreground">+55 11 98127-2111</p>
                  </div>
                </a>

                <a href="https://www.linkedin.com/in/viniciussaraceni" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-accent/10 transition-colors group">
                  <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                    <Linkedin className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">LinkedIn do Diretor Geral</p>
                    <p className="text-sm text-muted-foreground">Vinicius Saraceni</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 border border-border">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground mb-2">Representações regionais</p>
                  <p className="text-sm text-muted-foreground">São Paulo • Florianópolis • Salvador • Recife</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
