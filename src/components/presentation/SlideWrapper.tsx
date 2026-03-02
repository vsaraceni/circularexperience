import React, { useEffect, useRef, useState, useCallback } from "react";

interface SlideWrapperProps {
  children: React.ReactNode;
  isActive: boolean;
}

const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

const SlideWrapper: React.FC<SlideWrapperProps> = ({ children, isActive }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const parent = containerRef.current.parentElement;
    if (!parent) return;
    const scaleX = parent.clientWidth / BASE_WIDTH;
    const scaleY = parent.clientHeight / BASE_HEIGHT;
    setScale(Math.min(scaleX, scaleY));
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [updateScale]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
        isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
      }`}
    >
      <div
        className="bg-background rounded-lg overflow-hidden shadow-2xl"
        style={{
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <div className="w-full h-full overflow-y-auto flex items-center justify-center scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SlideWrapper;
