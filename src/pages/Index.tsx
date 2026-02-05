import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBanner from "@/components/TrustBanner";
import KinguinProductGrid from "@/components/KinguinProductGrid";
import Platforms from "@/components/Platforms";
import Testimonials from "@/components/Testimonials";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import IntroAnimation from "@/components/IntroAnimation";
import MobileNav from "@/components/MobileNav";
import MobileHome from "@/components/MobileHome";
import MobileSearch from "@/components/MobileSearch";
import MobileDeals from "@/components/MobileDeals";
import MobileClub from "@/components/MobileClub";
import MobileCart from "@/components/MobileCart";
import MobileGameCard from "@/components/MobileGameCard";

import { AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/contexts/AuthContext";
import { useShardBalance } from "@/hooks/useShards";
import { KinguinProduct } from "@/lib/kinguin";

const Index = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [siteReady, setSiteReady] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedGame, setSelectedGame] = useState<KinguinProduct | null>(null);
  const isMobile = useIsMobile();
  const { getTotalItems } = useCartStore();
  const { user } = useAuth();
  const { data: balance } = useShardBalance();

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

  const handleSelectGame = (product: KinguinProduct) => {
    setSelectedGame(product);
  };

  const handleBackToHome = () => {
    setActiveTab('home');
  };

  const renderMobileContent = () => {
    switch (activeTab) {
      case 'home':
        return <MobileHome onSelectGame={handleSelectGame} />;
      case 'search':
        return <MobileSearch onSelectGame={handleSelectGame} onBack={handleBackToHome} />;
      case 'deals':
        return <MobileDeals onSelectGame={handleSelectGame} onBack={handleBackToHome} />;
      case 'cart':
        return <MobileCart onBack={handleBackToHome} />;
      case 'club':
        return <MobileClub onBack={handleBackToHome} />;
      default:
        return <MobileHome onSelectGame={handleSelectGame} />;
    }
  };

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
            {renderMobileContent()}
            
            <MobileNav 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
              cartCount={getTotalItems()}
              shardBalance={user ? (balance?.balance || 0) : 0}
            />

            {/* Game Detail Sheet */}
            <AnimatePresence>
              {selectedGame && (
                <MobileGameCard
                  title={selectedGame.name}
                  image={selectedGame.cover_image || ''}
                  price={selectedGame.sell_price}
                  originalPrice={selectedGame.original_price}
                  platform={selectedGame.platform || 'Steam'}
                  discount={Math.round((1 - selectedGame.sell_price / selectedGame.original_price) * 100)}
                  rating={4.7}
                  onClose={() => setSelectedGame(null)}
                />
              )}
            </AnimatePresence>
          </>
        ) : (
          /* Desktop Layout */
          <>
            <Header />
            
            <main>
              <Hero />
              <TrustBanner />
              <KinguinProductGrid />
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
