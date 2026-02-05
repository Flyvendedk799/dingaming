import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CaseItem {
  id: string;
  name: string;
  price: number;
  image: string | null;
  dropPercentage: number;
}

interface CaseOpeningAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  items: CaseItem[];
  wonItem: CaseItem | null;
  caseName: string;
  shardsSpent: number;
}

const CaseOpeningAnimation = ({
  isOpen,
  onClose,
  items,
  wonItem,
  caseName,
  shardsSpent,
}: CaseOpeningAnimationProps) => {
  const [phase, setPhase] = useState<'spinning' | 'slowing' | 'reveal'>('spinning');
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Create extended items array for continuous spinning effect
  const extendedItems = [...items, ...items, ...items, ...items, ...items];
  const itemWidth = 180;
  const gap = 12;
  const totalItemWidth = itemWidth + gap;
  
  useEffect(() => {
    if (!isOpen || !wonItem) return;
    
    setPhase('spinning');
    setCurrentIndex(0);
    
    // Find the index of the won item in the middle section
    const wonItemIndex = items.findIndex(item => item.id === wonItem.id);
    const targetIndex = items.length * 2 + wonItemIndex; // Middle of extended array
    
    // Fast spinning phase
    let spinCount = 0;
    const spinInterval = setInterval(() => {
      setCurrentIndex(prev => prev + 1);
      spinCount++;
      
      // After spinning through ~2 full sets, start slowing
      if (spinCount > items.length * 2) {
        clearInterval(spinInterval);
        setPhase('slowing');
        
        // Slow down animation to target
        let slowIndex = items.length * 2;
        const slowInterval = setInterval(() => {
          slowIndex++;
          setCurrentIndex(slowIndex);
          
          if (slowIndex >= targetIndex) {
            clearInterval(slowInterval);
            setTimeout(() => setPhase('reveal'), 300);
          }
        }, 150 + (slowIndex - items.length * 2) * 20); // Gradually slow down
      }
    }, 50);
    
    return () => clearInterval(spinInterval);
  }, [isOpen, wonItem, items]);
  
  if (!isOpen) return null;
  
  const translateX = -currentIndex * totalItemWidth + (containerRef.current?.offsetWidth || 400) / 2 - itemWidth / 2;
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        
        <div className="w-full max-w-4xl mx-auto px-4">
          {/* Case name */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="font-heading text-3xl text-white mb-2">{caseName}</h2>
            <p className="text-muted-foreground">
              {phase === 'reveal' ? 'Du vandt!' : 'Åbner case...'}
            </p>
          </motion.div>
          
          {/* Spinning carousel */}
          <div className="relative">
            {/* Center indicator */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-primary z-20 -translate-x-1/2" />
            <div className="absolute left-1/2 -top-4 -translate-x-1/2 z-20">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[16px] border-transparent border-t-primary" />
            </div>
            
            {/* Gradient overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
            
            {/* Items container */}
            <div 
              ref={containerRef}
              className="overflow-hidden py-4"
            >
              <motion.div
                className="flex gap-3"
                animate={{ 
                  x: translateX,
                  transition: { 
                    duration: phase === 'spinning' ? 0.05 : phase === 'slowing' ? 0.15 : 0.3,
                    ease: phase === 'reveal' ? 'easeOut' : 'linear'
                  }
                }}
              >
                {extendedItems.map((item, index) => {
                  const isWinner = phase === 'reveal' && wonItem && item.id === wonItem.id && 
                    Math.abs(index - currentIndex) < 1;
                  
                  return (
                    <motion.div
                      key={`${item.id}-${index}`}
                      className={`
                        flex-shrink-0 w-[180px] rounded-xl overflow-hidden border-2 transition-all duration-300
                        ${isWinner 
                          ? 'border-primary shadow-[0_0_30px_rgba(var(--primary),0.5)] scale-110' 
                          : 'border-border/50'
                        }
                      `}
                      style={{ 
                        background: isWinner 
                          ? 'linear-gradient(135deg, hsl(var(--primary)/0.2), hsl(var(--primary)/0.05))' 
                          : 'hsl(var(--card))'
                      }}
                    >
                      <div className="aspect-[3/4] relative">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Rarity indicator */}
                        <div 
                          className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium
                            ${item.dropPercentage < 5 ? 'bg-yellow-500/90 text-black' : 
                              item.dropPercentage < 20 ? 'bg-purple-500/90 text-white' : 
                              'bg-blue-500/90 text-white'
                            }
                          `}
                        >
                          {item.dropPercentage.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-primary font-semibold">
                          {item.price.toFixed(2)} DKK
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
          
          {/* Win reveal */}
          <AnimatePresence>
            {phase === 'reveal' && wonItem && (
              <motion.div
                className="mt-8 text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/20 border border-primary/50 mb-4">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span className="text-primary font-semibold">Du vandt!</span>
                </div>
                
                <h3 className="font-heading text-2xl text-white mb-2">{wonItem.name}</h3>
                <p className="text-primary text-xl font-bold mb-4">
                  {wonItem.price.toFixed(2)} DKK værdi
                </p>
                
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="border-border"
                  >
                    Luk
                  </Button>
                  <Button
                    onClick={onClose}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Åben igen
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CaseOpeningAnimation;
