import { useCallback, useState } from "react";
import BrandIntro, { shouldShowIntro } from "@/components/BrandIntro";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import KinguinProductGrid from "@/components/KinguinProductGrid";
import Platforms from "@/components/Platforms";
import Footer from "@/components/Footer";
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

/**
 * Front page.
 *
 * The six-second canvas intro is gone, replaced by a sub-second brand moment
 * that runs once per session (see BrandIntro). The page underneath renders
 * immediately either way — the overlay never gates the content, so the hero
 * and the grid are already painted when it lifts.
 */
const Index = () => {
  const [showIntro, setShowIntro] = useState(shouldShowIntro);
  const dismissIntro = useCallback(() => setShowIntro(false), []);
  const [activeTab, setActiveTab] = useState("home");
  const [selectedGame, setSelectedGame] = useState<KinguinProduct | null>(null);
  const isMobile = useIsMobile();
  const { getTotalItems } = useCartStore();
  const { user } = useAuth();
  const { data: balance } = useShardBalance();

  const handleSelectGame = (product: KinguinProduct) => setSelectedGame(product);
  const handleBackToHome = () => setActiveTab("home");

  const renderMobileContent = () => {
    switch (activeTab) {
      case "search":
        return <MobileSearch onSelectGame={handleSelectGame} onBack={handleBackToHome} />;
      case "deals":
        return <MobileDeals onSelectGame={handleSelectGame} onBack={handleBackToHome} />;
      case "cart":
        return <MobileCart onBack={handleBackToHome} />;
      case "club":
        return <MobileClub onBack={handleBackToHome} />;
      case "home":
      default:
        return <MobileHome onSelectGame={handleSelectGame} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {showIntro && <BrandIntro onDone={dismissIntro} />}
      {isMobile ? (
        <>
          {renderMobileContent()}

          <MobileNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            cartCount={getTotalItems()}
            shardBalance={user ? balance?.balance || 0 : 0}
          />

          {selectedGame && (
            <MobileGameCard
              key={selectedGame.id}
              kinguinId={selectedGame.kinguin_id}
              title={selectedGame.name}
              image={selectedGame.cover_image || ""}
              price={selectedGame.sell_price}
              originalPrice={selectedGame.original_price}
              marginPercent={selectedGame.margin_percent}
              platform={selectedGame.platform || "Steam"}
              discount={Math.round((1 - selectedGame.sell_price / selectedGame.original_price) * 100)}
              onClose={() => setSelectedGame(null)}
            />
          )}
        </>
      ) : (
        <>
          <Header />
          <main>
            <Hero />
            <KinguinProductGrid />
            <Platforms />
          </main>
          <Footer />
        </>
      )}
    </div>
  );
};

export default Index;
