import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { motion } from "framer-motion";
import { Gamepad2, Monitor, Laptop, Joystick } from "lucide-react";

const categories = [
  {
    id: "steam",
    name: "Steam Keys",
    description: "PC-spil til Steam platformen",
    icon: Monitor,
    color: "from-blue-500/20 to-blue-600/10",
    borderColor: "border-blue-500/30",
    games: 150,
  },
  {
    id: "playstation",
    name: "PlayStation",
    description: "Spil til PlayStation 4 & 5",
    icon: Gamepad2,
    color: "from-indigo-500/20 to-indigo-600/10",
    borderColor: "border-indigo-500/30",
    games: 85,
  },
  {
    id: "xbox",
    name: "Xbox",
    description: "Spil til Xbox One & Series X|S",
    icon: Joystick,
    color: "from-green-500/20 to-green-600/10",
    borderColor: "border-green-500/30",
    games: 72,
  },
  {
    id: "nintendo",
    name: "Nintendo Switch",
    description: "Spil til Nintendo Switch",
    icon: Gamepad2,
    color: "from-red-500/20 to-red-600/10",
    borderColor: "border-red-500/30",
    games: 45,
  },
  {
    id: "pc",
    name: "PC Games",
    description: "Andre PC-spil og platforme",
    icon: Laptop,
    color: "from-purple-500/20 to-purple-600/10",
    borderColor: "border-purple-500/30",
    games: 120,
  },
  {
    id: "origin",
    name: "EA / Origin",
    description: "EA-spil og Origin keys",
    icon: Monitor,
    color: "from-orange-500/20 to-orange-600/10",
    borderColor: "border-orange-500/30",
    games: 38,
  },
];

const genres = [
  { name: "Action", count: 124 },
  { name: "Adventure", count: 89 },
  { name: "RPG", count: 76 },
  { name: "Sport", count: 45 },
  { name: "Racing", count: 32 },
  { name: "Simulation", count: 28 },
  { name: "Strategy", count: 54 },
  { name: "Indie", count: 67 },
];

const CategoriesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="fixed top-24 right-4 z-50">
        <CartDrawer />
      </div>

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
            Udforsk vores spil efter platform eller genre
          </p>
        </motion.div>

        {/* Platform Categories */}
        <section className="mb-16">
          <h2 className="font-heading text-2xl text-foreground mb-8">Platforme</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <Link 
                  to={`/search?q=${category.name}`}
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
        </section>

        {/* Genre Categories */}
        <section>
          <h2 className="font-heading text-2xl text-foreground mb-8">Genrer</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {genres.map((genre, index) => (
              <motion.div
                key={genre.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
              >
                <Link
                  to={`/search?q=${genre.name}`}
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
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CategoriesPage;