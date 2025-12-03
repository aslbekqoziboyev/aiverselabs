import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Heart, Music2, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

interface MusicCardProps {
  id: string;
  audioUrl: string;
  title: string;
  description: string | null;
  author: string;
  authorId: string;
  likesCount: number;
  storagePath: string | null;
  onDelete?: () => void;
}

export function MusicCard({
  id,
  audioUrl,
  title,
  description,
  author,
  authorId,
  likesCount,
  storagePath,
  onDelete
}: MusicCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likesCount);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio(audioUrl));

  const togglePlay = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  audio.onended = () => setIsPlaying(false);

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
        setLiked(false);
        setCurrentLikes(prev => prev - 1);
      } else {
        await supabase
          .from('music_likes')
          .insert({ music_id: id, user_id: user.id });
        setLiked(true);
        setCurrentLikes(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleDelete = async () => {
    if (!user || authorId !== user.id) {
      toast.error("Siz bu musiqani o'chira olmaysiz");
      return;
    }

    try {
      // Delete from storage if path exists
      if (storagePath) {
        await supabase.storage.from('music').remove([storagePath]);
      }

      // Delete from database (cascade will handle related records)
      const { error } = await supabase
        .from('music')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Musiqa o'chirildi");
      audio.pause();
      onDelete?.();
    } catch (error) {
      console.error('Error deleting music:', error);
      toast.error("Musiqa o'chirishda xatolik yuz berdi");
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg cursor-pointer group">
      <div 
        className="relative aspect-square bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
        onClick={() => navigate(`/music/${id}`)}
      >
        <Music2 className="h-24 w-24 text-primary/40 group-hover:scale-110 transition-transform" />
        <Button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="absolute gradient-primary rounded-full h-16 w-16"
          size="icon"
        >
          {isPlaying ? (
            <Pause className="h-8 w-8 text-white" />
          ) : (
            <Play className="h-8 w-8 text-white ml-1" />
          )}
        </Button>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {description}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            by <span className="font-medium">{author}</span>
          </p>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={liked ? "text-red-500" : ""}
          >
            <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-current" : ""}`} />
            {currentLikes}
          </Button>
          {user?.id === authorId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Musiqani o'chirish</AlertDialogTitle>
                  <AlertDialogDescription>
                    Haqiqatan ham bu musiqani o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    O'chirish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
