import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Newspaper,
  Heart,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Filter,
  Plus,
  Pin,
  Flag,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Post {
  id: number;
  title: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  category: string;
  isOfficial: boolean;
  isPinned: boolean;
  likes: number;
  comments: number;
  createdAt: string;
  liked: boolean;
}

const samplePosts: Post[] = [
  {
    id: 1,
    title: "Travaux de ravalement - Planning actualisé",
    content: "Chers résidents, suite à notre réunion avec l'entreprise de ravalement, nous vous informons que les travaux débuteront le 15 février 2025. La façade côté rue sera traitée en premier, puis le côté cour. Nous vous tiendrons informés de l'avancement. Merci de votre compréhension.",
    author: { name: "Syndic Gestion Plus", role: "Gestionnaire" },
    category: "Travaux",
    isOfficial: true,
    isPinned: true,
    likes: 24,
    comments: 8,
    createdAt: "Il y a 2 heures",
    liked: false,
  },
  {
    id: 2,
    title: "Nouveau règlement intérieur disponible",
    content: "Le nouveau règlement intérieur, approuvé lors de la dernière AG, est maintenant disponible dans la section Documents. Les principales modifications concernent les horaires de bruit et l'utilisation des espaces communs.",
    author: { name: "Jean Martin", role: "Conseil Syndical" },
    category: "Documents",
    isOfficial: true,
    isPinned: false,
    likes: 12,
    comments: 3,
    createdAt: "Hier",
    liked: true,
  },
  {
    id: 3,
    title: "Rappel: Assemblée Générale le 15 janvier",
    content: "N'oubliez pas notre Assemblée Générale Ordinaire qui aura lieu le 15 janvier 2025 à 18h30 dans la salle de réception. L'ordre du jour et les documents préparatoires sont disponibles dans la section Votes & AG.",
    author: { name: "Syndic Gestion Plus", role: "Gestionnaire" },
    category: "AG",
    isOfficial: true,
    isPinned: false,
    likes: 45,
    comments: 15,
    createdAt: "Il y a 2 jours",
    liked: false,
  },
  {
    id: 4,
    title: "Problème de stationnement visiteurs",
    content: "Bonjour à tous, j'ai remarqué que plusieurs résidents utilisent les places visiteurs pour leurs propres véhicules. Pourrions-nous respecter le règlement pour permettre à nos invités de se garer correctement? Merci!",
    author: { name: "Marie Dupont", role: "Résident" },
    category: "Vie quotidienne",
    isOfficial: false,
    isPinned: false,
    likes: 18,
    comments: 7,
    createdAt: "Il y a 3 jours",
    liked: false,
  },
];

const categories = ["Tous", "Travaux", "Documents", "AG", "Vie quotidienne", "Événements"];

export default function Newsfeed() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState(samplePosts);
  const [activeCategory, setActiveCategory] = useState("Tous");
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("kopro_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/auth");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("kopro_user");
    navigate("/auth");
  };

  const toggleLike = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  const filteredPosts = activeCategory === "Tous" 
    ? posts 
    : posts.filter(post => post.category === activeCategory);

  if (!user) return null;

  return (
    <AppLayout userRole={user.role} onLogout={handleLogout}>
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
              {category}
            </Button>
          ))}
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className={`shadow-soft hover:shadow-medium transition-shadow ${post.isPinned ? "border-primary/30" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {post.author.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{post.author.name}</span>
                        {post.isOfficial && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Officiel</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{post.author.role}</span>
                        <span>·</span>
                        <span>{post.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {post.isPinned && (
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
                  <Badge variant="outline" className="mb-2 text-xs">{post.category}</Badge>
                  <h3 className="font-semibold text-foreground mb-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{post.content}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(post.id)}
                    className={post.liked ? "text-kopro-rose" : "text-muted-foreground"}
                  >
                    <Heart className={`h-4 w-4 mr-1.5 ${post.liked ? "fill-current" : ""}`} />
                    {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    {post.comments}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground ml-auto">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}