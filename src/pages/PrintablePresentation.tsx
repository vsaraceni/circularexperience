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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    window.__SLIDES_READY = false;
    const fetchProposal = async () => {
      if (!slug) return;
      try {
        const { data } = await supabase
          .rpc("get_proposal_by_slug", { p_slug: slug })
          .single();
        setProposal(data as Proposal | null);
      } catch {
        setProposal(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProposal();
  }, [slug]);

  useEffect(() => {
    if (loading) return;
    // Always signal readiness after loading finishes — even on error/missing data.
    // Browserless will capture whatever is rendered, instead of timing out.
    let cancelled = false;
    const signalReady = async () => {
      try { await (document as any).fonts?.ready; } catch { /* noop */ }
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const idle = (window as any).requestIdleCallback as
        | ((cb: () => void, opts?: { timeout: number }) => number)
        | undefined;
      await new Promise<void>((resolve) => {
        if (idle) idle(() => resolve(), { timeout: 800 });
        else setTimeout(resolve, 500);
      });
      if (cancelled) return;
      window.__SLIDES_READY = true;
      setReady(true);
    };
    signalReady();
    return () => { cancelled = true; };
  }, [loading]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-xl">Carregando...</div>;
  }

  return (
    <div className="printable-presentation" data-ready={ready ? "true" : "false"}>
      <style>{`
        @media print {
          @page { size: 1920px 1080px; margin: 0; }
          body { margin: 0; padding: 0; }
        }
        .printable-presentation { width: 1920px; margin: 0; padding: 0; background: white; }
        .slide-container { width: 1920px; height: 1080px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; }
      `}</style>
      <div className="slide-container" style={{ background: "#ffffff" }}>
        {proposal ? (
          <ProposalSlide proposal={proposal} />
        ) : (
          <div className="text-2xl">Proposta não encontrada.</div>
        )}
      </div>
    </div>
  );
};

export default PrintablePresentation;