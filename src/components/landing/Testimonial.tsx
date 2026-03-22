import { Button } from "@/components/ui/button";
import { Quote } from "lucide-react";

const Testimonial = () => {
  const scrollToContact = () => {
    const element = document.getElementById("contato");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-20 bg-primary">
      <div className="container mx-auto px-4 md:!px-[46px]">
        <div className="max-w-3xl mx-auto text-center">
          {/* Quote icon */}
          <Quote className="w-12 h-12 text-secondary mx-auto mb-8 opacity-80" />

          {/* Testimonial quote */}
          <blockquote className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground mb-6 leading-snug">
            "A vivência gerou muitas ideias para colocarmos em prática já!"
          </blockquote>

          <p className="text-primary-foreground/70 text-lg mb-10">
            — Natasha K., Participante do Workshop Circular Experience
          </p>

          {/* Social proof badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold text-primary-foreground">
              NPS +98%
            </span>
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold text-primary-foreground">
              +500 profissionais capacitados
            </span>
          </div>

          {/* CTA */}
          <Button
            variant="outline"
            size="lg"
            className="border-white text-primary-foreground hover:bg-white/10"
            onClick={scrollToContact}
          >
            Fale com nossos especialistas →
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
