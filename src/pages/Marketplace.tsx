import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { ShoppingBag, Plus, Heart, Search, Filter, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";

const sampleListings = [
  {
    id: "1",
    title: "Canapé 3 places beige",
    price: 250,
    category: "Mobilier",
    image: null,
    seller: "Marie D.",
    apartment: "Apt 12B",
    createdAt: "Il y a 2 jours",
    isFavorite: false,
  },
  {
    id: "2",
    title: "Vélo enfant 20 pouces",
    price: 80,
    category: "Sport",
    image: null,
    seller: "Jean M.",
    apartment: "Apt 8A",
    createdAt: "Il y a 1 semaine",
    isFavorite: true,
  },
  {
    id: "3",
    title: "Table basse en verre",
    price: 45,
    category: "Mobilier",
    image: null,
    seller: "Sophie B.",
    apartment: "Apt 3C",
    createdAt: "Il y a 3 jours",
    isFavorite: false,
  },
  {
    id: "4",
    title: "Lot livres Harry Potter",
    price: 30,
    category: "Livres",
    image: null,
    seller: "Pierre L.",
    apartment: "Apt 5D",
    createdAt: "Hier",
    isFavorite: false,
  },
];

function ListingDetail({ id }: { id: string }) {
  const listing = sampleListings.find(l => l.id === id);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!listing) {
    return (
      <AppLayout userRole={user?.role || 'resident'} onLogout={logout}>
        <div className="text-center py-12">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Annonce non trouvée</p>
          <Button variant="link" onClick={() => navigate('/marketplace')}>
            Retour aux annonces
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole={user?.role || 'resident'} onLogout={logout}>
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
                <Badge variant="secondary" className="mt-2">{listing.category}</Badge>
              </div>
              <p className="text-2xl font-bold text-primary">{listing.price} €</p>
            </div>

            <div className="flex items-center gap-4 py-4 border-t border-b border-border">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-semibold text-primary">{listing.seller.charAt(0)}</span>
              </div>
              <div>
                <p className="font-medium">{listing.seller}</p>
                <p className="text-sm text-muted-foreground">{listing.apartment}</p>
              </div>
            </div>

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
    </AppLayout>
  );
}

export default function Marketplace() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (id) {
    return <ListingDetail id={id} />;
  }

  const filteredListings = sampleListings.filter(l =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout userRole={user.role} onLogout={logout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Marketplace</h1>
            <p className="text-muted-foreground mt-1">Petites annonces entre voisins</p>
          </div>
          <Button>
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredListings.map((listing) => (
            <Card 
              key={listing.id} 
              className="shadow-soft hover:shadow-medium transition-all cursor-pointer group overflow-hidden"
              onClick={() => navigate(`/marketplace/${listing.id}`)}
            >
              <div className="aspect-square bg-muted flex items-center justify-center relative">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Heart className={`h-4 w-4 ${listing.isFavorite ? 'fill-destructive text-destructive' : ''}`} />
                </Button>
              </div>
              <CardContent className="p-3">
                <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {listing.title}
                </p>
                <p className="text-lg font-bold text-primary mt-1">{listing.price} €</p>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="secondary" className="text-xs">{listing.category}</Badge>
                  <span className="text-xs text-muted-foreground">{listing.createdAt}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
