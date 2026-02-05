import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Monitor, Laptop, Joystick, Loader2, ChevronRight, Sparkles, TrendingUp, Zap, Star, Flame, Shield, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface PlatformCategory {
  id: string;
  name: string;
  description: string;
  icon: typeof Monitor;
  gradient: string;
  accentColor: string;
  games: number;
  topGames: { name: string; cover_image: string | null }[];
}

interface GenreCategory {
  name: string;
  count: number;
  icon: typeof Flame;
}

const platformConfig: Record<string, { 
  icon: typeof Monitor; 
  gradient: string; 
  accentColor: string;
  description: string 
}> = {
  'Steam': { 
    icon: Monitor, 
    gradient: 'from-[#1b2838] via-[#2a475e] to-[#1b2838]', 
    accentColor: 'text-[#66c0f4]',
    description: 'Verdens største spilplatform med tusindvis af titler' 
  },
  'PlayStation': { 
    icon: Gamepad2, 
    gradient: 'from-[#003791] via-[#0070d1] to-[#003791]', 
    accentColor: 'text-[#00d9ff]',
    description: 'PlayStation 4 & 5 eksklusive og multiplatform spil' 
  },
  'Xbox': { 
    icon: Joystick, 
    gradient: 'from-[#0e7a0d] via-[#107c10] to-[#0e7a0d]', 
    accentColor: 'text-[#9bf00b]',
    description: 'Xbox One & Series X|S spil og Game Pass' 
  },
  'Nintendo': { 
    icon: Gamepad2, 
    gradient: 'from-[#e60012] via-[#ff1744] to-[#e60012]', 
    accentColor: 'text-white',
    description: 'Nintendo Switch spil og klassikere' 
  },
  'Origin': { 
    icon: Monitor, 
    gradient: 'from-[#f56c2d] via-[#ff8a50] to-[#f56c2d]', 
    accentColor: 'text-white',
    description: 'EA Sports, Battlefield, FIFA og mere' 
  },
  'Uplay': { 
    icon: Monitor, 
    gradient: 'from-[#0070ff] via-[#00a8ff] to-[#0070ff]', 
    accentColor: 'text-white',
    description: "Assassin's Creed, Far Cry, Rainbow Six" 
  },
  'Battle.net': { 
    icon: Monitor, 
    gradient: 'from-[#0074e0] via-[#00aeff] to-[#0074e0]', 
    accentColor: 'text-[#00ccff]',
    description: 'World of Warcraft, Diablo, Overwatch' 
  },
  'GOG': { 
    icon: Monitor, 
    gradient: 'from-[#7b2d8e] via-[#9b4dca] to-[#7b2d8e]', 
    accentColor: 'text-[#ff00ff]',
    description: 'DRM-frie spil og klassikere' 
  },
  'Epic Games': { 
    icon: Monitor, 
    gradient: 'from-[#2a2a2a] via-[#404040] to-[#2a2a2a]', 
    accentColor: 'text-white',
    description: 'Epic Games Store eksklusive' 
  },
};

const genreIcons: Record<string, typeof Flame> = {
  'Action': Zap,
  'Adventure': Star,
  'RPG': Shield,
  'Shooter': Flame,
  'Strategy': TrendingUp,
  'Sports': Gamepad2,
  'Racing': Zap,
  'Simulation': Monitor,
  'Indie': Sparkles,
  'Horror': Flame,
  'Puzzle': Star,
  'Fighting': Shield,
};

const CategoriesPage = () => {
  const [platforms, setPlatforms] = useState<PlatformCategory[]>([]);
  const [genres, setGenres] = useState<GenreCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      // Fetch all products to calculate counts + get sample games
      const { data: products, error } = await supabase
        .from('kinguin_products')
        .select('platform, genres, name, cover_image')
        .eq('is_available', true);

      if (error) throw error;

      // Count by platform with sample games
      const platformData: Record<string, { count: number; games: { name: string; cover_image: string | null }[] }> = {};
      const genreCounts: Record<string, number> = {};

      products?.forEach((product) => {
        // Count platforms
        if (product.platform) {
          if (!platformData[product.platform]) {
            platformData[product.platform] = { count: 0, games: [] };
          }
          platformData[product.platform].count++;
          if (platformData[product.platform].games.length < 4 && product.cover_image) {
            platformData[product.platform].games.push({
              name: product.name,
              cover_image: product.cover_image
            });
          }
        }

        // Count genres
        if (product.genres && Array.isArray(product.genres)) {
          product.genres.forEach((genre: string) => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          });
        }
      });

      // Convert to arrays with config
      const platformCategories: PlatformCategory[] = Object.entries(platformData)
        .map(([name, data]) => {
          const config = platformConfig[name] || {
            icon: Monitor,
            gradient: 'from-muted via-muted/80 to-muted',
            accentColor: 'text-primary',
            description: `${name} spil og keys`
          };
          return {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            description: config.description,
            icon: config.icon,
            gradient: config.gradient,
            accentColor: config.accentColor,
            games: data.count,
            topGames: data.games
          };
        })
        .sort((a, b) => b.games - a.games);

      const genreCategories: GenreCategory[] = Object.entries(genreCounts)
        .map(([name, count]) => ({ 
          name, 
          count,
          icon: genreIcons[name] || Star
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 16);

      setPlatforms(platformCategories);
      setGenres(genreCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
            <Loader2 className="w-8 h-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground">Indlæser kategorier...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const totalGames = platforms.reduce((sum, p) => sum + p.games, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <motion.div 
          className="relative rounded-3xl overflow-hidden mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-success/5 via-transparent to-transparent" />
          
          {/* Content */}
          <div className="relative px-6 py-12 md:px-12 md:py-16">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Badge variant="outline" className="gap-2 px-4 py-2 rounded-2xl border-primary/30 bg-primary/5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-primary font-medium">Udforsk alle kategorier</span>
                  </Badge>
                </motion.div>
                
                <motion.h1 
                  className="font-heading text-4xl md:text-5xl lg:text-6xl text-foreground"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Find dit næste
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-success to-accent">
                    gaming eventyr
                  </span>
                </motion.h1>
                
                <motion.p 
                  className="text-muted-foreground text-lg max-w-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Gennemse vores omfattende katalog med {formatNumber(totalGames)}+ spil på tværs af {platforms.length} platforme
                </motion.p>
              </div>

              {/* Stats */}
              <motion.div 
                className="flex gap-6 md:gap-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-foreground">{formatNumber(totalGames)}</div>
                  <div className="text-sm text-muted-foreground">Spil</div>
                </div>
                <div className="w-px bg-border" />
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-foreground">{platforms.length}</div>
                  <div className="text-sm text-muted-foreground">Platforme</div>
                </div>
                <div className="w-px bg-border" />
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-foreground">{genres.length}</div>
                  <div className="text-sm text-muted-foreground">Genrer</div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Platform Categories - Premium Cards */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-2xl md:text-3xl text-foreground mb-2">Platforme</h2>
              <p className="text-muted-foreground">Vælg din foretrukne gaming platform</p>
            </div>
          </div>
          
          {platforms.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-dashed border-border bg-muted/20">
              <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Ingen platforme fundet. Synkroniser produkter først.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platforms.slice(0, 9).map((platform, index) => (
                <motion.div
                  key={platform.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.5, ease: "easeOut" }}
                  onMouseEnter={() => setHoveredPlatform(platform.id)}
                  onMouseLeave={() => setHoveredPlatform(null)}
                >
                  <Link 
                    to={`/search?platform=${encodeURIComponent(platform.name)}`}
                    className="group relative block h-full"
                  >
                    {/* Card */}
                    <div className={`relative h-full p-6 rounded-3xl overflow-hidden bg-gradient-to-br ${platform.gradient} border border-white/10 transition-all duration-500 hover:shadow-premium-lg hover:-translate-y-2 hover:border-white/20`}>
                      {/* Shine effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      </div>
                      
                      {/* Content */}
                      <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-6">
                          <div className={`w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-inner-glow`}>
                            <platform.icon className={`w-7 h-7 ${platform.accentColor}`} />
                          </div>
                          <Badge variant="outline" className="bg-white/10 border-white/20 text-white/90 backdrop-blur-sm">
                            {formatNumber(platform.games)} spil
                          </Badge>
                        </div>
                        
                        {/* Title & Description */}
                        <h3 className="font-heading text-xl md:text-2xl text-white mb-2 group-hover:translate-x-1 transition-transform">
                          {platform.name}
                        </h3>
                        <p className="text-white/70 text-sm mb-6 line-clamp-2">
                          {platform.description}
                        </p>
                        
                        {/* Game previews */}
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-3">
                            {platform.topGames.slice(0, 4).map((game, i) => (
                              <motion.div
                                key={i}
                                className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-white/20 shadow-md"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ 
                                  scale: hoveredPlatform === platform.id ? 1 : 0.9, 
                                  opacity: 1 
                                }}
                                transition={{ delay: i * 0.05 }}
                              >
                                {game.cover_image && (
                                  <img 
                                    src={game.cover_image} 
                                    alt={game.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </motion.div>
                            ))}
                          </div>
                          <div className="flex-1" />
                          <motion.div 
                            className="flex items-center gap-1 text-white/80 text-sm"
                            animate={{ x: hoveredPlatform === platform.id ? 4 : 0 }}
                          >
                            <span>Udforsk</span>
                            <ChevronRight className="w-4 h-4" />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Genre Categories - Pill/Chip Design */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-2xl md:text-3xl text-foreground mb-2">Genrer</h2>
              <p className="text-muted-foreground">Udforsk spil efter din yndlingsgenre</p>
            </div>
          </div>
          
          {genres.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-dashed border-border bg-muted/20">
              <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Ingen genrer fundet.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 md:gap-4">
              {genres.map((genre, index) => {
                const IconComponent = genre.icon;
                return (
                  <motion.div
                    key={genre.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.03, duration: 0.3 }}
                  >
                    <Link
                      to={`/search?genre=${encodeURIComponent(genre.name)}`}
                      className="group flex items-center gap-3 px-5 py-3 md:px-6 md:py-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-premium"
                    >
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {genre.name}
                      </span>
                      <Badge variant="secondary" className="ml-1 bg-muted/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {formatNumber(genre.count)}
                      </Badge>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Access Section */}
        <section>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {/* New Releases */}
            <Link 
              to="/search?sort=newest"
              className="group p-6 rounded-3xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20 hover:border-success/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="font-heading text-lg text-foreground group-hover:text-success transition-colors">
                    Nye Udgivelser
                  </h3>
                  <p className="text-sm text-muted-foreground">De seneste spil</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-success text-sm font-medium">
                <span>Se alle</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* On Sale */}
            <Link 
              to="/deals"
              className="group p-6 rounded-3xl bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20 hover:border-destructive/40 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-destructive/20 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-heading text-lg text-foreground group-hover:text-destructive transition-colors">
                    Tilbud
                  </h3>
                  <p className="text-sm text-muted-foreground">Spar på dine favoritter</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-destructive text-sm font-medium">
                <span>Se tilbud</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Bestsellers */}
            <Link 
              to="/search?sort=popular"
              className="group p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-lg text-foreground group-hover:text-primary transition-colors">
                    Bestsellers
                  </h3>
                  <p className="text-sm text-muted-foreground">Mest populære spil</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-primary text-sm font-medium">
                <span>Se populære</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CategoriesPage;
