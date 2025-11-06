import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Heart, Play } from "lucide-react";
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

interface VideoCardProps {
  id: string;
  videoUrl: string;
  title: string;
  description: string | null;
  author: string;
  authorId: string;
  likesCount: number;
  storagePath: string | null;
  onDelete?: () => void;
}

export function VideoCard({
  id,
  videoUrl,
  title,
  description,
  author,
  authorId,
  likesCount,
  storagePath,
  onDelete
}: VideoCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likesCount);

  const handleLike = async () => {
    if (!user) {
      toast.error("Like qilish uchun tizimga kiring");
      navigate('/auth');
      return;
    }

    try {
      if (liked) {
        await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', id)
          .eq('user_id', user.id);
        setLiked(false);
        setCurrentLikes(prev => prev - 1);
      } else {
        await supabase
          .from('video_likes')
          .insert({ video_id: id, user_id: user.id });
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
      toast.error("Siz bu videoni o'chira olmaysiz");
      return;
    }

    try {
      // Delete from storage if path exists
      if (storagePath) {
        await supabase.storage.from('videos').remove([storagePath]);
      }

      // Delete from database (cascade will handle related records)
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Video o'chirildi");
      onDelete?.();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error("Video o'chirishda xatolik yuz berdi");
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg group">
      <div className="relative aspect-video bg-black">
        <video
          src={videoUrl}
          className="w-full h-full object-cover"
          preload="metadata"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="h-16 w-16 text-white" />
        </div>
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
                  <AlertDialogTitle>Videoni o'chirish</AlertDialogTitle>
                  <AlertDialogDescription>
                    Haqiqatan ham bu videoni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
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
