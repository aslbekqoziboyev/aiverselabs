import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WaveformVisualizer } from "@/components/WaveformVisualizer";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Heart, 
  Download, 
  Share2, 
  Music2,
  Copy,
  Twitter,
  Facebook,
  Link2,
  FileText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MusicData {
  id: string;
  audio_url: string;
  title: string;
  description: string | null;
  likes_count: number;
  user_id: string;
  storage_path: string | null;
  created_at: string;
  prompt: string | null;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const translations = {
  uz: {
    back: "Orqaga",
    lyrics: "Qo'shiq matni",
    noLyrics: "Qo'shiq matni mavjud emas",
    download: "Yuklab olish",
    share: "Ulashish",
    copyLink: "Havolani nusxalash",
    shareTwitter: "Twitter'da ulashish",
    shareFacebook: "Facebook'da ulashish",
    linkCopied: "Havola nusxalandi!",
    downloadStarted: "Yuklab olish boshlandi...",
    notFound: "Musiqa topilmadi",
    createdAt: "Yaratilgan",
    prompt: "Prompt",
    author: "Muallif",
  },
  ru: {
    back: "Назад",
    lyrics: "Текст песни",
    noLyrics: "Текст песни недоступен",
    download: "Скачать",
    share: "Поделиться",
    copyLink: "Копировать ссылку",
    shareTwitter: "Поделиться в Twitter",
    shareFacebook: "Поделиться в Facebook",
    linkCopied: "Ссылка скопирована!",
    downloadStarted: "Загрузка началась...",
    notFound: "Музыка не найдена",
    createdAt: "Создано",
    prompt: "Промпт",
    author: "Автор",
  },
  en: {
    back: "Back",
    lyrics: "Lyrics",
    noLyrics: "Lyrics not available",
    download: "Download",
    share: "Share",
    copyLink: "Copy link",
    shareTwitter: "Share on Twitter",
    shareFacebook: "Share on Facebook",
    linkCopied: "Link copied!",
    downloadStarted: "Download started...",
    notFound: "Music not found",
    createdAt: "Created",
    prompt: "Prompt",
    author: "Author",
  }
};

export default function MusicDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [music, setMusic] = useState<MusicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(0);

  const trans = translations[language as keyof typeof translations];

  useEffect(() => {
    if (id) {
      fetchMusic();
      checkIfLiked();
    }
  }, [id, user]);

  const fetchMusic = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('music')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', data.user_id)
          .single();

        setMusic({
          ...data,
          profiles: profileData || null
        });
        setCurrentLikes(data.likes_count || 0);
      }
    } catch (error) {
      console.error('Error fetching music:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = async () => {
    if (!user || !id) return;

    const { data } = await supabase
      .from('music_likes')
      .select('id')
      .eq('music_id', id)
      .eq('user_id', user.id)
      .single();

    setLiked(!!data);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Like qilish uchun tizimga kiring");
      navigate('/auth');
      return;
    }

    try {
      if (liked) {
        await supabase
          .from('music_likes')
          .delete()
          .eq('music_id', id)
          .eq('user_id', user.id);
        
        await supabase
          .from('music')
          .update({ likes_count: currentLikes - 1 })
          .eq('id', id);
        
        setLiked(false);
        setCurrentLikes(prev => prev - 1);
      } else {
        await supabase
          .from('music_likes')
          .insert({ music_id: id, user_id: user.id });
        
        await supabase
          .from('music')
          .update({ likes_count: currentLikes + 1 })
          .eq('id', id);
        
        setLiked(true);
        setCurrentLikes(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleDownload = async () => {
    if (!music) return;

    try {
      toast.info(trans.downloadStarted);
      
      const response = await fetch(music.audio_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${music.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error("Yuklab olishda xatolik");
    }
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    toast.success(trans.linkCopied);
  };

  const handleShareTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out "${music?.title}" - AI Generated Music`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!music) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Music2 className="h-16 w-16 mx-auto text-muted-foreground" />
          <p className="text-xl">{trans.notFound}</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {trans.back}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {trans.back}
        </Button>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Album Art & Controls */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              <div className="relative aspect-square bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                <Music2 className="h-32 w-32 text-primary/40" />
                <Button
                  onClick={togglePlay}
                  className="absolute gradient-primary rounded-full h-20 w-20 shadow-xl"
                  size="icon"
                >
                  {isPlaying ? (
                    <Pause className="h-10 w-10 text-white" />
                  ) : (
                    <Play className="h-10 w-10 text-white ml-1" />
                  )}
                </Button>
              </div>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h1 className="text-2xl font-bold">{music.title}</h1>
                  <p className="text-muted-foreground">
                    {trans.author}: {music.profiles?.username || 'Unknown'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLike}
                    className={liked ? "text-red-500 border-red-500" : ""}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-current" : ""}`} />
                    {currentLikes}
                  </Button>

                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-1" />
                    {trans.download}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-1" />
                        {trans.share}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleCopyLink}>
                        <Link2 className="h-4 w-4 mr-2" />
                        {trans.copyLink}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShareTwitter}>
                        <Twitter className="h-4 w-4 mr-2" />
                        {trans.shareTwitter}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShareFacebook}>
                        <Facebook className="h-4 w-4 mr-2" />
                        {trans.shareFacebook}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Waveform & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Waveform */}
            <Card>
              <CardContent className="p-6">
                <WaveformVisualizer
                  audioUrl={music.audio_url}
                  isPlaying={isPlaying}
                  audioRef={audioRef}
                />
                <audio
                  ref={audioRef}
                  src={music.audio_url}
                  onEnded={() => setIsPlaying(false)}
                  crossOrigin="anonymous"
                />
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardContent className="p-6 space-y-4">
                {music.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{music.description}</p>
                  </div>
                )}

                {music.prompt && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {trans.prompt}
                    </h3>
                    <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                      {music.prompt}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
                  <span>{trans.createdAt}: {formatDate(music.created_at)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Lyrics Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {trans.lyrics}
                  </h3>
                  {music.prompt && (
                    <Button variant="ghost" size="sm" onClick={() => {
                      navigator.clipboard.writeText(music.prompt || '');
                      toast.success(trans.linkCopied);
                    }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="min-h-[200px] bg-muted/50 rounded-lg p-4">
                  {music.prompt ? (
                    <pre className="whitespace-pre-wrap font-sans text-foreground">
                      {music.prompt}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      {trans.noLyrics}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
