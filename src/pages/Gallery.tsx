import { useState, useMemo, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ImageCard } from "@/components/ImageCard";
import { VideoCard } from "@/components/VideoCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface Video {
  id: string;
  video_url: string;
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
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    fetchImages();
    fetchVideos();

    // Real-time subscription for images
    const imagesChannel = supabase
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

    // Real-time subscription for videos
    const videosChannel = supabase
      .channel('gallery-videos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos'
        },
        () => {
          fetchVideos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(imagesChannel);
      supabase.removeChannel(videosChannel);
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
        .order('likes_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          id,
          video_url,
          title,
          description,
          likes_count,
          user_id,
          storage_path,
          created_at
        `)
        .order('likes_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately for videos
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(v => v.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .in('id', userIds);

        const profilesMap = new Map(
          profilesData?.map(p => [p.id, p]) || []
        );

        const videosWithProfiles = data.map(video => ({
          ...video,
          profiles: profilesMap.get(video.user_id) || null
        }));

        setVideos(videosWithProfiles as Video[]);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
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

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos;

    const query = searchQuery.toLowerCase().replace("#", "");
    return videos.filter((video) =>
      video.title?.toLowerCase().includes(query) ||
      video.description?.toLowerCase().includes(query)
    );
  }, [searchQuery, videos]);

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              {t('gallery.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('gallery.subtitle')}
            </p>
          </div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('gallery.search')}
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">Barchasi</TabsTrigger>
            <TabsTrigger value="images">Rasmlar</TabsTrigger>
            <TabsTrigger value="videos">Videolar</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
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
            ) : filteredImages.length > 0 || filteredVideos.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredImages.map((image) => (
                  <ImageCard 
                    key={`image-${image.id}`}
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
                {filteredVideos.map((video) => (
                  <VideoCard 
                    key={`video-${video.id}`}
                    id={video.id}
                    videoUrl={video.video_url}
                    author={video.profiles?.username || 'Unknown'}
                    authorId={video.user_id}
                    title={video.title}
                    description={video.description}
                    likesCount={video.likes_count}
                    storagePath={video.storage_path}
                    onDelete={fetchVideos}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">{t('gallery.notFound')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('gallery.tryOther')}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="images" className="mt-6">
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
                  <p className="text-lg font-medium">{t('gallery.notFound')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('gallery.tryOther')}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="mt-6">
            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-video w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredVideos.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredVideos.map((video) => (
                  <VideoCard 
                    key={video.id}
                    id={video.id}
                    videoUrl={video.video_url}
                    author={video.profiles?.username || 'Unknown'}
                    authorId={video.user_id}
                    title={video.title}
                    description={video.description}
                    likesCount={video.likes_count}
                    storagePath={video.storage_path}
                    onDelete={fetchVideos}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">Hech qanday video topilmadi</p>
                  <p className="text-sm text-muted-foreground">
                    AI Video sahifasida video yarating
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
