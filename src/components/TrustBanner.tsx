import { motion } from "framer-motion";
import { Star, Users, ShoppingBag, Clock, TrendingUp } from "lucide-react";

const stats = [
  { icon: Users, value: "50.000+", label: "TILFREDSE KUNDER", color: "primary" },
  { icon: ShoppingBag, value: "200K+", label: "SOLGTE KEYS", color: "secondary" },
  { icon: Star, value: "4.9/5", label: "TRUSTPILOT", color: "accent" },
  { icon: Clock, value: "<60s", label: "LEVERINGSTID", color: "primary" },
];

const TrustBanner = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5" />
      <motion.div 
        animate={{ x: [0, 100, 0] }}
        transition={{ duration: 20, repeat: Infinity }}
        className="absolute inset-0 bg-mesh opacity-50"
      />
      
      {/* Borders */}
      <div className="absolute top-0 left-0 right-0 h-px line-glow" />
      <div className="absolute bottom-0 left-0 right-0 h-px line-glow" />

      {/* Marquee effect - trust badges */}
      <div className="absolute top-0 left-0 right-0 py-3 overflow-hidden bg-primary/5 border-b border-primary/10">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 whitespace-nowrap"
        >
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">ØJEBLIKKELIG LEVERING</span>
              <span className="text-primary">•</span>
              <span className="text-sm font-medium">SIKKER BETALING</span>
              <span className="text-primary">•</span>
              <span className="text-sm font-medium">ÆGTE KEYS</span>
              <span className="text-primary">•</span>
              <span className="text-sm font-medium">DANSK SUPPORT</span>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="relative container mx-auto px-4 pt-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center group"
            >
              {/* Icon with glow */}
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 
                  ${stat.color === 'primary' ? 'bg-primary/10 shadow-glow-sm' : ''}
                  ${stat.color === 'secondary' ? 'bg-secondary/10 shadow-glow-purple' : ''}
                  ${stat.color === 'accent' ? 'bg-accent/10 shadow-gold' : ''}
                `}
              >
                <stat.icon className={`w-8 h-8 
                  ${stat.color === 'primary' ? 'text-primary' : ''}
                  ${stat.color === 'secondary' ? 'text-secondary' : ''}
                  ${stat.color === 'accent' ? 'text-accent' : ''}
                `} />
              </motion.div>
              
              {/* Value */}
              <motion.div 
                className="font-display text-4xl sm:text-5xl lg:text-6xl text-gradient glow-text mb-3"
                whileHover={{ scale: 1.05 }}
              >
                {stat.value}
              </motion.div>
              
              {/* Label */}
              <div className="text-xs sm:text-sm text-muted-foreground font-tech tracking-widest">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBanner;
