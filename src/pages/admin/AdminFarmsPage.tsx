import { useAllFarms, useAllCrops, useAllLivestock, useAllUsers, useAllFishPonds } from '@/hooks/useAdminData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

export function AdminFarmsPage() {
  const { data: farms, isLoading: lf } = useAllFarms();
  const { data: crops, isLoading: lc } = useAllCrops();
  const { data: livestock, isLoading: ll } = useAllLivestock();
  const { data: fishPonds, isLoading: lp } = useAllFishPonds();
  const { data: users } = useAllUsers();

  const getOwner = (farmId: string) => {
    const farm = farms?.find(f => f.id === farmId);
    if (!farm) return '—';
    const u = users?.find(u => u.user_id === farm.user_id);
    return u?.full_name || '—';
  };

  const getFarmOwner = (userId: string) => {
    const u = users?.find(u => u.user_id === userId);
    return u?.full_name || '—';
  };

  if (lf || lc || ll || lp) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-4">🌾 ফার্ম ডেটা</h2>
      <Tabs defaultValue="farms">
        <TabsList>
          <TabsTrigger value="farms">ফার্ম ({farms?.length || 0})</TabsTrigger>
          <TabsTrigger value="crops">ফসল ({crops?.length || 0})</TabsTrigger>
          <TabsTrigger value="livestock">পশু ({livestock?.length || 0})</TabsTrigger>
          <TabsTrigger value="fish">🐟 মাছ ({fishPonds?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="farms" className="mt-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>মালিক</TableHead>
                  <TableHead>ফার্মের নাম</TableHead>
                  <TableHead>ধরন</TableHead>
                  <TableHead>জেলা</TableHead>
                  <TableHead>উপজেলা</TableHead>
                  <TableHead>তারিখ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farms?.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{getFarmOwner(f.user_id)}</TableCell>
                    <TableCell>{f.name}</TableCell>
                    <TableCell><Badge variant="secondary">{f.type}</Badge></TableCell>
                    <TableCell>{f.district || '—'}</TableCell>
                    <TableCell>{f.upazila || '—'}</TableCell>
                    <TableCell className="text-xs">{format(new Date(f.created_at), 'dd MMM yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="crops" className="mt-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>মালিক</TableHead>
                  <TableHead>ফসল</TableHead>
                  <TableHead>জাত</TableHead>
                  <TableHead>পর্যায়</TableHead>
                  <TableHead>স্বাস্থ্য</TableHead>
                  <TableHead>জমি</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crops?.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{getOwner(c.farm_id)}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.variety || '—'}</TableCell>
                    <TableCell><Badge variant="secondary">{c.growth_stage || '—'}</Badge></TableCell>
                    <TableCell><Badge variant={c.health_status === 'healthy' ? 'default' : 'destructive'}>{c.health_status || '—'}</Badge></TableCell>
                    <TableCell>{c.land_size ? `${c.land_size} ${c.land_unit}` : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="livestock" className="mt-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>মালিক</TableHead>
                  <TableHead>পশু</TableHead>
                  <TableHead>জাত</TableHead>
                  <TableHead>সংখ্যা</TableHead>
                  <TableHead>বয়স</TableHead>
                  <TableHead>উৎপাদন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {livestock?.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{getOwner(l.farm_id)}</TableCell>
                    <TableCell>{l.animal_type}</TableCell>
                    <TableCell>{l.breed || '—'}</TableCell>
                    <TableCell>{l.count}</TableCell>
                    <TableCell>{l.age_group || '—'}</TableCell>
                    <TableCell>{l.daily_production_amount ? `${l.daily_production_amount} ${l.daily_production_unit}` : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="fish" className="mt-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>মালিক</TableHead>
                  <TableHead>পুকুর</TableHead>
                  <TableHead>আয়তন</TableHead>
                  <TableHead>প্রজাতি</TableHead>
                  <TableHead>পোনা</TableHead>
                  <TableHead>গড় ওজন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fishPonds?.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{getOwner(p.farm_id)}</TableCell>
                    <TableCell>#{p.pond_number}</TableCell>
                    <TableCell>{p.area_decimal} শতাংশ</TableCell>
                    <TableCell>{(p.fish_species || []).join(', ') || '—'}</TableCell>
                    <TableCell>{p.fingerling_count}</TableCell>
                    <TableCell>{p.current_avg_weight_g || 0}g</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
