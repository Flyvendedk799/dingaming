import { Gamepad2, MonitorPlay, Joystick, Smartphone } from "lucide-react";

const platforms = [
  {
    name: "Steam",
    icon: MonitorPlay,
    games: "10.000+",
    color: "from-blue-500 to-blue-700",
  },
  {
    name: "PlayStation",
    icon: Gamepad2,
    games: "3.000+",
    color: "from-blue-600 to-indigo-700",
  },
  {
    name: "Xbox",
    icon: Joystick,
    games: "2.500+",
    color: "from-green-500 to-green-700",
  },
  {
    name: "Nintendo",
    icon: Smartphone,
    games: "1.500+",
    color: "from-red-500 to-red-700",
  },
];

const PlatformShowcase = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-dark" />
      
      <div className="relative container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Alle dine <span className="text-gradient">yndlingsplatforme</span>
          </h2>
          <p className="text-muted-foreground">
            Vi har game keys til alle de store gaming platforme
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {platforms.map((platform, index) => (
            <div
              key={platform.name}
              className="group relative p-6 rounded-2xl bg-card border border-border/50 text-center hover:border-primary/50 transition-all duration-500 hover:transform hover:-translate-y-2 hover:shadow-neon animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon with gradient background */}
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${platform.color} mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <platform.icon className="w-10 h-10 text-foreground" />
              </div>
              
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {platform.name}
              </h3>
              <p className="text-primary font-semibold">
                {platform.games} spil
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformShowcase;
