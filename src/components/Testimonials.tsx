import { Quote, Star, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

const testimonials = [
  {
    name: "Mikkel H.",
    rating: 5,
    text: "Utrolig hurtig levering! Havde min Steam key i indbakken på under et minut. Bedste oplevelse med at købe spil online.",
    verified: true,
    game: "Galactic Warfare 2077",
    date: "For 2 dage siden"
  },
  {
    name: "Sarah L.",
    rating: 5,
    text: "Sparede over 200 kr på FIFA. Nøglen virkede med det samme og aktivering var super nem. Kan varmt anbefales!",
    verified: true,
    game: "Pro Football 25",
    date: "For 5 dage siden"
  },
  {
    name: "Anders K.",
    rating: 5,
    text: "Havde et lille problem med min key, men supporten løste det på under 10 minutter. Fantastisk kundeservice!",
    verified: true,
    game: "Shadow Warrior: Legends",
    date: "For 1 uge siden"
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Star className="w-4 h-4 text-accent fill-accent" />
            <span className="text-sm font-semibold text-accent">4.9/5 på Trustpilot</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Hvad vores kunder siger
          </h2>
          <p className="text-muted-foreground text-lg">
            Over 50.000 tilfredse kunder har købt deres spil hos os
          </p>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-card rounded-xl border border-border p-6 hover:border-success/30 hover:shadow-soft transition-all duration-300"
            >
              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-accent fill-accent" />
                ))}
              </div>

              {/* Quote */}
              <Quote className="w-8 h-8 text-muted/50 mb-3" />
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground block">{testimonial.name}</span>
                      <span className="text-xs text-muted-foreground">{testimonial.date}</span>
                    </div>
                  </div>
                  {testimonial.verified && (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verificeret
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">Købte: {testimonial.game}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button variant="outline" className="group">
            Se alle anmeldelser på Trustpilot
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
