import { QRCodeSVG } from "qrcode.react";
import logoWhite from "@/assets/movimento-circular-logo-white.png";
import type { Proposal } from "@/pages/admin/Proposals";

interface ProposalSlideProps {
  proposal: Proposal;
}

const ProposalSlide: React.FC<ProposalSlideProps> = ({ proposal }) => {
  const proposalUrl = `${window.location.origin}/apresentacao-print/${proposal.slug}`;

  return (
    <div className="w-full h-full flex" style={{ fontFamily: "'Raleway', sans-serif" }}>
      {/* Sidebar */}
      <div
        className="flex flex-col items-center justify-between py-12 px-8"
        style={{
          width: "420px",
          minWidth: "420px",
          background: "linear-gradient(135deg, hsl(307 44% 32%) 0%, hsl(307 44% 18%) 100%)",
        }}
      >
        {/* Logo + Proposta Comercial label */}
        <div className="flex flex-col items-center gap-4">
          <img
            src={logoWhite}
            alt="Movimento Circular"
            className="w-auto object-contain"
            style={{ height: "120px" }}
          />
          <p
            className="text-sm uppercase tracking-[0.25em] font-light"
            style={{ color: "hsla(0,0%,100%,0.4)" }}
          >
            Proposta Comercial
          </p>
        </div>

        {/* Divider */}
        <div className="w-16 h-px" style={{ background: "hsla(0,0%,100%,0.2)" }} />

        {/* Investment */}
        {proposal.investment && (
          <div
            className="w-full rounded-xl p-4 text-center"
            style={{ background: "hsla(0,0%,100%,0.1)" }}
          >
            <p
              className="text-xs uppercase tracking-widest mb-2"
              style={{ color: "hsla(0,0%,100%,0.6)" }}
            >
              Investimento
            </p>
            <p className="text-2xl font-bold text-white">{proposal.investment}</p>
          </div>
        )}

        {/* Divider */}
        <div className="w-16 h-px" style={{ background: "hsla(0,0%,100%,0.2)" }} />

        {/* QR Code */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-white rounded-2xl p-3">
            <QRCodeSVG value={proposalUrl} size={120} />
          </div>
          <p
            className="text-xs text-center leading-snug"
            style={{ color: "hsla(0,0%,100%,0.5)" }}
          >
            Acesse esta proposta online
          </p>
        </div>

        {/* Footer spacer */}
        <div />
      </div>

      {/* Main area */}
      <div
        className="flex-1 flex flex-col p-14"
        style={{ background: "#FAFAFA" }}
      >
        {/* Title */}
        <h1
          className="font-bold pb-4 mb-8"
          style={{
            fontSize: "28px",
            color: "hsl(0 0% 10%)",
            borderBottom: "2px solid hsla(307,44%,26%,0.3)",
          }}
        >
          {proposal.title}
        </h1>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-5 mb-8">
          <MetaCard label="Empresa" value={proposal.company_name} />
          <MetaCard
            label="Contato"
            value={proposal.contact_name}
            sub={proposal.contact_role || undefined}
          />
          {proposal.event_date && (
            <MetaCard
              label="Data do Evento"
              value={new Date(proposal.event_date).toLocaleDateString("pt-BR")}
            />
          )}
          {proposal.valid_until && (
            <MetaCard
              label="Validade"
              value={new Date(proposal.valid_until).toLocaleDateString("pt-BR")}
            />
          )}
        </div>

        {/* Scope */}
        {proposal.scope && (
          <div className="mb-6">
            <p
              className="uppercase tracking-wide font-bold mb-2"
              style={{ fontSize: "16px", color: "hsl(307 44% 26%)" }}
            >
              Escopo
            </p>
            <div
              className="leading-relaxed proposal-html-content"
              style={{
                fontSize: "16px",
                color: "hsl(0 0% 30%)",
                display: "-webkit-box",
                WebkitLineClamp: 6,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
              dangerouslySetInnerHTML={{ __html: proposal.scope }}
            />
          </div>
        )}

        {/* Considerations */}
        {proposal.considerations && (
          <div className="mb-6">
            <p
              className="uppercase tracking-wide font-bold mb-2"
              style={{ fontSize: "16px", color: "hsl(307 44% 26%)" }}
            >
              Considerações
            </p>
            <div
              className="leading-relaxed proposal-html-content"
              style={{
                fontSize: "16px",
                color: "hsl(0 0% 30%)",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
              dangerouslySetInnerHTML={{ __html: proposal.considerations }}
            />
          </div>
        )}

        {/* Divider + Thank you + Signature */}
        <div className="mt-auto">
          <div className="h-px w-full mb-5" style={{ background: "hsla(307,44%,26%,0.3)" }} />

          <p
            className="italic leading-relaxed mb-5"
            style={{ fontSize: "14px", color: "hsl(0 0% 45%)" }}
          >
            Agradecemos desde já a oportunidade desta construção e ficamos à disposição para juntos avançarmos em prol da circularidade.
          </p>

          {(proposal.author_name || proposal.author_phone || proposal.author_email) && (
            <div className="mb-4">
              {proposal.author_name && (
                <p className="font-bold" style={{ fontSize: "16px", color: "hsl(0 0% 15%)" }}>
                  {proposal.author_name}
                </p>
              )}
              <div className="flex gap-4 mt-1" style={{ fontSize: "14px", color: "hsl(0 0% 45%)" }}>
                {proposal.author_phone && <span>{proposal.author_phone}</span>}
                {proposal.author_email && <span>{proposal.author_email}</span>}
              </div>
            </div>
          )}

          <p className="text-sm" style={{ color: "hsl(0 0% 70%)" }}>
            Movimento Circular © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

const MetaCard: React.FC<{ label: string; value: string; sub?: string }> = ({
  label,
  value,
  sub,
}) => (
  <div
    className="rounded-xl p-5"
    style={{
      background: "hsl(0 0% 96%)",
      border: "1px solid hsl(0 0% 93%)",
    }}
  >
    <p
      className="uppercase tracking-wide font-bold mb-1"
      style={{ fontSize: "14px", color: "hsl(0 0% 60%)" }}
    >
      {label}
    </p>
    <p className="font-semibold" style={{ fontSize: "18px", color: "hsl(0 0% 15%)" }}>
      {value}
    </p>
    {sub && (
      <p className="mt-0.5" style={{ fontSize: "16px", color: "hsl(0 0% 45%)" }}>
        {sub}
      </p>
    )}
  </div>
);

export default ProposalSlide;
