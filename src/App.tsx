import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ResidenceProvider } from "@/contexts/ResidenceContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import ResetPassword from "./pages/ResetPassword";
import Pending from "./pages/Pending";
import JoinResidence from "./pages/JoinResidence";
import Dashboard from "./pages/Dashboard";
import Newsfeed from "./pages/Newsfeed";
import Tickets from "./pages/Tickets";
import NewTicket from "./pages/NewTicket";
import TicketDetail from "./pages/TicketDetail";
import Documents from "./pages/Documents";
import AG from "./pages/AG";
import Payments from "./pages/Payments";
import Vault from "./pages/Vault";
import Directory from "./pages/Directory";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import Rental from "./pages/Rental";
import RentalUnits from "./pages/RentalUnits";
import NewUnit from "./pages/NewUnit";
import EditUnit from "./pages/EditUnit";
import RentalVacancies from "./pages/RentalVacancies";
import RentalApplications from "./pages/RentalApplications";
import NewVacancy from "./pages/NewVacancy";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import Tenants from "./pages/Tenants";
import Profile from "./pages/Profile";
import Household from "./pages/Household";
import ServiceProviders from "./pages/ServiceProviders";
import AIAssistant from "./pages/AIAssistant";
import Marketplace from "./pages/Marketplace";
import Accounting from "./pages/Accounting";
import Syndic from "./pages/Syndic";
import WorkOrders from "./pages/WorkOrders";
import Analytics from "./pages/Analytics";
import PropertyInspections from "./pages/PropertyInspections";
import SyndicPortal from "./pages/SyndicPortal";

// Bailleur Pages
import { BailleurDashboard, BailleurApartments, NewBailleurApartment } from "./pages/bailleur";

// Syndic Pages  
import { SyndicDashboard, SyndicResidences } from "./pages/syndic";

// Auth Pages
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import RegisterResident from "./pages/auth/RegisterResident";
import RegisterManager from "./pages/auth/RegisterManager";
import RegisterTrial from "./pages/auth/RegisterTrial";
import ResidenceLanding from "./pages/ResidenceLanding";

// Admin Pages (global platform admin)
import AdminDashboard from "./pages/AdminDashboard";
import AdminResidences from "./pages/AdminResidences";
import AdminManagers from "./pages/AdminManagers";
import AdminUsers from "./pages/AdminUsers";
import AdminQuotes from "./pages/AdminQuotes";
import AdminReports from "./pages/AdminReports";
import AdminSettings from "./pages/AdminSettings";
import AdminIntegrations from "./pages/AdminIntegrations";
import AdminEmails from "./pages/AdminEmails";
import AdminStorage from "./pages/AdminStorage";
import AdminAudit from "./pages/AdminAudit";
import AdminPricing from "./pages/AdminPricing";
import AdminCRM from "./pages/AdminCRM";
import AdminAccounting from "./pages/AdminAccounting";
import QuotePublic from "./pages/QuotePublic";
import AgencySignup from "./pages/AgencySignup";
import AdminClients from "./pages/AdminClients";
import AdminClientDetail from "./pages/AdminClientDetail";
import AdminTrials from "./pages/AdminTrials";
import AdminTickets from "./pages/AdminTickets";
import AdminPaymentPage from "./pages/AdminPaymentPage";
import AdminBugReports from "./pages/AdminBugReports";
import AdminColdEmailing from "./pages/AdminColdEmailing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ResidenceProvider>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register-resident" element={<RegisterResident />} />
            <Route path="/auth/register-manager" element={<RegisterManager />} />
            <Route path="/auth/register-trial" element={<RegisterTrial />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Legacy auth route - redirect to login */}
            <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
            
            {/* QR Code landing page */}
            <Route path="/r/:residenceCode" element={<ResidenceLanding />} />
            
            {/* Onboarding routes */}
            <Route path="/pending" element={<Pending />} />
            <Route path="/join" element={<JoinResidence />} />
            
            {/* Public quote page */}
            <Route path="/quote/:quoteNumber" element={<QuotePublic />} />
            
            {/* Agency signup for trial users upgrading to subscription */}
            <Route path="/agency-signup" element={<AgencySignup />} />
            
            {/* Syndic portal - accessible via magic link or logged-in syndics */}
            <Route path="/syndic-portal" element={<SyndicPortal />} />
            
            {/* Admin routes - Global platform admin */}
            <Route path="/admin/platform" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/clients" element={<AdminRoute><AdminClients /></AdminRoute>} />
            <Route path="/admin/clients/:agencyId" element={<AdminRoute><AdminClientDetail /></AdminRoute>} />
            <Route path="/admin/trials" element={<AdminRoute><AdminTrials /></AdminRoute>} />
            <Route path="/admin/tickets" element={<AdminRoute><AdminTickets /></AdminRoute>} />
            <Route path="/admin/residences" element={<AdminRoute><AdminResidences /></AdminRoute>} />
            <Route path="/admin/residences/:id" element={<AdminRoute><AdminResidences /></AdminRoute>} />
            <Route path="/admin/managers" element={<AdminRoute><AdminManagers /></AdminRoute>} />
            <Route path="/admin/global-users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/quotes" element={<AdminRoute><AdminQuotes /></AdminRoute>} />
            <Route path="/admin/pricing" element={<AdminRoute><AdminPricing /></AdminRoute>} />
            <Route path="/admin/payment-page" element={<AdminRoute><AdminPaymentPage /></AdminRoute>} />
            <Route path="/admin/crm" element={<AdminRoute><AdminCRM /></AdminRoute>} />
            <Route path="/admin/accounting" element={<AdminRoute><AdminAccounting /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
            <Route path="/admin/global-settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="/admin/integrations" element={<AdminRoute><AdminIntegrations /></AdminRoute>} />
            <Route path="/admin/emails" element={<AdminRoute><AdminEmails /></AdminRoute>} />
            <Route path="/admin/cold-emailing" element={<AdminRoute><AdminColdEmailing /></AdminRoute>} />
            <Route path="/admin/bug-reports" element={<AdminRoute><AdminBugReports /></AdminRoute>} />
            <Route path="/admin/storage" element={<AdminRoute><AdminStorage /></AdminRoute>} />
            <Route path="/admin/audit" element={<AdminRoute><AdminAudit /></AdminRoute>} />
            <Route path="/admin/impersonate/:id" element={<AdminRoute><Dashboard /></AdminRoute>} />
            
            {/* Legacy /owner redirects */}
            <Route path="/owner" element={<Navigate to="/admin/platform" replace />} />
            <Route path="/owner/*" element={<Navigate to="/admin/platform" replace />} />
            
            {/* Protected routes - Dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/newsfeed" element={<ProtectedRoute><Newsfeed /></ProtectedRoute>} />
            <Route path="/feed" element={<Navigate to="/newsfeed" replace />} />
            
            {/* Tickets */}
            <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
            <Route path="/tickets/new" element={<ProtectedRoute><NewTicket /></ProtectedRoute>} />
            <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
            
            {/* Tenants - Manager only */}
            <Route path="/tenants" element={<ProtectedRoute requiredRole="manager"><Tenants /></ProtectedRoute>} />
            
            {/* Legacy redirects - features removed */}
            <Route path="/reservations" element={<Navigate to="/dashboard" replace />} />
            <Route path="/packages" element={<Navigate to="/dashboard" replace />} />
            <Route path="/visitors" element={<Navigate to="/dashboard" replace />} />
            
            {/* Marketplace */}
            <Route path="/marketplace" element={<ProtectedRoute><AppLayout><Marketplace /></AppLayout></ProtectedRoute>} />
            <Route path="/marketplace/:id" element={<ProtectedRoute><AppLayout><Marketplace /></AppLayout></ProtectedRoute>} />
            
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
            
            {/* AI Assistant */}
            <Route path="/assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
            
            {/* Admin - requires manager role (residence admin) */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="manager"><Admin /></ProtectedRoute>} />
            <Route path="/admin/residence" element={<ProtectedRoute requiredRole="manager"><Admin /></ProtectedRoute>} />
            <Route path="/admin/lots" element={<ProtectedRoute requiredRole="manager"><Admin /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredRole="manager"><Admin /></ProtectedRoute>} />
            <Route path="/admin/templates" element={<ProtectedRoute requiredRole="manager"><Admin /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/household" element={<ProtectedRoute><Household /></ProtectedRoute>} />
            <Route path="/providers" element={<ProtectedRoute><ServiceProviders /></ProtectedRoute>} />
            <Route path="/settings" element={<Navigate to="/admin" replace />} />
            
            {/* Bailleur Routes */}
            <Route path="/bailleur/dashboard" element={<ProtectedRoute requiredRole="manager"><BailleurDashboard /></ProtectedRoute>} />
            <Route path="/bailleur/apartments" element={<ProtectedRoute requiredRole="manager"><BailleurApartments /></ProtectedRoute>} />
            <Route path="/bailleur/apartments/new" element={<ProtectedRoute requiredRole="manager"><NewBailleurApartment /></ProtectedRoute>} />
            <Route path="/bailleur/apartments/:id" element={<ProtectedRoute requiredRole="manager"><BailleurApartments /></ProtectedRoute>} />
            <Route path="/bailleur/apartments/:id/edit" element={<ProtectedRoute requiredRole="manager"><BailleurApartments /></ProtectedRoute>} />
            <Route path="/bailleur/tenants" element={<ProtectedRoute requiredRole="manager"><Tenants /></ProtectedRoute>} />
            <Route path="/bailleur/tenants/new" element={<ProtectedRoute requiredRole="manager"><Tenants /></ProtectedRoute>} />
            <Route path="/bailleur/tickets" element={<ProtectedRoute requiredRole="manager"><Tickets /></ProtectedRoute>} />
            <Route path="/bailleur/tickets/:id" element={<ProtectedRoute requiredRole="manager"><TicketDetail /></ProtectedRoute>} />
            <Route path="/bailleur/payments" element={<ProtectedRoute requiredRole="manager"><Payments /></ProtectedRoute>} />
            <Route path="/bailleur/documents" element={<ProtectedRoute requiredRole="manager"><Documents /></ProtectedRoute>} />
            <Route path="/bailleur/analytics" element={<ProtectedRoute requiredRole="manager"><Analytics /></ProtectedRoute>} />
            
            {/* Syndic Routes */}
            <Route path="/syndic/dashboard" element={<ProtectedRoute requiredRole="manager"><SyndicDashboard /></ProtectedRoute>} />
            <Route path="/syndic/residences" element={<ProtectedRoute requiredRole="manager"><SyndicResidences /></ProtectedRoute>} />
            <Route path="/syndic/residences/new" element={<ProtectedRoute requiredRole="manager"><SyndicResidences /></ProtectedRoute>} />
            <Route path="/syndic/residences/:id" element={<ProtectedRoute requiredRole="manager"><SyndicResidences /></ProtectedRoute>} />
            <Route path="/syndic/residences/:id/buildings" element={<ProtectedRoute requiredRole="manager"><SyndicResidences /></ProtectedRoute>} />
            <Route path="/syndic/tickets" element={<ProtectedRoute requiredRole="manager"><Tickets /></ProtectedRoute>} />
            <Route path="/syndic/tickets/:id" element={<ProtectedRoute requiredRole="manager"><TicketDetail /></ProtectedRoute>} />
            <Route path="/syndic/work-orders" element={<ProtectedRoute requiredRole="manager"><WorkOrders /></ProtectedRoute>} />
            <Route path="/syndic/ag" element={<ProtectedRoute requiredRole="manager"><AG /></ProtectedRoute>} />
            <Route path="/syndic/ag/new" element={<ProtectedRoute requiredRole="manager"><AG /></ProtectedRoute>} />
            <Route path="/syndic/ag/:id" element={<ProtectedRoute requiredRole="manager"><AG /></ProtectedRoute>} />
            <Route path="/syndic/calls" element={<ProtectedRoute requiredRole="manager"><Syndic /></ProtectedRoute>} />
            <Route path="/syndic/budget" element={<ProtectedRoute requiredRole="manager"><Syndic /></ProtectedRoute>} />
            <Route path="/syndic/accounting" element={<ProtectedRoute requiredRole="manager"><Accounting /></ProtectedRoute>} />
            <Route path="/syndic/documents" element={<ProtectedRoute requiredRole="manager"><Documents /></ProtectedRoute>} />
            <Route path="/syndic/residents" element={<ProtectedRoute requiredRole="manager"><Directory /></ProtectedRoute>} />
            <Route path="/syndic/apartments-requests" element={<ProtectedRoute requiredRole="manager"><SyndicResidences /></ProtectedRoute>} />
            
            {/* Professional modules - Manager/Admin only */}
            <Route path="/accounting" element={<ProtectedRoute requiredRole="manager"><Accounting /></ProtectedRoute>} />
            <Route path="/syndic" element={<ProtectedRoute requiredRole="manager"><Syndic /></ProtectedRoute>} />
            <Route path="/work-orders" element={<ProtectedRoute requiredRole="manager"><WorkOrders /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute requiredRole="manager"><Analytics /></ProtectedRoute>} />
            <Route path="/inspections" element={<ProtectedRoute requiredRole="manager"><PropertyInspections /></ProtectedRoute>} />
            
            {/* Rental module - requires manager/admin */}
            <Route path="/rental" element={<ProtectedRoute requireRental><Rental /></ProtectedRoute>} />
            <Route path="/rental/units" element={<ProtectedRoute requireRental><RentalUnits /></ProtectedRoute>} />
            <Route path="/rental/units/new" element={<ProtectedRoute requireRental><NewUnit /></ProtectedRoute>} />
            <Route path="/rental/units/:id/edit" element={<ProtectedRoute requireRental><EditUnit /></ProtectedRoute>} />
            <Route path="/rental/vacancies" element={<ProtectedRoute requireRental><RentalVacancies /></ProtectedRoute>} />
            <Route path="/rental/vacancies/new" element={<ProtectedRoute requireRental><NewVacancy /></ProtectedRoute>} />
            <Route path="/rental/vacancies/:id" element={<ProtectedRoute requireRental><Rental /></ProtectedRoute>} />
            <Route path="/rental/applications" element={<ProtectedRoute requireRental><RentalApplications /></ProtectedRoute>} />
            <Route path="/rental/applications/:id" element={<ProtectedRoute requireRental><Rental /></ProtectedRoute>} />
            
            {/* Help */}
            <Route path="/help" element={<Help />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ResidenceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
