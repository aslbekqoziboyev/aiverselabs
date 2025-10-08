import { useState, useMemo, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ImageCard } from "@/components/ImageCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface Image {
  id: string;
  image_url: string;
  title: string;
  description: string | null;
  likes_count: number;
  user_id: string;
  storage_path: string | null;
  profiles: {
    username: string;
    full_name: string | null;
  } | null;
}

export default function Gallery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchImages();

    // Real-time subscription for new images
    const channel = supabase
      .channel('gallery-images')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'images'
        },
        () => {
          fetchImages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('images')
        .select(`
          *,
          profiles:user_id (
            username,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) return images;

    const query = searchQuery.toLowerCase().replace("#", "");
    return images.filter((image) =>
      image.title?.toLowerCase().includes(query) ||
      image.description?.toLowerCase().includes(query)
    );
  }, [searchQuery, images]);

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              Rasmlar galereyasi
            </h1>
            <p className="text-muted-foreground">
              AI va ijod - San'at va texnologiya uyg'unligi
            </p>
          </div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Teglar bo'yicha qidirish... (#nature, #AI, #art)"
          />
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
        ) : filteredImages.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredImages.map((image) => (
              <ImageCard 
                key={image.id} 
                id={image.id}
                imageUrl={image.image_url}
                author={image.profiles?.username || 'Unknown'}
                authorId={image.user_id}
                title={image.title}
                description={image.description}
                likesCount={image.likes_count}
                storagePath={image.storage_path}
                onDelete={fetchImages}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">Hech narsa topilmadi</p>
              <p className="text-sm text-muted-foreground">
                Boshqa teglar bilan qidiring
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
