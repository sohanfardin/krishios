import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveFarm } from '@/hooks/useFarm';
import { useFarmTasks, useAddFarmTask, useToggleTask, useDeleteFarmTask } from '@/hooks/useFarmTasks';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function SchedulePage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { farm } = useActiveFarm();
  const { data: tasks, isLoading } = useFarmTasks(farm?.id);
  const addTask = useAddFarmTask();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteFarmTask();
  const [showAdd, setShowAdd] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const bn = language === 'bn';

  // Add task form
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || !farm) return;
    try {
      await addTask.mutateAsync({
        farm_id: farm.id,
        title,
        due_date: dueDate,
        priority,
        task_type: 'manual',
        source: 'manual',
      });
      toast.success(bn ? 'কাজ যোগ হয়েছে!' : 'Task added!');
      setShowAdd(false);
      setTitle(''); setDueDate('');
    } catch {
      toast.error(bn ? 'ত্রুটি' : 'Error');
    }
  };

  const generateAITasks = async () => {
    if (!farm) return;
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-advisory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ type: 'smart_schedule', farmId: farm.id }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'AI error');
      }

      const result = await resp.json();
      const savedCount = result.saved || 0;
      toast.success(bn ? `${savedCount}টি AI কাজ তৈরি হয়েছে!` : `${savedCount} AI tasks created!`);
      queryClient.invalidateQueries({ queryKey: ['farm_tasks'] });
    } catch (e: any) {
      toast.error(e.message || (bn ? 'AI ত্রুটি' : 'AI error'));
    }
    setIsGenerating(false);
  };

  const pendingTasks = tasks?.filter(t => !t.is_completed) || [];
  const completedTasks = tasks?.filter(t => t.is_completed) || [];

  const priorityColor = (p: string) => {
    if (p === 'high') return 'text-destructive';
    if (p === 'low') return 'text-muted-foreground';
    return 'text-warning';
  };

  const priorityLabel = (p: string) => {
    if (p === 'high') return bn ? '🔴 জরুরি' : '🔴 High';
    if (p === 'low') return bn ? '🟢 কম' : '🟢 Low';
    return bn ? '🟡 মাঝারি' : '🟡 Medium';
  };

  const taskTypeEmoji: Record<string, string> = {
    irrigation: '💧', fertilizer: '🧪', vaccination: '💉', harvest: '🌾',
    pest_control: '🦠', feeding: '🍽️', general: '📋', manual: '✏️', ai_generated: '🤖',
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            📅 {bn ? 'সময়সূচী ও কাজের তালিকা' : 'Schedule & Tasks'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {bn ? `${pendingTasks.length}টি বাকি কাজ` : `${pendingTasks.length} pending tasks`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={generateAITasks} disabled={isGenerating} className="flex items-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-xl font-medium hover:bg-accent/80 transition-colors touch-target disabled:opacity-50">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{bn ? 'AI কাজ তৈরি' : 'AI Generate'}</span>
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg touch-target">
            <Plus className="w-5 h-5" />
            <span>{bn ? 'কাজ যোগ' : 'Add Task'}</span>
          </button>
        </div>
      </div>

      {/* Pending Tasks */}
      <div className="bg-card rounded-2xl border border-border animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{bn ? '📋 বাকি কাজ' : '📋 Pending Tasks'}</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">{bn ? 'লোড হচ্ছে...' : 'Loading...'}</div>
        ) : pendingTasks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <span className="text-4xl block mb-3">✅</span>
            {bn ? 'সব কাজ শেষ! নতুন কাজ যোগ করুন বা AI দিয়ে তৈরি করুন।' : 'All done! Add new tasks or generate with AI.'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pendingTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                <button onClick={() => toggleTask.mutate({ id: task.id, is_completed: true })} className="text-muted-foreground hover:text-primary transition-colors">
                  <Circle className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{task.title_bn || task.title}</p>
                  {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(task.due_date).toLocaleDateString(bn ? 'bn-BD' : 'en-US')}
                    </span>
                    <span className={cn("text-xs font-medium", priorityColor(task.priority))}>
                      {priorityLabel(task.priority)}
                    </span>
                    <span className="text-xs">{taskTypeEmoji[task.task_type] || taskTypeEmoji[task.source] || ''}</span>
                    {task.source === 'ai' && <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">AI</span>}
                  </div>
                </div>
                <button onClick={() => { deleteTask.mutate(task.id); toast.success(bn ? 'মুছে ফেলা হয়েছে' : 'Deleted'); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="bg-card rounded-2xl border border-border animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="p-5 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">{bn ? '✅ সম্পন্ন কাজ' : '✅ Completed'}</h2>
          </div>
          <div className="divide-y divide-border">
            {completedTasks.slice(0, 10).map(task => (
              <div key={task.id} className="flex items-center gap-3 p-4 opacity-60">
                <button onClick={() => toggleTask.mutate({ id: task.id, is_completed: false })} className="text-success">
                  <CheckCircle2 className="w-5 h-5" />
                </button>
                <p className="flex-1 line-through text-foreground text-sm">{task.title_bn || task.title}</p>
                <button onClick={() => { deleteTask.mutate(task.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>📝 {bn ? 'নতুন কাজ যোগ করুন' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <Label>{bn ? 'কাজের বিবরণ' : 'Task Title'} *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={bn ? 'যেমন: ধানে সার দিন' : 'e.g. Apply fertilizer'} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{bn ? 'তারিখ' : 'Due Date'} *</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
              </div>
              <div>
                <Label>{bn ? 'অগ্রাধিকার' : 'Priority'}</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">{bn ? '🔴 জরুরি' : '🔴 High'}</SelectItem>
                    <SelectItem value="medium">{bn ? '🟡 মাঝারি' : '🟡 Medium'}</SelectItem>
                    <SelectItem value="low">{bn ? '🟢 কম' : '🟢 Low'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <button type="submit" disabled={addTask.isPending} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
              {addTask.isPending ? (bn ? 'যোগ হচ্ছে...' : 'Adding...') : (bn ? 'কাজ যোগ করুন' : 'Add Task')}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
