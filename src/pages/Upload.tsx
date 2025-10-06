import { useState } from "react";
import { Upload as UploadIcon, X, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Upload() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleUpload = () => {
    if (!selectedImage) {
      toast({
        title: "Xatolik",
        description: "Iltimos, rasm tanlang",
        variant: "destructive",
      });
      return;
    }

    if (tags.length === 0) {
      toast({
        title: "Xatolik",
        description: "Iltimos, kamida bitta teg qo'shing",
        variant: "destructive",
      });
      return;
    }

    // Backend integration will be added here
    toast({
      title: "Muvaffaqiyatli!",
      description: "Rasm muvaffaqiyatli joylashtirildi",
    });

    // Reset form
    setSelectedImage(null);
    setPreviewUrl("");
    setTags([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Rasm joylash</h1>
          <p className="text-muted-foreground">
            O'z ijodingizni dunyoga taqdim eting
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Rasm yuklash</CardTitle>
              <CardDescription>
                JPEG, PNG yoki WebP formatdagi rasmni tanlang
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center gap-4">
                {previewUrl ? (
                  <div className="relative w-full max-w-md overflow-hidden rounded-lg">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-auto w-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={() => {
                        setSelectedImage(null);
                        setPreviewUrl("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border transition-smooth hover:border-primary hover:bg-accent/50">
                    <div className="flex flex-col items-center gap-2">
                      <div className="rounded-full bg-primary/10 p-4">
                        <ImageIcon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Rasm yuklash uchun bosing</p>
                        <p className="text-xs text-muted-foreground">
                          yoki faylni bu yerga sudrab olib keling
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Teglar</CardTitle>
              <CardDescription>
                Rasmingizni topish oson bo'lishi uchun teglar qo'shing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="tag-input" className="sr-only">
                    Teg qo'shish
                  </Label>
                  <Input
                    id="tag-input"
                    placeholder="Teg kiriting va Enter bosing..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="transition-smooth"
                  />
                </div>
                <Button onClick={handleAddTag} variant="outline">
                  Qo'shish
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer transition-smooth hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      #{tag}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full gradient-primary transition-smooth hover:shadow-hover"
            onClick={handleUpload}
          >
            <UploadIcon className="mr-2 h-5 w-5" />
            Joylash
          </Button>
        </div>
      </div>
    </div>
  );
}
