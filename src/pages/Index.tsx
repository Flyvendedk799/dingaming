import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBanner from "@/components/TrustBanner";
import GameCatalog from "@/components/GameCatalog";
import PlatformShowcase from "@/components/PlatformShowcase";
import Features from "@/components/Features";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <TrustBanner />
        <GameCatalog />
        <PlatformShowcase />
        <Features />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
