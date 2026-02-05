import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Package, Plus, Edit, Trash2, Search, X, Sparkles, AlertCircle } from 'lucide-react';
import { calculateCasePrice } from '@/hooks/useCases';

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
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<KinguinProduct[]>([]);
  const [searching, setSearching] = useState(false);

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
      setCaseItems(caseData.items);
    } else {
      setEditingCase(null);
      setCaseName('');
      setCaseDescription('');
      setCaseImageUrl('');
      setCaseItems([]);
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
        drop_percentage: 0,
        product,
      },
    ]);
    setProductSearch('');
    setSearchResults([]);
  };

  const updateItemPercentage = (productId: string, percentage: number) => {
    setCaseItems(items =>
      items.map(item =>
        item.kinguin_product_id === productId
          ? { ...item, drop_percentage: Math.max(0, Math.min(100, percentage)) }
          : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setCaseItems(items => items.filter(item => item.kinguin_product_id !== productId));
  };

  const totalPercentage = caseItems.reduce((sum, item) => sum + item.drop_percentage, 0);
  const isValidPercentage = Math.abs(totalPercentage - 100) < 0.01;
  
  const calculatedPrice = calculateCasePrice(
    caseItems.map(item => ({
      sell_price: item.product?.sell_price || 0,
      drop_percentage: item.drop_percentage,
    }))
  );

  const handleSave = async () => {
    if (!caseName.trim()) {
      toast.error('Indtast et navn til casen');
      return;
    }

    if (caseItems.length === 0) {
      toast.error('Tilføj mindst ét produkt');
      return;
    }

    if (!isValidPercentage) {
      toast.error('Procentsatserne skal summere til 100%');
      return;
    }

    setSaving(true);
    try {
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
            caseItems.map(item => ({
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
            caseItems.map(item => ({
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingCase ? 'Rediger Case' : 'Opret Ny Case'}
            </DialogTitle>
            <DialogDescription>
              Tilføj produkter og indstil drop rates. Prisen beregnes automatisk med 10% house edge.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 pb-4">
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
                  <div className="border border-border rounded-lg overflow-hidden mt-2">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addProduct(product)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          {product.cover_image && (
                            <img
                              src={product.cover_image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.sell_price.toFixed(2)} DKK
                            {product.platform && ` • ${product.platform}`}
                          </p>
                        </div>
                        <Plus className="w-5 h-5 text-primary" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Added items */}
              {caseItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Produkter i Casen</Label>
                    <div className={`text-sm font-medium ${isValidPercentage ? 'text-success' : 'text-destructive'}`}>
                      Total: {totalPercentage.toFixed(1)}% {isValidPercentage ? '✓' : '(skal være 100%)'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {caseItems.map((item) => (
                      <div
                        key={item.kinguin_product_id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          {item.product?.cover_image && (
                            <img
                              src={item.product.cover_image}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.product?.name}</p>
                          <p className="text-sm text-primary font-semibold">
                            {item.product?.sell_price.toFixed(2)} DKK
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={item.drop_percentage}
                            onChange={(e) => updateItemPercentage(item.kinguin_product_id, parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.kinguin_product_id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                    Baseret på forventet værdi med 10% house edge
                  </p>
                </div>
              )}

              {!isValidPercentage && caseItems.length > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">
                    Procentsatserne skal summere til præcis 100%
                  </span>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={closeEditor}>
              Annuller
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !isValidPercentage || caseItems.length === 0}
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
