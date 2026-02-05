import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Gamepad2, Monitor, Laptop, Joystick, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PlatformCategory {
  id: string;
  name: string;
  description: string;
  icon: typeof Monitor;
  color: string;
  borderColor: string;
  games: number;
}

interface GenreCategory {
  name: string;
  count: number;
}

const platformConfig: Record<string, { icon: typeof Monitor; color: string; borderColor: string; description: string }> = {
  'Steam': { icon: Monitor, color: 'from-blue-500/20 to-blue-600/10', borderColor: 'border-blue-500/30', description: 'PC-spil til Steam platformen' },
  'PlayStation': { icon: Gamepad2, color: 'from-indigo-500/20 to-indigo-600/10', borderColor: 'border-indigo-500/30', description: 'Spil til PlayStation 4 & 5' },
  'Xbox': { icon: Joystick, color: 'from-green-500/20 to-green-600/10', borderColor: 'border-green-500/30', description: 'Spil til Xbox One & Series X|S' },
  'Nintendo': { icon: Gamepad2, color: 'from-red-500/20 to-red-600/10', borderColor: 'border-red-500/30', description: 'Spil til Nintendo Switch' },
  'PC': { icon: Laptop, color: 'from-purple-500/20 to-purple-600/10', borderColor: 'border-purple-500/30', description: 'Andre PC-spil og platforme' },
  'Origin': { icon: Monitor, color: 'from-orange-500/20 to-orange-600/10', borderColor: 'border-orange-500/30', description: 'EA-spil og Origin keys' },
  'Uplay': { icon: Monitor, color: 'from-cyan-500/20 to-cyan-600/10', borderColor: 'border-cyan-500/30', description: 'Ubisoft-spil og Uplay keys' },
  'Battle.net': { icon: Monitor, color: 'from-sky-500/20 to-sky-600/10', borderColor: 'border-sky-500/30', description: 'Blizzard-spil' },
  'GOG': { icon: Monitor, color: 'from-violet-500/20 to-violet-600/10', borderColor: 'border-violet-500/30', description: 'DRM-frie spil fra GOG' },
  'Epic Games': { icon: Monitor, color: 'from-gray-500/20 to-gray-600/10', borderColor: 'border-gray-500/30', description: 'Epic Games Store keys' },
};

const CategoriesPage = () => {
  const [platforms, setPlatforms] = useState<PlatformCategory[]>([]);
  const [genres, setGenres] = useState<GenreCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      // Fetch all products to calculate counts
      const { data: products, error } = await supabase
        .from('kinguin_products')
        .select('platform, genres')
        .eq('is_available', true);

      if (error) throw error;

      // Count by platform
      const platformCounts: Record<string, number> = {};
      const genreCounts: Record<string, number> = {};

      products?.forEach((product) => {
        // Count platforms
        if (product.platform) {
          platformCounts[product.platform] = (platformCounts[product.platform] || 0) + 1;
        }

        // Count genres
        if (product.genres && Array.isArray(product.genres)) {
          product.genres.forEach((genre: string) => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          });
        }
      });

      // Convert to arrays with config
      const platformCategories: PlatformCategory[] = Object.entries(platformCounts)
        .map(([name, count]) => {
          const config = platformConfig[name] || {
            icon: Monitor,
            color: 'from-gray-500/20 to-gray-600/10',
            borderColor: 'border-gray-500/30',
            description: `${name} spil`
          };
          return {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            description: config.description,
            icon: config.icon,
            color: config.color,
            borderColor: config.borderColor,
            games: count
          };
        })
        .sort((a, b) => b.games - a.games);

      const genreCategories: GenreCategory[] = Object.entries(genreCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12); // Top 12 genres

      setPlatforms(platformCategories);
      setGenres(genreCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            Kategorier
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Udforsk vores {platforms.reduce((sum, p) => sum + p.games, 0)} spil efter platform eller genre
          </p>
        </motion.div>

        {/* Platform Categories */}
        <section className="mb-16">
          <h2 className="font-heading text-2xl text-foreground mb-8">Platforme</h2>
          {platforms.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Ingen platforme fundet. Synkroniser produkter først.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {platforms.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <Link 
                    to={`/search?platform=${encodeURIComponent(category.name)}`}
                    className={`group block p-6 rounded-2xl bg-gradient-to-br ${category.color} border ${category.borderColor} hover:border-primary/50 transition-all duration-300 hover:-translate-y-1`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center">
                        <category.icon className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {category.games} spil
                      </span>
                    </div>
                    <h3 className="font-heading text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {category.description}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Genre Categories */}
        <section>
          <h2 className="font-heading text-2xl text-foreground mb-8">Genrer</h2>
          {genres.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Ingen genrer fundet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {genres.map((genre, index) => (
                <motion.div
                  key={genre.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                >
                  <Link
                    to={`/search?genre=${encodeURIComponent(genre.name)}`}
                    className="group block p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {genre.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {genre.count}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CategoriesPage;
