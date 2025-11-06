import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download, Save } from "lucide-react";
import { useAuth } from "@/integrations/supabase/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function AIVideo() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a video description");
      return;
    }

    setIsGenerating(true);
    setVideoUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: { prompt }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Poll for video completion
      const pollInterval = setInterval(async () => {
        const { data: statusData, error: statusError } = await supabase.functions.invoke('check-video-status', {
          body: { predictionId: data.predictionId }
        });

        if (statusError) {
          clearInterval(pollInterval);
          toast.error("Error checking video status");
          setIsGenerating(false);
          return;
        }

        if (statusData.status === 'succeeded') {
          clearInterval(pollInterval);
          setVideoUrl(statusData.output);
          setIsGenerating(false);
          toast.success("Video yaratildi!");
        } else if (statusData.status === 'failed') {
          clearInterval(pollInterval);
          setIsGenerating(false);
          toast.error("Video yaratishda xatolik yuz berdi");
        }
      }, 3000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setIsGenerating(false);
          toast.error("Timeout: Video generation took too long");
        }
      }, 300000);

    } catch (error) {
      console.error('Error generating video:', error);
      toast.error("Xatolik yuz berdi");
      setIsGenerating(false);
    }
  };

  const handleSaveVideo = async () => {
    if (!user) {
      toast.error("Videoni saqlash uchun tizimga kiring");
      navigate('/auth');
      return;
    }

    if (!videoUrl) {
      toast.error("Avval video yarating");
      return;
    }

    if (!title.trim()) {
      toast.error("Video nomini kiriting");
      return;
    }

    setIsSaving(true);

    try {
      // Download video from URL
      const videoResponse = await fetch(videoUrl);
      const videoBlob = await videoResponse.blob();
      
      // Upload to storage
      const fileName = `${user.id}/${Date.now()}.mp4`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, videoBlob, {
          contentType: 'video/mp4'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          video_url: publicUrl,
          storage_path: fileName,
          prompt: prompt
        });

      if (dbError) throw dbError;

      toast.success("Video muvaffaqiyatli saqlandi!");
      
      // Reset form
      setPrompt("");
      setTitle("");
      setDescription("");
      setVideoUrl(null);
      
      // Navigate to gallery
      navigate('/');
    } catch (error) {
      console.error('Error saving video:', error);
      toast.error("Videoni saqlashda xatolik yuz berdi");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {t('aiVideo.title')}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('aiVideo.description')}
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Video tavsifi (Prompt)</label>
          <Textarea
            placeholder={t('aiVideo.promptPlaceholder')}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-32 text-lg"
            disabled={isGenerating}
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full gradient-primary text-white"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t('aiVideo.generating')}
            </>
          ) : (
            t('aiVideo.generateButton')
          )}
        </Button>

        {videoUrl && (
          <div className="mt-8 space-y-4">
            <div className="rounded-lg overflow-hidden bg-black">
              <video
                src={videoUrl}
                controls
                className="w-full"
                autoPlay
                loop
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Video nomi</label>
                <Input
                  placeholder="Video uchun nom kiriting..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tavsif (ixtiyoriy)</label>
                <Textarea
                  placeholder="Video haqida ma'lumot..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSaving}
                  className="min-h-20"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleSaveVideo}
                  disabled={isSaving || !title.trim()}
                  className="flex-1 gradient-primary text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Galereyaga saqlash
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = videoUrl;
                    a.download = 'ai-generated-video.mp4';
                    a.click();
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('aiVideo.download')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
