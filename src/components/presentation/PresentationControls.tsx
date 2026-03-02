import React from "react";
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
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-background/80 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-border transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
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
        onClick={onExit}
        className="rounded-full"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default PresentationControls;
