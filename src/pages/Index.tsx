import Header from "@/components/Header";
import Hero from "@/components/Hero";
import GameCatalog from "@/components/GameCatalog";
import Features from "@/components/Features";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <GameCatalog />
        <Features />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
