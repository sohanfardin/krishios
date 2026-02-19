import { useAllUsers, useToggleSubscription } from '@/hooks/useAdminData';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function useUsersWithSubs() {
  return useQuery({
    queryKey: ['admin-users-subs'],
    queryFn: async () => {
      const [{ data: users }, { data: subs }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('*'),
      ]);
      const subMap = new Map((subs || []).map(s => [s.user_id, s]));
      return (users || []).map(u => ({ ...u, subscription: subMap.get(u.user_id) || null }));
    },
  });
}

function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-subs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function AdminUsersPage() {
  const { data: users, isLoading } = useUsersWithSubs();
  const toggleSub = useToggleSubscription();
  const deleteUser = useDeleteUser();
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const isPremium = (sub: any) => {
    if (!sub) return false;
    const plan = sub.plan;
    if (plan === 'free' || plan === 'trial') return false;
    if (sub.expires_at && new Date(sub.expires_at) < new Date()) return false;
    return sub.status === 'active';
  };

  const handleToggle = (userId: string, currentlyPremium: boolean) => {
    toggleSub.mutate(
      { userId, plan: currentlyPremium ? 'free' : 'yearly' },
      {
        onSuccess: () => toast({ title: !currentlyPremium ? '✅ প্রিমিয়াম সক্রিয়' : '⬇️ ফ্রি প্ল্যানে পরিবর্তন' }),
        onError: (e: any) => toast({ title: 'ত্রুটি', description: e.message, variant: 'destructive' }),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: '🗑️ ইউজার ডিলিট হয়েছে' });
        setDeleteTarget(null);
      },
      onError: (e: any) => {
        toast({ title: 'ত্রুটি', description: e.message, variant: 'destructive' });
        setDeleteTarget(null);
      },
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-4">👥 সব ইউজার ({users?.length || 0})</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>নাম</TableHead>
              <TableHead>ইমেইল/ফোন</TableHead>
              <TableHead>জেলা</TableHead>
              <TableHead>উপজেলা</TableHead>
              <TableHead>ধরন</TableHead>
              <TableHead>সাইনআপ</TableHead>
              <TableHead>অনবোর্ডিং</TableHead>
              <TableHead>সাবস্ক্রিপশন</TableHead>
              <TableHead>অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map(u => {
              const premium = isPremium(u.subscription);
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
                  <TableCell className="text-sm">{u.email || u.phone || '—'}</TableCell>
                  <TableCell>{u.district || '—'}</TableCell>
                  <TableCell>{u.upazila || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {u.farmer_type?.map((t: string) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(u.created_at), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.onboarding_completed ? 'default' : 'destructive'} className="text-xs">
                      {u.onboarding_completed ? '✅' : '❌'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={premium}
                        onCheckedChange={() => handleToggle(u.user_id, premium)}
                        disabled={toggleSub.isPending}
                      />
                      <span className="text-xs font-medium">
                        {premium ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20">Pro</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Free</Badge>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget({ id: u.user_id, name: u.full_name || u.email || 'Unknown' })}
                      disabled={deleteUser.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {(!users || users.length === 0) && (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">কোনো ইউজার নেই</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ ইউজার ডিলিট করুন</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত যে <strong>{deleteTarget?.name}</strong> এর অ্যাকাউন্ট সম্পূর্ণভাবে মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteUser.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              ডিলিট করুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
