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
import { toast } from 'sonner';
import { Sparkles, Users, TrendingUp, Gift, Plus, Edit, Trash2, RefreshCw, Package, Send, Search } from 'lucide-react';
import CaseManagementSection from './CaseManagementSection';

interface ShardStats {
  totalUsers: number;
  totalShardsInCirculation: number;
  totalShardsAwarded: number;
  totalShardsRedeemed: number;
}

interface RewardItem {
  id: string;
  name: string;
  description: string;
  type: string;
  shard_cost: number;
  value_dkk: number | null;
  stock: number | null;
  is_active: boolean;
}

interface EarningRule {
  id: string;
  action_type: string;
  base_shards: number | null;
  percentage: number | null;
  streak_multiplier: number | null;
  is_active: boolean;
}

interface UserProfile {
  id: string;
  display_name: string | null;
  balance?: number;
}

const CustomerClubTab = () => {
  const [stats, setStats] = useState<ShardStats | null>(null);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [rules, setRules] = useState<EarningRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);
  const [newReward, setNewReward] = useState({
    name: '',
    description: '',
    type: 'voucher',
    shard_cost: 0,
    value_dkk: 0,
    stock: null as number | null,
  });
  const [showNewRewardDialog, setShowNewRewardDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Grant Shards state
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [grantAmount, setGrantAmount] = useState<number>(0);
  const [grantReason, setGrantReason] = useState('');
  const [grantingShards, setGrantingShards] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch stats using aggregate queries
      const [
        { count: totalUsers },
        { data: balances },
        { data: rewardsData },
        { data: rulesData },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('shard_balances').select('balance, lifetime_earned, lifetime_spent'),
        supabase.from('reward_items').select('*').order('shard_cost', { ascending: true }),
        supabase.from('shard_earning_rules').select('*'),
      ]);

      // Calculate aggregates
      const totalInCirculation = balances?.reduce((sum, b) => sum + (b.balance || 0), 0) || 0;
      const totalAwarded = balances?.reduce((sum, b) => sum + (b.lifetime_earned || 0), 0) || 0;
      const totalRedeemed = balances?.reduce((sum, b) => sum + (b.lifetime_spent || 0), 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalShardsInCirculation: totalInCirculation,
        totalShardsAwarded: totalAwarded,
        totalShardsRedeemed: totalRedeemed,
      });

      setRewards(rewardsData || []);
      setRules(rulesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Kunne ikke hente data');
    } finally {
      setLoading(false);
    }
  };

  const formatShards = (shards: number) => {
    return new Intl.NumberFormat('da-DK').format(shards);
  };

  // Search users by email or display name
  const handleUserSearch = async () => {
    if (!userSearch.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      // Search profiles by display_name
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, display_name')
        .ilike('display_name', `%${userSearch}%`)
        .limit(10);

      if (error) throw error;

      // Get balances for found users
      const userIds = profiles?.map(p => p.id) || [];
      const { data: balances } = await supabase
        .from('shard_balances')
        .select('user_id, balance')
        .in('user_id', userIds);

      const balanceMap = new Map(balances?.map(b => [b.user_id, b.balance]) || []);

      const results: UserProfile[] = (profiles || []).map(p => ({
        id: p.id,
        display_name: p.display_name,
        balance: balanceMap.get(p.id) || 0,
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Kunne ikke søge efter brugere');
    } finally {
      setSearchingUsers(false);
    }
  };

  // Grant shards to selected user
  const handleGrantShards = async () => {
    if (!selectedUser || grantAmount <= 0) {
      toast.error('Vælg en bruger og indtast et gyldigt beløb');
      return;
    }

    setGrantingShards(true);
    try {
      // Insert a shard transaction - the trigger will update the balance
      const { error } = await supabase.from('shard_transactions').insert({
        user_id: selectedUser.id,
        amount: grantAmount,
        type: 'admin_grant',
        description: grantReason || `Admin gave ${grantAmount} Shards`,
      });

      if (error) throw error;

      toast.success(`${formatShards(grantAmount)} Shards givet til ${selectedUser.display_name || 'bruger'}`);
      
      // Reset form
      setSelectedUser(null);
      setGrantAmount(0);
      setGrantReason('');
      setUserSearch('');
      setSearchResults([]);
      
      // Refresh stats
      loadData();
    } catch (error) {
      console.error('Error granting shards:', error);
      toast.error('Kunne ikke give Shards');
    } finally {
      setGrantingShards(false);
    }
  };

  const handleCreateReward = async () => {
    if (!newReward.name || !newReward.description || newReward.shard_cost <= 0) {
      toast.error('Udfyld alle felter korrekt');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('reward_items').insert({
        name: newReward.name,
        description: newReward.description,
        type: newReward.type,
        shard_cost: newReward.shard_cost,
        value_dkk: newReward.value_dkk || null,
        stock: newReward.stock,
        is_active: true,
      });

      if (error) throw error;

      toast.success('Reward oprettet');
      setShowNewRewardDialog(false);
      setNewReward({ name: '', description: '', type: 'voucher', shard_cost: 0, value_dkk: 0, stock: null });
      loadData();
    } catch (error) {
      console.error('Error creating reward:', error);
      toast.error('Kunne ikke oprette reward');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReward = async (reward: RewardItem) => {
    try {
      const { error } = await supabase
        .from('reward_items')
        .update({ is_active: !reward.is_active })
        .eq('id', reward.id);

      if (error) throw error;

      toast.success(reward.is_active ? 'Reward deaktiveret' : 'Reward aktiveret');
      loadData();
    } catch (error) {
      console.error('Error toggling reward:', error);
      toast.error('Kunne ikke ændre reward status');
    }
  };

  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne reward?')) return;

    try {
      const { error } = await supabase.from('reward_items').delete().eq('id', rewardId);

      if (error) throw error;

      toast.success('Reward slettet');
      loadData();
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast.error('Kunne ikke slette reward');
    }
  };

  const handleUpdateRule = async (rule: EarningRule, updates: Partial<EarningRule>) => {
    try {
      const { error } = await supabase
        .from('shard_earning_rules')
        .update(updates)
        .eq('id', rule.id);

      if (error) throw error;

      toast.success('Regel opdateret');
      loadData();
    } catch (error) {
      console.error('Error updating rule:', error);
      toast.error('Kunne ikke opdatere regel');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <Users className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Club Medlemmer</p>
                <p className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shards i Omløb</p>
                <p className="text-2xl font-bold">{formatShards(stats?.totalShardsInCirculation || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shards Uddelt</p>
                <p className="text-2xl font-bold">{formatShards(stats?.totalShardsAwarded || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Gift className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shards Indløst</p>
                <p className="text-2xl font-bold">{formatShards(stats?.totalShardsRedeemed || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grant Shards Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Giv Shards til Bruger
          </CardTitle>
          <CardDescription>
            Søg efter en bruger og tildel dem Shards manuelt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Search */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Søg Bruger</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Søg på brugernavn..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleUserSearch}
                    disabled={searchingUsers}
                  >
                    {searchingUsers ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      className={`w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between ${
                        selectedUser?.id === user.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div>
                        <p className="font-medium text-foreground">{user.display_name || 'Unavngivet'}</p>
                        <p className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}...</p>
                      </div>
                      <Badge variant="secondary">
                        {formatShards(user.balance || 0)} Shards
                      </Badge>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected User */}
              {selectedUser && (
                <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Valgt bruger:</p>
                  <p className="font-semibold text-foreground">{selectedUser.display_name || 'Unavngivet'}</p>
                  <p className="text-sm text-success">Nuværende balance: {formatShards(selectedUser.balance || 0)} Shards</p>
                </div>
              )}
            </div>

            {/* Grant Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Antal Shards</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="f.eks. 1000"
                  value={grantAmount || ''}
                  onChange={(e) => setGrantAmount(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  ≈ {(grantAmount / 1000).toFixed(2)} DKK værdi
                </p>
              </div>

              <div className="space-y-2">
                <Label>Begrundelse (valgfri)</Label>
                <Input
                  placeholder="f.eks. Kompensation, bonus, konkurrence..."
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                />
              </div>

              <Button 
                className="w-full"
                onClick={handleGrantShards}
                disabled={!selectedUser || grantAmount <= 0 || grantingShards}
              >
                {grantingShards ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Giver Shards...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Giv {formatShards(grantAmount)} Shards
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earning Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Optjeningsregler
          </CardTitle>
          <CardDescription>
            Konfigurer hvordan kunder optjener Shards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Handling</TableHead>
                <TableHead>Base Shards</TableHead>
                <TableHead>Procent</TableHead>
                <TableHead>Streak Bonus</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium capitalize">
                    {rule.action_type.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell>
                    {rule.base_shards !== null ? (
                      <Input
                        type="number"
                        value={rule.base_shards}
                        onChange={(e) => handleUpdateRule(rule, { base_shards: parseInt(e.target.value) || 0 })}
                        className="w-24"
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {rule.percentage !== null ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.1"
                          value={rule.percentage}
                          onChange={(e) => handleUpdateRule(rule, { percentage: parseFloat(e.target.value) || 0 })}
                          className="w-20"
                        />
                        <span>%</span>
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {rule.streak_multiplier !== null ? (
                      <Input
                        type="number"
                        value={rule.streak_multiplier}
                        onChange={(e) => handleUpdateRule(rule, { streak_multiplier: parseFloat(e.target.value) || 0 })}
                        className="w-20"
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleUpdateRule(rule, { is_active: !rule.is_active })}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rewards Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Rewards
            </CardTitle>
            <CardDescription>
              Administrer rewards som kunder kan indløse
            </CardDescription>
          </div>
          <Dialog open={showNewRewardDialog} onOpenChange={setShowNewRewardDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ny Reward
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Opret Ny Reward</DialogTitle>
                <DialogDescription>
                  Tilføj en ny reward som kunder kan købe med Shards
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Navn</Label>
                  <Input
                    value={newReward.name}
                    onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                    placeholder="f.eks. 50 DKK Voucher"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Beskrivelse</Label>
                  <Input
                    value={newReward.description}
                    onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                    placeholder="f.eks. Få 50 DKK rabat på dit næste køb"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Shard Pris</Label>
                    <Input
                      type="number"
                      value={newReward.shard_cost}
                      onChange={(e) => setNewReward({ ...newReward, shard_cost: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Værdi (DKK)</Label>
                    <Input
                      type="number"
                      value={newReward.value_dkk}
                      onChange={(e) => setNewReward({ ...newReward, value_dkk: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Lager (tom = ubegrænset)</Label>
                  <Input
                    type="number"
                    value={newReward.stock ?? ''}
                    onChange={(e) => setNewReward({ 
                      ...newReward, 
                      stock: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    placeholder="Ubegrænset"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateReward}
                  disabled={saving}
                >
                  {saving ? 'Opretter...' : 'Opret Reward'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>Beskrivelse</TableHead>
                <TableHead>Pris</TableHead>
                <TableHead>Værdi</TableHead>
                <TableHead>Lager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rewards.map((reward) => (
                <TableRow key={reward.id}>
                  <TableCell className="font-medium">{reward.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{reward.description}</TableCell>
                  <TableCell>{formatShards(reward.shard_cost)}</TableCell>
                  <TableCell>{reward.value_dkk ? `${reward.value_dkk} DKK` : '—'}</TableCell>
                  <TableCell>{reward.stock ?? '∞'}</TableCell>
                  <TableCell>
                    <Badge variant={reward.is_active ? 'default' : 'secondary'}>
                      {reward.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleReward(reward)}
                      >
                        {reward.is_active ? 'Deaktiver' : 'Aktiver'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteReward(reward.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rewards.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Ingen rewards oprettet endnu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Case Management */}
      <CaseManagementSection />
    </div>
  );
};

export default CustomerClubTab;
