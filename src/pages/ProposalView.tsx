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

const ProposalView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
      <div id="contato" className="min-h-screen flex flex-col md:flex-row" style={{ fontFamily: "'Raleway', sans-serif" }}>
        {/* Sidebar */}
        <div
          className="proposal-sidebar flex flex-col items-center justify-between py-10 px-6 md:py-12 md:px-8 gap-8"
          style={{
            background: "linear-gradient(135deg, hsl(307 44% 32%) 0%, hsl(307 44% 18%) 100%)",
            minWidth: "280px",
          }}
        >
          <style>{`
            @media (min-width: 768px) {
              .proposal-sidebar {
                width: 320px !important;
                max-width: 320px !important;
                min-width: 320px !important;
              }
            }
          `}</style>
          <div className="flex flex-col items-center gap-4">
            <img
              src={logoWhite}
              alt="Movimento Circular"
              className="w-auto object-contain"
              style={{ height: "100px" }}
            />
            <p
              className="text-sm uppercase tracking-[0.25em] font-light"
              style={{ color: "hsla(0,0%,100%,0.4)" }}
            >
              Proposta Comercial
            </p>
          </div>

          <div className="w-16 h-px" style={{ background: "hsla(0,0%,100%,0.2)" }} />

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

          <div className="w-16 h-px" style={{ background: "hsla(0,0%,100%,0.2)" }} />

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

          <div />
        </div>

        {/* Main area */}
        <div
          className="flex-1 flex flex-col p-8 md:p-14"
          style={{ background: "#FAFAFA" }}
        >
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
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
                style={{ fontSize: "16px", color: "hsl(0 0% 30%)" }}
                dangerouslySetInnerHTML={{ __html: proposal.scope }}
              />
            </div>
          )}

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
                style={{ fontSize: "16px", color: "hsl(0 0% 30%)" }}
                dangerouslySetInnerHTML={{ __html: proposal.considerations }}
              />
            </div>
          )}

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

export default ProposalView;
