import { useState, useEffect, useRef } from "react";
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
  Image,
  Camera,
  Reply,
  Clock,
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
  event_end_date: string | null;
  event_location: string | null;
  reply_to_id: string | null;
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
  reply_to?: {
    id: string;
    content: string;
    author?: {
      first_name: string | null;
      last_name: string | null;
    };
  };
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

function NewsfeedContent() {
  const { user, profile } = useAuth();
  const { selectedResidence, residences, isLoading: residenceLoading } = useResidence();
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tous");
  const navigate = useNavigate();

  // For residents with a single residence, use it directly even if selectedResidence is not yet set
  const effectiveResidence = selectedResidence || (residences.length === 1 ? residences[0] : null);

  // New post dialog
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    type: "" as string, // empty = message simple
    event_date: "",
    event_end_date: "",
    event_location: "",
    sendToAllResidences: false,
    images: [] as string[],
    replyToId: null as string | null,
  });
  const [posting, setPosting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [allResidences, setAllResidences] = useState<{id: string; name: string}[]>([]);
  const [swipingPostId, setSwipingPostId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is manager or owner
  const isManager = profile?.role === 'manager' || profile?.role === 'admin';

  // Fetch all residences for managers
  useEffect(() => {
    if (isManager && user) {
      fetchAllResidences();
    }
  }, [isManager, user]);

  const fetchAllResidences = async () => {
    try {
      const { data, error } = await supabase
        .from('residences')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setAllResidences(data || []);
    } catch (error) {
      console.error('Error fetching residences:', error);
    }
  };

  // Comments
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (user && effectiveResidence && !residenceLoading) {
      fetchPosts();
    } else if (!residenceLoading && !effectiveResidence) {
      setLoading(false);
    }
  }, [user, effectiveResidence, residenceLoading]);

  const fetchPosts = async () => {
    if (!effectiveResidence) return;
    
    try {
      setLoading(true);
      
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('residence_id', effectiveResidence.id)
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
        event_end_date: (post as any).event_end_date || null,
        reply_to_id: (post as any).reply_to_id || null,
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

  const sendPushNotifications = async (residenceId: string, title: string, body: string) => {
    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          title,
          body,
          residenceId,
          url: '/newsfeed',
          tag: 'announcement',
        },
      });
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.content.trim()) return;
    if (!newPost.sendToAllResidences && !effectiveResidence) return;

    setPosting(true);
    try {
      const postType = newPost.type || null;
      const basePostData: any = {
        title: (newPost.type === 'request' && newPost.title) ? newPost.title : (isManager ? (newPost.title || null) : null),
        content: newPost.content,
        type: isManager ? (postType || 'info') : postType,
        author_id: user!.id,
        reply_to_id: newPost.replyToId || null,
        attachments: newPost.images.length > 0 ? { images: newPost.images } : null,
      };

      if (newPost.type === 'event') {
        if (newPost.event_date) {
          basePostData.event_date = new Date(newPost.event_date).toISOString();
        }
        if (newPost.event_end_date) {
          basePostData.event_end_date = new Date(newPost.event_end_date).toISOString();
        }
        basePostData.event_location = newPost.event_location || null;
      }

      const notificationTitle = newPost.type === 'announcement' 
        ? 'Nouvelle annonce' 
        : newPost.type === 'event' 
        ? 'Nouvel événement' 
        : newPost.type === 'request'
        ? 'Nouvelle demande'
        : 'Nouveau message';
      const notificationBody = newPost.title || newPost.content.slice(0, 100);

      if (newPost.sendToAllResidences && isManager && allResidences.length > 0) {
        const postsToInsert = allResidences.map(residence => ({
          ...basePostData,
          residence_id: residence.id,
        }));

        const { error } = await supabase
          .from('posts')
          .insert(postsToInsert);

        if (error) throw error;

        for (const residence of allResidences) {
          sendPushNotifications(residence.id, notificationTitle, notificationBody);
        }

        toast.success(`Publication envoyée à ${allResidences.length} résidence(s)`);
      } else {
        const { error } = await supabase
          .from('posts')
          .insert({
            ...basePostData,
            residence_id: effectiveResidence!.id,
          });

        if (error) throw error;
        sendPushNotifications(effectiveResidence!.id, notificationTitle, notificationBody);
        toast.success(newPost.replyToId ? 'Réponse envoyée' : 'Message envoyé');
      }

      setShowNewPost(false);
      setNewPost({ title: "", content: "", type: "", event_date: "", event_end_date: "", event_location: "", sendToAllResidences: false, images: [], replyToId: null });
      fetchPosts();
    } catch (error: any) {
      toast.error('Erreur lors de la création');
      console.error(error);
    } finally {
      setPosting(false);
    }
  };

  // Handle swipe gestures for reply
  const handleTouchStart = (e: React.TouchEvent, postId: string) => {
    touchStartX.current = e.touches[0].clientX;
    setSwipingPostId(postId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingPostId) return;
    const currentX = e.touches[0].clientX;
    const diff = touchStartX.current - currentX;
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 80));
    }
  };

  const handleTouchEnd = (post: PostWithDetails) => {
    if (swipeOffset > 50) {
      handleReplyToPost(post);
    }
    setSwipeOffset(0);
    setSwipingPostId(null);
  };

  const handleMouseSwipe = (post: PostWithDetails) => {
    handleReplyToPost(post);
  };

  const handleReplyToPost = (post: PostWithDetails) => {
    setNewPost(prev => ({
      ...prev,
      replyToId: post.id,
      content: "",
    }));
    setShowNewPost(true);
  };

  const getReplyToPost = () => {
    if (!newPost.replyToId) return null;
    return posts.find(p => p.id === newPost.replyToId);
  };

  const handleImageUpload = async (files: FileList) => {
    if (!user || files.length === 0) return;
    
    setUploadingImages(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (let i = 0; i < Math.min(files.length, 4); i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, file, { upsert: false });
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }
        
        const { data } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);
        
        uploadedUrls.push(data.publicUrl);
      }
      
      if (uploadedUrls.length > 0) {
        setNewPost(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls]
        }));
        toast.success(`${uploadedUrls.length} image(s) ajoutée(s)`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setNewPost(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
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
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Actualités</h1>
            <p className="text-muted-foreground mt-1">
              {effectiveResidence ? effectiveResidence.name : "Sélectionnez une résidence"}
            </p>
          </div>
          <Button onClick={() => setShowNewPost(true)} disabled={!effectiveResidence}>
            {isManager ? <Plus className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            {isManager ? "Publier" : "Message"}
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
        {loading || residenceLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : !effectiveResidence ? (
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
              const isSwiping = swipingPostId === post.id;
              
              return (
                <div 
                  key={post.id} 
                  className="relative"
                  onTouchStart={(e) => handleTouchStart(e, post.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(post)}
                >
                  {/* Swipe reply indicator */}
                  <div 
                    className={`absolute right-0 top-0 bottom-0 flex items-center justify-center bg-primary/10 transition-all ${isSwiping && swipeOffset > 20 ? 'opacity-100' : 'opacity-0'}`}
                    style={{ width: swipeOffset }}
                  >
                    <Reply className="h-5 w-5 text-primary" />
                  </div>
                  
                  <Card 
                    className={`shadow-soft hover:shadow-medium transition-all ${post.is_pinned ? "border-primary/30 bg-primary/5" : ""}`}
                    style={{ transform: isSwiping ? `translateX(-${swipeOffset}px)` : 'none' }}
                  >
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
                              <DropdownMenuItem onClick={() => handleMouseSwipe(post)}>
                                <Reply className="h-4 w-4 mr-2" />
                                Répondre
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={async () => {
                                const postUrl = `${window.location.origin}/newsfeed?post=${post.id}`;
                                const shareText = post.title || post.content.substring(0, 100);
                                
                                if (navigator.share) {
                                  try {
                                    await navigator.share({
                                      title: shareText,
                                      text: post.content.substring(0, 200),
                                      url: postUrl
                                    });
                                  } catch (err) {
                                    // User cancelled or share failed
                                    if ((err as Error).name !== 'AbortError') {
                                      await navigator.clipboard.writeText(postUrl);
                                      toast.success("Lien copié dans le presse-papier");
                                    }
                                  }
                                } else {
                                  await navigator.clipboard.writeText(postUrl);
                                  toast.success("Lien copié dans le presse-papier");
                                }
                              }}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Partager
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  toast.info("Signalement enregistré. Merci de nous aider à maintenir une communauté respectueuse.");
                                }}
                              >
                                <Flag className="h-4 w-4 mr-2" />
                                Signaler
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-4">
                      {/* Reply reference */}
                      {post.reply_to_id && (
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border-l-2 border-primary/30">
                          <Reply className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            En réponse à un message
                          </div>
                        </div>
                      )}
                      
                      <div>
                        {post.title && (
                          <h3 className="font-semibold text-foreground mb-2">{post.title}</h3>
                        )}
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      </div>

                      {/* Post images */}
                      {post.attachments?.images && post.attachments.images.length > 0 && (
                        <div className={`grid gap-2 ${post.attachments.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                          {(post.attachments.images as string[]).slice(0, 4).map((imgUrl, idx) => (
                            <img 
                              key={idx}
                              src={imgUrl} 
                              alt={`Image ${idx + 1}`}
                              className={`w-full object-cover rounded-lg ${post.attachments.images.length === 1 ? 'max-h-80' : 'h-40'}`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Event Info */}
                      {post.type === 'event' && post.event_date && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="font-medium">
                              {format(new Date(post.event_date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                            </span>
                          </div>
                          {post.event_end_date && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>Fin : {format(new Date(post.event_end_date), "HH:mm", { locale: fr })}</span>
                            </div>
                          )}
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
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-muted-foreground"
                          onClick={() => handleMouseSwipe(post)}
                        >
                          <Reply className="h-4 w-4" />
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
                </div>
              );
            })}
          </div>
        )}

        {/* New Post Dialog */}
        <Dialog open={showNewPost} onOpenChange={(open) => {
          if (!open) {
            setNewPost({ title: "", content: "", type: "", event_date: "", event_end_date: "", event_location: "", sendToAllResidences: false, images: [], replyToId: null });
          }
          setShowNewPost(open);
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {newPost.replyToId 
                  ? "Répondre" 
                  : isManager 
                  ? "Nouvelle publication" 
                  : "Nouveau message"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Reply reference */}
              {newPost.replyToId && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <Reply className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">En réponse à :</p>
                    <p className="text-sm line-clamp-2">{getReplyToPost()?.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => setNewPost({ ...newPost, replyToId: null })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Type selection - For managers: all types, for residents: event, request only (optional) */}
              {isManager ? (
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
              ) : !newPost.replyToId && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Optionnel : signaler un type</Label>
                  <div className="flex gap-2 flex-wrap">
                    {['event', 'request', 'info'].map(type => {
                      const Icon = categoryIcons[type];
                      return (
                        <Button
                          key={type}
                          type="button"
                          variant={newPost.type === type ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setNewPost({ ...newPost, type: newPost.type === type ? '' : type })}
                        >
                          {Icon && <Icon className="h-4 w-4 mr-1" />}
                          {categoryLabels[type]}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Title - For managers always, for residents only on request type */}
              {(isManager || newPost.type === 'request') && (
                <div className="space-y-2">
                  <Label>{newPost.type === 'request' ? 'Titre de la demande' : 'Titre (optionnel)'}</Label>
                  <Input
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder={newPost.type === 'request' ? 'Ex: Recherche bricoleur...' : 'Titre de la publication'}
                  />
                </div>
              )}

              {/* Message content */}
              <div className="space-y-2">
                <Label>{isManager ? "Contenu *" : "Message"}</Label>
                <Textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder={
                    newPost.replyToId 
                      ? "Votre réponse..." 
                      : isManager 
                      ? "Écrivez votre message..." 
                      : "Partagez quelque chose avec vos voisins..."
                  }
                  className={isManager ? "min-h-[120px]" : "min-h-[80px]"}
                />
              </div>

              {/* Event fields */}
              {newPost.type === 'event' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Début *</Label>
                      <Input
                        type="datetime-local"
                        value={newPost.event_date}
                        onChange={(e) => setNewPost({ ...newPost, event_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fin (optionnel)</Label>
                      <Input
                        type="datetime-local"
                        value={newPost.event_end_date}
                        onChange={(e) => setNewPost({ ...newPost, event_end_date: e.target.value })}
                      />
                    </div>
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

              {/* Image upload - hidden input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    handleImageUpload(e.target.files);
                    e.target.value = '';
                  }
                }}
              />

              {/* Uploaded images preview */}
              {newPost.images.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {newPost.images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={`Image ${index + 1}`} 
                        className="h-20 w-20 object-cover rounded-lg border border-border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action button for photo upload - single button that opens native picker */}
              {!newPost.replyToId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages || newPost.images.length >= 4}
                >
                  <Camera className="h-4 w-4 mr-1" />
                  {uploadingImages ? 'Upload...' : 'Ajouter des photos'}
                </Button>
              )}

              {/* Send to all residences - Manager only */}
              {isManager && allResidences.length > 1 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <input
                    type="checkbox"
                    id="sendToAll"
                    checked={newPost.sendToAllResidences}
                    onChange={(e) => setNewPost({ ...newPost, sendToAllResidences: e.target.checked })}
                    className="h-4 w-4 rounded border-border"
                  />
                  <label htmlFor="sendToAll" className="flex-1 cursor-pointer">
                    <span className="font-medium text-sm">Envoyer à tout mon parc</span>
                    <p className="text-xs text-muted-foreground">
                      Cette publication sera envoyée à {allResidences.length} résidence(s)
                    </p>
                  </label>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewPost(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleCreatePost} 
                disabled={posting || !newPost.content.trim() || (newPost.type === 'event' && !newPost.event_date)}
              >
                <Send className="h-4 w-4 mr-2" />
                {posting ? 'Envoi...' : 'Envoyer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}

export default function Newsfeed() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!user || !profile) return null;

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <NewsfeedContent />
    </AppLayout>
  );
}