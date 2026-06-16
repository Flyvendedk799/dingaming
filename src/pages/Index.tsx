import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBanner from "@/components/TrustBanner";
import KinguinProductGrid from "@/components/KinguinProductGrid";
import Platforms from "@/components/Platforms";
import Testimonials from "@/components/Testimonials";
import HowItWorks from "@/components/HowItWorks";
import NewsletterBanner from "@/components/NewsletterBanner";
import Footer from "@/components/Footer";
import IntroAnimation from "@/components/IntroAnimation";
import MobileNav from "@/components/MobileNav";
import MobileHome from "@/components/MobileHome";
import MobileSearch from "@/components/MobileSearch";
import MobileDeals from "@/components/MobileDeals";
import MobileClub from "@/components/MobileClub";
import MobileCart from "@/components/MobileCart";
import MobileGameCard from "@/components/MobileGameCard";


import { useIsMobile } from "@/hooks/use-mobile";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/contexts/AuthContext";
import { useShardBalance } from "@/hooks/useShards";
import { KinguinProduct } from "@/lib/kinguin";

const INTRO_STORAGE_KEY = 'dingaming_intro_shown';
const INTRO_EXPIRY_MS = 30 * 1000; // 30 seconds

const Index = () => {
  const [showIntro, setShowIntro] = useState(() => {
    const stored = localStorage.getItem(INTRO_STORAGE_KEY);
    if (!stored) return true;
    
    const timestamp = parseInt(stored, 10);
    const elapsed = Date.now() - timestamp;
    
    // Show intro if more than 30 seconds have passed
    return elapsed > INTRO_EXPIRY_MS;
  });
  const [siteReady, setSiteReady] = useState(!showIntro);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedGame, setSelectedGame] = useState<KinguinProduct | null>(null);
  const isMobile = useIsMobile();
  const { getTotalItems } = useCartStore();
  const { user } = useAuth();
  const { data: balance } = useShardBalance();

  const handleIntroComplete = () => {
    setShowIntro(false);
    localStorage.setItem(INTRO_STORAGE_KEY, Date.now().toString());
    setTimeout(() => setSiteReady(true), 100);
  };

  // Scroll locking is handled inside the MobileGameCard itself to avoid "stuck" states
  // if selection happens but the sheet fails to mount/animate for any reason.


  const handleSelectGame = (product: KinguinProduct) => {
    console.log('[DEBUG] handleSelectGame called with:', product.name);
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
          siteReady ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
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
            {selectedGame && (
              <MobileGameCard
                key={selectedGame.id}
                kinguinId={selectedGame.kinguin_id}
                title={selectedGame.name}
                image={selectedGame.cover_image || ''}
                price={selectedGame.sell_price}
                originalPrice={selectedGame.original_price}
                marginPercent={selectedGame.margin_percent}
                platform={selectedGame.platform || 'Steam'}
                discount={Math.round((1 - selectedGame.sell_price / selectedGame.original_price) * 100)}
                rating={4.7}
                onClose={() => {
                  console.log('[DEBUG] onClose called');
                  setSelectedGame(null);
                }}
              />
            )}
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
              <NewsletterBanner source="homepage" />
            </main>
            <Footer />
          </>
        )}
      </div>
    </>
  );
};

export default Index;
