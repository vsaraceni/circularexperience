import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import SocialProof from "@/components/landing/SocialProof";
import Stats from "@/components/landing/Stats";
import About from "@/components/landing/About";
import Methodology from "@/components/landing/Methodology";
import Agenda from "@/components/landing/Agenda";
import Experts from "@/components/landing/Experts";
import SDGs from "@/components/landing/SDGs";
import Video from "@/components/landing/Video";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import PresentationMode from "@/components/presentation/PresentationMode";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPresentationMode, setIsPresentationMode] = useState(
    searchParams.get("mode") === "apresentacao"
  );

  const handleExitPresentation = () => {
    setIsPresentationMode(false);
    searchParams.delete("mode");
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {isPresentationMode && (
        <PresentationMode onExit={handleExitPresentation} />
      )}
      <Header onPresent={() => setIsPresentationMode(true)} />
      <main>
        <Hero />
        <SocialProof />
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
