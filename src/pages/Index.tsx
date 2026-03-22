import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import SocialProof from "@/components/landing/SocialProof";
import About from "@/components/landing/About";
import Testimonial from "@/components/landing/Testimonial";
import Agenda from "@/components/landing/Agenda";
import Experts from "@/components/landing/Experts";
import SDGs from "@/components/landing/SDGs";
import Video from "@/components/landing/Video";
import CTA from "@/components/landing/CTA";
import FAQSection from "@/components/landing/FAQSection";
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
        <Testimonial />
        <About />
        <Experts />
        <Agenda />
        <Video />
        <SDGs />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
