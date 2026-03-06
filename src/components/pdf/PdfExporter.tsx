import { useState, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Proposal } from "@/pages/admin/Proposals";

// Import slide components
import Hero from "@/components/landing/Hero";
import SocialProof from "@/components/landing/SocialProof";
import Stats from "@/components/landing/Stats";
import About from "@/components/landing/About";
import MethodologySteps from "@/components/presentation/slides/MethodologySteps";
import MethodologyBenefits from "@/components/presentation/slides/MethodologyBenefits";
import Agenda from "@/components/landing/Agenda";
import Video from "@/components/landing/Video";
import Experts from "@/components/landing/Experts";
import SDGs from "@/components/landing/SDGs";
import CTA from "@/components/landing/CTA";
import ProposalSlide from "@/components/presentation/slides/ProposalSlide";

const slideComponents = [
  Hero, SocialProof, Stats, About,
  MethodologySteps, MethodologyBenefits,
  Agenda, Video, Experts, SDGs, CTA,
];

interface PdfExporterProps {
  proposal: Proposal;
}

const PdfExporter: React.FC<PdfExporterProps> = ({ proposal }) => {
  const [generating, setGenerating] = useState(false);

  const generatePdf = useCallback(async () => {
    setGenerating(true);
    toast.info("Gerando PDF... isso pode levar alguns segundos.");

    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = 297;
      const pageHeight = 210;

      // Create offscreen container
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;width:1920px;height:1080px;overflow:hidden;z-index:-1;";
      document.body.appendChild(container);

      // All slides including proposal
      const allSlides = [
        ...slideComponents.map((C) => () => <C />),
        () => <ProposalSlide proposal={proposal} />,
      ];

      for (let i = 0; i < allSlides.length; i++) {
        // Clear container
        container.innerHTML = "";
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "width:1920px;height:1080px;overflow:hidden;background:white;";
        container.appendChild(wrapper);

        // Render slide
        const SlideComponent = allSlides[i];
        const root = createRoot(wrapper);
        root.render(<SlideComponent />);

        // Wait for render + images
        await new Promise((r) => setTimeout(r, 800));

        const canvas = await html2canvas(wrapper, {
          width: 1920,
          height: 1080,
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.92);

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, pageHeight);

        root.unmount();
      }

      document.body.removeChild(container);

      const filename = `Circular-Experience-${proposal.company_name.replace(/\s+/g, "-")}.pdf`;
      pdf.save(filename);
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
