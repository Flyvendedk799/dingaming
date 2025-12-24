import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBanner from "@/components/TrustBanner";
import GameCatalog from "@/components/GameCatalog";
import Platforms from "@/components/Platforms";
import Testimonials from "@/components/Testimonials";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <TrustBanner />
        <GameCatalog />
        <Platforms />
        <Testimonials />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
