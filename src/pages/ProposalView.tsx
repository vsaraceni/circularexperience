import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import logoWhite from "@/assets/movimento-circular-logo-white.png";
import mcLogoHorizontal from "@/assets/movimento-circular-logo-horizontal.png";
import type { Proposal } from "@/pages/admin/Proposals";

// Slide components (same as PrintablePresentation)
import Hero from "@/components/landing/Hero";
import SocialProof from "@/components/landing/SocialProof";
import Stats from "@/components/landing/Stats";
import AboutPrint from "@/components/presentation/slides/AboutPrint";
import MethodologyFullPrint from "@/components/presentation/slides/MethodologyFullPrint";
import AgendaPrint from "@/components/presentation/slides/AgendaPrint";
import VideoPrint from "@/components/presentation/slides/VideoPrint";
import ExpertsPrint from "@/components/presentation/slides/ExpertsPrint";
import SDGs from "@/components/landing/SDGs";

const HeroPrint = () => <Hero printMode />;

const fixedSlides = [
  HeroPrint, SocialProof, Stats, AboutPrint,
  MethodologyFullPrint, AgendaPrint, VideoPrint, ExpertsPrint, SDGs,
];

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

const ProposalView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const generatePdf = useCallback(async () => {
    if (!proposal) return;
    setGeneratingPdf(true);
    toast.info("Gerando PDF... isso pode levar alguns segundos.");
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/generate-pdf`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: proposal.slug }),
        }
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(errData.error || "Erro ao gerar PDF");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Circular-Experience-${proposal.company_name.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setGeneratingPdf(false);
    }
  }, [proposal]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setProposal(data as Proposal);
      }
      setLoading(false);
    };
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Proposta não encontrada</h1>
          <p className="text-muted-foreground">O link pode estar incorreto ou a proposta foi removida.</p>
        </div>
      </div>
    );
  }

  const proposalUrl = `${window.location.origin}/proposta/${proposal.slug}`;

  return (
    <div className="proposal-view-container">
      <style>{`
        .proposal-view-container {
          width: 100%;
          margin: 0;
          padding: 0;
          background: white;
          overflow-x: hidden;
        }
        .proposal-slide-wrapper {
          width: 100%;
          aspect-ratio: 1920 / 1080;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .proposal-slide-wrapper > *:not(.proposal-logo-overlay) {
          width: 100% !important;
          min-height: 100%;
        }
        .proposal-logo-overlay {
          height: 2.6vw !important;
          width: auto !important;
          min-height: 0 !important;
          display: block !important;
        }
        .proposal-slide-center > *:not(.proposal-logo-overlay) {
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          min-height: 100% !important;
        }
      `}</style>

      {/* All presentation slides */}
      {fixedSlides.map((SlideComponent, index) => {
        const needsCenter = [1, 2, 8].includes(index);
        const showLogo = [1, 2, 3, 4, 5, 7, 8].includes(index);
        return (
          <div key={index} className={`proposal-slide-wrapper${needsCenter ? ' proposal-slide-center' : ''}`}>
            {showLogo && (
              <img
                className="proposal-logo-overlay"
                src={mcLogoHorizontal}
                alt="Movimento Circular"
                style={{ position: 'absolute', top: '1.8%', right: '1%', zIndex: 10, width: 'auto' }}
              />
            )}
            <SlideComponent />
          </div>
        );
      })}

      {/* Proposal slide — responsive version */}
      <div
        id="contato"
        className="relative"
        style={{
          fontFamily: "'Raleway', sans-serif",
          background: COLORS.bg,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
        }}
      >
        {/* PDF download button */}
        <button
          onClick={generatePdf}
          disabled={generatingPdf}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: "hsla(0,0%,0%,0.06)",
            color: "hsl(0 0% 35%)",
            cursor: generatingPdf ? "wait" : "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "hsla(0,0%,0%,0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "hsla(0,0%,0%,0.06)")}
        >
          {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          PDF da proposta
        </button>

        {/* White container */}
        <div
          className="relative flex flex-col md:flex-row overflow-hidden w-full"
          style={{
            maxWidth: 1080,
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
              borderRadius: "22px 22px 0 0",
            }}
          />

          {/* Sidebar */}
          <style>{`
            @media (min-width: 768px) {
              .proposal-new-sidebar {
                width: 220px !important;
                min-width: 220px !important;
                max-width: 220px !important;
              }
            }
          `}</style>
          <div
            className="proposal-new-sidebar relative flex flex-col items-center justify-between overflow-hidden"
            style={{
              margin: 12,
              borderRadius: 18,
              background: COLORS.purple,
              padding: "32px 20px 24px",
              gap: 20,
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
                style={{ height: 80, width: "auto" }}
              />
              <p
                style={{
                  fontSize: 8,
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
              <div className="text-center relative z-10 w-full">
                <p
                  style={{
                    fontSize: 8,
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
                    fontSize: 22,
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
              <div style={{ background: "#fff", borderRadius: 14, padding: 8 }}>
                <QRCodeSVG value={proposalUrl} size={100} />
              </div>
              <p
                style={{
                  fontSize: 8,
                  color: "rgba(255,255,255,0.4)",
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                Acesse esta proposta online
              </p>
            </div>
          </div>

          {/* Main content */}
          <div
            className="flex-1 flex flex-col"
            style={{ padding: "28px 28px 20px 20px" }}
          >
            {/* Badge */}
            <div className="flex items-center gap-2 mb-3">
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
                    fontSize: 10,
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
                fontSize: 26,
                fontWeight: 900,
                color: COLORS.purple,
                marginBottom: 2,
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
                marginBottom: 16,
              }}
            >
              {proposal.company_name}
            </p>

            {/* Meta cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
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

            {/* Scope + Considerations */}
            <div className="flex flex-col gap-4 mb-5 flex-1">
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
              className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4"
              style={{
                borderTop: `1px solid ${COLORS.cardBorder}`,
                paddingTop: 12,
              }}
            >
              <p
                style={{
                  fontSize: 12,
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
                  <p style={{ fontSize: 13, fontWeight: 700, color: "hsl(0 0% 15%)" }}>
                    {proposal.author_name}
                  </p>
                )}
                <div className="flex gap-3 justify-end" style={{ fontSize: 11, color: "hsl(0 0% 50%)" }}>
                  {proposal.author_phone && <span>{proposal.author_phone}</span>}
                  {proposal.author_email && <span>{proposal.author_email}</span>}
                </div>
                <p style={{ fontSize: 10, color: "hsl(0 0% 70%)", marginTop: 4 }}>
                  Movimento Circular © {new Date().getFullYear()}
                </p>
              </div>
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
        fontSize: 7,
        fontWeight: 700,
        letterSpacing: 1,
        color: "hsl(0 0% 55%)",
        textTransform: "uppercase",
        marginBottom: 2,
      }}
    >
      {label}
    </p>
    <p style={{ fontSize: 12, fontWeight: 700, color: "hsl(0 0% 15%)" }}>
      {value}
    </p>
    {sub && (
      <p style={{ fontSize: 12, color: "hsl(0 0% 45%)", marginTop: 1 }}>
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
          fontSize: 13,
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
        padding: "14px 18px",
        fontSize: 13,
        lineHeight: 1.6,
        color: "hsl(0 0% 30%)",
        flex: 1,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  </div>
);

export default ProposalView;
