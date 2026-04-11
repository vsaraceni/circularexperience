import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Proposal } from "@/pages/admin/Proposals";

// Slide components
import Hero from "@/components/landing/Hero";
import mcLogoHorizontal from "@/assets/movimento-circular-logo-horizontal.png";
import SocialProof from "@/components/landing/SocialProof";
import Stats from "@/components/landing/Stats";
import AboutPrint from "@/components/presentation/slides/AboutPrint";
import MethodologyFullPrint from "@/components/presentation/slides/MethodologyFullPrint";
import AgendaPrint from "@/components/presentation/slides/AgendaPrint";
import VideoPrint from "@/components/presentation/slides/VideoPrint";
import ExpertsPrint from "@/components/presentation/slides/ExpertsPrint";
import SDGs from "@/components/landing/SDGs";
import ProposalSlide from "@/components/presentation/slides/ProposalSlide";

declare global {
  interface Window {
    __SLIDES_READY?: boolean;
  }
}

const fixedSlides = [
  null, SocialProof, Stats, AboutPrint,
  MethodologyFullPrint,
  AgendaPrint, VideoPrint, ExpertsPrint, SDGs,
];

const PrintablePresentation = () => {
  const { slug } = useParams<{ slug: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProposal = async () => {
      if (!slug) return;
      const { data } = await supabase
        .rpc("get_proposal_by_slug", { p_slug: slug })
        .single();
      setProposal(data as Proposal | null);
      setLoading(false);
    };
    fetchProposal();
  }, [slug]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        window.__SLIDES_READY = true;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-xl">Carregando...</div>;
  }

  return (
    <div className="printable-presentation">
      <style>{`
        @media print {
          @page { size: 1920px 1080px; margin: 0; }
          body { margin: 0; padding: 0; }
        }
        .printable-presentation {
          width: 1920px;
          margin: 0;
          padding: 0;
          background: white;
        }
        .slide-container {
          width: 1920px;
          height: 1080px;
          overflow: hidden;
          page-break-after: always;
          break-after: page;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .slide-container > *:not(.slide-logo-overlay) {
          width: 100% !important;
          min-height: 100%;
        }
        .slide-logo-overlay {
          height: 50px !important;
          width: auto !important;
          min-height: 0 !important;
          display: block !important;
        }
        .slide-center-content > *:not(.slide-logo-overlay) {
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          min-height: 100% !important;
        }
        .slide-container:last-child {
          page-break-after: auto;
          break-after: auto;
        }
      `}</style>

      {fixedSlides.map((SlideComponent, index) => {
        const needsCenter = [1, 2, 8].includes(index);
        const showLogo = [1, 2, 3, 4, 5, 7, 8].includes(index);
        return (
          <div key={index} className={`slide-container${needsCenter ? ' slide-center-content' : ''}`}>
            {showLogo && (
              <img className="slide-logo-overlay" src={mcLogoHorizontal} alt="Movimento Circular" style={{ position: 'absolute', top: 20, right: 20, height: 50, zIndex: 50, width: 'auto' }} />
            )}
            {SlideComponent ? <SlideComponent /> : <Hero printMode proposalTitle={proposal?.title} />}
          </div>
        );
      })}

      {proposal && (
        <div className="slide-container" style={{ background: '#ffffff' }}>
          <ProposalSlide proposal={proposal} />
        </div>
      )}
    </div>
  );
};

export default PrintablePresentation;
