import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MusicCard } from "@/components/MusicCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Music, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Music {
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
  } | null;
}

type SortOption = 'newest' | 'oldest' | 'most-liked' | 'least-liked';

const translations = {
  uz: {
    title: "Mening Musiqalarim",
    subtitle: "Siz yaratgan barcha musiqalarni bu yerda topishingiz mumkin",
    backToMusic: "Musiqaga qaytish",
    sortBy: "Saralash",
    newest: "Eng yangi",
    oldest: "Eng eski",
    mostLiked: "Eng ko'p like",
    leastLiked: "Eng kam like",
    noMusic: "Hech qanday musiqa topilmadi",
    createFirst: "AI Musiqa sahifasida birinchi musiqangizni yarating",
    loginRequired: "Musiqalarni ko'rish uchun tizimga kiring",
  },
  ru: {
    title: "Моя Музыка",
    subtitle: "Здесь вы можете найти всю музыку, которую создали",
    backToMusic: "Вернуться к музыке",
    sortBy: "Сортировать",
    newest: "Самые новые",
    oldest: "Самые старые",
    mostLiked: "Больше всего лайков",
    leastLiked: "Меньше всего лайков",
    noMusic: "Музыка не найдена",
    createFirst: "Создайте свою первую музыку на странице AI Музыка",
    loginRequired: "Войдите, чтобы увидеть свою музыку",
  },
  en: {
    title: "My Music",
    subtitle: "All music you've created can be found here",
    backToMusic: "Back to Music",
    sortBy: "Sort by",
    newest: "Newest",
    oldest: "Oldest",
    mostLiked: "Most Liked",
    leastLiked: "Least Liked",
    noMusic: "No music found",
    createFirst: "Create your first music on AI Music page",
    loginRequired: "Login to see your music",
  }
};

export default function MyMusic() {
  const [music, setMusic] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const trans = translations[language as keyof typeof translations];

  useEffect(() => {
    if (user) {
      fetchMusic();

      const musicChannel = supabase
        .channel('my-music')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'music',
          filter: `user_id=eq.${user.id}`
        }, fetchMusic)
        .subscribe();

      return () => {
        supabase.removeChannel(musicChannel);
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (music.length > 0) {
      sortMusic();
    }
  }, [sortBy]);

  const fetchMusic = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('music')
        .select('id, audio_url, title, description, likes_count, user_id, storage_path, created_at, prompt')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .eq('id', user.id)
          .single();

        const musicWithProfile = data.map(track => ({
          ...track,
          profiles: profileData || null
        }));

        setMusic(musicWithProfile as Music[]);
      } else {
        setMusic([]);
      }
    } catch (error) {
      console.error('Error fetching music:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortMusic = () => {
    const sorted = [...music];
    
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'most-liked':
        sorted.sort((a, b) => b.likes_count - a.likes_count);
        break;
      case 'least-liked':
        sorted.sort((a, b) => a.likes_count - b.likes_count);
        break;
    }
    
    setMusic(sorted);
  };

  if (!user) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/ai-music')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {trans.backToMusic}
          </Button>

          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
            <div className="text-center space-y-4">
              <Music className="mx-auto h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">{trans.loginRequired}</p>
              </div>
              <Button onClick={() => navigate('/auth')}>
                Kirish
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/ai-music')}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {trans.backToMusic}
        </Button>

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-primary">
                <Music className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">{trans.title}</h1>
                <p className="text-muted-foreground">{trans.subtitle}</p>
              </div>
            </div>
          </div>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={trans.sortBy} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{trans.newest}</SelectItem>
              <SelectItem value="oldest">{trans.oldest}</SelectItem>
              <SelectItem value="most-liked">{trans.mostLiked}</SelectItem>
              <SelectItem value="least-liked">{trans.leastLiked}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Jami musiqalar:</span>
              <span className="font-medium">{music.length}</span>
            </div>
            {music.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Jami like'lar:</span>
                <span className="font-medium">{music.reduce((sum, m) => sum + m.likes_count, 0)}</span>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : music.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {music.map((track) => (
              <MusicCard 
                key={track.id}
                id={track.id}
                audioUrl={track.audio_url}
                author={track.profiles?.username || 'Unknown'}
                authorId={track.user_id}
                title={track.title}
                description={track.description}
                likesCount={track.likes_count}
                storagePath={track.storage_path}
                onDelete={fetchMusic}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
            <div className="text-center space-y-4">
              <Music className="mx-auto h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">{trans.noMusic}</p>
                <p className="text-sm text-muted-foreground">{trans.createFirst}</p>
              </div>
              <Button onClick={() => navigate('/ai-music')}>
                Musiqa yaratish
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
