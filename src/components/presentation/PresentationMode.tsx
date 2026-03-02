import React, { useCallback, useEffect, useRef, useState } from "react";
import SlideWrapper from "./SlideWrapper";
import PresentationControls from "./PresentationControls";
import Hero from "@/components/landing/Hero";
import SocialProof from "@/components/landing/SocialProof";
import Stats from "@/components/landing/Stats";
import About from "@/components/landing/About";
import Methodology from "@/components/landing/Methodology";
import Agenda from "@/components/landing/Agenda";
import Video from "@/components/landing/Video";
import Experts from "@/components/landing/Experts";
import SDGs from "@/components/landing/SDGs";
import CTA from "@/components/landing/CTA";

interface PresentationModeProps {
  onExit: () => void;
}

const slides = [
  { component: Hero, label: "Capa" },
  { component: SocialProof, label: "Prova Social" },
  { component: Stats, label: "Oportunidade" },
  { component: About, label: "Sobre" },
  { component: Methodology, label: "Metodologia" },
  { component: Agenda, label: "Agenda" },
  { component: Video, label: "Vídeo" },
  { component: Experts, label: "Especialistas" },
  { component: SDGs, label: "ODS" },
  { component: CTA, label: "Contato" },
];

const PresentationMode: React.FC<PresentationModeProps> = ({ onExit }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const goNext = useCallback(() => {
    setCurrentSlide((s) => Math.min(s + 1, slides.length - 1));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentSlide((s) => Math.max(s - 1, 0));
  }, []);

  const exitPresentation = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onExit();
  }, [onExit]);

  // Enter fullscreen on mount
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});

    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        onExit();
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [onExit]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "Backspace":
          e.preventDefault();
          goPrev();
          break;
        case "Escape":
          exitPresentation();
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, exitPresentation]);

  // Auto-hide controls & cursor
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black"
      style={{ cursor: controlsVisible ? "default" : "none" }}
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
    >
      {slides.map((slide, index) => {
        const SlideComponent = slide.component;
        return (
          <SlideWrapper key={index} isActive={index === currentSlide}>
            <SlideComponent />
          </SlideWrapper>
        );
      })}

      <PresentationControls
        currentSlide={currentSlide}
        totalSlides={slides.length}
        onPrev={goPrev}
        onNext={goNext}
        onExit={exitPresentation}
        visible={controlsVisible}
      />
    </div>
  );
};

export default PresentationMode;
