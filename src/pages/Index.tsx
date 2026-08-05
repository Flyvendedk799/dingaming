import { useState } from "react";
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
 * The full-screen intro animation is gone: it cost thirty seconds of a
 * visitor's trust before they had seen a single price. The hero is compressed
 * so the real product grid sits above the fold, and the fabricated social
 * proof (invented sales counts, review scores and testimonials) has been
 * removed rather than restyled.
 */
const Index = () => {
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
