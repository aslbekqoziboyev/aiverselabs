import { useState, useMemo } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ImageCard } from "@/components/ImageCard";

// Mock data - keyinchalik backend bilan almashtiriladi
const mockImages = [
  {
    id: "1",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop",
    author: "Ali Valiyev",
    tags: ["AI", "art", "digital"],
    comments: [
      { author: "Sardor", text: "Ajoyib ish!" },
      { author: "Madina", text: "Juda chiroyli!" },
    ],
    likes: 24,
  },
  {
    id: "2",
    imageUrl: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&auto=format&fit=crop",
    author: "Dilnoza Karimova",
    tags: ["nature", "landscape", "AI"],
    comments: [{ author: "Jasur", text: "Tabiat go'zal!" }],
    likes: 18,
  },
  {
    id: "3",
    imageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&auto=format&fit=crop",
    author: "Bekzod Tursunov",
    tags: ["abstract", "colorful", "art"],
    comments: [],
    likes: 31,
  },
  {
    id: "4",
    imageUrl: "https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=800&auto=format&fit=crop",
    author: "Nilufar Yusupova",
    tags: ["portrait", "AI", "faces"],
    comments: [
      { author: "Kamol", text: "Sehr kabi!" },
      { author: "Zarina", text: "AI qanday qilib bunchalik real yasaydi?" },
    ],
    likes: 42,
  },
  {
    id: "5",
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop",
    author: "Rustam Azimov",
    tags: ["space", "cosmic", "stars"],
    comments: [{ author: "Sherzod", text: "Koinot sirlari!" }],
    likes: 27,
  },
  {
    id: "6",
    imageUrl: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&auto=format&fit=crop",
    author: "Malika Saidova",
    tags: ["fantasy", "magical", "art"],
    comments: [],
    likes: 19,
  },
];

export default function Gallery() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) return mockImages;

    const query = searchQuery.toLowerCase().replace("#", "");
    return mockImages.filter((image) =>
      image.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [searchQuery]);

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

        {filteredImages.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredImages.map((image) => (
              <ImageCard key={image.id} {...image} />
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
