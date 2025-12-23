import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Newspaper,
  Heart,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Plus,
  Pin,
  Flag,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Post {
  id: string;
  title: string | null;
  content: string;
  type: string | null;
  is_pinned: boolean | null;
  created_at: string;
  author_id: string;
  attachments: any;
}

interface PostWithAuthor extends Post {
  author?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

const categories = ["Tous", "announcement", "info", "event", "discussion"];
const categoryLabels: Record<string, string> = {
  "Tous": "Tous",
  "announcement": "Annonces",
  "info": "Infos",
  "event": "Événements",
  "discussion": "Discussions",
};

export default function Newsfeed() {
  const { user, profile, logout } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tous");
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch author profiles
      if (postsData && postsData.length > 0) {
        const authorIds = [...new Set(postsData.map(p => p.author_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', authorIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        
        const postsWithAuthors = postsData.map(post => ({
          ...post,
          author: profileMap.get(post.author_id),
        }));

        setPosts(postsWithAuthors);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return "À l'instant";
    if (diffHours < 24) return `Il y a ${diffHours} heure(s)`;
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getAuthorName = (post: PostWithAuthor) => {
    if (post.author?.first_name || post.author?.last_name) {
      return `${post.author.first_name || ''} ${post.author.last_name || ''}`.trim();
    }
    return post.author?.email?.split('@')[0] || 'Utilisateur';
  };

  const getAuthorInitials = (post: PostWithAuthor) => {
    const name = getAuthorName(post);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredPosts = activeCategory === "Tous" 
    ? posts 
    : posts.filter(post => post.type === activeCategory);

  if (!user || !profile) return null;

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Actualités</h1>
            <p className="text-muted-foreground mt-1">Communications et discussions de la résidence</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Publier
          </Button>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "secondary"}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className="shrink-0"
            >
              {categoryLabels[category] || category}
            </Button>
          ))}
        </div>

        {/* Posts Feed */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-8 text-center">
              <Newspaper className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune publication</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className={`shadow-soft hover:shadow-medium transition-shadow ${post.is_pinned ? "border-primary/30" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getAuthorInitials(post)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{getAuthorName(post)}</span>
                          {post.type === 'announcement' && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Officiel</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatDate(post.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {post.is_pinned && (
                        <Pin className="h-4 w-4 text-primary" />
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Partager
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Flag className="h-4 w-4 mr-2" />
                            Signaler
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                  <div>
                    {post.type && (
                      <Badge variant="outline" className="mb-2 text-xs">
                        {categoryLabels[post.type] || post.type}
                      </Badge>
                    )}
                    {post.title && (
                      <h3 className="font-semibold text-foreground mb-2">{post.title}</h3>
                    )}
                    <p className="text-sm text-muted-foreground leading-relaxed">{post.content}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-2 border-t border-border">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Heart className="h-4 w-4 mr-1.5" />
                      0
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <MessageSquare className="h-4 w-4 mr-1.5" />
                      0
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground ml-auto">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
