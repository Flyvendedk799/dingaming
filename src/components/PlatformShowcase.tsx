import { motion } from "framer-motion";
import { Gamepad2, MonitorPlay, Joystick, Smartphone } from "lucide-react";

const platforms = [
  { name: "STEAM", icon: MonitorPlay, games: "10.000+", gradient: "from-blue-500 to-blue-700" },
  { name: "PLAYSTATION", icon: Gamepad2, games: "3.000+", gradient: "from-blue-600 to-indigo-700" },
  { name: "XBOX", icon: Joystick, games: "2.500+", gradient: "from-green-500 to-green-700" },
  { name: "NINTENDO", icon: Smartphone, games: "1.500+", gradient: "from-red-500 to-red-700" },
];

const PlatformShowcase = () => {
  return (
    <section className="relative py-24 overflow-hidden bg-noise">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.05)_0%,_transparent_50%)]" />
      
      <div className="relative container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-[2.5rem] sm:text-[4rem] lg:text-[5rem] leading-[0.9] mb-4">
            <span className="text-foreground">ALLE DINE </span>
            <span className="text-gradient">PLATFORME</span>
          </h2>
          <p className="text-muted-foreground font-body text-lg">
            Vi har game keys til alle de store gaming platforme
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group relative p-8 rounded-2xl bg-card border border-border/50 text-center overflow-hidden spotlight"
            >
              {/* Gradient glow on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${platform.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              
              {/* Icon */}
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${platform.gradient} mb-6 shadow-lg group-hover:shadow-glow-md transition-all duration-300`}
              >
                <platform.icon className="w-10 h-10 text-white" />
              </motion.div>
              
              <h3 className="font-display text-2xl text-foreground mb-2 tracking-wide">
                {platform.name}
              </h3>
              <p className="text-primary font-tech text-sm tracking-wider">
                {platform.games} SPIL
              </p>

              {/* Animated border */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary/30 transition-colors duration-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformShowcase;
