import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Image, Video, Music, Trash2, Search, Shield, Eye } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface ContentItem {
  id: string;
  title: string;
  created_at: string;
  user_id: string;
  profile?: Profile;
}

const translations = {
  uz: {
    title: "Admin Panel",
    dashboard: "Dashboard",
    users: "Foydalanuvchilar",
    images: "Rasmlar",
    videos: "Videolar",
    music: "Musiqalar",
    search: "Qidirish...",
    delete: "O'chirish",
    view: "Ko'rish",
    confirmDelete: "O'chirishni tasdiqlang",
    deleteUserDesc: "Bu foydalanuvchini o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.",
    deleteContentDesc: "Bu kontentni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.",
    cancel: "Bekor qilish",
    confirm: "Tasdiqlash",
    totalUsers: "Jami foydalanuvchilar",
    totalImages: "Jami rasmlar",
    totalVideos: "Jami videolar",
    totalMusic: "Jami musiqalar",
    noAccess: "Sizda admin huquqi yo'q",
    loading: "Yuklanmoqda...",
    deleted: "Muvaffaqiyatli o'chirildi",
    error: "Xatolik yuz berdi",
  },
  ru: {
    title: "Админ панель",
    dashboard: "Дашборд",
    users: "Пользователи",
    images: "Изображения",
    videos: "Видео",
    music: "Музыка",
    search: "Поиск...",
    delete: "Удалить",
    view: "Просмотр",
    confirmDelete: "Подтвердите удаление",
    deleteUserDesc: "Вы хотите удалить этого пользователя? Это действие нельзя отменить.",
    deleteContentDesc: "Вы хотите удалить этот контент? Это действие нельзя отменить.",
    cancel: "Отмена",
    confirm: "Подтвердить",
    totalUsers: "Всего пользователей",
    totalImages: "Всего изображений",
    totalVideos: "Всего видео",
    totalMusic: "Всего музыки",
    noAccess: "У вас нет прав администратора",
    loading: "Загрузка...",
    deleted: "Успешно удалено",
    error: "Произошла ошибка",
  },
  en: {
    title: "Admin Panel",
    dashboard: "Dashboard",
    users: "Users",
    images: "Images",
    videos: "Videos",
    music: "Music",
    search: "Search...",
    delete: "Delete",
    view: "View",
    confirmDelete: "Confirm Deletion",
    deleteUserDesc: "Are you sure you want to delete this user? This action cannot be undone.",
    deleteContentDesc: "Are you sure you want to delete this content? This action cannot be undone.",
    cancel: "Cancel",
    confirm: "Confirm",
    totalUsers: "Total Users",
    totalImages: "Total Images",
    totalVideos: "Total Videos",
    totalMusic: "Total Music",
    noAccess: "You don't have admin access",
    loading: "Loading...",
    deleted: "Successfully deleted",
    error: "An error occurred",
  },
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { language } = useLanguage();
  const { toast } = useToast();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [images, setImages] = useState<ContentItem[]>([]);
  const [videos, setVideos] = useState<ContentItem[]>([]);
  const [music, setMusic] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "user" | "image" | "video" | "music";
    id: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate("/");
    }
  }, [isAdmin, adminLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchProfiles(),
      fetchImages(),
      fetchVideos(),
      fetchMusic(),
    ]);
    setLoading(false);
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setProfiles(data);
  };

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from("images")
      .select("id, title, created_at, user_id")
      .order("created_at", { ascending: false });
    if (!error && data) setImages(data);
  };

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("videos")
      .select("id, title, created_at, user_id")
      .order("created_at", { ascending: false });
    if (!error && data) setVideos(data);
  };

  const fetchMusic = async () => {
    const { data, error } = await supabase
      .from("music")
      .select("id, title, created_at, user_id")
      .order("created_at", { ascending: false });
    if (!error && data) setMusic(data);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;

    const { type, id } = deleteDialog;
    let error;

    switch (type) {
      case "user":
        ({ error } = await supabase.from("profiles").delete().eq("id", id));
        if (!error) setProfiles((prev) => prev.filter((p) => p.id !== id));
        break;
      case "image":
        ({ error } = await supabase.from("images").delete().eq("id", id));
        if (!error) setImages((prev) => prev.filter((i) => i.id !== id));
        break;
      case "video":
        ({ error } = await supabase.from("videos").delete().eq("id", id));
        if (!error) setVideos((prev) => prev.filter((v) => v.id !== id));
        break;
      case "music":
        ({ error } = await supabase.from("music").delete().eq("id", id));
        if (!error) setMusic((prev) => prev.filter((m) => m.id !== id));
        break;
    }

    if (error) {
      toast({ title: t.error, description: error.message, variant: "destructive" });
    } else {
      toast({ title: t.deleted });
    }

    setDeleteDialog(null);
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredImages = images.filter((i) =>
    i.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMusic = music.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || adminLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[50vh]">
        <Card className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">{t.noAccess}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">{t.title}</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.totalUsers}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.totalImages}</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{images.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.totalVideos}</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{videos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.totalMusic}</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{music.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            {t.users}
          </TabsTrigger>
          <TabsTrigger value="images">
            <Image className="h-4 w-4 mr-2" />
            {t.images}
          </TabsTrigger>
          <TabsTrigger value="videos">
            <Video className="h-4 w-4 mr-2" />
            {t.videos}
          </TabsTrigger>
          <TabsTrigger value="music">
            <Music className="h-4 w-4 mr-2" />
            {t.music}
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="space-y-2">
            {loading ? (
              [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)
            ) : filteredProfiles.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            ) : (
              filteredProfiles.map((profile) => (
                <Card key={profile.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{profile.username}</p>
                        <p className="text-sm text-muted-foreground">{profile.full_name}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, type: "user", id: profile.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images">
          <div className="space-y-2">
            {loading ? (
              [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)
            ) : filteredImages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No images found</p>
            ) : (
              filteredImages.map((image) => (
                <Card key={image.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{image.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(image.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialog({ open: true, type: "image", id: image.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos">
          <div className="space-y-2">
            {loading ? (
              [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)
            ) : filteredVideos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No videos found</p>
            ) : (
              filteredVideos.map((video) => (
                <Card key={video.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{video.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(video.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialog({ open: true, type: "video", id: video.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Music Tab */}
        <TabsContent value="music">
          <div className="space-y-2">
            {loading ? (
              [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)
            ) : filteredMusic.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No music found</p>
            ) : (
              filteredMusic.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialog({ open: true, type: "music", id: item.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog?.open} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog?.type === "user" ? t.deleteUserDesc : t.deleteContentDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPanel;
