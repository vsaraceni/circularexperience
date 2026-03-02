import { useState, useRef, useEffect, useCallback } from "react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

const videos = [
  { id: "NgEwR9eBoJI", title: "O que é o Circular Experience?" },
  { id: "HgdvD6Zf3TI", title: "Impacto na cadeia produtiva" },
  { id: "kvQPcB1Tkt4", title: "Reputação e posicionamento ESG" },
  { id: "Z2QT5dYmxiU", title: "Engajamento de colaboradores" },
  { id: "xx1et3NmK7c", title: "Resultados mensuráveis" },
];

const Video = () => {
  const [activeVideo, setActiveVideo] = useState(videos[0].id);
  const [isVisible, setIsVisible] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const playerRef = useRef<any>(null);
  const activeVideoRef = useRef(activeVideo);

  // Keep ref in sync
  activeVideoRef.current = activeVideo;

  // Load YouTube IFrame API
  useEffect(() => {
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

  // Intersection observer
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  const onStateChange = useCallback((event: any) => {
    if (event.data === window.YT.PlayerState.ENDED) {
      const idx = videos.findIndex((v) => v.id === activeVideoRef.current);
      if (idx < videos.length - 1) {
        setActiveVideo(videos[idx + 1].id);
      }
    }
  }, []);

  // Create / recreate player
  useEffect(() => {
    if (!apiReady) return;

    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    const playerVars: any = {
      autoplay: isVisible ? 1 : 0,
      rel: 0,
    };
    if (activeVideo === videos[0].id) {
      playerVars.start = 3;
    }

    playerRef.current = new window.YT.Player("yt-player", {
      videoId: activeVideo,
      playerVars,
      events: {
        onStateChange,
      },
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [apiReady, activeVideo, onStateChange]);

  // Play/pause based on visibility
  useEffect(() => {
    if (!playerRef.current?.getPlayerState) return;
    if (isVisible) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isVisible]);

  return (
    <section ref={sectionRef} className="py-20 gradient-hero">
      <div className="container mx-auto px-4 md:!px-[46px]">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Conheça o Circular Experience
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            Assista aos vídeos e descubra como transformar sua organização
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Player principal */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video bg-background/10">
            <div id="yt-player" className="w-full h-full" />
          </div>

          {/* Thumbnails */}
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2 flex-nowrap">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => setActiveVideo(video.id)}
                className={`flex-shrink-0 w-36 md:w-44 transition-all duration-300 rounded-lg overflow-hidden ${
                  activeVideo === video.id
                    ? "ring-2 ring-primary-foreground opacity-100 scale-105"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                  alt={video.title}
                  className="w-full aspect-video object-cover rounded-lg"
                />
                <p className="text-primary-foreground/80 text-xs mt-1 text-center truncate px-1">
                  {video.title}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Stats below video */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 md:gap-16">
          <div className="text-center">
            <p className="font-display text-4xl font-bold text-primary-foreground">4h</p>
            <p className="text-primary-foreground/70 text-sm">de imersão</p>
          </div>
          <div className="text-center">
            <p className="font-display text-4xl font-bold text-primary-foreground">7 R's</p>
            <p className="text-primary-foreground/70 text-sm">da circularidade</p>
          </div>
          <div className="text-center">
            <p className="font-display text-4xl font-bold text-primary-foreground">100%</p>
            <p className="text-primary-foreground/70 text-sm">prático</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Video;
