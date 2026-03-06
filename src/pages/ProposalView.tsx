import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import logo from "@/assets/movimento-circular-logo.png";
import { LogoImage } from "@/components/LogoImage";
import type { Proposal } from "@/pages/admin/Proposals";

const ProposalView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetch = async () => {
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
    fetch();
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
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="gradient-primary p-8 text-center">
            <LogoImage src={logo} alt="Movimento Circular" className="h-12 mx-auto mb-4 brightness-0 invert" />
            <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">{proposal.title}</h1>
            <p className="text-primary-foreground/80 mt-2">Proposta Comercial — Circular Experience</p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <p className="font-semibold text-foreground">{proposal.company_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contato</p>
                <p className="font-semibold text-foreground">{proposal.contact_name}</p>
                {proposal.contact_role && <p className="text-sm text-muted-foreground">{proposal.contact_role}</p>}
              </div>
              {proposal.event_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Data do Evento</p>
                  <p className="font-semibold text-foreground">{new Date(proposal.event_date).toLocaleDateString("pt-BR")}</p>
                </div>
              )}
              {proposal.valid_until && (
                <div>
                  <p className="text-sm text-muted-foreground">Validade</p>
                  <p className="font-semibold text-foreground">{new Date(proposal.valid_until).toLocaleDateString("pt-BR")}</p>
                </div>
              )}
            </div>

            {proposal.scope && (
              <div>
                <h3 className="font-bold text-foreground mb-2">Escopo</h3>
                <div className="text-muted-foreground proposal-html-content" dangerouslySetInnerHTML={{ __html: proposal.scope }} />
              </div>
            )}

            {proposal.investment && (
              <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                <h3 className="font-bold text-foreground mb-1">Investimento</h3>
                <p className="text-2xl font-bold text-primary">{proposal.investment}</p>
              </div>
            )}

            {proposal.considerations && (
              <div>
                <h3 className="font-bold text-foreground mb-2">Considerações</h3>
                <div className="text-muted-foreground proposal-html-content" dangerouslySetInnerHTML={{ __html: proposal.considerations }} />
              </div>
            )}

            <div className="flex justify-center pt-4">
              <QRCodeSVG value={proposalUrl} size={120} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalView;
