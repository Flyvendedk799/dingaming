import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, Package, ChevronLeft, Loader2, Info, 
  Eye, Lock, AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useShardBalance } from '@/hooks/useShards';
import { useCases, useOpenCase, OpenCaseResult } from '@/hooks/useCases';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CaseOpeningAnimation from '@/components/games/CaseOpeningAnimation';

const CasesPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: balance } = useShardBalance();
  const { data: cases, isLoading: casesLoading } = useCases();
  const openCase = useOpenCase();
  
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [previewCase, setPreviewCase] = useState<string | null>(null);
  const [openingResult, setOpeningResult] = useState<OpenCaseResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const formatShards = (shards: number) => {
    return new Intl.NumberFormat('da-DK').format(shards);
  };

  const handleOpenCase = async (caseId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const caseData = cases?.find(c => c.id === caseId);
    if (!caseData) return;

    if ((balance?.balance || 0) < caseData.calculated_price) {
      return;
    }

    setSelectedCase(caseId);
    setIsAnimating(true);

    try {
      const result = await openCase.mutateAsync(caseId);
      setOpeningResult(result);
    } catch (error) {
      setIsAnimating(false);
      setSelectedCase(null);
    }
  };

  const handleCloseAnimation = () => {
    setIsAnimating(false);
    setOpeningResult(null);
    setSelectedCase(null);
  };

  const currentCase = cases?.find(c => c.id === selectedCase);
  const previewCaseData = cases?.find(c => c.id === previewCase);

  if (authLoading || casesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back link */}
        <Link 
          to="/club" 
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Tilbage til Club
        </Link>

        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <span className="text-primary font-medium">Loot Cases</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-3">
            Åben Cases
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Brug dine Shards til at åbne cases og vind spil! Hver case indeholder 
            forskellige spil med forskellige drop rates.
          </p>
        </motion.div>

        {/* Balance display */}
        {user && (
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-card border border-border">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-foreground font-medium">Din balance:</span>
              <span className="text-primary font-bold text-xl">
                {formatShards(balance?.balance || 0)}
              </span>
              <span className="text-muted-foreground">Shards</span>
            </div>
          </motion.div>
        )}

        {/* Cases grid */}
        {cases && cases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((caseData, index) => {
              const canAfford = (balance?.balance || 0) >= caseData.calculated_price;
              const itemCount = caseData.items?.length || 0;
              
              return (
                <motion.div
                  key={caseData.id}
                  className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Case image */}
                  <div className="aspect-video relative overflow-hidden">
                    {caseData.image_url ? (
                      <img
                        src={caseData.image_url}
                        alt={caseData.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Package className="w-16 h-16 text-primary/50" />
                      </div>
                    )}
                    
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Item count badge */}
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm">
                      {itemCount} spil
                    </div>
                    
                    {/* Preview button */}
                    <button
                      onClick={() => setPreviewCase(caseData.id)}
                      className="absolute top-3 left-3 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Case info */}
                  <div className="p-5">
                    <h3 className="font-heading text-xl text-foreground mb-2">
                      {caseData.name}
                    </h3>
                    {caseData.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {caseData.description}
                      </p>
                    )}
                    
                    {/* Price and action */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Pris</p>
                        <p className="text-primary font-bold text-lg">
                          {formatShards(caseData.calculated_price)} Shards
                        </p>
                      </div>
                      
                      {user ? (
                        <Button
                          onClick={() => handleOpenCase(caseData.id)}
                          disabled={!canAfford || openCase.isPending}
                          className={`${
                            canAfford 
                              ? 'bg-primary hover:bg-primary/90' 
                              : 'bg-muted text-muted-foreground cursor-not-allowed'
                          }`}
                        >
                          {openCase.isPending && selectedCase === caseData.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : !canAfford ? (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              Ikke nok
                            </>
                          ) : (
                            <>
                              <Package className="w-4 h-4 mr-2" />
                              Åben
                            </>
                          )}
                        </Button>
                      ) : (
                        <Link to="/login">
                          <Button className="bg-primary hover:bg-primary/90">
                            Log ind
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Ingen cases tilgængelige</h3>
            <p className="text-muted-foreground">
              Der er ingen cases tilgængelige lige nu. Kom tilbage senere!
            </p>
          </div>
        )}

        {/* Info section */}
        <motion.div
          className="mt-12 p-6 rounded-2xl bg-card border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Info className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Sådan virker det</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Hver case indeholder forskellige spil med forskellige drop rates</li>
                <li>• Prisen beregnes ud fra den gennemsnitlige værdi af indholdet</li>
                <li>• Når du åbner en case, trækkes Shards automatisk fra din balance</li>
                <li>• Dit vundne spil vises efter åbningen (bemærk: dette er til underholdning - du modtager ikke det fysiske spil)</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />

      {/* Preview dialog */}
      <Dialog open={!!previewCase} onOpenChange={() => setPreviewCase(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewCaseData?.name}</DialogTitle>
            <DialogDescription>
              Mulige gevinster i denne case
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {previewCaseData?.items?.sort((a, b) => a.drop_percentage - b.drop_percentage).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 border border-border"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  {item.kinguin_products.cover_image ? (
                    <img
                      src={item.kinguin_products.cover_image}
                      alt={item.kinguin_products.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {item.kinguin_products.name}
                  </p>
                  <p className="text-sm text-primary font-semibold">
                    {item.kinguin_products.sell_price.toFixed(2)} DKK
                  </p>
                </div>
                
                <div 
                  className={`px-3 py-1 rounded-full text-sm font-medium
                    ${item.drop_percentage < 5 
                      ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' 
                      : item.drop_percentage < 20 
                        ? 'bg-purple-500/20 text-purple-500 border border-purple-500/30'
                        : 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                    }
                  `}
                >
                  {item.drop_percentage.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Opening animation */}
      {isAnimating && currentCase && openingResult && (
        <CaseOpeningAnimation
          isOpen={isAnimating}
          onClose={handleCloseAnimation}
          items={openingResult.allItems}
          wonItem={openingResult.wonItem}
          caseName={currentCase.name}
          shardsSpent={openingResult.shardsSpent}
        />
      )}
    </div>
  );
};

export default CasesPage;
