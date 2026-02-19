import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { Send, Mic, MicOff, Camera, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveFarm } from '@/hooks/useFarm';
import { useCrops } from '@/hooks/useCrops';
import { useLivestock } from '@/hooks/useLivestock';
import { toast } from 'sonner';
import { useCanPerformAction, useIncrementUsage } from '@/hooks/useSubscription';
import { UpgradePrompt } from '@/components/shared/UpgradePrompt';
import { supabase } from '@/integrations/supabase/client';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-advisory`;

export function AIPage() {
  const { language } = useLanguage();
  const { navParams } = useNavigation();
  const { farm } = useActiveFarm();
  const { data: crops } = useCrops(farm?.id);
  const { data: livestock } = useLivestock(farm?.id);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTriggered = useRef(false);
  const bn = language === 'bn';
  const permissions = useCanPerformAction();
  const incrementUsage = useIncrementUsage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-trigger camera or voice based on navParams
  useEffect(() => {
    if (hasTriggered.current) return;
    if (navParams?.mode === 'camera') {
      hasTriggered.current = true;
      setTimeout(() => fileInputRef.current?.click(), 300);
    } else if (navParams?.mode === 'voice') {
      hasTriggered.current = true;
      setTimeout(() => handleVoice(), 300);
    }
  }, [navParams]);

  const farmContext = {
    farm: farm ? { name: farm.name, type: farm.type, district: farm.district } : null,
    crops: crops?.map(c => ({ name: c.name, stage: c.growth_stage, health: c.health_status })) || [],
    livestock: livestock?.map(l => ({ type: l.animal_type, count: l.count, breed: l.breed })) || [],
  };

  const streamChat = async (userMessages: Msg[], type = 'chat', image?: string) => {
    setIsLoading(true);
    let assistantSoFar = '';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ type, messages: userMessages, image, farmContext }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'AI service error');
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast.error(e.message || (bn ? 'ত্রুটি হয়েছে' : 'Error occurred'));
      setMessages(prev => [...prev, { role: 'assistant', content: bn ? '⚠️ দুঃখিত, একটি ত্রুটি হয়েছে। আবার চেষ্টা করুন।' : '⚠️ Sorry, an error occurred. Please try again.' }]);
    }
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (permissions.isFree && !permissions.canQuestion) {
      toast.error(bn ? `আজকের ${permissions.limits.questions}টি প্রশ্নের সীমা শেষ। আগামীকাল আবার চেষ্টা করুন বা আপগ্রেড করুন!` : `Daily limit of ${permissions.limits.questions} questions reached. Try tomorrow or upgrade!`);
      return;
    }
    const userMsg: Msg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    await streamChat(newMessages);
    if (permissions.isFree) incrementUsage.mutate('question');
  };

  const handleVoice = () => {
    if (permissions.isFree && !permissions.canVoice) {
      toast.error(bn ? `আজকের ${permissions.limits.voice}টি ভয়েস ইনপুটের সীমা শেষ। আপগ্রেড করুন!` : `Daily limit of ${permissions.limits.voice} voice inputs reached. Upgrade!`);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(bn ? 'আপনার ব্রাউজার ভয়েস ইনপুট সাপোর্ট করে না' : 'Your browser does not support voice input');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = bn ? 'bn-BD' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => { setIsListening(false); toast.error(bn ? 'ভয়েস ত্রুটি' : 'Voice error'); };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      if (permissions.isFree) incrementUsage.mutate('voice');
    };
    recognition.start();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (permissions.isFree && !permissions.canImage) {
      toast.error(bn ? `আজকের ${permissions.limits.images}টি ছবি বিশ্লেষণের সীমা শেষ। আপগ্রেড করুন!` : `Daily limit of ${permissions.limits.images} image analyses reached. Upgrade!`);
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const userMsg: Msg = { role: 'user', content: bn ? '📷 ছবি পাঠানো হয়েছে - রোগ শনাক্ত করুন' : '📷 Image sent - Detect disease' };
      setMessages(prev => [...prev, userMsg]);
      await streamChat([userMsg], 'disease_detect', base64);
      if (permissions.isFree) incrementUsage.mutate('image');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const quickPrompts = [
    { emoji: '💧', text: bn ? 'আজ কি সেচ দেওয়া উচিত?' : 'Should I irrigate today?' },
    { emoji: '🦠', text: bn ? 'আমার ফসলে কি রোগ হয়েছে?' : 'Is my crop diseased?' },
    { emoji: '🐄', text: bn ? 'গরুর খাদ্য পরামর্শ দিন' : 'Advise on cattle feed' },
    { emoji: '📊', text: bn ? 'এই মাসে কোন ফসল লাগাব?' : 'What crop to plant this month?' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          {bn ? 'এআই কৃষি পরামর্শদাতা' : 'AI Farm Advisor'}
        </h1>
        <p className="text-sm text-muted-foreground">{bn ? 'প্রশ্ন করুন, ছবি পাঠান, বা ভয়েস ব্যবহার করুন' : 'Ask questions, send images, or use voice'}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <span className="text-6xl block mb-4">🤖</span>
            <p className="text-lg font-medium text-foreground mb-2">{bn ? 'আমি আপনার কৃষি সহায়ক' : "I'm your farm assistant"}</p>
            <p className="text-sm text-muted-foreground mb-6">{bn ? 'যেকোনো কৃষি সমস্যা নিয়ে প্রশ্ন করুন' : 'Ask me anything about farming'}</p>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {quickPrompts.map((p, i) => (
                <button key={i} onClick={() => { setInput(p.text); }}
                  className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl text-sm text-left hover:bg-muted transition-colors">
                  <span className="text-xl">{p.emoji}</span>
                  <span className="text-foreground">{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn("max-w-[80%] rounded-2xl px-4 py-3",
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground')}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl bg-info/10 text-info hover:bg-info/20 transition-colors touch-target" title={bn ? 'ছবি পাঠান' : 'Send Image'}>
            <Camera className="w-5 h-5" />
          </button>
          <button onClick={handleVoice} disabled={isListening} className={cn("p-3 rounded-xl transition-colors touch-target", isListening ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-accent/20 text-accent-foreground hover:bg-accent/30')}>
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={bn ? 'আপনার প্রশ্ন লিখুন...' : 'Type your question...'}
            className="flex-1 px-4 py-3 rounded-xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 touch-target">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
