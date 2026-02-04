import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/circular-experience-logo.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src={logo} 
              alt="Circular Experience" 
              className="h-[94px] md:h-[110px] w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection("sobre")} 
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Sobre
            </button>
            <button 
              onClick={() => scrollToSection("metodologia")} 
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Metodologia
            </button>
            <button 
              onClick={() => scrollToSection("agenda")} 
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Agenda
            </button>
            <button 
              onClick={() => scrollToSection("especialistas")} 
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Especialistas
            </button>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button variant="hero" size="lg" onClick={() => scrollToSection("contato")}>
              Quero Participar
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-4">
              <button 
                onClick={() => scrollToSection("sobre")} 
                className="text-left py-2 text-foreground hover:text-primary transition-colors font-medium"
              >
                Sobre
              </button>
              <button 
                onClick={() => scrollToSection("metodologia")} 
                className="text-left py-2 text-foreground hover:text-primary transition-colors font-medium"
              >
                Metodologia
              </button>
              <button 
                onClick={() => scrollToSection("agenda")} 
                className="text-left py-2 text-foreground hover:text-primary transition-colors font-medium"
              >
                Agenda
              </button>
              <button 
                onClick={() => scrollToSection("especialistas")} 
                className="text-left py-2 text-foreground hover:text-primary transition-colors font-medium"
              >
                Especialistas
              </button>
              <Button variant="hero" className="mt-2" onClick={() => scrollToSection("contato")}>
                Quero Participar
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
