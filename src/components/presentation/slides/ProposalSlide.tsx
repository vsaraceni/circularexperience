import { QRCodeSVG } from "qrcode.react";
import logoWhite from "@/assets/movimento-circular-logo-white.png";
import type { Proposal } from "@/pages/admin/Proposals";

interface ProposalSlideProps {
  proposal: Proposal;
}

const COLORS = {
  teal: "#2FB2C0",
  goiaba: "#EB626D",
  ambar: "#F4A736",
  purple: "#5F2558",
  green: "#a8b830",
  bg: "#ffffff",
  cardBg: "#F0ECEA",
  cardBorder: "#edebe9",
  badgeBg: "#F1F4C5",
};

const ProposalSlide: React.FC<ProposalSlideProps> = ({ proposal }) => {
  const proposalUrl = `${window.location.origin}/apresentacao-print/${proposal.slug}`;

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: COLORS.bg, fontFamily: "'Raleway', sans-serif" }}
    >
      {/* White container */}
      <div
        className="relative flex overflow-hidden"
        style={{
          width: 1880,
          height: 1040,
          borderRadius: 22,
          background: "#fff",
          boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
        }}
      >
        {/* Gradient accent bar */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: 3,
            background: `linear-gradient(90deg, ${COLORS.teal}, ${COLORS.goiaba}, ${COLORS.ambar})`,
          }}
        />

        {/* Sidebar */}
        <div
          className="relative flex flex-col items-center justify-between overflow-hidden"
          style={{
            width: 196,
            minWidth: 196,
            margin: 12,
            borderRadius: 18,
            background: COLORS.purple,
            padding: "28px 16px 20px",
          }}
        >
          {/* Decorative circles */}
          <div
            className="absolute"
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              bottom: -30,
              left: -40,
            }}
          />
          <div
            className="absolute"
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: `${COLORS.teal}1A`,
              top: 60,
              right: -20,
            }}
          />

          {/* Logo */}
          <div className="flex flex-col items-center gap-2 relative z-10">
            <img
              src={logoWhite}
              alt="Movimento Circular"
              className="object-contain"
              style={{ height: 70, width: "auto" }}
            />
            <p
              style={{
                fontSize: 7.5,
                fontWeight: 900,
                letterSpacing: 3,
                color: "rgba(255,255,255,0.38)",
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              Proposta Comercial
            </p>
          </div>

          {/* Divider */}
          <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.15)" }} />

          {/* Investment */}
          {proposal.investment && (
            <div className="text-center relative z-10" style={{ width: "100%" }}>
              <p
                style={{
                  fontSize: 7,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Investimento
              </p>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: COLORS.ambar,
                }}
              >
                {proposal.investment}
              </p>
            </div>
          )}

          {/* Divider */}
          <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.15)" }} />

          {/* QR Code */}
          <div className="flex flex-col items-center gap-2 relative z-10">
            <div style={{ background: "#fff", borderRadius: 12, padding: 6 }}>
              <QRCodeSVG value={proposalUrl} size={80} />
            </div>
            <p
              style={{
                fontSize: 7,
                color: "rgba(255,255,255,0.4)",
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              Acesse esta
              <br />
              proposta online
            </p>
          </div>
        </div>

        {/* Main content */}
        <div
          className="flex-1 flex flex-col relative"
          style={{ padding: "20px 32px 14px 24px" }}
        >
          {/* Badge */}
          <div className="flex items-center gap-2 mb-2">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: COLORS.badgeBg,
                borderRadius: 20,
                padding: "4px 14px",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: COLORS.teal,
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  color: COLORS.purple,
                  textTransform: "uppercase",
                }}
              >
                Circular Experience
              </span>
            </div>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 25,
              fontWeight: 900,
              color: COLORS.purple,
              marginBottom: 1,
              lineHeight: 1.2,
            }}
          >
            {proposal.title}
          </h1>
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: COLORS.teal,
              marginBottom: 10,
            }}
          >
            {proposal.company_name}
          </p>

          {/* Meta cards */}
          <div
            className="grid gap-2 mb-3"
            style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}
          >
            <MetaCard label="Empresa" value={proposal.company_name} borderColor={COLORS.teal} />
            <MetaCard
              label="Contato"
              value={proposal.contact_name}
              sub={proposal.contact_role || undefined}
              borderColor={COLORS.goiaba}
            />
            {proposal.event_date && (
              <MetaCard
                label="Data da Proposta"
                value={new Date(proposal.event_date).toLocaleDateString("pt-BR")}
                borderColor={COLORS.ambar}
              />
            )}
            {proposal.valid_until && (
              <MetaCard
                label="Validade"
                value={new Date(proposal.valid_until).toLocaleDateString("pt-BR")}
                borderColor={COLORS.green}
              />
            )}
          </div>

          {/* Scope + Considerations side by side */}
          <div className="flex flex-col gap-3 mb-3 flex-1" style={{ minHeight: 0 }}>
            {proposal.scope && (
              <ContentBlock
                label="Escopo"
                html={proposal.scope}
                accentColor={COLORS.teal}
              />
            )}
            {proposal.considerations && (
              <ContentBlock
                label="Considerações"
                html={proposal.considerations}
                accentColor={COLORS.goiaba}
              />
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-end justify-between"
            style={{
              borderTop: `1px solid ${COLORS.cardBorder}`,
              paddingTop: 10,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontStyle: "italic",
                color: "hsl(0 0% 55%)",
                maxWidth: "55%",
                lineHeight: 1.5,
              }}
            >
              Agradecemos desde já a oportunidade desta construção e ficamos à disposição para juntos avançarmos em prol da circularidade.
            </p>

            <div className="text-right">
              {proposal.author_name && (
                <p style={{ fontSize: 12, fontWeight: 700, color: "hsl(0 0% 15%)" }}>
                  {proposal.author_name}
                </p>
              )}
              <div className="flex gap-3 justify-end" style={{ fontSize: 10, color: "hsl(0 0% 50%)" }}>
                {proposal.author_phone && <span>{proposal.author_phone}</span>}
                {proposal.author_email && <span>{proposal.author_email}</span>}
              </div>
              <p style={{ fontSize: 9, color: "hsl(0 0% 70%)", marginTop: 4 }}>
                Movimento Circular © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetaCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  borderColor: string;
}> = ({ label, value, sub, borderColor }) => (
  <div
    style={{
      background: COLORS.cardBg,
      borderRadius: 11,
      borderLeft: `3px solid ${borderColor}`,
      padding: "7px 12px",
    }}
  >
    <p
      style={{
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: 1,
        color: "hsl(0 0% 55%)",
        textTransform: "uppercase",
        marginBottom: 3,
      }}
    >
      {label}
    </p>
    <p style={{ fontSize: 13, fontWeight: 700, color: "hsl(0 0% 15%)" }}>
      {value}
    </p>
    {sub && (
      <p style={{ fontSize: 11, color: "hsl(0 0% 45%)", marginTop: 1 }}>
        {sub}
      </p>
    )}
  </div>
);

const ContentBlock: React.FC<{
  label: string;
  html: string;
  accentColor: string;
}> = ({ label, html, accentColor }) => (
  <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
    <div className="flex items-center gap-2 mb-2">
      <div
        style={{
          width: 3,
          height: 16,
          borderRadius: 2,
          background: accentColor,
        }}
      />
      <p
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 1,
          color: accentColor,
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
    </div>
    <div
      className="proposal-html-content"
      style={{
        background: COLORS.cardBg,
        borderRadius: 11,
        padding: "12px 16px",
        fontSize: 12,
        lineHeight: 1.6,
        color: "hsl(0 0% 30%)",
        flex: 1,
        overflow: "hidden",
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  </div>
);

export default ProposalSlide;
