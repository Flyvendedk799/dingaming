import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBanner from "@/components/TrustBanner";
import ShopifyProductGrid from "@/components/ShopifyProductGrid";
import Platforms from "@/components/Platforms";
import Testimonials from "@/components/Testimonials";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import IntroAnimation from "@/components/IntroAnimation";
import MobileNav from "@/components/MobileNav";
import MobileHome from "@/components/MobileHome";
import MobileGameCard from "@/components/MobileGameCard";
import { CartDrawer } from "@/components/CartDrawer";
import { AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCartStore } from "@/stores/cartStore";

const Index = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [siteReady, setSiteReady] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const isMobile = useIsMobile();
  const cartItems = useCartStore(state => state.items);

  const handleIntroComplete = () => {
    setShowIntro(false);
    setTimeout(() => setSiteReady(true), 100);
  };

  // Prevent scroll when game card is open
  useEffect(() => {
    if (selectedGame && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedGame, isMobile]);

  return (
    <>
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      
      <div 
        className={`min-h-screen bg-background transition-opacity duration-500 ${
          siteReady ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Mobile Layout */}
        {isMobile ? (
          <>
            <MobileHome onSelectGame={setSelectedGame} />
            
            <MobileNav 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
              cartCount={cartItems.length}
            />

            {/* Game Detail Sheet */}
            <AnimatePresence>
              {selectedGame && (
                <MobileGameCard
                  {...selectedGame}
                  onClose={() => setSelectedGame(null)}
                />
              )}
            </AnimatePresence>
          </>
        ) : (
          /* Desktop Layout */
          <>
            <Header />
            
            {/* Fixed Cart Drawer */}
            <div className="fixed top-24 right-4 z-50">
              <CartDrawer />
            </div>
            
            <main>
              <Hero />
              <TrustBanner />
              <ShopifyProductGrid />
              <Platforms />
              <Testimonials />
              <HowItWorks />
            </main>
            <Footer />
          </>
        )}
      </div>
    </>
  );
};

export default Index;