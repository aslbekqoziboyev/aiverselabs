import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Music, Loader2, Download } from "lucide-react";
import { useAuth } from "@/integrations/supabase/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AIMusic = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMusic, setGeneratedMusic] = useState<{
    audioUrl: string;
    imageUrl: string;
    title: string;
  } | null>(null);

  const translations = {
    uz: {
      title: "AI Musiqa Yaratish",
      description: "Sun'iy intellekt yordamida musiqa va albom qoplamasi yarating",
      promptPlaceholder: "Musiqa haqida tavsif yozing (masalan: tinch, klassik fortepiano musiqasi)",
      generate: "Musiqa yaratish",
      generating: "Yaratilmoqda...",
      download: "Yuklab olish",
      loginRequired: "Musiqa yaratish uchun tizimga kiring",
      error: "Xatolik yuz berdi",
      success: "Musiqa muvaffaqiyatli yaratildi!",
    },
    ru: {
      title: "Создание AI Музыки",
      description: "Создайте музыку и обложку альбома с помощью искусственного интеллекта",
      promptPlaceholder: "Опишите музыку (например: спокойная классическая фортепианная музыка)",
      generate: "Создать музыку",
      generating: "Создание...",
      download: "Скачать",
      loginRequired: "Войдите для создания музыки",
      error: "Произошла ошибка",
      success: "Музыка успешно создана!",
    },
    en: {
      title: "AI Music Generation",
      description: "Create music and album cover using artificial intelligence",
      promptPlaceholder: "Describe the music (e.g., calm classical piano music)",
      generate: "Generate Music",
      generating: "Generating...",
      download: "Download",
      loginRequired: "Please log in to generate music",
      error: "An error occurred",
      success: "Music generated successfully!",
    },
  };

  const trans = translations[language as keyof typeof translations];

  const handleGenerate = async () => {
    if (!user) {
      toast.error(trans.loginRequired);
      navigate("/auth");
      return;
    }

    if (!prompt.trim()) {
      toast.error("Please enter a music description");
      return;
    }

    setIsGenerating(true);

    try {
      // Generate music
      toast.info("Musiqa yaratilmoqda, iltimos kuting...");
      
      const { data: musicData, error: musicError } = await supabase.functions.invoke('generate-music', {
        body: { prompt: prompt.trim() }
      });

      if (musicError) throw musicError;

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max
      let musicUrl = '';
      let musicTitle = '';
      let albumImageUrl = '';

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

        const { data: statusData, error: statusError } = await supabase.functions.invoke('check-music-status', {
          body: { clipIds: musicData.clipIds }
        });

        if (statusError) throw statusError;

        if (statusData.status === 'complete') {
          musicUrl = statusData.audioUrl;
          musicTitle = statusData.title;
          albumImageUrl = statusData.imageUrl;
          break;
        }

        attempts++;
        toast.info(`Musiqa yaratilmoqda... (${attempts * 5}s)`);
      }

      if (!musicUrl) {
        throw new Error('Musiqa yaratish vaqti tugadi');
      }

      // Generate album art based on the music title/prompt
      if (!albumImageUrl) {
        toast.info("Albom qoplamasi yaratilmoqda...");
        const albumPrompt = `Album cover art for a song titled "${musicTitle}". ${prompt}. Professional music album cover design, high quality, artistic.`;
        const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-ai-image', {
          body: { prompt: albumPrompt }
        });

        if (!imageError && imageData?.imageUrl) {
          albumImageUrl = imageData.imageUrl;
        }
      }

      setGeneratedMusic({
        audioUrl: musicUrl,
        imageUrl: albumImageUrl,
        title: musicTitle
      });

      toast.success(trans.success);
    } catch (error) {
      console.error("Error generating music:", error);
      toast.error(error instanceof Error ? error.message : trans.error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Music className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {trans.title}
          </h1>
          <p className="text-muted-foreground text-lg">
            {trans.description}
          </p>
        </div>

        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle>{trans.title}</CardTitle>
            <CardDescription>{trans.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={trans.promptPlaceholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-32 resize-none"
              disabled={isGenerating}
            />
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full gradient-primary text-white"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {trans.generating}
                </>
              ) : (
                <>
                  <Music className="mr-2 h-5 w-5" />
                  {trans.generate}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {generatedMusic && (
          <Card className="border-2 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={generatedMusic.imageUrl}
                  alt="Album Cover"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{generatedMusic.title}</h3>
                <audio controls className="w-full">
                  <source src={generatedMusic.audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
              <Button className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {trans.download}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AIMusic;
