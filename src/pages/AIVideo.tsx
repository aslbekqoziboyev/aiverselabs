import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download } from "lucide-react";

export default function AIVideo() {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
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
            <Button
              onClick={() => {
                const a = document.createElement('a');
                a.href = videoUrl;
                a.download = 'ai-generated-video.mp4';
                a.click();
              }}
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {t('aiVideo.download')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
