import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
          <span className="text-4xl font-bold text-muted-foreground">404</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Page non trouvée</h1>
        <p className="text-muted-foreground mb-6">
          La page <code className="bg-muted px-2 py-1 rounded text-sm">{location.pathname}</code> n'existe pas.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Button onClick={() => navigate("/dashboard")}>
            <Home className="h-4 w-4 mr-2" />
            Accueil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
