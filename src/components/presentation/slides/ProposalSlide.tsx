import { QRCodeSVG } from "qrcode.react";
import logo from "@/assets/movimento-circular-logo.png";
import { LogoImage } from "@/components/LogoImage";
import type { Proposal } from "@/pages/admin/Proposals";

interface ProposalSlideProps {
  proposal: Proposal;
}

const ProposalSlide: React.FC<ProposalSlideProps> = ({ proposal }) => {
  const proposalUrl = `${window.location.origin}/proposta/${proposal.slug}`;

  return (
    <div className="w-full h-full gradient-primary flex flex-col text-primary-foreground p-16">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <LogoImage src={logo} alt="Movimento Circular" className="h-14 brightness-0 invert" />
        <span className="text-primary-foreground/60 text-sm">Proposta Comercial</span>
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold mb-10">{proposal.title}</h1>

      {/* Body grid */}
      <div className="flex-1 grid grid-cols-3 gap-10">
        {/* Left column */}
        <div className="col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-primary-foreground/60 text-sm mb-1">Empresa</p>
              <p className="text-xl font-semibold">{proposal.company_name}</p>
            </div>
            <div>
              <p className="text-primary-foreground/60 text-sm mb-1">Contato</p>
              <p className="text-xl font-semibold">{proposal.contact_name}</p>
              {proposal.contact_role && <p className="text-primary-foreground/70 text-sm">{proposal.contact_role}</p>}
            </div>
            {proposal.event_date && (
              <div>
                <p className="text-primary-foreground/60 text-sm mb-1">Data do Evento</p>
                <p className="text-lg font-semibold">{new Date(proposal.event_date).toLocaleDateString("pt-BR")}</p>
              </div>
            )}
            {proposal.valid_until && (
              <div>
                <p className="text-primary-foreground/60 text-sm mb-1">Validade</p>
                <p className="text-lg font-semibold">{new Date(proposal.valid_until).toLocaleDateString("pt-BR")}</p>
              </div>
            )}
          </div>

          {proposal.scope && (
            <div>
              <p className="text-primary-foreground/60 text-sm mb-1">Escopo</p>
              <p className="text-base leading-relaxed whitespace-pre-wrap line-clamp-6">{proposal.scope}</p>
            </div>
          )}

          {proposal.considerations && (
            <div>
              <p className="text-primary-foreground/60 text-sm mb-1">Considerações</p>
              <p className="text-base leading-relaxed whitespace-pre-wrap line-clamp-4">{proposal.considerations}</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col items-center justify-center gap-6">
          {proposal.investment && (
            <div className="bg-primary-foreground/10 backdrop-blur rounded-2xl p-8 text-center w-full">
              <p className="text-primary-foreground/60 text-sm mb-2">Investimento</p>
              <p className="text-3xl font-bold">{proposal.investment}</p>
            </div>
          )}
          <div className="bg-primary-foreground rounded-2xl p-4">
            <QRCodeSVG value={proposalUrl} size={140} />
          </div>
          <p className="text-primary-foreground/50 text-xs text-center">Acesse esta proposta online</p>
        </div>
      </div>
    </div>
  );
};

export default ProposalSlide;
