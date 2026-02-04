import { ExternalLink } from "lucide-react";
import logo from "@/assets/circular-experience-logo.png";
import { LogoImage } from "@/components/LogoImage";

const Footer = () => {
  return (
    <footer className="py-12 bg-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <LogoImage
              src={logo}
              alt="Circular Experience"
              className="h-10 w-auto brightness-0 invert"
              loading="lazy"
              decoding="async"
            />
            <span className="text-xs text-background/60">Uma iniciativa do Movimento Circular</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a 
              href="https://movimentocircular.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-background/70 hover:text-background transition-colors"
            >
              Movimento Circular
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a 
              href="https://atinaedu.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-background/70 hover:text-background transition-colors"
            >
              ATINA
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-background/50">
            © {new Date().getFullYear()} Circular Experience. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
