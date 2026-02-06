import {
  Home,
  Building2,
  Users,
  Ticket,
  FileText,
  Vote,
  Wrench,
  ClipboardList,
  Calculator,
  BarChart3,
  Calendar,
  MessageCircle,
  CreditCard,
  ClipboardCheck,
} from "lucide-react";
import type { SidebarMenuGroup } from "./GenericSidebar";

/**
 * Syndic sidebar menu configuration
 */
export const syndicMenuGroups: SidebarMenuGroup[] = [
  {
    id: "main",
    title: "Principal",
    items: [
      { id: "dashboard", title: "Tableau de bord", href: "/syndic/dashboard", icon: Home },
      { id: "residences", title: "Résidences", href: "/syndic/residences", icon: Building2 },
      { id: "tickets", title: "Incidents", href: "/syndic/tickets", icon: Ticket },
      { id: "documents", title: "Documents", href: "/syndic/documents", icon: FileText },
    ],
  },
  {
    id: "copro",
    title: "Copropriété",
    items: [
      { id: "ag", title: "Assemblées générales", href: "/syndic/ag", icon: Vote },
      { id: "owners", title: "Copropriétaires", href: "/syndic/owners", icon: Users },
      { id: "calls", title: "Appels de fonds", href: "/syndic/calls", icon: Calendar },
    ],
  },
  {
    id: "operations",
    title: "Opérations",
    items: [
      { id: "workorders", title: "Ordres de travaux", href: "/syndic/work-orders", icon: ClipboardList },
      { id: "providers", title: "Prestataires", href: "/syndic/providers", icon: Wrench },
      { id: "reservations", title: "Réservations", href: "/syndic/reservations", icon: Calendar },
    ],
  },
  {
    id: "finance",
    title: "Finance",
    items: [
      { id: "accounting", title: "Comptabilité", href: "/syndic/accounting", icon: Calculator },
      { id: "analytics", title: "Statistiques", href: "/syndic/analytics", icon: BarChart3 },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    items: [
      { id: "chat", title: "Messagerie", href: "/syndic/chat", icon: MessageCircle },
    ],
  },
];

/**
 * Bailleur sidebar menu configuration
 */
export const bailleurMenuGroups: SidebarMenuGroup[] = [
  {
    id: "main",
    title: "",
    items: [
      { id: "dashboard", title: "Tableau de bord", href: "/bailleur/dashboard", icon: Home },
      { id: "apartments", title: "Mes appartements", href: "/bailleur/apartments", icon: Building2 },
      { id: "tenants", title: "Mes locataires", href: "/bailleur/tenants", icon: Users },
      { id: "tickets", title: "Incidents", href: "/bailleur/tickets", icon: Ticket },
      { id: "documents", title: "Documents", href: "/bailleur/documents", icon: FileText },
      { id: "payments", title: "Loyers & Paiements", href: "/bailleur/payments", icon: CreditCard },
      { id: "accounting", title: "Comptabilité", href: "/bailleur/accounting", icon: Calculator },
      { id: "inspections", title: "États des lieux", href: "/bailleur/inspections", icon: ClipboardCheck },
      { id: "analytics", title: "Statistiques", href: "/bailleur/analytics", icon: BarChart3 },
    ],
  },
];

/**
 * Resident/App sidebar base menu - this is used with dynamic nav settings
 */
export const residentBaseMenuGroups: SidebarMenuGroup[] = [
  {
    id: "main",
    title: "Principal",
    items: [
      { id: "dashboard", title: "Tableau de bord", href: "/dashboard", icon: Home },
      { id: "newsfeed", title: "Fil d'actualité", href: "/newsfeed" },
      { id: "tickets", title: "Tickets", href: "/tickets", icon: Ticket },
      { id: "documents", title: "Documents", href: "/documents", icon: FileText },
      { id: "directory", title: "Annuaire", href: "/directory", icon: Users },
      { id: "chat", title: "Messages", href: "/chat", icon: MessageCircle },
    ],
  },
];
