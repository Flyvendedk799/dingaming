import { Shield, Zap, RefreshCw, Headphones, Star, Users, ShoppingBag, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const stats = [
  { icon: Users, value: "50.000+", label: "Kunder" },
  { icon: ShoppingBag, value: "200K+", label: "Solgte keys" },
  { icon: Star, value: "4.9/5", label: "Trustpilot" },
  { icon: Clock, value: "<30 sek", label: "Levering" },
];

const trustPoints = [
  { icon: Zap, title: "Øjeblikkelig Levering", description: "Key sendes automatisk til din email inden for 30 sekunder efter køb" },
  { icon: Shield, title: "100% Officielle Keys", description: "Alle keys er købt direkte fra udgivere og autoriserede distributører" },
  { icon: RefreshCw, title: "Pengene Tilbage Garanti", description: "Fuld refundering inden for 14 dage hvis din key ikke virker" },
  { icon: Headphones, title: "Dansk Kundeservice", description: "Vores danske support team er klar til at hjælpe dig 24/7" },
];

const TrustBanner = () => {
  const { ref: statsRef, isVisible: statsVisible } = useScrollReveal({ threshold: 0.2 });
  const { ref: trustpilotRef, isVisible: trustpilotVisible } = useScrollReveal({ threshold: 0.3 });
  const { ref: pointsRef, isVisible: pointsVisible } = useScrollReveal({ threshold: 0.2 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <section className="py-16 bg-card border-y border-border overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Stats row */}
        <motion.div 
          ref={statsRef}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate={statsVisible ? "visible" : "hidden"}
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={stat.label} 
              className="text-center p-6 rounded-xl bg-muted/50 border border-border hover:border-success/30 transition-all duration-300 group"
              variants={itemVariants}
              whileHover={{ 
                y: -8, 
                boxShadow: "0 20px 40px -12px hsl(0 0% 0% / 0.4)"
              }}
            >
              <motion.div 
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-success/10 mb-4 group-hover:bg-success/20 transition-colors"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <stat.icon className="w-6 h-6 text-success" />
              </motion.div>
              <motion.div 
                className="text-3xl font-bold text-foreground mb-1"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={statsVisible ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 300 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trustpilot highlight */}
        <motion.div 
          ref={trustpilotRef}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 p-6 rounded-xl bg-muted/30 border border-border"
          initial={{ opacity: 0, y: 30 }}
          animate={trustpilotVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ borderColor: "hsl(45 100% 51% / 0.3)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  animate={trustpilotVisible ? { opacity: 1, scale: 1, rotate: 0 } : {}}
                  transition={{ 
                    delay: 0.3 + i * 0.1, 
                    type: "spring", 
                    stiffness: 400,
                    damping: 15
                  }}
                >
                  <Star className="w-6 h-6 text-accent fill-accent" />
                </motion.div>
              ))}
            </div>
            <motion.span 
              className="text-2xl font-bold text-foreground"
              initial={{ opacity: 0, x: -20 }}
              animate={trustpilotVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.8 }}
            >
              4.9/5
            </motion.span>
          </div>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <motion.span 
            className="text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={trustpilotVisible ? { opacity: 1 } : {}}
            transition={{ delay: 0.9 }}
          >
            baseret på <span className="text-foreground font-semibold">12.847 anmeldelser</span> på Trustpilot
          </motion.span>
        </motion.div>

        {/* Trust points */}
        <motion.div 
          ref={pointsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={pointsVisible ? "visible" : "hidden"}
        >
          {trustPoints.map((point, index) => (
            <motion.div 
              key={point.title} 
              className="p-6 rounded-xl bg-background border border-border hover:border-success/30 hover:shadow-soft transition-all duration-300 group"
              variants={itemVariants}
              whileHover={{ 
                y: -8,
                boxShadow: "0 20px 40px -12px hsl(0 0% 0% / 0.4)"
              }}
            >
              <motion.div 
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-success/10 mb-4 group-hover:bg-success/15 transition-colors"
                whileHover={{ scale: 1.15, rotate: 10 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <point.icon className="w-6 h-6 text-success" />
              </motion.div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2 group-hover:text-success transition-colors">
                {point.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {point.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TrustBanner;