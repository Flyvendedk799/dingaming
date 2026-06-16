import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User as UserIcon, Mail, Lock, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AccountPage = () => {
  const { user, signOut, updatePassword } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const fallback = (user.user_metadata as { display_name?: string })?.display_name ?? "";
        setDisplayName(data?.display_name ?? fallback);
      });
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", user.id);
    setSavingProfile(false);
    if (error) {
      toast.error("Kunne ikke gemme", { description: error.message });
    } else {
      toast.success("Profil opdateret");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Adgangskoden skal være mindst 6 tegn");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Adgangskoderne matcher ikke");
      return;
    }
    setSavingPassword(true);
    const { error } = await updatePassword(newPassword);
    setSavingPassword(false);
    if (error) {
      toast.error("Kunne ikke ændre adgangskode", { description: error.message });
    } else {
      toast.success("Adgangskode ændret");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-32 pb-16 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <UserIcon className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Min konto</h1>
        </div>

        {/* Account info */}
        <section className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-heading text-lg mb-4">Profil</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Mail className="w-4 h-4" /> {user?.email}
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Visningsnavn</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dit navn"
              />
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Gem ændringer
            </Button>
          </form>
        </section>

        {/* Change password */}
        <section className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-heading text-lg mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Skift adgangskode
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Ny adgangskode</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bekræft adgangskode</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" disabled={savingPassword} variant="outline">
              {savingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Opdater adgangskode
            </Button>
          </form>
        </section>

        <Button variant="ghost" onClick={handleSignOut} className="text-destructive hover:text-destructive">
          <LogOut className="w-4 h-4 mr-2" /> Log ud
        </Button>
      </main>
      <Footer />
    </div>
  );
};

export default AccountPage;
