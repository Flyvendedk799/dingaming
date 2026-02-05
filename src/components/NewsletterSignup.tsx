import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewsletterSignupProps {
  source?: string;
  variant?: "default" | "compact" | "inline";
  className?: string;
}

const NewsletterSignup = ({ source = "footer", variant = "default", className = "" }: NewsletterSignupProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Indtast en gyldig email adresse");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ 
          email: email.toLowerCase().trim(),
          source,
          is_active: true
        });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation - email already exists
          toast.info("Denne email er allerede tilmeldt!");
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        toast.success("Du er nu tilmeldt vores nyhedsbrev! 🎉");
        setEmail("");
      }
    } catch (error) {
      console.error("Newsletter signup error:", error);
      toast.error("Der opstod en fejl. Prøv igen senere.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed && variant !== "inline") {
    return (
      <div className={`text-center ${className}`}>
        <div className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-success/10 border border-success/20">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <span className="text-success font-medium">Du er tilmeldt!</span>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Din email"
            disabled={isLoading}
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
        </div>
        <Button type="submit" size="sm" disabled={isLoading} className="shrink-0">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tilmeld"}
        </Button>
      </form>
    );
  }

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 ${className}`}>
        <div className="relative flex-1">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Din email adresse"
            disabled={isLoading}
            className="w-full h-12 pl-12 pr-4 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
        </div>
        <Button type="submit" size="lg" disabled={isLoading} className="group shrink-0">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Tilmeld
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>
    );
  }

  // Default variant
  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <div className="relative flex-1">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Din email adresse"
            disabled={isLoading}
            className="w-full h-12 pl-12 pr-4 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
        </div>
        <Button type="submit" size="lg" disabled={isLoading} className="group bg-primary text-primary-foreground hover:bg-primary/90">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Tilmeld
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>
      <p className="mt-4 text-xs text-muted-foreground flex items-center justify-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Ingen spam. Afmeld når som helst.
      </p>
    </div>
  );
};

export default NewsletterSignup;
