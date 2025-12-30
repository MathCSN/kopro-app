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
  Calendar,
  MapPin,
  Users,
  Send,
  X,
  Check,
  HelpCircle,
  Info,
  Megaphone,
  PartyPopper,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useResidence } from "@/contexts/ResidenceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Post {
  id: string;
  title: string | null;
  content: string;
  type: string | null;
  is_pinned: boolean | null;
  created_at: string;
  author_id: string;
  attachments: any;
  residence_id: string;
  event_date: string | null;
  event_location: string | null;
}

interface PostWithDetails extends Post {
  author?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
  user_rsvp?: string;
  rsvp_going_count: number;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  author?: {
    first_name: string | null;
    last_name: string | null;
  };
}

const categories = ["Tous", "announcement", "info", "event", "request"];
const categoryLabels: Record<string, string> = {
  "Tous": "Tous",
  "announcement": "Annonces",
  "info": "Infos",
  "event": "Événements",
  "request": "Demandes",
};

const categoryIcons: Record<string, any> = {
  "announcement": Megaphone,
  "info": Info,
  "event": PartyPopper,
  "request": HelpCircle,
};

export default function Newsfeed() {
  const { user, profile, logout } = useAuth();
  const { selectedResidence } = useResidence();
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tous");
  const navigate = useNavigate();

  // New post dialog
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    type: "info",
    event_date: "",
    event_location: "",
  });
  const [posting, setPosting] = useState(false);

  // Comments
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (user && selectedResidence) {
      fetchPosts();
    }
  }, [user, selectedResidence]);

  const fetchPosts = async () => {
    if (!selectedResidence) return;
    
    try {
      setLoading(true);
      
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('residence_id', selectedResidence.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Fetch author profiles
      const authorIds = [...new Set(postsData.map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      // Fetch likes counts
      const postIds = postsData.map(p => p.id);
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .in('post_id', postIds);

      const likesCount: Record<string, number> = {};
      likesData?.forEach(l => {
        likesCount[l.post_id] = (likesCount[l.post_id] || 0) + 1;
      });

      // Fetch user's likes
      const { data: userLikes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user!.id)
        .in('post_id', postIds);

      const userLikedPosts = new Set(userLikes?.map(l => l.post_id));

      // Fetch comments counts
      const { data: commentsData } = await supabase
        .from('post_comments')
        .select('post_id')
        .in('post_id', postIds);

      const commentsCount: Record<string, number> = {};
      commentsData?.forEach(c => {
        commentsCount[c.post_id] = (commentsCount[c.post_id] || 0) + 1;
      });

      // Fetch RSVPs for events
      const eventPosts = postsData.filter(p => p.type === 'event').map(p => p.id);
      let rsvpData: Record<string, { userRsvp?: string; goingCount: number }> = {};
      
      if (eventPosts.length > 0) {
        const { data: rsvps } = await supabase
          .from('event_rsvps')
          .select('post_id, user_id, status')
          .in('post_id', eventPosts);

        rsvps?.forEach(r => {
          if (!rsvpData[r.post_id]) {
            rsvpData[r.post_id] = { goingCount: 0 };
          }
          if (r.status === 'going') {
            rsvpData[r.post_id].goingCount++;
          }
          if (r.user_id === user!.id) {
            rsvpData[r.post_id].userRsvp = r.status;
          }
        });
      }

      const postsWithDetails: PostWithDetails[] = postsData.map(post => ({
        ...post,
        author: profileMap.get(post.author_id),
        likes_count: likesCount[post.id] || 0,
        comments_count: commentsCount[post.id] || 0,
        user_liked: userLikedPosts.has(post.id),
        user_rsvp: rsvpData[post.id]?.userRsvp,
        rsvp_going_count: rsvpData[post.id]?.goingCount || 0,
      }));

      setPosts(postsWithDetails);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, currentlyLiked: boolean) => {
    try {
      if (currentlyLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user!.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user!.id });
      }

      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              user_liked: !currentlyLiked,
              likes_count: currentlyLiked ? p.likes_count - 1 : p.likes_count + 1
            }
          : p
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleRsvp = async (postId: string, status: 'going' | 'maybe' | 'not_going') => {
    try {
      const { data: existing } = await supabase
        .from('event_rsvps')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user!.id)
        .single();

      if (existing) {
        await supabase
          .from('event_rsvps')
          .update({ status })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('event_rsvps')
          .insert({ post_id: postId, user_id: user!.id, status });
      }

      fetchPosts();
      toast.success(status === 'going' ? 'Vous participez !' : status === 'maybe' ? 'Réponse enregistrée' : 'Réponse enregistrée');
    } catch (error) {
      console.error('Error updating RSVP:', error);
    }
  };

  const loadComments = async (postId: string) => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch authors
      const userIds = [...new Set(data?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      const commentsWithAuthors = (data || []).map(c => ({
        ...c,
        author: profileMap.get(c.user_id),
      }));

      setComments(prev => ({ ...prev, [postId]: commentsWithAuthors }));
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user!.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      loadComments(postId);
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.content.trim() || !selectedResidence) return;

    setPosting(true);
    try {
      const postData: any = {
        title: newPost.title || null,
        content: newPost.content,
        type: newPost.type,
        author_id: user!.id,
        residence_id: selectedResidence.id,
      };

      if (newPost.type === 'event' && newPost.event_date) {
        postData.event_date = new Date(newPost.event_date).toISOString();
        postData.event_location = newPost.event_location || null;
      }

      const { error } = await supabase
        .from('posts')
        .insert(postData);

      if (error) throw error;

      toast.success('Publication créée');
      setShowNewPost(false);
      setNewPost({ title: "", content: "", type: "info", event_date: "", event_location: "" });
      fetchPosts();
    } catch (error: any) {
      toast.error('Erreur lors de la création');
      console.error(error);
    } finally {
      setPosting(false);
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
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getAuthorName = (post: PostWithDetails) => {
    if (post.author?.first_name || post.author?.last_name) {
      return `${post.author.first_name || ''} ${post.author.last_name || ''}`.trim();
    }
    return post.author?.email?.split('@')[0] || 'Utilisateur';
  };

  const getAuthorInitials = (post: PostWithDetails) => {
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
            <p className="text-muted-foreground mt-1">
              {selectedResidence ? selectedResidence.name : "Sélectionnez une résidence"}
            </p>
          </div>
          <Button onClick={() => setShowNewPost(true)} disabled={!selectedResidence}>
            <Plus className="h-4 w-4 mr-2" />
            Publier
          </Button>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => {
            const Icon = categoryIcons[category];
            return (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "secondary"}
                size="sm"
                onClick={() => setActiveCategory(category)}
                className="shrink-0"
              >
                {Icon && <Icon className="h-4 w-4 mr-1" />}
                {categoryLabels[category] || category}
              </Button>
            );
          })}
        </div>

        {/* Posts Feed */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : !selectedResidence ? (
          <Card className="shadow-soft">
            <CardContent className="p-8 text-center">
              <Newspaper className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Sélectionnez une résidence pour voir les actualités</p>
            </CardContent>
          </Card>
        ) : filteredPosts.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-8 text-center">
              <Newspaper className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune publication</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowNewPost(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer la première
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const Icon = categoryIcons[post.type || ''];
              const isExpanded = expandedComments === post.id;
              
              return (
                <Card key={post.id} className={`shadow-soft hover:shadow-medium transition-shadow ${post.is_pinned ? "border-primary/30 bg-primary/5" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getAuthorInitials(post)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">{getAuthorName(post)}</span>
                            {post.type && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                                {Icon && <Icon className="h-3 w-3" />}
                                {categoryLabels[post.type]}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {post.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
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
                      {post.title && (
                        <h3 className="font-semibold text-foreground mb-2">{post.title}</h3>
                      )}
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    </div>

                    {/* Event Info */}
                    {post.type === 'event' && post.event_date && (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {format(new Date(post.event_date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                          </span>
                        </div>
                        {post.event_location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{post.event_location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{post.rsvp_going_count} participant{post.rsvp_going_count > 1 ? 's' : ''}</span>
                        </div>

                        {/* RSVP Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant={post.user_rsvp === 'going' ? 'default' : 'outline'}
                            onClick={() => handleRsvp(post.id, 'going')}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Je participe
                          </Button>
                          <Button
                            size="sm"
                            variant={post.user_rsvp === 'maybe' ? 'secondary' : 'ghost'}
                            onClick={() => handleRsvp(post.id, 'maybe')}
                          >
                            Peut-être
                          </Button>
                          <Button
                            size="sm"
                            variant={post.user_rsvp === 'not_going' ? 'secondary' : 'ghost'}
                            onClick={() => handleRsvp(post.id, 'not_going')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Non
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 pt-2 border-t border-border">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={post.user_liked ? "text-red-500" : "text-muted-foreground"}
                        onClick={() => handleLike(post.id, post.user_liked)}
                      >
                        <Heart className={`h-4 w-4 mr-1.5 ${post.user_liked ? "fill-current" : ""}`} />
                        {post.likes_count}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground"
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedComments(null);
                          } else {
                            setExpandedComments(post.id);
                            loadComments(post.id);
                          }
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-1.5" />
                        {post.comments_count}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground ml-auto">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Comments Section */}
                    {isExpanded && (
                      <div className="space-y-3 pt-2 border-t border-border">
                        {loadingComments ? (
                          <p className="text-sm text-muted-foreground text-center py-2">Chargement...</p>
                        ) : (
                          <>
                            {(comments[post.id] || []).map(comment => (
                              <div key={comment.id} className="flex gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {(comment.author?.first_name?.[0] || '') + (comment.author?.last_name?.[0] || '')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2">
                                  <p className="text-xs font-medium">
                                    {comment.author?.first_name} {comment.author?.last_name}
                                  </p>
                                  <p className="text-sm">{comment.content}</p>
                                </div>
                              </div>
                            ))}

                            {/* Add Comment */}
                            <div className="flex gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {(profile.first_name?.[0] || '') + (profile.last_name?.[0] || '')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex gap-2">
                                <Input
                                  placeholder="Écrire un commentaire..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleAddComment(post.id);
                                    }
                                  }}
                                  className="h-9"
                                />
                                <Button 
                                  size="icon" 
                                  className="h-9 w-9 shrink-0"
                                  onClick={() => handleAddComment(post.id)}
                                  disabled={!newComment.trim()}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* New Post Dialog */}
        <Dialog open={showNewPost} onOpenChange={setShowNewPost}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouvelle publication</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type de publication</Label>
                <div className="flex gap-2 flex-wrap">
                  {['info', 'announcement', 'event', 'request'].map(type => {
                    const Icon = categoryIcons[type];
                    return (
                      <Button
                        key={type}
                        type="button"
                        variant={newPost.type === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewPost({ ...newPost, type })}
                      >
                        {Icon && <Icon className="h-4 w-4 mr-1" />}
                        {categoryLabels[type]}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Titre (optionnel)</Label>
                <Input
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="Titre de la publication"
                />
              </div>

              <div className="space-y-2">
                <Label>Contenu *</Label>
                <Textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Écrivez votre message..."
                  className="min-h-[120px]"
                />
              </div>

              {newPost.type === 'event' && (
                <>
                  <div className="space-y-2">
                    <Label>Date et heure *</Label>
                    <Input
                      type="datetime-local"
                      value={newPost.event_date}
                      onChange={(e) => setNewPost({ ...newPost, event_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lieu</Label>
                    <Input
                      value={newPost.event_location}
                      onChange={(e) => setNewPost({ ...newPost, event_location: e.target.value })}
                      placeholder="Ex: Salle commune, Jardin..."
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewPost(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleCreatePost} 
                disabled={posting || !newPost.content.trim()}
              >
                {posting ? 'Publication...' : 'Publier'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}