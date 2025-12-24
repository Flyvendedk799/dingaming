import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Zap, Star, Eye } from "lucide-react";
import { useState } from "react";

interface GameCardProps {
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  platform: string;
  discount?: number;
  rating?: number;
  index?: number;
}

const GameCard = ({ title, image, price, originalPrice, platform, discount, rating = 4.5, index = 0 }: GameCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.33, 1, 0.68, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      {/* Animated glow border on hover */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-primary via-secondary to-neon-magenta blur-sm z-0"
      />
      
      <div className="relative bg-card rounded-2xl overflow-hidden border border-border/50 z-10 spotlight">
        {/* Badges */}
        <div className="absolute top-4 left-4 right-4 z-30 flex items-start justify-between">
          {discount && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="relative"
            >
              <div className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-bold">
                -{discount}%
              </div>
              <div className="absolute inset-0 bg-destructive/50 blur-lg -z-10" />
            </motion.div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-primary/30 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary">INSTANT</span>
          </div>
        </div>

        {/* Image Container with 3D effect */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <motion.img
            src={image}
            alt={title}
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
            className="w-full h-full object-cover"
          />
          
          {/* Holographic overlay */}
          <motion.div 
            animate={{ opacity: isHovered ? 0.6 : 0 }}
            className="absolute inset-0 holographic"
          />
          
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Quick actions on hover */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center gap-3"
          >
            <Button variant="hero" size="lg" className="shadow-glow-lg">
              <ShoppingCart className="w-5 h-5 mr-2" />
              TILFØJ
            </Button>
            <Button variant="outline" size="icon" className="w-12 h-12 rounded-xl border-2">
              <Eye className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>

        {/* Content */}
        <div className="relative p-6 -mt-16 pt-20 bg-gradient-to-t from-card via-card to-transparent">
          {/* Platform & Rating */}
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20 font-tech">
              {platform}
            </span>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span className="text-sm font-semibold text-foreground">{rating}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-display text-2xl text-foreground mb-4 leading-tight tracking-wide group-hover:text-gradient transition-all duration-500">
            {title.toUpperCase()}
          </h3>

          {/* Price & Action */}
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-gradient glow-text font-tech">{price} KR</span>
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through">{originalPrice} kr</span>
              )}
            </div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="neon" size="icon" className="w-14 h-14 rounded-xl border-2">
                <ShoppingCart className="w-6 h-6" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Bottom accent */}
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-neon-magenta origin-left"
        />
      </div>
    </motion.div>
  );
};

export default GameCard;
