import { ExternalLink } from "lucide-react";
import { LogoImage } from "@/components/LogoImage";
import logo from "@/assets/movimento-circular-logo.png";

const Footer = () => {
  return (
    <footer className="py-12" style={{ backgroundColor: "#F0ECEA" }}>
      <div className="container mx-auto px-[26px]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <LogoImage
              src={logo}
              alt="Movimento Circular"
              className="h-16 md:h-20 w-auto"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://movimentocircular.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
              style={{ color: "#5F2558" }}
            >
              Saiba mais sobre o Movimento Circular
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm" style={{ color: "#5F2558", opacity: 0.7 }}>
            © {new Date().getFullYear()} Circular Experience. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
