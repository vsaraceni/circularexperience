import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Linkedin } from "lucide-react";

const CTA = () => {
  return (
    <section id="contato" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-3xl p-8 md:p-12 border border-border shadow-xl relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-secondary/10 blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6">
                <span className="text-sm font-medium text-primary">Leve para sua região</span>
              </div>

              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Quer levar o <span className="text-gradient-primary">Circular Experience</span> para sua cidade?
              </h2>

              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Entre em contato conosco e saiba como organizar uma oficina para os empreendedores da sua região.
              </p>

              {/* Contact Info */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <a 
                  href="mailto:vinicius@atinaedu.com.br"
                  className="flex flex-col items-center p-4 rounded-xl bg-muted/50 hover:bg-primary/10 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">E-mail</p>
                  <p className="text-xs text-muted-foreground">vinicius@atinaedu.com.br</p>
                </a>

                <a 
                  href="tel:+5511981272111"
                  className="flex flex-col items-center p-4 rounded-xl bg-muted/50 hover:bg-secondary/10 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full gradient-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Telefone</p>
                  <p className="text-xs text-muted-foreground">+55 11 98127-2111</p>
                </a>

                <a 
                  href="https://www.linkedin.com/in/viniciussaraceni"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center p-4 rounded-xl bg-muted/50 hover:bg-accent/10 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Linkedin className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">LinkedIn</p>
                  <p className="text-xs text-muted-foreground">Vinicius Saraceni</p>
                </a>
              </div>

              <Button variant="hero" size="xl" asChild>
                <a href="mailto:vinicius@atinaedu.com.br?subject=Interesse no Circular Experience">
                  Entrar em Contato
                </a>
              </Button>

              {/* Locations */}
              <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>São Paulo • Florianópolis • Salvador • Recife • Cidade do México • Buenos Aires</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
