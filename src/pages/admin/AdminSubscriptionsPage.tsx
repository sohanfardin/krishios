import { useState } from 'react';
import { useAllPaymentRequests, useAllSubscriptions, useAllUsers, useApprovePayment, useRejectPayment, useToggleSubscription } from '@/hooks/useAdminData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function AdminSubscriptionsPage() {
  const { data: payments, isLoading: loadingPayments } = useAllPaymentRequests();
  const { data: subscriptions, isLoading: loadingSubs } = useAllSubscriptions();
  const { data: users } = useAllUsers();
  const approve = useApprovePayment();
  const reject = useRejectPayment();
  const toggleSub = useToggleSubscription();
  const { toast } = useToast();

  const getUserName = (userId: string) => {
    const u = users?.find(u => u.user_id === userId);
    return u?.full_name || u?.email || userId.slice(0, 8);
  };

  const handleApprove = async (p: any) => {
    try {
      await approve.mutateAsync({ paymentId: p.id, userId: p.user_id, plan: p.plan });
      toast({ title: '✅ অনুমোদিত', description: `${getUserName(p.user_id)} এর সাবস্ক্রিপশন অ্যাক্টিভ করা হয়েছে` });
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
  };

  const handleReject = async (p: any) => {
    try {
      await reject.mutateAsync(p.id);
      toast({ title: '❌ প্রত্যাখ্যান', description: 'পেমেন্ট রিকোয়েস্ট প্রত্যাখ্যান করা হয়েছে' });
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
  };

  const handleToggleSub = async (userId: string, plan: 'pro' | 'half_yearly' | 'yearly' | 'free') => {
    try {
      await toggleSub.mutateAsync({ userId, plan });
      const planLabel = plan === 'free' ? 'ফ্রি' : plan === 'pro' ? 'মাসিক' : plan === 'half_yearly' ? '৬ মাস' : 'বার্ষিক';
      toast({ title: '✅ আপডেট হয়েছে', description: `সাবস্ক্রিপশন ${planLabel} করা হয়েছে` });
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
  };

  if (loadingPayments || loadingSubs) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const pendingPayments = payments?.filter(p => p.status === 'pending') || [];
  const processedPayments = payments?.filter(p => p.status !== 'pending') || [];

  return (
    <div className="space-y-8">
      {/* Pending Payments */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          🔔 পেন্ডিং পেমেন্ট রিকোয়েস্ট ({pendingPayments.length})
        </h2>
        {pendingPayments.length > 0 ? (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ইউজার</TableHead>
                  <TableHead>প্ল্যান</TableHead>
                  <TableHead>টাকা</TableHead>
                  <TableHead>ট্রানজেকশন ID</TableHead>
                  <TableHead>মাধ্যম</TableHead>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.map(p => (
                  <TableRow key={p.id} className="bg-yellow-500/5">
                    <TableCell className="font-medium">{getUserName(p.user_id)}</TableCell>
                    <TableCell><Badge>{p.plan}</Badge></TableCell>
                    <TableCell className="font-semibold">৳{p.amount}</TableCell>
                    <TableCell className="font-mono text-xs">{p.transaction_id}</TableCell>
                    <TableCell>{p.payment_method || 'bKash'}</TableCell>
                    <TableCell className="text-xs">{format(new Date(p.created_at), 'dd MMM yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApprove(p)} disabled={approve.isPending}>
                          <Check className="w-3 h-3 mr-1" /> অনুমোদন
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(p)} disabled={reject.isPending}>
                          <X className="w-3 h-3 mr-1" /> প্রত্যাখ্যান
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
            কোনো পেন্ডিং পেমেন্ট নেই ✅
          </div>
        )}
      </div>

      {/* Processed Payments */}
      {processedPayments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">📋 প্রসেসড পেমেন্ট</h3>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ইউজার</TableHead>
                  <TableHead>প্ল্যান</TableHead>
                  <TableHead>টাকা</TableHead>
                  <TableHead>ট্রানজেকশন ID</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>তারিখ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedPayments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{getUserName(p.user_id)}</TableCell>
                    <TableCell><Badge variant="secondary">{p.plan}</Badge></TableCell>
                    <TableCell>৳{p.amount}</TableCell>
                    <TableCell className="font-mono text-xs">{p.transaction_id}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'approved' ? 'default' : 'destructive'}>
                        {p.status === 'approved' ? '✅ অনুমোদিত' : '❌ প্রত্যাখ্যাত'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{format(new Date(p.created_at), 'dd MMM yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* All Subscriptions */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">📊 সব সাবস্ক্রিপশন ({subscriptions?.length || 0})</h3>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ইউজার</TableHead>
                <TableHead>প্ল্যান</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                <TableHead>শুরু</TableHead>
                <TableHead>মেয়াদ</TableHead>
                <TableHead>সাবস্ক্রিপশন টগল</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions?.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{getUserName(s.user_id)}</TableCell>
                  <TableCell><Badge variant="secondary">{s.plan}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'active' ? 'default' : 'destructive'}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{format(new Date(s.starts_at), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-xs">{s.expires_at ? format(new Date(s.expires_at), 'dd MMM yyyy') : '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={s.plan === 'pro' ? 'default' : 'outline'}
                        className="text-xs h-7 px-2"
                        onClick={() => handleToggleSub(s.user_id, 'pro')}
                        disabled={toggleSub.isPending}
                      >
                        মাসিক
                      </Button>
                      <Button
                        size="sm"
                        variant={s.plan === 'half_yearly' ? 'default' : 'outline'}
                        className="text-xs h-7 px-2"
                        onClick={() => handleToggleSub(s.user_id, 'half_yearly')}
                        disabled={toggleSub.isPending}
                      >
                        ৬ মাস
                      </Button>
                      <Button
                        size="sm"
                        variant={s.plan === 'yearly' ? 'default' : 'outline'}
                        className="text-xs h-7 px-2"
                        onClick={() => handleToggleSub(s.user_id, 'yearly')}
                        disabled={toggleSub.isPending}
                      >
                        বার্ষিক
                      </Button>
                      <Button
                        size="sm"
                        variant={s.plan === 'free' || s.status !== 'active' ? 'default' : 'outline'}
                        className="text-xs h-7 px-2"
                        onClick={() => handleToggleSub(s.user_id, 'free')}
                        disabled={toggleSub.isPending}
                      >
                        ফ্রি
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
