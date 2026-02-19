import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStats } from '@/hooks/useAdminData';
import { AdminUsersPage } from './AdminUsersPage';
import { AdminSubscriptionsPage } from './AdminSubscriptionsPage';
import { AdminFarmsPage } from './AdminFarmsPage';
import { AdminComplaintsPage } from './AdminComplaintsPage';
import { Users, CreditCard, Tractor, BarChart3, LogOut, Shield, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type AdminTab = 'dashboard' | 'users' | 'subscriptions' | 'farms' | 'complaints';

export default function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const { signOut } = useAuth();
  const { data: stats } = useAdminStats();

  const tabs = [
    { id: 'dashboard' as AdminTab, label: 'ড্যাশবোর্ড', icon: BarChart3 },
    { id: 'users' as AdminTab, label: 'ইউজারস', icon: Users },
    { id: 'subscriptions' as AdminTab, label: 'সাবস্ক্রিপশন', icon: CreditCard, badge: stats?.pendingPayments },
    { id: 'farms' as AdminTab, label: 'ফার্ম ডেটা', icon: Tractor },
    { id: 'complaints' as AdminTab, label: 'অভিযোগ', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-bold text-foreground">অ্যাডমিন প্যানেল</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">কৃষিOS Management</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.badge ? (
                <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">{t.badge}</Badge>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="w-4 h-4" /> লগআউট
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {tab === 'dashboard' && <AdminDashboard stats={stats} onNavigate={setTab} />}
        {tab === 'users' && <AdminUsersPage />}
        {tab === 'subscriptions' && <AdminSubscriptionsPage />}
        {tab === 'farms' && <AdminFarmsPage />}
        {tab === 'complaints' && <AdminComplaintsPage />}
      </main>
    </div>
  );
}

function AdminDashboard({ stats, onNavigate }: { stats: any; onNavigate: (t: AdminTab) => void }) {
  const cards = [
    { label: 'মোট ইউজার', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', tab: 'users' as AdminTab },
    { label: 'মোট ফার্ম', value: stats?.totalFarms || 0, icon: Tractor, color: 'text-green-500', tab: 'farms' as AdminTab },
    { label: 'মোট ফসল', value: stats?.totalCrops || 0, icon: BarChart3, color: 'text-orange-500', tab: 'farms' as AdminTab },
    { label: '🐟 মাছের পুকুর', value: stats?.totalFishPonds || 0, icon: BarChart3, color: 'text-cyan-500', tab: 'farms' as AdminTab },
    { label: 'পেন্ডিং পেমেন্ট', value: stats?.pendingPayments || 0, icon: CreditCard, color: 'text-red-500', tab: 'subscriptions' as AdminTab },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">📊 অ্যাডমিন ড্যাশবোর্ড</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <button
            key={c.label}
            onClick={() => onNavigate(c.tab)}
            className="bg-card border border-border rounded-xl p-5 text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <c.icon className={`w-8 h-8 ${c.color}`} />
            </div>
            <p className="text-3xl font-bold text-foreground">{c.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{c.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
