import { useState } from "react";
import { Download, MessageCircle, Heart, User } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

interface ImageCardProps {
  id: string;
  imageUrl: string;
  author: string;
  tags: string[];
  comments: Array<{ author: string; text: string }>;
  likes: number;
}

export function ImageCard({ imageUrl, author, tags, comments, likes }: ImageCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [newComment, setNewComment] = useState("");

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  const handleDownload = () => {
    // Download logic will be implemented with backend
    console.log("Downloading image...");
  };

  const handleComment = () => {
    if (newComment.trim()) {
      // Comment logic will be implemented with backend
      console.log("Adding comment:", newComment);
      setNewComment("");
    }
  };

  return (
    <Card className="group overflow-hidden transition-smooth hover:shadow-hover gradient-card">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="gradient-primary text-white text-xs">
                {author.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{author}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className="transition-smooth"
          >
            <Heart
              className={`h-4 w-4 ${liked ? "fill-destructive text-destructive" : ""}`}
            />
            <span className="ml-1 text-xs">{likeCount}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={imageUrl}
            alt="AI generated art"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="transition-smooth hover:bg-primary hover:text-primary-foreground cursor-pointer"
            >
              #{tag}
            </Badge>
          ))}
        </div>

        <div className="flex w-full items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex-1 transition-smooth"
          >
            <Download className="mr-2 h-4 w-4" />
            Yuklab olish
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex-1 transition-smooth"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Sharhlar ({comments.length})
          </Button>
        </div>

        {showComments && (
          <div className="w-full space-y-3">
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg bg-muted p-3">
              {comments.length > 0 ? (
                comments.map((comment, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span className="text-xs font-medium">{comment.author}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Hali sharhlar yo'q</p>
              )}
            </div>

            <div className="flex gap-2">
              <Textarea
                placeholder="Sharh yozing..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px] resize-none transition-smooth"
              />
              <Button onClick={handleComment} size="sm" className="gradient-primary">
                Yuborish
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
