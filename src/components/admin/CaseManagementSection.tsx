import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Package, Plus, Edit, Trash2, Search, X, Sparkles, Info } from 'lucide-react';

interface KinguinProduct {
  id: string;
  name: string;
  sell_price: number;
  cover_image: string | null;
  platform: string | null;
}

interface CaseItem {
  id?: string;
  kinguin_product_id: string;
  drop_percentage: number;
  target_price_dkk: number; // The target DKK value for display in the case
  product?: KinguinProduct;
}

interface ShardCase {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  calculated_price: number;
  is_active: boolean;
  display_order: number;
  items: CaseItem[];
}

// Volatility levels affect how the odds are distributed
// Higher volatility = more weight on expensive items, lower volatility = more even distribution
const VOLATILITY_LEVELS = [
  { value: 1, label: 'Meget Lav', description: 'Jævn fordeling, hyppige gevinster' },
  { value: 2, label: 'Lav', description: 'Lidt skævhed mod dyrere items' },
  { value: 3, label: 'Medium', description: 'Balanceret risk/reward' },
  { value: 4, label: 'Høj', description: 'Sjældnere store gevinster' },
  { value: 5, label: 'Ekstrem', description: 'Jackpot-stil, meget sjældne topgevinster' },
];

const HOUSE_EDGE_PERCENT = 10;

// Calculate drop percentages based on target prices and volatility
function calculateDropPercentages(
  items: Array<{ target_price_dkk: number; kinguin_product_id: string }>,
  volatility: number,
  houseEdge: number
): Array<{ kinguin_product_id: string; drop_percentage: number }> {
  if (items.length === 0) return [];
  
  // Calculate total target value
  const totalTargetValue = items.reduce((sum, item) => sum + item.target_price_dkk, 0);
  
  // For very low volatility (1), use more even distribution
  // For high volatility (5), heavily favor cheaper items
  const volatilityExponent = 0.5 + (volatility * 0.5); // Range: 1.0 to 3.0
  
  // Calculate weights inversely proportional to price (cheaper = higher chance)
  // Apply volatility exponent to control distribution
  const weights = items.map(item => {
    const normalizedPrice = item.target_price_dkk / totalTargetValue;
    // Inverse and apply volatility - higher price = lower weight
    // Add small epsilon to avoid division by zero
    const weight = Math.pow(1 / (normalizedPrice + 0.01), volatilityExponent);
    return { kinguin_product_id: item.kinguin_product_id, weight };
  });
  
  // Normalize weights to sum to 100
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  const percentages = weights.map(w => ({
    kinguin_product_id: w.kinguin_product_id,
    drop_percentage: (w.weight / totalWeight) * 100,
  }));
  
  // Round to 1 decimal place and ensure they sum to exactly 100
  let roundedPercentages = percentages.map((p, i) => ({
    ...p,
    drop_percentage: Math.round(p.drop_percentage * 10) / 10,
  }));
  
  // Adjust last item to make total exactly 100
  const total = roundedPercentages.reduce((sum, p) => sum + p.drop_percentage, 0);
  if (roundedPercentages.length > 0) {
    roundedPercentages[roundedPercentages.length - 1].drop_percentage += 
      Math.round((100 - total) * 10) / 10;
  }
  
  return roundedPercentages;
}

// Calculate case price based on expected value with house edge
function calculateCasePriceFromItems(
  items: Array<{ target_price_dkk: number; drop_percentage: number }>
): number {
  const expectedValue = items.reduce((sum, item) => {
    return sum + (item.target_price_dkk * item.drop_percentage / 100);
  }, 0);
  
  // Apply house edge (player pays more than expected value)
  const priceWithEdge = expectedValue * (1 + HOUSE_EDGE_PERCENT / 100);
  
  // Convert to shards (1 DKK = 1000 shards)
  return Math.round(priceWithEdge * 1000);
}

const CaseManagementSection = () => {
  const [cases, setCases] = useState<ShardCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingCase, setEditingCase] = useState<ShardCase | null>(null);
  const [saving, setSaving] = useState(false);

  // Editor state
  const [caseName, setCaseName] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [caseImageUrl, setCaseImageUrl] = useState('');
  const [caseItems, setCaseItems] = useState<CaseItem[]>([]);
  const [volatility, setVolatility] = useState(3);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<KinguinProduct[]>([]);
  const [searching, setSearching] = useState(false);

  // Auto-calculate percentages when items or volatility change
  const calculatedPercentages = useMemo(() => {
    return calculateDropPercentages(
      caseItems.map(item => ({
        kinguin_product_id: item.kinguin_product_id,
        target_price_dkk: item.target_price_dkk,
      })),
      volatility,
      HOUSE_EDGE_PERCENT
    );
  }, [caseItems, volatility]);

  // Merge calculated percentages with items
  const itemsWithPercentages = useMemo(() => {
    return caseItems.map(item => {
      const calculated = calculatedPercentages.find(
        p => p.kinguin_product_id === item.kinguin_product_id
      );
      return {
        ...item,
        drop_percentage: calculated?.drop_percentage || 0,
      };
    });
  }, [caseItems, calculatedPercentages]);

  // Calculate price
  const calculatedPrice = useMemo(() => {
    return calculateCasePriceFromItems(
      itemsWithPercentages.map(item => ({
        target_price_dkk: item.target_price_dkk,
        drop_percentage: item.drop_percentage,
      }))
    );
  }, [itemsWithPercentages]);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shard_cases')
        .select(`
          *,
          shard_case_items (
            id,
            kinguin_product_id,
            drop_percentage,
            kinguin_products (
              id,
              name,
              sell_price,
              cover_image,
              platform
            )
          )
        `)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const formattedCases: ShardCase[] = (data || []).map(c => ({
        ...c,
        items: (c.shard_case_items || []).map((item: any) => ({
          id: item.id,
          kinguin_product_id: item.kinguin_product_id,
          drop_percentage: item.drop_percentage,
          target_price_dkk: item.kinguin_products?.sell_price || 0,
          product: item.kinguin_products,
        })),
      }));

      setCases(formattedCases);
    } catch (error) {
      console.error('Error loading cases:', error);
      toast.error('Kunne ikke hente cases');
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('kinguin_products')
        .select('id, name, sell_price, cover_image, platform')
        .ilike('name', `%${query}%`)
        .eq('is_available', true)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchProducts(productSearch);
    }, 300);
    return () => clearTimeout(debounce);
  }, [productSearch]);

  const openEditor = (caseData?: ShardCase) => {
    if (caseData) {
      setEditingCase(caseData);
      setCaseName(caseData.name);
      setCaseDescription(caseData.description || '');
      setCaseImageUrl(caseData.image_url || '');
      setCaseItems(caseData.items.map(item => ({
        ...item,
        target_price_dkk: item.product?.sell_price || 0,
      })));
      setVolatility(3); // Default, could store this in DB if needed
    } else {
      setEditingCase(null);
      setCaseName('');
      setCaseDescription('');
      setCaseImageUrl('');
      setCaseItems([]);
      setVolatility(3);
    }
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingCase(null);
    setProductSearch('');
    setSearchResults([]);
  };

  const addProduct = (product: KinguinProduct) => {
    if (caseItems.some(item => item.kinguin_product_id === product.id)) {
      toast.error('Produktet er allerede tilføjet');
      return;
    }

    setCaseItems([
      ...caseItems,
      {
        kinguin_product_id: product.id,
        drop_percentage: 0, // Will be auto-calculated
        target_price_dkk: product.sell_price, // Default to actual price
        product,
      },
    ]);
    setProductSearch('');
    setSearchResults([]);
  };

  const updateItemTargetPrice = (productId: string, price: number) => {
    setCaseItems(items =>
      items.map(item =>
        item.kinguin_product_id === productId
          ? { ...item, target_price_dkk: Math.max(1, price) }
          : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setCaseItems(items => items.filter(item => item.kinguin_product_id !== productId));
  };

  const handleSave = async () => {
    if (!caseName.trim()) {
      toast.error('Indtast et navn til casen');
      return;
    }

    if (caseItems.length === 0) {
      toast.error('Tilføj mindst ét produkt');
      return;
    }

    setSaving(true);
    try {
      // Use itemsWithPercentages which has calculated drop_percentage
      const itemsToSave = itemsWithPercentages;

      if (editingCase) {
        // Update existing case
        const { error: updateError } = await supabase
          .from('shard_cases')
          .update({
            name: caseName,
            description: caseDescription || null,
            image_url: caseImageUrl || null,
            calculated_price: calculatedPrice,
          })
          .eq('id', editingCase.id);

        if (updateError) throw updateError;

        // Delete existing items
        const { error: deleteError } = await supabase
          .from('shard_case_items')
          .delete()
          .eq('case_id', editingCase.id);

        if (deleteError) throw deleteError;

        // Insert new items
        const { error: insertError } = await supabase
          .from('shard_case_items')
          .insert(
            itemsToSave.map(item => ({
              case_id: editingCase.id,
              kinguin_product_id: item.kinguin_product_id,
              drop_percentage: item.drop_percentage,
            }))
          );

        if (insertError) throw insertError;

        toast.success('Case opdateret');
      } else {
        // Create new case
        const { data: newCase, error: createError } = await supabase
          .from('shard_cases')
          .insert({
            name: caseName,
            description: caseDescription || null,
            image_url: caseImageUrl || null,
            calculated_price: calculatedPrice,
            display_order: cases.length,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Insert items
        const { error: insertError } = await supabase
          .from('shard_case_items')
          .insert(
            itemsToSave.map(item => ({
              case_id: newCase.id,
              kinguin_product_id: item.kinguin_product_id,
              drop_percentage: item.drop_percentage,
            }))
          );

        if (insertError) throw insertError;

        toast.success('Case oprettet');
      }

      closeEditor();
      loadCases();
    } catch (error) {
      console.error('Error saving case:', error);
      toast.error('Kunne ikke gemme case');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (caseData: ShardCase) => {
    try {
      const { error } = await supabase
        .from('shard_cases')
        .update({ is_active: !caseData.is_active })
        .eq('id', caseData.id);

      if (error) throw error;

      toast.success(caseData.is_active ? 'Case deaktiveret' : 'Case aktiveret');
      loadCases();
    } catch (error) {
      console.error('Error toggling case:', error);
      toast.error('Kunne ikke ændre status');
    }
  };

  const handleDelete = async (caseId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne case?')) return;

    try {
      const { error } = await supabase
        .from('shard_cases')
        .delete()
        .eq('id', caseId);

      if (error) throw error;

      toast.success('Case slettet');
      loadCases();
    } catch (error) {
      console.error('Error deleting case:', error);
      toast.error('Kunne ikke slette case');
    }
  };

  const formatShards = (shards: number) => {
    return new Intl.NumberFormat('da-DK').format(shards);
  };

  const selectedVolatilityInfo = VOLATILITY_LEVELS.find(v => v.value === volatility);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Loot Cases
          </CardTitle>
          <CardDescription>
            Opret og administrer cases som kunder kan åbne med Shards
          </CardDescription>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="w-4 h-4 mr-2" />
          Ny Case
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Navn</TableHead>
              <TableHead>Produkter</TableHead>
              <TableHead>Pris (Shards)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((caseData) => (
              <TableRow key={caseData.id}>
                <TableCell className="font-medium">{caseData.name}</TableCell>
                <TableCell>{caseData.items.length} produkter</TableCell>
                <TableCell>{formatShards(caseData.calculated_price)}</TableCell>
                <TableCell>
                  <Badge variant={caseData.is_active ? 'default' : 'secondary'}>
                    {caseData.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditor(caseData)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(caseData)}
                    >
                      {caseData.is_active ? 'Deaktiver' : 'Aktiver'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(caseData.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {cases.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Ingen cases oprettet endnu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Case Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingCase ? 'Rediger Case' : 'Opret Ny Case'}
            </DialogTitle>
            <DialogDescription>
              Tilføj produkter og sæt målpriser. Odds beregnes automatisk baseret på volatilitet og {HOUSE_EDGE_PERCENT}% house edge.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Navn *</Label>
                <Input
                  value={caseName}
                  onChange={(e) => setCaseName(e.target.value)}
                  placeholder="f.eks. Premium Gaming Box"
                />
              </div>
              <div className="space-y-2">
                <Label>Billede URL</Label>
                <Input
                  value={caseImageUrl}
                  onChange={(e) => setCaseImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beskrivelse</Label>
              <Input
                value={caseDescription}
                onChange={(e) => setCaseDescription(e.target.value)}
                placeholder="Valgfri beskrivelse af casen"
              />
            </div>

            {/* Volatility selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Volatilitet</Label>
                <span className="text-sm font-medium text-primary">
                  {selectedVolatilityInfo?.label}
                </span>
              </div>
              <Slider
                value={[volatility]}
                onValueChange={(vals) => setVolatility(vals[0])}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Lav risk</span>
                <span>Høj risk</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedVolatilityInfo?.description}
              </p>
            </div>

            {/* Product search */}
            <div className="space-y-2">
              <Label>Tilføj Produkter</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Søg efter spil..."
                  className="pl-10"
                />
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden mt-2 max-h-48 overflow-y-auto">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addProduct(product)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        {product.cover_image && (
                          <img
                            src={product.cover_image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.sell_price.toFixed(2)} DKK
                          {product.platform && ` • ${product.platform}`}
                        </p>
                      </div>
                      <Plus className="w-4 h-4 text-primary flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Added items - this is the scrollable section */}
            {caseItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Produkter i Casen ({caseItems.length})</Label>
                </div>

                <ScrollArea className="max-h-64">
                  <div className="space-y-2 pr-4">
                    {itemsWithPercentages
                      .sort((a, b) => b.drop_percentage - a.drop_percentage)
                      .map((item) => (
                      <div
                        key={item.kinguin_product_id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          {item.product?.cover_image && (
                            <img
                              src={item.product.cover_image}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{item.product?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Basis: {item.product?.sell_price.toFixed(2)} DKK
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                step="1"
                                min="1"
                                value={item.target_price_dkk}
                                onChange={(e) => updateItemTargetPrice(
                                  item.kinguin_product_id, 
                                  parseFloat(e.target.value) || 1
                                )}
                                className="w-20 h-8 text-sm"
                              />
                              <span className="text-xs text-muted-foreground">DKK</span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                item.drop_percentage < 5 
                                  ? 'border-yellow-500/50 text-yellow-500' 
                                  : item.drop_percentage < 20 
                                    ? 'border-purple-500/50 text-purple-500'
                                    : 'border-primary/50 text-primary'
                              }`}
                            >
                              {item.drop_percentage.toFixed(1)}%
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeItem(item.kinguin_product_id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Price preview */}
            {caseItems.length > 0 && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Beregnet pris</span>
                </div>
                <p className="text-3xl font-bold text-primary">
                  {formatShards(calculatedPrice)} Shards
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Baseret på forventet værdi med {HOUSE_EDGE_PERCENT}% house edge
                </p>
              </div>
            )}

            {/* Info box */}
            {caseItems.length > 0 && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border flex gap-3">
                <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Sådan beregnes odds:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Dyrere items har lavere drop chance</li>
                    <li>Højere volatilitet = mere skæv fordeling</li>
                    <li>Alle procenter summerer automatisk til 100%</li>
                    <li>Case prisen sikrer {HOUSE_EDGE_PERCENT}% house edge</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={closeEditor}>
              Annuller
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || caseItems.length === 0}
            >
              {saving ? 'Gemmer...' : editingCase ? 'Opdater' : 'Opret'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CaseManagementSection;
