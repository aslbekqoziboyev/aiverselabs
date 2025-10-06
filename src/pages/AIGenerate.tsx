import { useState } from "react";
import { Sparkles, Download, Wand2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AIGenerate() {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Xatolik",
        description: "Iltimos, prompt kiriting",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    // Simulate AI generation - backend integration will be added
    setTimeout(() => {
      // Mock: Using a random image
      const randomId = Math.floor(Math.random() * 1000);
      setGeneratedImage(`https://images.unsplash.com/photo-${1618005182384 + randomId}?w=800&auto=format&fit=crop`);
      setIsGenerating(false);
      
      toast({
        title: "Tayyor!",
        description: "Rasm muvaffaqiyatli yaratildi",
      });
    }, 3000);
  };

  const handleDownload = () => {
    if (generatedImage) {
      toast({
        title: "Yuklab olish",
        description: "Rasm yuklab olinmoqda...",
      });
    }
  };

  const handlePublish = () => {
    if (generatedImage) {
      toast({
        title: "Muvaffaqiyatli!",
        description: "Rasm galereyaga joylashtirildi",
      });
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg gradient-primary p-2">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                AI Rasm Generatori
              </h1>
              <p className="text-muted-foreground">
                Sun'iy intellekt yordamida rasm yarating
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Prompt kiriting</CardTitle>
              <CardDescription>
                Yaratmoqchi bo'lgan rasmingizni batafsil tasvirlab bering
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Sizning tasavvuringiz</Label>
                <Textarea
                  id="prompt"
                  placeholder="Masalan: Oltin osmon ostida qadimiy shahar, kecha vaqti, yulduzlar porlayotgan..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[200px] resize-none transition-smooth"
                />
              </div>

              <Button
                size="lg"
                className="w-full gradient-primary transition-smooth hover:shadow-hover"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Wand2 className="mr-2 h-5 w-5 animate-spin" />
                    Yaratilmoqda...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Rasm yaratish
                  </>
                )}
              </Button>

              <div className="space-y-2 rounded-lg bg-muted p-4">
                <h3 className="text-sm font-medium">Maslahatlar:</h3>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Rang va yorug'likni ta'riflang</li>
                  <li>• Obyektlarning joylashuvini ko'rsating</li>
                  <li>• Arzimas tafsilotlarni qo'shing</li>
                  <li>• Kayfiyat va atmosferani ifodalang</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Natija</CardTitle>
              <CardDescription>
                Yaratilgan rasm bu yerda ko'rinadi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedImage ? (
                <>
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={generatedImage}
                      alt="AI generated"
                      className="h-auto w-full object-cover"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Button
                      variant="outline"
                      className="w-full transition-smooth"
                      onClick={handleDownload}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Yuklab olish
                    </Button>
                    <Button
                      className="w-full gradient-primary transition-smooth"
                      onClick={handlePublish}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Galereyaga joylash
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed">
                  <div className="text-center space-y-3">
                    <div className="mx-auto rounded-full bg-primary/10 p-4 w-fit">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-sm font-medium">
                      Rasm hali yaratilmagan
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Prompt yozib, "Rasm yaratish" tugmasini bosing
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
