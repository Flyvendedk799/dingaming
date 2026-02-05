import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Star, Tag, Package, Loader2, Save, X, Plus, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface Product {
  id: string;
  kinguin_id: number;
  name: string;
  cover_image: string | null;
  sell_price: number;
  platform: string | null;
  is_featured: boolean;
  is_on_sale: boolean;
  sale_label: string | null;
  display_order: number;
}

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  discount_percent: number;
  is_active: boolean;
  display_order: number;
  items?: BundleItem[];
}

interface BundleItem {
  id: string;
  bundle_id: string;
  kinguin_product_id: string;
  product?: Product;
}

const ProductManagementTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Bundle creation
  const [showBundleDialog, setShowBundleDialog] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [bundleForm, setBundleForm] = useState({
    name: "",
    description: "",
    cover_image: "",
    discount_percent: 10,
    is_active: true
  });
  const [bundleProducts, setBundleProducts] = useState<Product[]>([]);
  const [bundleProductSearch, setBundleProductSearch] = useState("");
  const [bundleSearchResults, setBundleSearchResults] = useState<Product[]>([]);

  useEffect(() => {
    loadFeaturedAndSale();
    loadBundles();
  }, []);

  const loadFeaturedAndSale = async () => {
    try {
      const [featuredRes, saleRes] = await Promise.all([
        supabase
          .from('kinguin_products')
          .select('id, kinguin_id, name, cover_image, sell_price, platform, is_featured, is_on_sale, sale_label, display_order')
          .eq('is_featured', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('kinguin_products')
          .select('id, kinguin_id, name, cover_image, sell_price, platform, is_featured, is_on_sale, sale_label, display_order')
          .eq('is_on_sale', true)
          .order('display_order', { ascending: true })
      ]);

      setFeaturedProducts((featuredRes.data as Product[]) || []);
      setSaleProducts((saleRes.data as Product[]) || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadBundles = async () => {
    try {
      const { data: bundlesData, error } = await supabase
        .from('product_bundles')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBundles((bundlesData as Bundle[]) || []);
    } catch (error) {
      console.error('Error loading bundles:', error);
    }
  };

  const searchProducts = async (query: string) => {
    if (!query || query.length < 2) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kinguin_products')
        .select('id, kinguin_id, name, cover_image, sell_price, platform, is_featured, is_on_sale, sale_label, display_order')
        .ilike('name', `%${query}%`)
        .eq('is_available', true)
        .limit(20);

      if (error) throw error;
      setProducts((data as Product[]) || []);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Søgning fejlede');
    } finally {
      setLoading(false);
    }
  };

  const searchBundleProducts = async (query: string) => {
    if (!query || query.length < 2) {
      setBundleSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('kinguin_products')
        .select('id, kinguin_id, name, cover_image, sell_price, platform, is_featured, is_on_sale, sale_label, display_order')
        .ilike('name', `%${query}%`)
        .eq('is_available', true)
        .limit(10);

      if (error) throw error;
      setBundleSearchResults((data as Product[]) || []);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const toggleFeatured = async (product: Product) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('kinguin_products')
        .update({ 
          is_featured: !product.is_featured,
          display_order: !product.is_featured ? featuredProducts.length : 0
        })
        .eq('id', product.id);

      if (error) throw error;
      
      toast.success(product.is_featured ? 'Fjernet fra fremhævede' : 'Tilføjet til fremhævede');
      loadFeaturedAndSale();
      
      // Update search results
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, is_featured: !p.is_featured } : p
      ));
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Kunne ikke opdatere produkt');
    } finally {
      setSaving(false);
    }
  };

  const toggleOnSale = async (product: Product, saleLabel?: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('kinguin_products')
        .update({ 
          is_on_sale: !product.is_on_sale,
          sale_label: !product.is_on_sale ? (saleLabel || 'TILBUD') : null
        })
        .eq('id', product.id);

      if (error) throw error;
      
      toast.success(product.is_on_sale ? 'Fjernet fra tilbud' : 'Tilføjet til tilbud');
      loadFeaturedAndSale();
      
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, is_on_sale: !p.is_on_sale } : p
      ));
    } catch (error) {
      console.error('Error toggling sale:', error);
      toast.error('Kunne ikke opdatere produkt');
    } finally {
      setSaving(false);
    }
  };

  const updateSaleLabel = async (productId: string, label: string) => {
    try {
      const { error } = await supabase
        .from('kinguin_products')
        .update({ sale_label: label })
        .eq('id', productId);

      if (error) throw error;
      
      setSaleProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, sale_label: label } : p
      ));
      toast.success('Label opdateret');
    } catch (error) {
      console.error('Error updating label:', error);
      toast.error('Kunne ikke opdatere label');
    }
  };

  const removeFromFeatured = async (productId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('kinguin_products')
        .update({ is_featured: false, display_order: 0 })
        .eq('id', productId);

      if (error) throw error;
      toast.success('Fjernet fra fremhævede');
      loadFeaturedAndSale();
    } catch (error) {
      console.error('Error removing:', error);
      toast.error('Kunne ikke fjerne produkt');
    } finally {
      setSaving(false);
    }
  };

  const removeFromSale = async (productId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('kinguin_products')
        .update({ is_on_sale: false, sale_label: null })
        .eq('id', productId);

      if (error) throw error;
      toast.success('Fjernet fra tilbud');
      loadFeaturedAndSale();
    } catch (error) {
      console.error('Error removing:', error);
      toast.error('Kunne ikke fjerne produkt');
    } finally {
      setSaving(false);
    }
  };

  // Bundle functions
  const openBundleDialog = (bundle?: Bundle) => {
    if (bundle) {
      setEditingBundle(bundle);
      setBundleForm({
        name: bundle.name,
        description: bundle.description || "",
        cover_image: bundle.cover_image || "",
        discount_percent: bundle.discount_percent,
        is_active: bundle.is_active
      });
      loadBundleItems(bundle.id);
    } else {
      setEditingBundle(null);
      setBundleForm({
        name: "",
        description: "",
        cover_image: "",
        discount_percent: 10,
        is_active: true
      });
      setBundleProducts([]);
    }
    setShowBundleDialog(true);
  };

  const loadBundleItems = async (bundleId: string) => {
    try {
      const { data, error } = await supabase
        .from('bundle_items')
        .select(`
          id,
          bundle_id,
          kinguin_product_id,
          kinguin_products (
            id, kinguin_id, name, cover_image, sell_price, platform, is_featured, is_on_sale, sale_label, display_order
          )
        `)
        .eq('bundle_id', bundleId);

      if (error) throw error;
      
      const products = data?.map(item => (item as any).kinguin_products as Product).filter(Boolean) || [];
      setBundleProducts(products);
    } catch (error) {
      console.error('Error loading bundle items:', error);
    }
  };

  const saveBundle = async () => {
    if (!bundleForm.name) {
      toast.error('Navn er påkrævet');
      return;
    }

    setSaving(true);
    try {
      let bundleId: string;

      if (editingBundle) {
        const { error } = await supabase
          .from('product_bundles')
          .update({
            name: bundleForm.name,
            description: bundleForm.description || null,
            cover_image: bundleForm.cover_image || null,
            discount_percent: bundleForm.discount_percent,
            is_active: bundleForm.is_active
          })
          .eq('id', editingBundle.id);

        if (error) throw error;
        bundleId = editingBundle.id;

        // Remove existing items
        await supabase.from('bundle_items').delete().eq('bundle_id', bundleId);
      } else {
        const { data, error } = await supabase
          .from('product_bundles')
          .insert({
            name: bundleForm.name,
            description: bundleForm.description || null,
            cover_image: bundleForm.cover_image || null,
            discount_percent: bundleForm.discount_percent,
            is_active: bundleForm.is_active,
            display_order: bundles.length
          })
          .select()
          .single();

        if (error) throw error;
        bundleId = data.id;
      }

      // Add bundle items
      if (bundleProducts.length > 0) {
        const items = bundleProducts.map(p => ({
          bundle_id: bundleId,
          kinguin_product_id: p.id
        }));

        const { error: itemsError } = await supabase
          .from('bundle_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      toast.success(editingBundle ? 'Bundle opdateret' : 'Bundle oprettet');
      setShowBundleDialog(false);
      loadBundles();
    } catch (error) {
      console.error('Error saving bundle:', error);
      toast.error('Kunne ikke gemme bundle');
    } finally {
      setSaving(false);
    }
  };

  const deleteBundle = async (bundleId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne bundle?')) return;

    try {
      const { error } = await supabase
        .from('product_bundles')
        .delete()
        .eq('id', bundleId);

      if (error) throw error;
      toast.success('Bundle slettet');
      loadBundles();
    } catch (error) {
      console.error('Error deleting bundle:', error);
      toast.error('Kunne ikke slette bundle');
    }
  };

  const toggleBundleActive = async (bundle: Bundle) => {
    try {
      const { error } = await supabase
        .from('product_bundles')
        .update({ is_active: !bundle.is_active })
        .eq('id', bundle.id);

      if (error) throw error;
      toast.success(bundle.is_active ? 'Bundle deaktiveret' : 'Bundle aktiveret');
      loadBundles();
    } catch (error) {
      console.error('Error toggling bundle:', error);
      toast.error('Kunne ikke opdatere bundle');
    }
  };

  const addProductToBundle = (product: Product) => {
    if (bundleProducts.find(p => p.id === product.id)) {
      toast.error('Produkt er allerede i bundle');
      return;
    }
    setBundleProducts(prev => [...prev, product]);
    setBundleProductSearch("");
    setBundleSearchResults([]);
  };

  const removeProductFromBundle = (productId: string) => {
    setBundleProducts(prev => prev.filter(p => p.id !== productId));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="featured" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="featured" className="gap-2">
            <Star className="w-4 h-4" />
            Fremhævede ({featuredProducts.length})
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-2">
            <Tag className="w-4 h-4" />
            Tilbud ({saleProducts.length})
          </TabsTrigger>
          <TabsTrigger value="bundles" className="gap-2">
            <Package className="w-4 h-4" />
            Bundles ({bundles.length})
          </TabsTrigger>
        </TabsList>

        {/* Search Card - shown for featured and sales tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Søg produkter
            </CardTitle>
            <CardDescription>
              Søg efter produkter for at tilføje til fremhævede eller tilbud
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Søg efter produktnavn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchProducts(searchQuery)}
              />
              <Button onClick={() => searchProducts(searchQuery)} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {products.length > 0 && (
              <ScrollArea className="h-80 rounded-xl border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produkt</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Pris</TableHead>
                      <TableHead className="text-right">Handlinger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.cover_image && (
                              <img 
                                src={product.cover_image} 
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            )}
                            <div>
                              <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                              <div className="flex gap-1 mt-1">
                                {product.is_featured && <Badge variant="success" className="text-xs">Fremhævet</Badge>}
                                {product.is_on_sale && <Badge variant="destructive" className="text-xs">Tilbud</Badge>}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.platform || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {product.sell_price.toFixed(2)} DKK
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant={product.is_featured ? "secondary" : "outline"}
                              onClick={() => toggleFeatured(product)}
                              disabled={saving}
                            >
                              <Star className={`w-4 h-4 ${product.is_featured ? 'fill-primary' : ''}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant={product.is_on_sale ? "destructive" : "outline"}
                              onClick={() => toggleOnSale(product)}
                              disabled={saving}
                            >
                              <Tag className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Featured Products Tab */}
        <TabsContent value="featured" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Fremhævede produkter
              </CardTitle>
              <CardDescription>
                Disse produkter vises øverst på forsiden
              </CardDescription>
            </CardHeader>
            <CardContent>
              {featuredProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Ingen fremhævede produkter. Søg og tilføj produkter ovenfor.
                </p>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {featuredProducts.map((product, index) => (
                      <div 
                        key={product.id}
                        className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 border border-border/50"
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        <span className="text-sm font-bold text-muted-foreground w-6">#{index + 1}</span>
                        {product.cover_image && (
                          <img 
                            src={product.cover_image} 
                            alt={product.name}
                            className="w-14 h-14 object-cover rounded-xl"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{product.platform}</Badge>
                            <span className="text-sm font-semibold text-success">{product.sell_price.toFixed(2)} DKK</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromFeatured(product.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-destructive" />
                Produkter på tilbud
              </CardTitle>
              <CardDescription>
                Disse produkter vises med tilbudsmærkat
              </CardDescription>
            </CardHeader>
            <CardContent>
              {saleProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Ingen produkter på tilbud. Søg og tilføj produkter ovenfor.
                </p>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {saleProducts.map((product) => (
                      <div 
                        key={product.id}
                        className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 border border-border/50"
                      >
                        {product.cover_image && (
                          <img 
                            src={product.cover_image} 
                            alt={product.name}
                            className="w-14 h-14 object-cover rounded-xl"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{product.platform}</Badge>
                            <span className="text-sm font-semibold text-success">{product.sell_price.toFixed(2)} DKK</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={product.sale_label || 'TILBUD'}
                            onChange={(e) => updateSaleLabel(product.id, e.target.value)}
                            className="w-28 h-8 text-xs"
                            placeholder="Label"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromSale(product.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-accent" />
                  Produktbundles
                </CardTitle>
                <CardDescription>
                  Opret bundlepakker med rabat
                </CardDescription>
              </div>
              <Button onClick={() => openBundleDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Opret bundle
              </Button>
            </CardHeader>
            <CardContent>
              {bundles.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Ingen bundles oprettet endnu.
                </p>
              ) : (
                <div className="space-y-3">
                  {bundles.map((bundle) => (
                    <div 
                      key={bundle.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/50"
                    >
                      {bundle.cover_image ? (
                        <img 
                          src={bundle.cover_image} 
                          alt={bundle.name}
                          className="w-16 h-16 object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center">
                          <Package className="w-8 h-8 text-accent" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{bundle.name}</p>
                          <Badge variant={bundle.is_active ? "success" : "secondary"}>
                            {bundle.is_active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                          {bundle.discount_percent > 0 && (
                            <Badge variant="destructive">-{bundle.discount_percent}%</Badge>
                          )}
                        </div>
                        {bundle.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {bundle.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleBundleActive(bundle)}
                        >
                          {bundle.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openBundleDialog(bundle)}
                        >
                          Rediger
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteBundle(bundle.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bundle Dialog */}
      <Dialog open={showBundleDialog} onOpenChange={setShowBundleDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBundle ? 'Rediger bundle' : 'Opret ny bundle'}
            </DialogTitle>
            <DialogDescription>
              Saml flere produkter i en pakke med rabat
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Navn *</Label>
                <Input
                  value={bundleForm.name}
                  onChange={(e) => setBundleForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="F.eks. Sommer Gaming Pack"
                />
              </div>
              <div className="space-y-2">
                <Label>Rabat %</Label>
                <Input
                  type="number"
                  value={bundleForm.discount_percent}
                  onChange={(e) => setBundleForm(prev => ({ ...prev, discount_percent: Number(e.target.value) }))}
                  placeholder="10"
                  min={0}
                  max={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beskrivelse</Label>
              <Textarea
                value={bundleForm.description}
                onChange={(e) => setBundleForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kort beskrivelse af bundlen..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Cover billede URL</Label>
              <Input
                value={bundleForm.cover_image}
                onChange={(e) => setBundleForm(prev => ({ ...prev, cover_image: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={bundleForm.is_active}
                onCheckedChange={(checked) => setBundleForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Aktiv (synlig for kunder)</Label>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label>Produkter i bundle ({bundleProducts.length})</Label>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Søg efter produkt..."
                  value={bundleProductSearch}
                  onChange={(e) => {
                    setBundleProductSearch(e.target.value);
                    searchBundleProducts(e.target.value);
                  }}
                />
              </div>

              {bundleSearchResults.length > 0 && (
                <ScrollArea className="h-40 rounded-xl border">
                  <div className="p-2 space-y-1">
                    {bundleSearchResults.map((product) => (
                      <button
                        key={product.id}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted text-left"
                        onClick={() => addProductToBundle(product)}
                      >
                        {product.cover_image && (
                          <img 
                            src={product.cover_image} 
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sell_price.toFixed(2)} DKK</p>
                        </div>
                        <Plus className="w-4 h-4 text-success" />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {bundleProducts.length > 0 && (
                <div className="space-y-2">
                  {bundleProducts.map((product) => (
                    <div 
                      key={product.id}
                      className="flex items-center gap-3 p-2 rounded-xl bg-muted/50"
                    >
                      {product.cover_image && (
                        <img 
                          src={product.cover_image} 
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sell_price.toFixed(2)} DKK</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeProductFromBundle(product.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      Samlet pris: {bundleProducts.reduce((sum, p) => sum + p.sell_price, 0).toFixed(2)} DKK
                    </span>
                    {bundleForm.discount_percent > 0 && (
                      <span className="text-sm font-semibold text-success">
                        Efter rabat: {(bundleProducts.reduce((sum, p) => sum + p.sell_price, 0) * (1 - bundleForm.discount_percent / 100)).toFixed(2)} DKK
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBundleDialog(false)}>
              Annuller
            </Button>
            <Button onClick={saveBundle} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {editingBundle ? 'Gem ændringer' : 'Opret bundle'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagementTab;
