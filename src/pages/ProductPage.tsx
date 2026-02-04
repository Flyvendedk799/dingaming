import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchKinguinProductById, KinguinProduct } from "@/lib/kinguin";
import { usePricing } from "@/lib/pricing";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, CheckCircle2, Loader2, Shield, Zap, Globe } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ProductPage = () => {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<KinguinProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const addItem = useCartStore(state => state.addItem);
  const { getPrice, formatDKK } = usePricing();

  useEffect(() => {
    const loadProduct = async () => {
      if (!handle) return;
      setIsLoading(true);
      
      // Handle is the kinguin_id
      const kinguinId = parseInt(handle);
      if (!isNaN(kinguinId)) {
        const data = await fetchKinguinProductById(kinguinId);
        setProduct(data);
      }
      setIsLoading(false);
    };
    loadProduct();
  }, [handle]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-heading text-3xl text-foreground mb-4">Produkt ikke fundet</h1>
          <Link to="/" className="text-primary hover:underline">
            Tilbage til forsiden
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const priceDKK = getPrice(product.sell_price, product.margin_percent);
  const originalPriceDKK = getPrice(product.original_price, product.margin_percent);

  const handleAddToCart = () => {
    addItem({
      variantId: `kinguin-${product.kinguin_id}`,
      title: product.name,
      quantity: 1,
      price: {
        amount: priceDKK.toString(),
        currencyCode: 'DKK'
      },
      image: product.cover_image || undefined,
      sku: `KINGUIN-${product.kinguin_id}`
    });
    
    setIsAdding(true);
    
    toast.success("Tilføjet til kurv", {
      description: product.name,
      position: "top-center"
    });
    
    setTimeout(() => setIsAdding(false), 1500);
  };

  const regionLabel = product.region_name || (product.region_id === 3 ? 'Worldwide' : 'Europe');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      

      <main className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbage til alle spil
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-xl overflow-hidden">
              {product.cover_image ? (
                <img
                  src={product.cover_image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            
            {product.screenshots && product.screenshots.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {product.screenshots.slice(0, 4).map((screenshot, i) => (
                  <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={screenshot}
                      alt={`${product.name} screenshot ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {product.platform && (
                <span className="px-3 py-1 bg-muted rounded-md text-sm font-medium">
                  {product.platform}
                </span>
              )}
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {regionLabel}
              </span>
            </div>

            <h1 className="font-heading text-3xl lg:text-4xl text-foreground mb-4">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-primary">
                {formatDKK(priceDKK)}
              </span>
              {product.original_price !== product.sell_price && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatDKK(originalPriceDKK * 1.1)}
                </span>
              )}
            </div>

            {/* Stock */}
            {product.qty > 0 && (
              <p className="text-sm text-muted-foreground mb-6">
                {product.qty <= 5 ? (
                  <span className="text-destructive">Kun {product.qty} på lager</span>
                ) : (
                  <span className="text-green-500">På lager</span>
                )}
              </p>
            )}

            {/* Add to Cart */}
            <Button
              size="lg"
              className="w-full mb-6 bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-lg"
              onClick={handleAddToCart}
              disabled={isAdding || !product.is_available}
            >
              {isAdding ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Tilføjet til kurv!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {product.is_available ? 'Tilføj til kurv' : 'Udsolgt'}
                </>
              )}
            </Button>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" />
                <span>Levering på 30 sekunder</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span>Pengene tilbage garanti</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Officiel key</span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="font-heading text-xl text-foreground mb-3">Beskrivelse</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Genres */}
            {product.genres && product.genres.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-foreground mb-2">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {product.genres.map((genre, i) => (
                    <span key={i} className="px-3 py-1 bg-muted rounded-full text-sm">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductPage;
