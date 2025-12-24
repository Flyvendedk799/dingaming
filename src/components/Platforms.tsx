import { Gamepad2, Monitor, Smartphone, Gamepad } from "lucide-react";

const platforms = [
  { name: "Steam", games: "1.200+ spil", icon: Monitor, color: "from-blue-500 to-blue-600" },
  { name: "PlayStation", games: "450+ spil", icon: Gamepad2, color: "from-blue-600 to-indigo-600" },
  { name: "Xbox", games: "380+ spil", icon: Gamepad, color: "from-green-500 to-green-600" },
  { name: "Nintendo", games: "280+ spil", icon: Smartphone, color: "from-red-500 to-red-600" },
];

const Platforms = () => {
  return (
    <section className="py-16 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Keys til alle platforme
          </h2>
          <p className="text-muted-foreground">
            Vi har spil til alle de store gaming platforme
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {platforms.map((platform) => (
            <a
              key={platform.name}
              href="#"
              className="group p-6 rounded-xl bg-card border border-border hover:border-success/30 hover:shadow-soft transition-all duration-300 text-center"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${platform.color} mb-4 transition-transform group-hover:scale-110`}>
                <platform.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                {platform.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {platform.games}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Platforms;
