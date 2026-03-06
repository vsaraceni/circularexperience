import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Proposal } from "@/pages/admin/Proposals";

interface PdfExporterProps {
  proposal: Proposal;
}

const PdfExporter: React.FC<PdfExporterProps> = ({ proposal }) => {
  const [generating, setGenerating] = useState(false);

  const generatePdf = useCallback(async () => {
    setGenerating(true);
    toast.info("Gerando PDF via servidor... isso pode levar alguns segundos.");

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/generate-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
      setGenerating(false);
    }
  }, [proposal]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={generatePdf}
      disabled={generating}
      title="Gerar PDF"
    >
      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
    </Button>
  );
};

export default PdfExporter;
