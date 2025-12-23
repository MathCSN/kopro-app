import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Newsfeed from "./pages/Newsfeed";
import Tickets from "./pages/Tickets";
import NewTicket from "./pages/NewTicket";
import Reservations from "./pages/Reservations";
import Documents from "./pages/Documents";
import Packages from "./pages/Packages";
import Visitors from "./pages/Visitors";
import Marketplace from "./pages/Marketplace";
import AG from "./pages/AG";
import Payments from "./pages/Payments";
import Vault from "./pages/Vault";
import Directory from "./pages/Directory";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import Rental from "./pages/Rental";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/newsfeed" element={<ProtectedRoute><Newsfeed /></ProtectedRoute>} />
            <Route path="/feed" element={<Navigate to="/newsfeed" replace />} />
            
            {/* Tickets */}
            <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
            <Route path="/tickets/new" element={<ProtectedRoute><NewTicket /></ProtectedRoute>} />
            <Route path="/tickets/:id" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
            
            {/* Reservations */}
            <Route path="/reservations" element={<ProtectedRoute><Reservations /></ProtectedRoute>} />
            <Route path="/reservations/:resourceId" element={<ProtectedRoute><Reservations /></ProtectedRoute>} />
            
            {/* Packages */}
            <Route path="/packages" element={<ProtectedRoute><Packages /></ProtectedRoute>} />
            
            {/* Visitors */}
            <Route path="/visitors" element={<ProtectedRoute><Visitors /></ProtectedRoute>} />
            
            {/* Marketplace */}
            <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="/marketplace/:id" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            
            {/* AG / Votes */}
            <Route path="/ag" element={<ProtectedRoute><AG /></ProtectedRoute>} />
            <Route path="/ag/:id" element={<ProtectedRoute><AG /></ProtectedRoute>} />
            <Route path="/votes" element={<Navigate to="/ag" replace />} />
            
            {/* Payments */}
            <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
            <Route path="/payments/:id" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
            
            {/* Documents */}
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/documents/:id" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            
            {/* Vault */}
            <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
            
            {/* Directory */}
            <Route path="/directory" element={<ProtectedRoute><Directory /></ProtectedRoute>} />
            
            {/* Chat */}
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            
            {/* Admin - requires manager role */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="manager"><Admin /></ProtectedRoute>} />
            <Route path="/admin/residence" element={<ProtectedRoute requiredRole="manager"><Admin /></ProtectedRoute>} />
            <Route path="/admin/lots" element={<ProtectedRoute requiredRole="manager"><Admin /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredRole="manager"><Admin /></ProtectedRoute>} />
            <Route path="/admin/templates" element={<ProtectedRoute requiredRole="manager"><Admin /></ProtectedRoute>} />
            <Route path="/settings" element={<Navigate to="/admin" replace />} />
            <Route path="/analytics" element={<ProtectedRoute requiredRole="manager"><Dashboard /></ProtectedRoute>} />
            
            {/* Rental module - requires manager/owner */}
            <Route path="/rental" element={<ProtectedRoute requireRental><Rental /></ProtectedRoute>} />
            <Route path="/rental/vacancies/:id" element={<ProtectedRoute requireRental><Rental /></ProtectedRoute>} />
            <Route path="/rental/applications/:id" element={<ProtectedRoute requireRental><Rental /></ProtectedRoute>} />
            
            {/* Help */}
            <Route path="/help" element={<Help />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
