import { useState, useRef, useEffect, useCallback } from "react";
import { Play } from "lucide-react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

const FEATURED_VIDEO = { id: "NgEwR9eBoJI", title: "O que é o Circular Experience?" };

const Video = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const playerRef = useRef<any>(null);

  // Load YouTube IFrame API only when user clicks play
  const loadApi = useCallback(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      setApiReady(true);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  }, []);

  // Create player once API is ready and user clicked play
  useEffect(() => {
    if (!apiReady || !isPlaying) return;

    playerRef.current = new window.YT.Player("yt-player", {
      videoId: FEATURED_VIDEO.id,
      playerVars: { autoplay: 1, rel: 0, start: 3 },
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [apiReady, isPlaying]);

  const handlePlay = () => {
    setIsPlaying(true);
    loadApi();
  };

  return (
    <section ref={sectionRef} className="py-20 gradient-hero">
      <div className="container mx-auto px-4 md:!px-[46px]">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Veja na prática o que acontece em uma sessão
          </h2>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video bg-background/10">
            {isPlaying ? (
              <div id="yt-player" className="w-full h-full" />
            ) : (
              <button
                onClick={handlePlay}
                className="relative w-full h-full group cursor-pointer"
                aria-label="Reproduzir vídeo"
              >
                <img
                  src={`https://img.youtube.com/vi/${FEATURED_VIDEO.id}/maxresdefault.jpg`}
                  alt={FEATURED_VIDEO.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                    <Play className="w-8 h-8 text-primary ml-1" />
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Video;
