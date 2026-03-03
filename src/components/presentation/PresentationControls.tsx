import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PresentationControlsProps {
  currentSlide: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
  visible: boolean;
}

const PresentationControls: React.FC<PresentationControlsProps> = ({
  currentSlide,
  totalSlides,
  onPrev,
  onNext,
  onExit,
  visible,
}) => {
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 transition-opacity duration-300 ${
      visible ? "opacity-100" : "opacity-0 pointer-events-none"
    }`}>
      {/* Hint temporário */}
      <div className={`text-sm text-foreground/90 bg-background/70 backdrop-blur-md rounded-full px-4 py-1.5 border border-border flex items-center gap-2 transition-opacity duration-700 ${
        showHint ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}>
        <span>Navegue pelos slides</span>
        <kbd className="px-1.5 py-0.5 text-xs rounded border border-border bg-muted font-mono">←</kbd>
        <kbd className="px-1.5 py-0.5 text-xs rounded border border-border bg-muted font-mono">→</kbd>
      </div>

      {/* Barra de controle */}
      <div className="flex items-center gap-3 bg-background/80 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrev}
          disabled={currentSlide === 0}
          className={`rounded-full ${showHint ? "animate-pulse" : ""}`}
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
          className={`rounded-full ${showHint ? "animate-pulse" : ""}`}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        <div className="w-px h-6 bg-border" />

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
