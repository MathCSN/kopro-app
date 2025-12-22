import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Newsfeed from "./pages/Newsfeed";
import Tickets from "./pages/Tickets";
import Reservations from "./pages/Reservations";
import Documents from "./pages/Documents";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/newsfeed" element={<Newsfeed />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/documents" element={<Documents />} />
          {/* Placeholder routes for other modules */}
          <Route path="/packages" element={<Dashboard />} />
          <Route path="/visitors" element={<Dashboard />} />
          <Route path="/marketplace" element={<Dashboard />} />
          <Route path="/votes" element={<Dashboard />} />
          <Route path="/payments" element={<Dashboard />} />
          <Route path="/vault" element={<Dashboard />} />
          <Route path="/chat" element={<Dashboard />} />
          <Route path="/analytics" element={<Dashboard />} />
          <Route path="/settings" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;