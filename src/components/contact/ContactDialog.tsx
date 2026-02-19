import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDialog({ open, onOpenChange }: ContactDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'ত্রুটি', description: 'আপনার ব্রাউজার ভয়েস ইনপুট সাপোর্ট করে না', variant: 'destructive' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'bn-BD';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setMessage(transcript);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({ title: 'ত্রুটি', description: 'অনুগ্রহ করে বার্তা লিখুন', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Fetch user profile for name, email, phone
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('user_id', user!.id)
        .maybeSingle();

      const { error } = await supabase.functions.invoke('contact-complaint', {
        body: {
          name: profile?.full_name || '',
          email: profile?.email || user?.email || '',
          phone: profile?.phone || '',
          message,
        },
      });

      if (error) throw error;

      toast({ title: '✅ সফল', description: 'আপনার বার্তা পাঠানো হয়েছে।' });
      setMessage('');
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'ত্রুটি', description: e.message || 'বার্তা পাঠাতে ব্যর্থ', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">📩 যোগাযোগ করুন</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>বার্তা / অভিযোগ</Label>
              <Button
                type="button"
                variant={isRecording ? 'destructive' : 'outline'}
                size="sm"
                onClick={isRecording ? stopVoiceInput : startVoiceInput}
                className="gap-1.5"
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                {isRecording ? 'বন্ধ করুন' : 'ভয়েস ইনপুট'}
              </Button>
            </div>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="আপনার বার্তা বা অভিযোগ এখানে লিখুন অথবা ভয়েস ইনপুট ব্যবহার করুন..."
              rows={5}
              className={isRecording ? 'border-destructive animate-pulse' : ''}
            />
            {isRecording && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                রেকর্ডিং চলছে... বাংলায় বলুন
              </p>
            )}
          </div>
          <Button onClick={handleSubmit} className="w-full gap-2" disabled={loading || !message.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            পাঠান
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
