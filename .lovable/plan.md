

# Plan de Refactoring : Architecture de Navigation Unifiée

## Diagnostic de l'État Actuel

### Problème Principal : Double Wrapping de Layouts
L'application a une **architecture hybride incohérente** :

1. **`App.tsx`** utilise correctement `GlobalLayout` avec routes imbriquées (lignes 159-258)
2. **MAIS 32 pages** importent et utilisent encore `AppLayout`, `ConditionalLayout`, etc. en interne
3. Résultat : **Double sidebar**, conflits CSS, perte de l'état (scroll, inputs) entre les pages

```text
Flux Actuel (Cassé) :
┌─────────────────────────────────────────────────────────┐
│ App.tsx : GlobalLayout                                  │
│  ├── Sidebar (GenericSidebar)                          │
│  └── <Outlet /> → Page Component                        │
│       └── Dashboard.tsx                                 │
│            └── <AppLayout> (DOUBLON!)                   │
│                 ├── Sidebar (AppSidebar) ← DUPLIQUÉ    │
│                 └── Contenu réel                        │
└─────────────────────────────────────────────────────────┘
```

### Fichiers Impactés

| Catégorie | Fichiers | Pattern Utilisé |
|-----------|----------|-----------------|
| Pages avec `AppLayout` | 27 fichiers | Dashboard, Profile, Vault, AG, etc. |
| Pages avec `ConditionalLayout` | 5 fichiers | Tickets, Documents, Payments, Chat, Tenants |
| Layouts Legacy | 4 fichiers | AppLayout, SyndicLayout, BailleurLayout, ConditionalLayout |

---

## Plan d'Exécution en 4 Phases

### Phase 1 : Nettoyer les Pages (Retirer les Layouts Internes)

**Objectif** : Chaque page doit rendre UNIQUEMENT son contenu, sans wrapper de layout.

**Transformation Type** :

```text
AVANT (Dashboard.tsx) :
─────────────────────
export default function Dashboard() {
  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <DashboardContent />
    </AppLayout>
  );
}

APRÈS (Dashboard.tsx) :
──────────────────────
export default function Dashboard() {
  return <DashboardContent />;
}
```

**Pages à Modifier (32 fichiers)** :
- `Dashboard.tsx`, `Newsfeed.tsx`, `AG.tsx`, `Documents.tsx`
- `Tickets.tsx`, `NewTicket.tsx`, `TicketDetail.tsx`
- `Payments.tsx`, `Chat.tsx`, `Tenants.tsx`, `Directory.tsx`
- `Profile.tsx`, `Vault.tsx`, `Household.tsx`, `Marketplace.tsx`
- `AIAssistant.tsx`, `ServiceProviders.tsx`, `Reservations.tsx`
- `Accounting.tsx`, `Syndic.tsx`, `WorkOrders.tsx`, `Analytics.tsx`
- `PropertyInspections.tsx`, `SyndicPortal.tsx`, `Help.tsx`
- `Rental.tsx`, `RentalUnits.tsx`, `RentalVacancies.tsx`, `RentalApplications.tsx`
- `NewUnit.tsx`, `EditUnit.tsx`, `NewVacancy.tsx`
- `Packages.tsx`, `Visitors.tsx`

### Phase 2 : Valider le `GlobalLayout` Existant

Le `GlobalLayout` actuel est déjà bien structuré. Vérifications mineures :

1. **Structure DOM** : Utilise Flexbox propre ✓
2. **Détection de mode** : URL-based puis fallback sur `agencyType` ✓
3. **Mobile** : Gère `MobileNav` avec padding dynamique ✓

**Ajustement mineur** : S'assurer que le padding mobile ne crée pas de doublons avec les pages nettoyées.

### Phase 3 : Supprimer les Fichiers Legacy

**Fichiers à supprimer** (après Phase 1) :
- `src/components/layout/ConditionalLayout.tsx`
- (Garder `AppLayout.tsx`, `SyndicLayout.tsx`, `BailleurLayout.tsx` en thin wrappers pour rétrocompatibilité externe si nécessaire, mais retirer leurs exports de l'index)

**Fichier à nettoyer** :
- `src/components/layout/index.ts` : Retirer les exports des layouts legacy

### Phase 4 : Validation & Tests

1. Vérifier que chaque route affiche une seule sidebar
2. Tester la navigation mobile (bottom bar + sheet menu)
3. Valider que le scroll et les états des formulaires persistent entre les pages
4. Tester les 3 modes : Résident, Syndic, Bailleur

---

## Détail Technique des Modifications

### Fichiers Pages (32 modifications similaires)

Pour chaque fichier, le pattern est :

1. **Retirer l'import** : `import { AppLayout } from "@/components/layout/AppLayout";` ou `ConditionalLayout`
2. **Simplifier l'export** : Retirer le wrapper et retourner directement le contenu

Certaines pages ont des hooks `useAuth` / `useAgencyType` utilisés uniquement pour le layout. Ces hooks peuvent être conservés si le contenu interne les utilise aussi, sinon ils seront également retirés.

### Fichier `src/components/layout/index.ts`

```text
Retirer ces exports :
─────────────────────
export { AppLayout } from "./AppLayout";
export { SyndicLayout } from "./SyndicLayout";
export { BailleurLayout } from "./BailleurLayout";
export { ConditionalLayout } from "./ConditionalLayout";
```

### Structure Finale Attendue

```text
Flux Corrigé :
┌─────────────────────────────────────────────────────────┐
│ App.tsx                                                 │
│  └── <Route element={<GlobalLayout />}>                 │
│       ├── Sidebar (GenericSidebar) ← UNIQUE            │
│       └── <Outlet /> → Page Component                   │
│            └── Dashboard.tsx                            │
│                 └── Contenu (sans layout wrapper)       │
└─────────────────────────────────────────────────────────┘
```

---

## Ordre d'Exécution Recommandé

1. **Batch 1** : Pages critiques (Dashboard, Tickets, Payments, Documents, Chat)
2. **Batch 2** : Pages secondaires (Profile, Directory, AG, Vault, etc.)
3. **Batch 3** : Modules professionnels (Accounting, Syndic, WorkOrders, Analytics)
4. **Batch 4** : Module Rental (RentalUnits, RentalVacancies, etc.)
5. **Batch 5** : Nettoyage des fichiers legacy et tests finaux

---

## Risques et Mitigations

| Risque | Mitigation |
|--------|------------|
| Perte de contexte Auth/Residence | Ces contextes sont fournis globalement dans `App.tsx`, pas besoin de les ré-wrapper |
| Pages Admin cassées | Les routes Admin utilisent `AdminLayout` séparément, non impactées |
| Mobile non fonctionnel | Le `GlobalLayout` gère déjà le mobile via `MobileNav` |

