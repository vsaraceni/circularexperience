import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";
import About from "@/components/landing/About";
import Methodology from "@/components/landing/Methodology";
import Agenda from "@/components/landing/Agenda";
import Experts from "@/components/landing/Experts";
import SDGs from "@/components/landing/SDGs";
import Video from "@/components/landing/Video";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Stats />
        <About />
        <Methodology />
        <Agenda />
        <Video />
        <Experts />
        <SDGs />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
