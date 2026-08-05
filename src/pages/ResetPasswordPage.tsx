import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Logo from "@/components/Logo";

/**
 * Lands here from the password-recovery email link. Supabase establishes a
 * recovery session from the URL fragment, which fires a PASSWORD_RECOVERY
 * auth event; we then let the user set a new password via updateUser.
 */
const ResetPasswordPage = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // A valid recovery link produces a session; reflect that so we can guide
    // the user if they opened the page without one.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Adgangskoden skal være mindst 6 tegn");
      return;
    }
    if (password !== confirm) {
      toast.error("Adgangskoderne matcher ikke");
      return;
    }

    setIsLoading(true);
    const { error } = await updatePassword(password);
    setIsLoading(false);

    if (error) {
      toast.error("Kunne ikke opdatere adgangskode", { description: error.message });
      return;
    }
    setDone(true);
    toast.success("Adgangskode opdateret!");
    setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
      </div>

      <motion.div
        className="w-full max-w-md relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Logo size={40} />

        </Link>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-14 h-14 text-success mx-auto" />
              <h1 className="font-heading text-2xl text-foreground">Adgangskode opdateret</h1>
              <p className="text-muted-foreground">Du sendes til login...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="font-heading text-2xl text-foreground mb-2">Vælg ny adgangskode</h1>
                <p className="text-muted-foreground">
                  {ready
                    ? "Indtast din nye adgangskode herunder."
                    : "Åbn linket fra din nulstillings-email for at fortsætte."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Ny adgangskode</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-background border-border"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-foreground">Bekræft adgangskode</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirm"
                      type={showPassword ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 bg-background border-border"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  disabled={isLoading || !ready}
                >
                  {isLoading ? "Opdaterer..." : (<>Opdater adgangskode<ArrowRight className="w-5 h-5 ml-2" /></>)}
                </Button>
              </form>

              <p className="text-center text-muted-foreground mt-6">
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Tilbage til login
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
