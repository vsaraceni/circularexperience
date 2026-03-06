const VIDEO_URL = "https://www.youtube.com/watch?v=NgEwR9eBoJI&t=3";
const THUMBNAIL_URL = "https://img.youtube.com/vi/NgEwR9eBoJI/maxresdefault.jpg";

const VideoPrint = () => {
  return (
    <a
      href={VIDEO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full h-full relative overflow-hidden"
      style={{ fontFamily: "'Raleway', sans-serif" }}
    >
      {/* Background thumbnail */}
      <img
        src={THUMBNAIL_URL}
        alt="Conheça o Circular Experience"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, hsla(307,44%,22%,0.85) 0%, hsla(307,44%,16%,0.92) 100%)" }}
      />

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        <h2 className="text-5xl font-bold text-white mb-8">
          Conheça o Circular Experience
        </h2>
        <p className="text-white/80 text-xl mb-12 max-w-2xl text-center">
          Assista aos vídeos e descubra como transformar sua organização
        </p>

        {/* CSS play button */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-16"
          style={{ background: "hsla(0,0%,100%,0.2)", border: "3px solid white" }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "18px solid transparent",
              borderBottom: "18px solid transparent",
              borderLeft: "30px solid white",
              marginLeft: "6px",
            }}
          />
        </div>

        {/* Stats */}
        <div className="flex gap-20">
          <div className="text-center">
            <p className="text-4xl font-bold text-white">4h</p>
            <p className="text-white/70 text-sm">de imersão</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-white">7 R's</p>
            <p className="text-white/70 text-sm">da circularidade</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-white">100%</p>
            <p className="text-white/70 text-sm">prático</p>
          </div>
        </div>
      </div>
    </a>
  );
};

export default VideoPrint;
