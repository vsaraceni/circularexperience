import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Proposal } from "@/pages/admin/Proposals";
import ProposalSlide from "@/components/presentation/slides/ProposalSlide";

declare global {
  interface Window {
    __SLIDES_READY?: boolean;
  }
}

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
    if (!loading && proposal) {
      const timer = setTimeout(() => {
        window.__SLIDES_READY = true;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, proposal]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-xl">Carregando...</div>;
  }

  if (!proposal) {
    return <div className="flex items-center justify-center h-screen text-xl">Proposta não encontrada.</div>;
  }

  return (
    <div className="printable-presentation">
      <style>{`
        @media print {
          @page { size: 1920px 1080px; margin: 0; }
          body { margin: 0; padding: 0; }
        }
        .printable-presentation { width: 1920px; margin: 0; padding: 0; background: white; }
        .slide-container { width: 1920px; height: 1080px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; }
      `}</style>
      <div className="slide-container" style={{ background: "#ffffff" }}>
        <ProposalSlide proposal={proposal} />
      </div>
    </div>
  );
};

export default PrintablePresentation;