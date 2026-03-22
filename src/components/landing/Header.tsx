import { Button } from "@/components/ui/button";
import { Menu, X, Presentation, Share2 } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/movimento-circular-logo.png";
import { LogoImage } from "@/components/LogoImage";
import { toast } from "sonner";

interface HeaderProps {
  onPresent?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onPresent }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  const copyPresentationLink = () => {
    const link = `${window.location.origin}/?mode=apresentacao`;
    navigator.clipboard.writeText(link).then(() => {
      toast.success("Link da apresentação copiado!");
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <LogoImage
              src={logo}
              alt="Movimento Circular"
              className="h-10 md:h-12 w-auto"
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

          {/* CTA + Present Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {onPresent && (
              <>
                <Button variant="ghost" size="icon" onClick={copyPresentationLink} title="Copiar link da apresentação">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onPresent} title="Modo Apresentação">
                  <Presentation className="h-5 w-5" />
                </Button>
              </>
            )}
            <Button variant="ghost" className="border border-primary/30 text-primary hover:bg-primary/10" onClick={() => scrollToSection("contato")}>
              Receber mais informações
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
              <Button variant="ghost" className="mt-2 border border-primary/30 text-primary hover:bg-primary/10" onClick={() => scrollToSection("contato")}>
                Receber mais informações
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
