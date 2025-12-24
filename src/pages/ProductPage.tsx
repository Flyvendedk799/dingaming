import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProductByHandle, CartItem, ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, CheckCircle2, Loader2, Shield, Zap } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";

const ProductPage = () => {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    const loadProduct = async () => {
      if (!handle) return;
      setIsLoading(true);
      const data = await fetchProductByHandle(handle);
      setProduct(data);
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

  const selectedVariant = product.variants.edges[selectedVariantIndex]?.node;
  const images = product.images.edges;
  const price = parseFloat(selectedVariant?.price.amount || "0");
  const currency = selectedVariant?.price.currencyCode || "DKK";

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    const shopifyProduct: ShopifyProduct = {
      node: product
    };

    const cartItem: CartItem = {
      product: shopifyProduct,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions || []
    };
    
    addItem(cartItem);
    setIsAdding(true);
    
    toast.success("Tilføjet til kurv", {
      description: product.title,
      position: "top-center"
    });
    
    setTimeout(() => setIsAdding(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Fixed cart button */}
      <div className="fixed top-24 right-4 z-50">
        <CartDrawer />
      </div>

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
              {images[0]?.node ? (
                <img
                  src={images[0].node.url}
                  alt={images[0].node.altText || product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((img: any, i: number) => (
                  <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={img.node.url}
                      alt={img.node.altText || `${product.title} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="font-heading text-3xl lg:text-4xl text-foreground mb-4">
              {product.title}
            </h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-primary">
                {price.toFixed(2)} {currency}
              </span>
            </div>

            {/* Variants */}
            {product.options && product.options.length > 0 && product.options[0].name !== 'Title' && (
              <div className="mb-6">
                {product.options.map((option: any) => (
                  <div key={option.name} className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {option.name}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value: string, i: number) => (
                        <button
                          key={value}
                          onClick={() => setSelectedVariantIndex(i)}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            selectedVariantIndex === i
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add to Cart */}
            <Button
              size="xl"
              className="w-full mb-6 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleAddToCart}
              disabled={isAdding || !selectedVariant?.availableForSale}
            >
              {isAdding ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Tilføjet til kurv!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {selectedVariant?.availableForSale ? 'Tilføj til kurv' : 'Udsolgt'}
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductPage;
