import { Quote, Star, CheckCircle2 } from "lucide-react";

const testimonials = [
  {
    name: "Mikkel H.",
    rating: 5,
    text: "Utrolig hurtig levering! Havde min Steam key i indbakken på under et minut. Klart den bedste oplevelse jeg har haft med at købe spil online.",
    verified: true,
    game: "Galactic Warfare 2077"
  },
  {
    name: "Sarah L.",
    rating: 5,
    text: "Sparede over 200 kr på FIFA 25. Nøglen virkede med det samme. Kan varmt anbefales!",
    verified: true,
    game: "Pro Football 25"
  },
  {
    name: "Anders K.",
    rating: 5,
    text: "Havde et problem med min key, men supporten løste det på 10 minutter. Fantastisk kundeservice.",
    verified: true,
    game: "Shadow Warrior: Legends"
  },
];

const Testimonials = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
            Hvad vores kunder siger
          </h2>
          <p className="text-muted-foreground">
            Over 50.000 tilfredse kunder har købt deres spil hos os
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-card rounded-xl border border-border p-6">
              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-accent fill-accent" />
                ))}
              </div>

              {/* Quote */}
              <Quote className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-foreground mb-4 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{testimonial.name}</span>
                    {testimonial.verified && (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verificeret køb
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Købte: {testimonial.game}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
