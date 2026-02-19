import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

function useAllComplaints() {
  return useQuery({
    queryKey: ['admin-complaints'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

function useUpdateComplaintStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('complaints')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-complaints'] });
      toast({ title: '✅ স্ট্যাটাস আপডেট হয়েছে' });
    },
  });
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  pending: { label: 'পেন্ডিং', variant: 'destructive', icon: Clock },
  reviewed: { label: 'পর্যালোচিত', variant: 'secondary', icon: CheckCircle },
  resolved: { label: 'সমাধান', variant: 'default', icon: CheckCircle },
  rejected: { label: 'বাতিল', variant: 'outline', icon: XCircle },
};

export function AdminComplaintsPage() {
  const { data: complaints, isLoading } = useAllComplaints();
  const updateStatus = useUpdateComplaintStatus();

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-4">📩 অভিযোগ / যোগাযোগ ({complaints?.length || 0})</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>নাম</TableHead>
              <TableHead>ইমেইল/ফোন</TableHead>
              <TableHead>বার্তা</TableHead>
              <TableHead>তারিখ</TableHead>
              <TableHead>স্ট্যাটাস</TableHead>
              <TableHead>অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints?.map(c => {
              const sc = statusConfig[c.status] || statusConfig.pending;
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name || '—'}</TableCell>
                  <TableCell className="text-sm">
                    <div>{c.email || '—'}</div>
                    {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm line-clamp-3 whitespace-pre-wrap">{c.message}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(c.created_at), 'dd MMM yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sc.variant} className="text-xs gap-1">
                      <sc.icon className="w-3 h-3" />
                      {sc.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {c.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => updateStatus.mutate({ id: c.id, status: 'reviewed' })}
                            disabled={updateStatus.isPending}
                          >
                            পর্যালোচিত
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => updateStatus.mutate({ id: c.id, status: 'resolved' })}
                            disabled={updateStatus.isPending}
                          >
                            সমাধান
                          </Button>
                        </>
                      )}
                      {c.status === 'reviewed' && (
                        <Button
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => updateStatus.mutate({ id: c.id, status: 'resolved' })}
                          disabled={updateStatus.isPending}
                        >
                          সমাধান
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {(!complaints || complaints.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">কোনো অভিযোগ নেই</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
