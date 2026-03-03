import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PresentationControlsProps {
  currentSlide: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
  visible: boolean;
}

type AnimationPhase = "intro" | "settling" | "idle";

const PresentationControls: React.FC<PresentationControlsProps> = ({
  currentSlide,
  totalSlides,
  onPrev,
  onNext,
  onExit,
  visible,
}) => {
  const [phase, setPhase] = useState<AnimationPhase>("intro");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("settling"), 1500);
    const t2 = setTimeout(() => setPhase("idle"), 2300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const isAnimating = phase !== "idle";
  const showHint = phase === "intro" || phase === "settling";

  // During intro: centered, large, glowing
  // During settling: transition to final position
  // During idle: normal behavior
  const wrapperStyle: React.CSSProperties =
    phase === "intro"
      ? {
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) scale(1.5)",
          transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 60,
        }
      : phase === "settling"
      ? {
          position: "fixed",
          bottom: "24px",
          left: "50%",
          top: "auto",
          transform: "translate(-50%, 0) scale(1)",
          transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 60,
        }
      : {
          position: "fixed",
          bottom: "24px",
          left: "50%",
          transform: "translate(-50%, 0) scale(1)",
          zIndex: 60,
        };

  return (
    <div
      style={wrapperStyle}
      className={`flex flex-col items-center gap-2 transition-opacity duration-300 ${
        visible || isAnimating ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Hint temporário */}
      <div
        className={`text-sm text-foreground/90 bg-background/70 backdrop-blur-md rounded-full px-4 py-1.5 border flex items-center gap-2 transition-opacity duration-700 ${
          isAnimating ? "border-accent" : "border-border"
        } ${showHint ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <span>Navegue pelos slides</span>
        <kbd className="px-1.5 py-0.5 text-xs rounded border border-accent/50 bg-muted font-mono">
          ←
        </kbd>
        <kbd className="px-1.5 py-0.5 text-xs rounded border border-accent/50 bg-muted font-mono">
          →
        </kbd>
      </div>

      {/* Barra de controle */}
      <div
        className={`flex items-center gap-3 bg-background/80 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border ${
          isAnimating
            ? "border-accent animate-[glow-accent_1.5s_ease-in-out_infinite]"
            : "border-border"
        }`}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrev}
          disabled={currentSlide === 0}
          className="rounded-full"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <span className="text-sm font-medium text-foreground min-w-[60px] text-center">
          {currentSlide + 1} / {totalSlides}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          disabled={currentSlide === totalSlides - 1}
          className="rounded-full"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        <div className="w-px h-6 bg-border" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const link = `${window.location.origin}/?mode=apresentacao`;
            navigator.clipboard.writeText(link).then(() => {
              toast.success("Link da apresentação copiado!");
            });
          }}
          className="rounded-full"
          title="Copiar link da apresentação"
        >
          <Link className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default PresentationControls;
