import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, Settings, Database, Clock, TrendingUp, Package, Download, Wallet, ShoppingCart, Key, RotateCcw, Eye, Copy, CheckCircle, XCircle, Loader2, Sparkles, Star, ShieldAlert, LogIn } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Header from "@/components/Header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import CustomerClubTab from "@/components/admin/CustomerClubTab";
import ProductManagementTab from "@/components/admin/ProductManagementTab";

interface StoreSetting {
  key: string;
  value: any;
}

interface SyncStats {
  totalProducts: number;
  availableProducts: number;
}

interface KinguinOrder {
  orderId: string;
  orderExternalId?: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  products: Array<{
    kinguinId: number;
    name: string;
    qty: number;
    price: number;
    keys?: Array<{ id: string; status: string }>;
  }>;
  totalQty: number;
}

interface KinguinKey {
  id: string;
  serial: string;
  type: string;
  name: string;
  kinguinId: number;
}

const AdminPage = () => {
  const { user, session, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [settings, setSettings] = useState<Record<string, any>>({});
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState<{ page: number; synced: number } | null>(null);
  
  // Kinguin balance
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  
  // Orders
  const [orders, setOrders] = useState<KinguinOrder[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersStatus, setOrdersStatus] = useState<string>('');
   
   // Helper to convert "all" to empty string for API
   const getStatusForApi = (status: string) => status === 'all' ? '' : status;
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Keys modal
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderKeys, setOrderKeys] = useState<KinguinKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [returningKeys, setReturningKeys] = useState(false);

  // Check admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (authLoading) return;
      
      if (!user) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        setIsAdmin(!!data && !error);
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminRole();
  }, [user, authLoading]);

  useEffect(() => {
    if (!checkingAdmin && isAdmin) {
      loadData();
    }
  }, [checkingAdmin, isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load settings
      const { data: settingsData } = await supabase
        .from('store_settings')
        .select('key, value');

      const settingsMap: Record<string, any> = {};
      settingsData?.forEach(s => {
        settingsMap[s.key] = typeof s.value === 'string' ? s.value.replace(/"/g, '') : s.value;
      });
      setSettings(settingsMap);

      // Load stats
      const { count: totalProducts } = await supabase
        .from('kinguin_products')
        .select('*', { count: 'exact', head: true });

      const { count: availableProducts } = await supabase
        .from('kinguin_products')
        .select('*', { count: 'exact', head: true })
        .eq('is_available', true);

      setStats({
        totalProducts: totalProducts || 0,
        availableProducts: availableProducts || 0
      });
      
      // Load balance
      fetchBalance();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Kunne ikke hente data');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchBalance = async () => {
    setLoadingBalance(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kinguin-balance`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      
      if (result.error) {
        console.error('Balance error:', result.error);
      } else {
        setBalance(result.balance);
      }
    } catch (error) {
      console.error('Balance fetch error:', error);
    } finally {
      setLoadingBalance(false);
    }
  };
  
  const fetchOrders = async (page = 1, status = '') => {
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '25');
      if (status) params.set('status', status);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kinguin-orders?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      
      if (result.error) {
        toast.error(result.error);
      } else {
        setOrders(result.orders || []);
        setOrdersTotal(result.total || 0);
        setOrdersPage(page);
      }
    } catch (error) {
      console.error('Orders fetch error:', error);
      toast.error('Kunne ikke hente ordrer');
    } finally {
      setLoadingOrders(false);
    }
  };
  
  const fetchKeys = async (orderId: string) => {
    setSelectedOrder(orderId);
    setLoadingKeys(true);
    setOrderKeys([]);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kinguin-keys?orderId=${orderId}&action=download`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      
      if (result.error) {
        toast.error(result.error);
      } else {
        setOrderKeys(result.keys || []);
      }
    } catch (error) {
      console.error('Keys fetch error:', error);
      toast.error('Kunne ikke hente nøgler');
    } finally {
      setLoadingKeys(false);
    }
  };
  
  const returnKeys = async (orderId: string) => {
    if (!confirm('Er du sikker på at du vil returnere nøglerne for denne ordre?')) return;
    
    setReturningKeys(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kinguin-keys?orderId=${orderId}&action=return`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Nøgler returneret!');
        fetchOrders(ordersPage, ordersStatus);
      }
    } catch (error) {
      console.error('Return keys error:', error);
      toast.error('Kunne ikke returnere nøgler');
    } finally {
      setReturningKeys(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopieret til udklipsholder');
  };

  const saveSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({ value: JSON.stringify(value) })
        .eq('key', key);

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('Indstilling gemt');
    } catch (error) {
      console.error('Error saving setting:', error);
      toast.error('Kunne ikke gemme indstilling');
    } finally {
      setSaving(false);
    }
  };

  const triggerKinguinSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kinguin-auto-sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Synk fuldført: ${result.newProducts} nye, ${result.updatedProducts} opdaterede`);
        loadData();
      } else {
        toast.error(result.error || 'Synk fejlede');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Kunne ikke starte synk');
    } finally {
      setSyncing(false);
    }
  };

  const triggerBackfill = async () => {
    setBackfilling(true);
    setBackfillProgress({ page: Number(settings.backfill_last_page) || 1, synced: 0 });
    
    try {
      let totalSynced = 0;
      
      while (true) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kinguin-backfill`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const result = await response.json();
        
        if (result.skipped) {
          toast.info(result.reason);
          break;
        }
        
        if (result.error) {
          toast.error(result.error);
          break;
        }

        totalSynced += result.synced || 0;
        setBackfillProgress({ page: result.nextPage, synced: totalSynced });
        
        toast.info(`Backfill: side ${result.nextPage}, ${totalSynced} produkter hentet`);

        if (result.complete) {
          toast.success(`Backfill fuldført! ${totalSynced} produkter hentet i alt.`);
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      loadData();
    } catch (error) {
      console.error('Backfill error:', error);
      toast.error('Kunne ikke starte backfill');
    } finally {
      setBackfilling(false);
      setBackfillProgress(null);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Fuldført</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Behandler</Badge>;
      case 'canceled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Annulleret</Badge>;
      case 'refunded':
        return <Badge variant="outline"><RotateCcw className="w-3 h-3 mr-1" /> Refunderet</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Show loading while checking auth
  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <LogIn className="w-16 h-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Log ind for at fortsætte</h1>
            <p className="text-muted-foreground mb-6">
              Du skal være logget ind som administrator for at tilgå denne side.
            </p>
            <Button onClick={() => navigate('/login')}>
              <LogIn className="w-4 h-4 mr-2" />
              Log ind
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold mb-2">Adgang nægtet</h1>
            <p className="text-muted-foreground mb-6">
              Du har ikke tilladelse til at tilgå admin panelet.
            </p>
            <Button variant="outline" onClick={() => navigate('/')}>
              Tilbage til forsiden
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Administrer produkter, ordrer, priser og synkronisering</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Balance Card */}
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Wallet className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kinguin Saldo</p>
                  <p className="text-2xl font-bold">
                    {loadingBalance ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : balance != null ? (
                      `€${balance.toFixed(2)}`
                    ) : (
                      '—'
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Produkter i DB</p>
                  <p className="text-2xl font-bold">{stats?.totalProducts.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Package className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tilgængelige</p>
                  <p className="text-2xl font-bold">{stats?.availableProducts.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="products" className="gap-2">
              <Star className="w-4 h-4" />
              Produkter
            </TabsTrigger>
            <TabsTrigger value="sync" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Synkronisering
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2" onClick={() => fetchOrders(1, ordersStatus)}>
              <ShoppingCart className="w-4 h-4" />
              Ordrer
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Priser & Margin
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Indstillinger
            </TabsTrigger>
            <TabsTrigger value="club" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Customer Club
            </TabsTrigger>
          </TabsList>

          {/* Product Management Tab */}
          <TabsContent value="products">
            <ProductManagementTab />
          </TabsContent>

          <TabsContent value="sync" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Kinguin → Database
                </CardTitle>
                <CardDescription>
                  Hent nye og opdaterede produkter fra Kinguin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Sidste synk</p>
                    <p className="text-xs text-muted-foreground">
                      {settings.last_kinguin_sync_timestamp
                        ? new Date(settings.last_kinguin_sync_timestamp).toLocaleString('da-DK')
                        : 'Aldrig'}
                    </p>
                  </div>
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    Hver time
                  </Badge>
                </div>
                <Button
                  onClick={triggerKinguinSync}
                  disabled={syncing}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Synkroniserer...' : 'Synk nu'}
                </Button>
              </CardContent>
            </Card>

            {/* Backfill Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Backfill alle produkter fra Kinguin
                </CardTitle>
                <CardDescription>
                  Hent ALLE produkter fra Kinguin API (ikke kun opdaterede). Kører 1000 produkter ad gangen.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-xs text-muted-foreground">
                      {settings.backfill_complete === true || settings.backfill_complete === 'true'
                        ? 'Fuldført'
                        : `Side ${settings.backfill_last_page || 1} - fortsætter hvor den slap`}
                    </p>
                  </div>
                  <Badge variant={settings.backfill_complete === true || settings.backfill_complete === 'true' ? 'default' : 'secondary'}>
                    {settings.backfill_complete === true || settings.backfill_complete === 'true' ? 'Fuldført' : 'I gang'}
                  </Badge>
                </div>

                {backfillProgress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Side {backfillProgress.page}</span>
                      <span>{backfillProgress.synced.toLocaleString()} produkter hentet</span>
                    </div>
                    <Progress value={undefined} className="animate-pulse" />
                  </div>
                )}

                <Button 
                  onClick={triggerBackfill} 
                  disabled={backfilling || settings.backfill_complete === true || settings.backfill_complete === 'true'}
                  className="w-full"
                  variant="outline"
                >
                  <Download className={`w-4 h-4 mr-2 ${backfilling ? 'animate-bounce' : ''}`} />
                  {backfilling 
                    ? `Henter side ${backfillProgress?.page || settings.backfill_last_page || 1}...` 
                    : settings.backfill_complete === true || settings.backfill_complete === 'true'
                      ? 'Backfill fuldført'
                      : 'Start/Fortsæt backfill'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Kinguin Ordrer
                </CardTitle>
                <CardDescription>
                  Se og administrer ordrer fra Kinguin API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label>Status filter</Label>
                    <Select 
                       value={ordersStatus || 'all'} 
                      onValueChange={(value) => {
                         const newStatus = value === 'all' ? '' : value;
                         setOrdersStatus(newStatus);
                         fetchOrders(1, newStatus);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Alle statuser" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="all">Alle statuser</SelectItem>
                        <SelectItem value="processing">Behandler</SelectItem>
                        <SelectItem value="completed">Fuldført</SelectItem>
                        <SelectItem value="canceled">Annulleret</SelectItem>
                        <SelectItem value="refunded">Refunderet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={() => fetchOrders(ordersPage, ordersStatus)} 
                    disabled={loadingOrders}
                    variant="outline"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingOrders ? 'animate-spin' : ''}`} />
                    Opdater
                  </Button>
                </div>

                {/* Orders table */}
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-10">
                    <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    Ingen ordrer fundet
                  </div>
                ) : (
                  <>
                    <ScrollArea className="h-[500px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ordre ID</TableHead>
                            <TableHead>Dato</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Produkter</TableHead>
                            <TableHead>Antal</TableHead>
                            <TableHead>Pris</TableHead>
                            <TableHead>Handlinger</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => (
                            <TableRow key={order.orderId}>
                              <TableCell className="font-mono text-sm">
                                {order.orderId}
                                {order.orderExternalId && (
                                  <span className="block text-xs text-muted-foreground">
                                    Ext: {order.orderExternalId}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(order.createdAt).toLocaleDateString('da-DK')}
                                <span className="block text-xs text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleTimeString('da-DK')}
                                </span>
                              </TableCell>
                              <TableCell>{getStatusBadge(order.status)}</TableCell>
                              <TableCell className="max-w-[200px]">
                                <div className="text-sm truncate">
                                  {order.products?.[0]?.name || '—'}
                                </div>
                                {order.products?.length > 1 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{order.products.length - 1} mere
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{order.totalQty}</TableCell>
                              <TableCell>€{order.totalPrice?.toFixed(2)}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => fetchKeys(order.orderId)}
                                      >
                                        <Key className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>Nøgler for ordre {selectedOrder}</DialogTitle>
                                        <DialogDescription>
                                          Download eller returner nøgler for denne ordre
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        {loadingKeys ? (
                                          <div className="flex items-center justify-center py-10">
                                            <RefreshCw className="w-6 h-6 animate-spin" />
                                          </div>
                                        ) : orderKeys.length === 0 ? (
                                          <div className="text-center py-10 text-muted-foreground">
                                            Ingen nøgler tilgængelige endnu
                                          </div>
                                        ) : (
                                          <ScrollArea className="h-[400px]">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead>Produkt</TableHead>
                                                  <TableHead>Nøgle</TableHead>
                                                  <TableHead>Type</TableHead>
                                                  <TableHead></TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {orderKeys.map((key) => (
                                                  <TableRow key={key.id}>
                                                    <TableCell className="text-sm max-w-[200px] truncate">
                                                      {key.name}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm">
                                                      {key.type.startsWith('image/') ? (
                                                        <img 
                                                          src={`data:${key.type};base64,${key.serial}`} 
                                                          alt="Key" 
                                                          className="max-w-[200px] max-h-[100px]"
                                                        />
                                                      ) : (
                                                        key.serial
                                                      )}
                                                    </TableCell>
                                                    <TableCell>
                                                      <Badge variant="outline">{key.type}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                      {!key.type.startsWith('image/') && (
                                                        <Button 
                                                          variant="ghost" 
                                                          size="sm"
                                                          onClick={() => copyToClipboard(key.serial)}
                                                        >
                                                          <Copy className="w-4 h-4" />
                                                        </Button>
                                                      )}
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </ScrollArea>
                                        )}
                                        
                                        <div className="flex gap-2 justify-end pt-4 border-t">
                                          <Button
                                            variant="destructive"
                                            onClick={() => selectedOrder && returnKeys(selectedOrder)}
                                            disabled={returningKeys || orderKeys.length === 0}
                                          >
                                            <RotateCcw className={`w-4 h-4 mr-2 ${returningKeys ? 'animate-spin' : ''}`} />
                                            Returner nøgler
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                    
                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-4">
                      <p className="text-sm text-muted-foreground">
                        Viser {orders.length} af {ordersTotal} ordrer
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={ordersPage <= 1 || loadingOrders}
                          onClick={() => fetchOrders(ordersPage - 1, ordersStatus)}
                        >
                          Forrige
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={orders.length < 25 || loadingOrders}
                          onClick={() => fetchOrders(ordersPage + 1, ordersStatus)}
                        >
                          Næste
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prisindstillinger</CardTitle>
                <CardDescription>
                  Konfigurer margin og valutakurs for alle produkter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="margin">Global margin (%)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="margin"
                        type="number"
                        value={settings.global_margin_percent || 30}
                        onChange={(e) => setSettings(prev => ({ ...prev, global_margin_percent: e.target.value }))}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => saveSetting('global_margin_percent', Number(settings.global_margin_percent))}
                        disabled={saving}
                      >
                        Gem
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tillægges alle produkter uden individuel margin
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate">EUR → DKK kurs</Label>
                    <div className="flex gap-2">
                      <Input
                        id="rate"
                        type="number"
                        step="0.01"
                        value={settings.eur_to_dkk_rate || 7.46}
                        onChange={(e) => setSettings(prev => ({ ...prev, eur_to_dkk_rate: e.target.value }))}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => saveSetting('eur_to_dkk_rate', Number(settings.eur_to_dkk_rate))}
                        disabled={saving}
                      >
                        Gem
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Brugt til at konvertere EUR priser til DKK
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Priseksempel</h4>
                  <p className="text-sm text-muted-foreground">
                    Produkt til €10 → €10 × {1 + (Number(settings.global_margin_percent) || 30) / 100} × {settings.eur_to_dkk_rate || 7.46} = 
                    <span className="font-bold text-foreground ml-1">
                      {(10 * (1 + (Number(settings.global_margin_percent) || 30) / 100) * (Number(settings.eur_to_dkk_rate) || 7.46)).toFixed(2)} kr.
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automatisk synkronisering</CardTitle>
                <CardDescription>
                  Konfigurer automatisk synk af produkter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-synk aktiveret</Label>
                    <p className="text-sm text-muted-foreground">
                      Synkroniser automatisk hver time
                    </p>
                  </div>
                  <Switch
                    checked={settings.auto_sync_enabled === true || settings.auto_sync_enabled === 'true'}
                    onCheckedChange={(checked) => saveSetting('auto_sync_enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="club">
            <CustomerClubTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
