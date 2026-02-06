import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ResidenceProvider } from "@/contexts/ResidenceContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { GlobalLayout } from "@/components/layout/GlobalLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

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

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
        storageKey="kopro-theme"
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <ResidenceProvider>
                <Routes>
                  {/* ============================================ */}
                  {/* PUBLIC ROUTES - No authentication required   */}
                  {/* ============================================ */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/auth/register-resident" element={<RegisterResident />} />
                  <Route path="/auth/register-manager" element={<RegisterManager />} />
                  <Route path="/auth/register-trial" element={<RegisterTrial />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
                  <Route path="/r/:residenceCode" element={<ResidenceLanding />} />
                  <Route path="/pending" element={<Pending />} />
                  <Route path="/join" element={<JoinResidence />} />
                  <Route path="/quote/:quoteNumber" element={<QuotePublic />} />
                  <Route path="/agency-signup" element={<AgencySignup />} />
                  <Route path="/syndic-portal" element={<SyndicPortal />} />
                  <Route path="/help" element={<Help />} />

                  {/* ============================================ */}
                  {/* ADMIN ROUTES - Platform owner only           */}
                  {/* ============================================ */}
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
                  <Route path="/admin/bug-reports" element={<AdminRoute><AdminBugReports /></AdminRoute>} />
                  <Route path="/admin/storage" element={<AdminRoute><AdminStorage /></AdminRoute>} />
                  <Route path="/admin/audit" element={<AdminRoute><AdminAudit /></AdminRoute>} />
                  <Route path="/admin/impersonate/:id" element={<AdminRoute><Dashboard /></AdminRoute>} />
                  <Route path="/owner" element={<Navigate to="/admin/platform" replace />} />
                  <Route path="/owner/*" element={<Navigate to="/admin/platform" replace />} />

                  {/* ============================================ */}
                  {/* PROTECTED ROUTES WITH GLOBAL LAYOUT          */}
                  {/* Uses nested routing with <Outlet />          */}
                  {/* ============================================ */}
                  <Route element={<ProtectedRoute><GlobalLayout /></ProtectedRoute>}>
                    {/* === RESIDENT / SHARED ROUTES === */}
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="newsfeed" element={<Newsfeed />} />
                    <Route path="feed" element={<Navigate to="/newsfeed" replace />} />
                    <Route path="tickets" element={<Tickets />} />
                    <Route path="tickets/new" element={<NewTicket />} />
                    <Route path="tickets/:id" element={<TicketDetail />} />
                    <Route path="documents" element={<Documents />} />
                    <Route path="documents/:id" element={<Documents />} />
                    <Route path="ag" element={<AG />} />
                    <Route path="ag/:id" element={<AG />} />
                    <Route path="votes" element={<Navigate to="/ag" replace />} />
                    <Route path="payments" element={<Payments />} />
                    <Route path="payments/:id" element={<Payments />} />
                    <Route path="vault" element={<Vault />} />
                    <Route path="directory" element={<Directory />} />
                    <Route path="chat" element={<Chat />} />
                    <Route path="chat/:id" element={<Chat />} />
                    <Route path="assistant" element={<AIAssistant />} />
                    <Route path="marketplace" element={<Marketplace />} />
                    <Route path="marketplace/:id" element={<Marketplace />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="household" element={<Household />} />
                    <Route path="providers" element={<ServiceProviders />} />
                    <Route path="settings" element={<Navigate to="/admin" replace />} />

                    {/* === MANAGER ROUTES (Tenants, Admin) === */}
                    <Route path="tenants" element={<ProtectedRoute requiredRole="manager"><Tenants /></ProtectedRoute>} />
                    <Route path="admin" element={<ProtectedRoute requiredRole="manager"><Admin /></ProtectedRoute>} />
                    <Route path="admin/residence" element={<ProtectedRoute requiredRole="manager"><Admin /></ProtectedRoute>} />
                    <Route path="admin/lots" element={<ProtectedRoute requiredRole="manager"><Admin /></ProtectedRoute>} />
                    <Route path="admin/users" element={<ProtectedRoute requiredRole="manager"><Admin /></ProtectedRoute>} />
                    <Route path="admin/templates" element={<ProtectedRoute requiredRole="manager"><Admin /></ProtectedRoute>} />

                    {/* === PROFESSIONAL MODULES === */}
                    <Route path="accounting" element={<ProtectedRoute requiredRole="manager"><Accounting /></ProtectedRoute>} />
                    <Route path="syndic" element={<ProtectedRoute requiredRole="manager"><Syndic /></ProtectedRoute>} />
                    <Route path="work-orders" element={<ProtectedRoute requiredRole="manager"><WorkOrders /></ProtectedRoute>} />
                    <Route path="analytics" element={<ProtectedRoute requiredRole="manager"><Analytics /></ProtectedRoute>} />
                    <Route path="inspections" element={<ProtectedRoute requiredRole="manager"><PropertyInspections /></ProtectedRoute>} />

                    {/* === RENTAL MODULE === */}
                    <Route path="rental" element={<ProtectedRoute requireRental><Rental /></ProtectedRoute>} />
                    <Route path="rental/units" element={<ProtectedRoute requireRental><RentalUnits /></ProtectedRoute>} />
                    <Route path="rental/units/new" element={<ProtectedRoute requireRental><NewUnit /></ProtectedRoute>} />
                    <Route path="rental/units/:id/edit" element={<ProtectedRoute requireRental><EditUnit /></ProtectedRoute>} />
                    <Route path="rental/vacancies" element={<ProtectedRoute requireRental><RentalVacancies /></ProtectedRoute>} />
                    <Route path="rental/vacancies/new" element={<ProtectedRoute requireRental><NewVacancy /></ProtectedRoute>} />
                    <Route path="rental/vacancies/:id" element={<ProtectedRoute requireRental><Rental /></ProtectedRoute>} />
                    <Route path="rental/applications" element={<ProtectedRoute requireRental><RentalApplications /></ProtectedRoute>} />
                    <Route path="rental/applications/:id" element={<ProtectedRoute requireRental><Rental /></ProtectedRoute>} />

                    {/* === BAILLEUR ROUTES === */}
                    <Route path="bailleur/dashboard" element={<ProtectedRoute requiredRole="manager"><BailleurDashboard /></ProtectedRoute>} />
                    <Route path="bailleur/apartments" element={<ProtectedRoute requiredRole="manager"><BailleurApartments /></ProtectedRoute>} />
                    <Route path="bailleur/apartments/new" element={<ProtectedRoute requiredRole="manager"><NewBailleurApartment /></ProtectedRoute>} />
                    <Route path="bailleur/apartments/:id" element={<ProtectedRoute requiredRole="manager"><BailleurApartments /></ProtectedRoute>} />
                    <Route path="bailleur/apartments/:id/edit" element={<ProtectedRoute requiredRole="manager"><BailleurApartments /></ProtectedRoute>} />
                    <Route path="bailleur/tenants" element={<ProtectedRoute requiredRole="manager"><Tenants /></ProtectedRoute>} />
                    <Route path="bailleur/tenants/new" element={<ProtectedRoute requiredRole="manager"><Tenants /></ProtectedRoute>} />
                    <Route path="bailleur/tickets" element={<ProtectedRoute requiredRole="manager"><Tickets /></ProtectedRoute>} />
                    <Route path="bailleur/tickets/:id" element={<ProtectedRoute requiredRole="manager"><TicketDetail /></ProtectedRoute>} />
                    <Route path="bailleur/payments" element={<ProtectedRoute requiredRole="manager"><Payments /></ProtectedRoute>} />
                    <Route path="bailleur/documents" element={<ProtectedRoute requiredRole="manager"><Documents /></ProtectedRoute>} />
                    <Route path="bailleur/accounting" element={<ProtectedRoute requiredRole="manager"><Accounting /></ProtectedRoute>} />
                    <Route path="bailleur/inspections" element={<ProtectedRoute requiredRole="manager"><PropertyInspections /></ProtectedRoute>} />
                    <Route path="bailleur/analytics" element={<ProtectedRoute requiredRole="manager"><Analytics /></ProtectedRoute>} />
                    <Route path="bailleur/settings" element={<ProtectedRoute requiredRole="manager"><Admin /></ProtectedRoute>} />

                    {/* === SYNDIC ROUTES === */}
                    <Route path="syndic/dashboard" element={<ProtectedRoute requiredRole="manager"><SyndicDashboard /></ProtectedRoute>} />
                    <Route path="syndic/residences" element={<ProtectedRoute requiredRole="manager"><SyndicResidences /></ProtectedRoute>} />
                    <Route path="syndic/residences/new" element={<ProtectedRoute requiredRole="manager"><SyndicResidences /></ProtectedRoute>} />
                    <Route path="syndic/residences/:id" element={<ProtectedRoute requiredRole="manager"><SyndicResidences /></ProtectedRoute>} />
                    <Route path="syndic/residences/:id/buildings" element={<ProtectedRoute requiredRole="manager"><SyndicResidences /></ProtectedRoute>} />
                    <Route path="syndic/tickets" element={<ProtectedRoute requiredRole="manager"><Tickets /></ProtectedRoute>} />
                    <Route path="syndic/tickets/:id" element={<ProtectedRoute requiredRole="manager"><TicketDetail /></ProtectedRoute>} />
                    <Route path="syndic/work-orders" element={<ProtectedRoute requiredRole="manager"><WorkOrders /></ProtectedRoute>} />
                    <Route path="syndic/ag" element={<ProtectedRoute requiredRole="manager"><AG /></ProtectedRoute>} />
                    <Route path="syndic/ag/new" element={<ProtectedRoute requiredRole="manager"><AG /></ProtectedRoute>} />
                    <Route path="syndic/ag/:id" element={<ProtectedRoute requiredRole="manager"><AG /></ProtectedRoute>} />
                    <Route path="syndic/calls" element={<ProtectedRoute requiredRole="manager"><Syndic /></ProtectedRoute>} />
                    <Route path="syndic/budget" element={<ProtectedRoute requiredRole="manager"><Syndic /></ProtectedRoute>} />
                    <Route path="syndic/owners" element={<ProtectedRoute requiredRole="manager"><Directory /></ProtectedRoute>} />
                    <Route path="syndic/providers" element={<ProtectedRoute requiredRole="manager"><ServiceProviders /></ProtectedRoute>} />
                    <Route path="syndic/reservations" element={<ProtectedRoute requiredRole="manager"><Dashboard /></ProtectedRoute>} />
                    <Route path="syndic/accounting" element={<ProtectedRoute requiredRole="manager"><Accounting /></ProtectedRoute>} />
                    <Route path="syndic/analytics" element={<ProtectedRoute requiredRole="manager"><Analytics /></ProtectedRoute>} />
                    <Route path="syndic/chat" element={<ProtectedRoute requiredRole="manager"><Chat /></ProtectedRoute>} />
                    <Route path="syndic/documents" element={<ProtectedRoute requiredRole="manager"><Documents /></ProtectedRoute>} />
                    <Route path="syndic/residents" element={<ProtectedRoute requiredRole="manager"><Directory /></ProtectedRoute>} />
                    <Route path="syndic/apartments-requests" element={<ProtectedRoute requiredRole="manager"><SyndicResidences /></ProtectedRoute>} />
                    <Route path="syndic/settings" element={<ProtectedRoute requiredRole="manager"><Admin /></ProtectedRoute>} />

                    {/* === LEGACY REDIRECTS === */}
                    <Route path="reservations" element={<Navigate to="/dashboard" replace />} />
                    <Route path="packages" element={<Navigate to="/dashboard" replace />} />
                    <Route path="visitors" element={<Navigate to="/dashboard" replace />} />
                  </Route>

                  {/* ============================================ */}
                  {/* 404 - NOT FOUND                              */}
                  {/* ============================================ */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ResidenceProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
