import { useState, useRef } from 'react';
import { Camera, X, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface PhotoUploadProps {
  bucket: 'crop-images' | 'livestock-images';
  farmId: string;
  onUpload: (path: string) => void;
  onAIResult?: (result: any) => void;
  analyzeType: 'crop' | 'livestock';
}

export function PhotoUpload({ bucket, farmId, onUpload, onAIResult, analyzeType }: PhotoUploadProps) {
  const { language } = useLanguage();
  const bn = language === 'bn';
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error(bn ? 'শুধুমাত্র ছবি আপলোড করুন' : 'Please upload images only');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(bn ? 'ছবি ৫MB এর কম হতে হবে' : 'Image must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to storage
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${farmId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      onUpload(filePath);
      toast.success(bn ? '📷 ছবি আপলোড হয়েছে' : '📷 Photo uploaded');

      // Auto-trigger AI analysis
      await analyzeImage(filePath, file);
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(bn ? 'আপলোড ব্যর্থ' : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const analyzeImage = async (storagePath: string, file: File) => {
    setAnalyzing(true);
    const loadingId = toast.loading(bn ? '🧠 AI ছবি বিশ্লেষণ করছে...' : '🧠 AI analyzing image...');

    try {
      // Convert to base64 for AI
      const base64 = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke('image-diagnosis', {
        body: {
          image: base64,
          type: analyzeType,
          farmId,
          storagePath,
          language,
        },
      });

      toast.dismiss(loadingId);

      if (error) throw error;

      setAiResult(data);
      onAIResult?.(data);

      // Show AI result toast
      if (data?.diagnosis) {
        const severity = data.risk_level === 'high' ? 'error' : data.risk_level === 'medium' ? 'warning' : 'success';
        const toastFn = severity === 'error' ? toast.error : severity === 'warning' ? toast.warning : toast.success;
        toastFn(
          `${data.emoji || '🔍'} ${bn ? data.title_bn : data.title_en}`,
          { description: bn ? data.diagnosis_bn : data.diagnosis_en, duration: 10000 }
        );
      }
    } catch (err) {
      toast.dismiss(loadingId);
      console.error('AI analysis error:', err);
      toast.error(bn ? 'AI বিশ্লেষণ ব্যর্থ' : 'AI analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const removePhoto = () => {
    setPreview(null);
    setAiResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {bn ? '📷 ছবি (AI বিশ্লেষণ)' : '📷 Photo (AI Analysis)'}
      </p>

      {!preview ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : (
            <Camera className="w-8 h-8 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {uploading
              ? (bn ? 'আপলোড হচ্ছে...' : 'Uploading...')
              : (bn ? 'ছবি তুলুন বা আপলোড করুন' : 'Take or upload a photo')}
          </span>
          <span className="text-xs text-muted-foreground/60">
            {bn ? 'AI স্বয়ংক্রিয়ভাবে বিশ্লেষণ করবে' : 'AI will analyze automatically'}
          </span>
        </button>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-40 object-cover rounded-xl border"
          />
          <button
            type="button"
            onClick={removePhoto}
            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1"
          >
            <X className="w-4 h-4" />
          </button>
          {analyzing && (
            <div className="absolute inset-0 bg-background/70 rounded-xl flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-sm font-medium">{bn ? 'AI বিশ্লেষণ চলছে...' : 'AI analyzing...'}</span>
            </div>
          )}
        </div>
      )}

      {/* AI Result Card */}
      {aiResult?.diagnosis && (
        <div className={`rounded-lg p-3 text-sm space-y-1 ${
          aiResult.risk_level === 'high' ? 'bg-destructive/10 border border-destructive/30' :
          aiResult.risk_level === 'medium' ? 'bg-yellow-500/10 border border-yellow-500/30' :
          'bg-green-500/10 border border-green-500/30'
        }`}>
          <p className="font-semibold flex items-center gap-1">
            {aiResult.emoji} {bn ? aiResult.title_bn : aiResult.title_en}
          </p>
          <p className="text-muted-foreground">{bn ? aiResult.diagnosis_bn : aiResult.diagnosis_en}</p>
          {aiResult.recommendations_bn && (
            <ul className="list-disc list-inside text-muted-foreground mt-1">
              {(bn ? aiResult.recommendations_bn : aiResult.recommendations_en)?.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
