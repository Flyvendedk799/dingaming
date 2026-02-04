import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchKinguinProductById, KinguinProduct } from "@/lib/kinguin";
import { getShopifyVariantId } from "@/lib/shopify";
import { usePricing } from "@/lib/pricing";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ShoppingCart, 
  CheckCircle2, 
  Loader2, 
  Shield, 
  Zap, 
  Globe, 
  Clock,
  Tag,
  ChevronLeft,
  ChevronRight,
  X,
  Gamepad2,
  Calendar,
  Package
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ProductPage = () => {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<KinguinProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const addItem = useCartStore(state => state.addItem);
  const { getPrice, formatDKK } = usePricing();

  useEffect(() => {
    const loadProduct = async () => {
      if (!handle) return;
      setIsLoading(true);
      
      const kinguinId = parseInt(handle);
      if (!isNaN(kinguinId)) {
        const data = await fetchKinguinProductById(kinguinId);
        setProduct(data);
      }
      setIsLoading(false);
    };
    loadProduct();
  }, [handle]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [handle]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <span className="text-muted-foreground">Indlæser produkt...</span>
        </motion.div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="font-heading text-3xl text-foreground mb-4">Produkt ikke fundet</h1>
            <p className="text-muted-foreground mb-6">Det produkt du leder efter eksisterer ikke eller er blevet fjernet.</p>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Tilbage til forsiden
              </Button>
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const priceDKK = getPrice(product.sell_price, product.margin_percent);
  const originalPriceDKK = getPrice(product.original_price, product.margin_percent);
  const discountPercent = product.original_price > product.sell_price 
    ? Math.round((1 - product.sell_price / product.original_price) * 100)
    : 0;
  
  const allImages = [
    product.cover_image,
    ...(product.screenshots || [])
  ].filter(Boolean) as string[];

  const handleAddToCart = async () => {
    setIsAdding(true);
    
    const shopifyVariantId = await getShopifyVariantId(product.kinguin_id);
    
    if (!shopifyVariantId) {
      toast.error("Kunne ikke tilføje til kurv", {
        description: "Produktet er ikke tilgængeligt i butikken endnu.",
        position: "top-center"
      });
      setIsAdding(false);
      return;
    }
    
    addItem({
      variantId: shopifyVariantId,
      title: product.name,
      quantity: 1,
      price: {
        amount: priceDKK.toString(),
        currencyCode: 'DKK'
      },
      image: product.cover_image || undefined,
      sku: `KINGUIN-${product.kinguin_id}`
    });
    
    toast.success("Tilføjet til kurv", {
      description: product.name,
      position: "top-center"
    });
    
    setTimeout(() => setIsAdding(false), 1500);
  };

  const regionLabel = product.region_name || (product.region_id === 3 ? 'Worldwide' : 'Europe');

  const nextImage = () => setSelectedImage((prev) => (prev + 1) % allImages.length);
  const prevImage = () => setSelectedImage((prev) => (prev - 1 + allImages.length) % allImages.length);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section with Cover Image */}
      <div className="relative h-[40vh] lg:h-[50vh] overflow-hidden">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {product.cover_image ? (
            <img
              src={product.cover_image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10" />
          )}
        </motion.div>
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
        
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute top-6 left-4 lg:left-8 z-10"
        >
          <Link to="/">
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Tilbage</span>
            </Button>
          </Link>
        </motion.div>

        {/* Badges overlay */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute bottom-0 left-0 right-0 p-4 lg:p-8"
        >
          <div className="container mx-auto">
            <div className="flex flex-wrap items-center gap-2">
              {product.platform && (
                <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-foreground border-border/50">
                  <Gamepad2 className="w-3 h-3 mr-1" />
                  {product.platform}
                </Badge>
              )}
              <Badge className="bg-primary/90 backdrop-blur-sm text-primary-foreground border-0">
                <Globe className="w-3 h-3 mr-1" />
                {regionLabel}
              </Badge>
              {discountPercent > 0 && (
                <Badge variant="destructive" className="backdrop-blur-sm">
                  <Tag className="w-3 h-3 mr-1" />
                  -{discountPercent}%
                </Badge>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <main className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Left Column - Images, Description & Details */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-7 xl:col-span-8 space-y-8"
          >
            {/* Title - Mobile & Desktop */}
            <div className="lg:hidden">
              <h1 className="font-heading text-2xl sm:text-3xl text-foreground leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Main Image */}
            <div 
              className="relative aspect-video bg-card rounded-2xl overflow-hidden border border-border/50 cursor-pointer group"
              onClick={() => setIsLightboxOpen(true)}
            >
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                src={allImages[selectedImage] || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Image navigation */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Image counter */}
              {allImages.length > 1 && (
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium">
                  {selectedImage + 1} / {allImages.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {allImages.map((img, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === i 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border/50 hover:border-primary/50'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            )}

            {/* Description Section */}
            {product.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card rounded-2xl border border-border/50 p-6 lg:p-8"
              >
                <h2 className="font-heading text-xl lg:text-2xl text-foreground mb-4 flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                  Om spillet
                </h2>
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm lg:text-base">
                    {product.description}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Product Specifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card rounded-2xl border border-border/50 p-6 lg:p-8"
            >
              <h2 className="font-heading text-xl lg:text-2xl text-foreground mb-6 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Produktdetaljer
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                {product.platform && (
                  <div className="p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Platform</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{product.platform}</p>
                  </div>
                )}
                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Region</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{regionLabel}</p>
                </div>
                {product.release_date && (
                  <div className="p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Udgivelse</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(product.release_date).toLocaleDateString('da-DK', { year: 'numeric', month: 'long' })}
                    </p>
                  </div>
                )}
                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Levering</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">Øjeblikkelig</p>
                </div>
              </div>

              {/* Genres */}
              {product.genres && product.genres.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {product.genres.map((genre, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1.5 text-xs">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Right Column - Sticky Purchase Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-5 xl:col-span-4"
          >
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Title - Desktop only */}
              <div className="hidden lg:block">
                <h1 className="font-heading text-2xl xl:text-3xl text-foreground leading-tight mb-2">
                  {product.name}
                </h1>
                {product.genres && product.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {product.genres.slice(0, 3).map((genre, i) => (
                      <Badge key={i} variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-2xl border border-border/50 p-6 space-y-5"
              >
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl xl:text-4xl font-bold text-primary">
                      {formatDKK(priceDKK)}
                    </span>
                    {product.original_price !== product.sell_price && (
                      <span className="text-lg text-muted-foreground line-through">
                        {formatDKK(originalPriceDKK * 1.1)}
                      </span>
                    )}
                  </div>
                  {discountPercent > 0 && (
                    <Badge variant="destructive" className="mt-2">
                      Spar {discountPercent}%
                    </Badge>
                  )}
                </div>

                {/* Stock status */}
                <div className="flex items-center gap-2 py-2 px-3 bg-muted/30 rounded-lg">
                  {product.qty > 0 ? (
                    <>
                      <span className={`w-2 h-2 rounded-full ${product.qty <= 5 ? 'bg-destructive animate-pulse' : 'bg-success'}`} />
                      <span className={`text-sm font-medium ${product.qty <= 5 ? 'text-destructive' : 'text-success'}`}>
                        {product.qty <= 5 ? `Kun ${product.qty} tilbage` : 'På lager - klar til levering'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Udsolgt</span>
                    </>
                  )}
                </div>

                {/* Add to Cart Button */}
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    className="w-full h-12 text-base font-semibold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleAddToCart}
                    disabled={isAdding || !product.is_available}
                  >
                    {isAdding ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Tilføjet!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        {product.is_available ? 'Tilføj til kurv' : 'Udsolgt'}
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.div>

              {/* Trust Badges - Compact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card rounded-2xl border border-border/50 p-5 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Øjeblikkelig levering</p>
                    <p className="text-xs text-muted-foreground">Din key på under 30 sekunder</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Pengene tilbage garanti</p>
                    <p className="text-xs text-muted-foreground">Fuld refundering ved problemer</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">100% officielle keys</p>
                    <p className="text-xs text-muted-foreground">Direkte fra autoriserede partnere</p>
                  </div>
                </div>
              </motion.div>

              {/* Quick Info Tags */}
              <div className="flex flex-wrap gap-2">
                {product.platform && (
                  <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                    <Gamepad2 className="w-3.5 h-3.5" />
                    {product.platform}
                  </Badge>
                )}
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                  <Globe className="w-3.5 h-3.5" />
                  {regionLabel}
                </Badge>
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                  <Package className="w-3.5 h-3.5" />
                  Digital Key
                </Badge>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 w-12 h-12 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={allImages[selectedImage]}
              alt={product.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Dots indicator */}
            {allImages.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(i); }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      selectedImage === i ? 'bg-primary w-6' : 'bg-muted-foreground/50 hover:bg-muted-foreground'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default ProductPage;