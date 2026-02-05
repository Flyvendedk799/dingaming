import { Home, Search, Tag, Sparkles, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  cartCount?: number;
  shardBalance?: number;
}

const MobileNav = ({ activeTab, onTabChange, cartCount = 0, shardBalance = 0 }: MobileNavProps) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Hjem' },
    { id: 'search', icon: Search, label: 'Søg' },
    { id: 'deals', icon: Tag, label: 'Tilbud' },
    { id: 'cart', icon: ShoppingCart, label: 'Kurv', badge: cartCount },
    { id: 'club', icon: Sparkles, label: 'Club', badge: shardBalance > 0 ? Math.floor(shardBalance / 1000) : undefined },
  ];

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Premium glassmorphism background */}
      <div 
        className="absolute inset-x-2 inset-y-0 bg-card/70 backdrop-blur-2xl border border-border/30 rounded-t-3xl shadow-premium-lg"
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      />
      
      <div 
        className="relative flex items-center justify-around px-2"
        style={{ 
          paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)',
          paddingTop: '8px',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center min-w-[60px] py-1"
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                className={`relative p-2 rounded-2xl transition-colors duration-200 ${
                  isActive ? 'bg-success/15' : ''
                }`}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.2 }}
              >
                <Icon 
                  className={`w-6 h-6 transition-colors duration-200 ${
                    isActive ? 'text-success' : 'text-muted-foreground'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                {/* Badge */}
                {tab.badge && tab.badge > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    {tab.badge}
                  </motion.span>
                )}
              </motion.div>
              
              <span className={`text-[10px] mt-0.5 font-medium transition-colors duration-200 ${
                isActive ? 'text-success' : 'text-muted-foreground'
              }`}>
                {tab.label}
              </span>
              
              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-success"
                  layoutId="activeTab"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default MobileNav;