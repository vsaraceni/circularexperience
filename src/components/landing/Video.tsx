import { Play } from "lucide-react";

const Video = () => {
  return (
    <section className="py-20 gradient-hero">
      <div className="container mx-auto !px-[26px]">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Conheça o Circular Experience
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            Assista ao vídeo e descubra como transformar seu negócio
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video bg-background/10">
            <iframe
              src="https://www.youtube.com/embed/NgEwR9eBoJI"
              title="Circular Experience - Apresentação"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
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
