import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { ShoppingBag, Plus, Heart, Search, MessageCircle, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useResidence } from "@/contexts/ResidenceContext";
import { CreateListingDialog } from "@/components/marketplace/CreateListingDialog";
import { EditListingDialog } from "@/components/marketplace/EditListingDialog";

interface SellerProfile {
  first_name: string | null;
  last_name: string | null;
}

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  category: string | null;
  condition: string | null;
  images: any;
  status: string | null;
  created_at: string;
  seller_id: string;
  seller?: SellerProfile | null;
}

function ListingDetail({ id }: { id: string }) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setListing(data);
    } catch (error) {
      console.error('Error fetching listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Annonce non trouvée</p>
        <Button variant="link" onClick={() => navigate('/marketplace')}>
          Retour aux annonces
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <Button variant="ghost" onClick={() => navigate('/marketplace')}>
        ← Retour aux annonces
      </Button>

      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="aspect-video bg-muted rounded-lg mb-6 flex items-center justify-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
          </div>
          
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">{listing.title}</h1>
              {listing.category && (
                <Badge variant="secondary" className="mt-2">{listing.category}</Badge>
              )}
            </div>
            {listing.price !== null && (
              <p className="text-2xl font-bold text-primary">{listing.price} €</p>
            )}
          </div>

          {listing.description && (
            <p className="text-muted-foreground mb-4">{listing.description}</p>
          )}

          <div className="flex gap-3 mt-6">
            <Button className="flex-1">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contacter
            </Button>
            <Button variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Marketplace() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const { selectedResidence, residences } = useResidence();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  const activeResidence = selectedResidence || (residences.length > 0 ? residences[0] : null);

  useEffect(() => {
    if (user && !id) {
      fetchListings();
    }
  }, [user, id]);

  const fetchListings = async () => {
    try {
      const { data: listingsData, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch seller profiles separately
      const sellerIds = [...new Set((listingsData || []).map(l => l.seller_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', sellerIds);

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, { first_name: p.first_name, last_name: p.last_name }])
      );

      const listingsWithSellers = (listingsData || []).map(listing => ({
        ...listing,
        seller: profilesMap.get(listing.seller_id) || null
      })) as Listing[];

      setListings(listingsWithSellers);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!user || !profile) {
    navigate("/auth");
    return null;
  }

  if (id) {
    return <ListingDetail id={id} />;
  }

  const getSellerName = (listing: Listing) => {
    if (listing.seller?.first_name || listing.seller?.last_name) {
      return `${listing.seller.first_name || ''} ${listing.seller.last_name || ''}`.trim();
    }
    return "Vendeur";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
  };

  const filteredListings = listings.filter(l =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.category && l.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Marketplace</h1>
          <p className="text-muted-foreground mt-1">Petites annonces entre voisins</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} disabled={!activeResidence}>
          <Plus className="h-4 w-4 mr-2" />
          Déposer une annonce
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une annonce..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune annonce</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredListings.map((listing) => (
            <Card 
              key={listing.id} 
              className="shadow-soft hover:shadow-medium transition-all cursor-pointer group overflow-hidden"
              onClick={() => navigate(`/marketplace/${listing.id}`)}
            >
              <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                {listing.images && listing.images.length > 0 ? (
                  <img 
                    src={listing.images[0]} 
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {user && listing.seller_id === user.id && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="bg-background/80 backdrop-blur-sm h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingListing(listing);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="bg-background/80 backdrop-blur-sm h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {listing.title}
                </p>
                {listing.price !== null && (
                  <p className="text-lg font-bold text-primary mt-1">{listing.price} €</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{getSellerName(listing)}</p>
                <div className="flex items-center justify-between mt-2">
                  {listing.category && (
                    <Badge variant="secondary" className="text-xs">{listing.category}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{formatDate(listing.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeResidence && (
        <CreateListingDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          residenceId={activeResidence.id}
          onSuccess={fetchListings}
        />
      )}

      {editingListing && (
        <EditListingDialog
          open={!!editingListing}
          onOpenChange={(open) => !open && setEditingListing(null)}
          listing={editingListing}
          onSuccess={fetchListings}
        />
      )}
    </div>
  );
}
