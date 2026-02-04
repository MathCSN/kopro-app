# Analyse du Fonctionnement - Application KOPRO

## RÉSUMÉ EXÉCUTIF

L'application KOPRO est une plateforme complète de gestion immobilière avec 3 types d'utilisateurs principaux :
1. **Résidents** - Utilisent l'app pour leur vie quotidienne (tickets, documents, paiements, chat)
2. **Managers (Bailleurs/Syndics)** - Gèrent les résidences, lots, locataires
3. **Admins** - Administration globale de la plateforme

## ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Components: UI, Layout, Auth, Residence, etc.        │  │
│  │  Pages: Dashboard, Tickets, Documents, Admin, etc.   │  │
│  │  Hooks: useAuth, useResidence, useSendEmail, etc.    │  │
│  │  Contexts: AuthContext, ResidenceContext             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ API Calls
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE (Backend)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Auth: Email/Password authentication                 │  │
│  │  Database: PostgreSQL with RLS                       │  │
│  │  Storage: File uploads (documents, images)           │  │
│  │  Edge Functions: Email, Payments, Password Reset     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ Webhooks
┌─────────────────────────────────────────────────────────────┐
│                 SERVICES EXTERNES                           │
│  • Stripe (Paiements & Abonnements)                         │
│  • SMTP (Envoi d'emails)                                    │
│  • Capacitor (Fonctionnalités natives mobile)              │
└─────────────────────────────────────────────────────────────┘
```

---

## FLUX CRITIQUES IDENTIFIÉS

### 1. FLUX QR CODE (Scanner → Rejoindre Résidence)

**État : ✅ Fonctionnel**

#### Composants Clés
- `QrScannerDialog.tsx` - Scanner caméra avec @zxing/browser
- `Pending.tsx` - Page post-registration avec options scan/manuel
- `JoinResidence.tsx` - Sélection d'appartement et attribution
- `ResidenceLanding.tsx` - Landing page pour URLs courtes (/r/)

#### Flux Détaillé
```
1. Manager génère QR code (ResidenceQRDialog.tsx)
   ├─ Global: /join?residence={uuid}
   └─ Par bâtiment: /join?residence={uuid}&building={uuid}

2. Résident scanne QR code (QrScannerDialog.tsx)
   ├─ Permission caméra demandée
   ├─ Détection QR code
   └─ Navigation vers l'URL scannée

3. Traitement selon le format
   ├─ URL complète → Navigation directe
   ├─ UUID → /join?residence={uuid}
   └─ Short code → /r/{code} (résolution puis /join)

4. Page JoinResidence (JoinResidence.tsx)
   ├─ Vérification authentification
   ├─ Vérification si déjà membre
   ├─ Chargement des lots disponibles
   ├─ Sélection appartement
   │   ├─ Libre → Attribution directe (primary_resident)
   │   └─ Occupé → Demande code (occupant)
   └─ Création user_roles + occupancies

5. Redirection vers Dashboard
```

#### Points de Test Critiques
- ✅ Permission caméra (acceptée/refusée)
- ✅ Fallback saisie manuelle
- ✅ Détection QR code correcte
- ✅ Création des enregistrements DB (user_roles, occupancies)
- ✅ Validation code d'appartement
- ✅ Gestion des erreurs (résidence introuvable, aucun lot disponible)

---

### 2. FLUX AUTHENTIFICATION

**État : ✅ Fonctionnel**

#### Composants Clés
- `Login.tsx` - Page de connexion
- `RegisterResident.tsx` - Inscription résident
- `RegisterManager.tsx` - Inscription manager
- `RegisterTrial.tsx` - Inscription agence trial
- `ResetPassword.tsx` - Réinitialisation mot de passe
- `useAuth.tsx` - Hook d'authentification

#### Flux Connexion
```
1. Utilisateur entre email/password
2. Appel supabase.auth.signInWithPassword()
3. Session créée
4. Chargement du profil (profiles table)
5. Chargement des rôles (user_roles table)
6. Redirection selon rôle:
   ├─ admin → /admin/platform
   ├─ manager → /dashboard
   ├─ resident → /dashboard
   └─ aucun rôle → /pending
```

#### Flux Inscription Résident
```
1. Formulaire d'inscription
2. Appel supabase.auth.signUp()
3. Création compte auth.users
4. Création profil (profiles table)
5. Redirection vers /pending
6. Scan QR code pour rejoindre résidence
```

#### Flux Mot de Passe Oublié
```
1. Utilisateur entre son email
2. Appel edge function request-password-reset
3. Génération token sécurisé (32 chars)
4. Insertion dans password_reset_tokens
5. Envoi email avec lien
6. Utilisateur clique sur lien → /reset-password?token=...
7. Vérification token (valide, non-utilisé, non-expiré)
8. Saisie nouveau mot de passe
9. Appel edge function reset-password-with-token
10. Mise à jour mot de passe Supabase Auth
11. Marquage token comme utilisé
```

#### Points de Test Critiques
- ✅ Inscription avec email déjà existant (erreur)
- ✅ Connexion avec mauvais mot de passe (erreur)
- ✅ Reset password token valide
- ✅ Reset password token expiré (1h)
- ✅ Reset password token déjà utilisé
- ✅ Email envoyé avec noreply configuré
- ✅ Redirection post-login correcte selon rôle

---

### 3. FLUX EMAILS

**État : ✅ Fonctionnel avec Configuration Centralisée**

#### Configuration Actuelle
- **Adresse noreply** : `noreply@kopro.app` (stockée dans `app_config`)
- **Modifiable** : Via Admin → Paramètres → Email
- **Utilisée par** :
  - Tous les emails agences (Bailleurs/Syndics)
  - Emails reset password
  - Tous les emails système

#### Composants Clés
- Edge Function `send-email` - Envoi d'emails via SMTP
- Edge Function `request-password-reset` - Emails reset password
- Hook `useSendEmail` - Envoi d'emails depuis le frontend
- Page `AdminSettings` - Configuration SMTP et noreply

#### Architecture Email
```
┌──────────────────────────────────────────────────┐
│          Configuration Centralisée               │
│                                                  │
│  app_config table:                               │
│  ├─ key: "noreply_email"                        │
│  ├─ value: "noreply@kopro.app"                  │
│  └─ modifiable via Admin Settings               │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│          Points d'Utilisation                    │
│                                                  │
│  1. useSendEmail hook                            │
│     → Récupère noreply depuis app_config         │
│     → FROM: Nom Agence <noreply@...>            │
│     → REPLY-TO: Email contact agence            │
│                                                  │
│  2. request-password-reset function              │
│     → Récupère noreply depuis app_config         │
│     → FROM: KOPRO <noreply@...>                 │
│                                                  │
│  3. send-email function                          │
│     → Reçoit fromEmail en paramètre              │
│     → Utilise SMTP configuré                     │
└──────────────────────────────────────────────────┘
```

#### Format des Emails
```
Exemple pour un Syndic "Sérénity":
  FROM: Sérénity <noreply@kopro.app>
  REPLY-TO: contact@serenity-syndic.fr
  TO: resident@example.com
  SUBJECT: Nouvel appel de charges

Exemple pour reset password:
  FROM: KOPRO <noreply@kopro.app>
  TO: user@example.com
  SUBJECT: Réinitialisation de votre mot de passe KOPRO
```

#### Changement de Domaine (Future)
```
Quand le domaine sera configuré:

1. Admin va dans Paramètres → Email
2. Change "noreply@kopro.app" → "noreply@votre-domaine.com"
3. Sauvegarde

Résultat immédiat:
  ✅ Tous les emails des agences utilisent le nouveau domaine
  ✅ Reset password utilise le nouveau domaine
  ✅ Aucune modification de code nécessaire
```

#### Points de Test Critiques
- ✅ SMTP configuré et testé
- ✅ Email reset password envoyé avec noreply correct
- ✅ Emails agences avec FROM correct (nom agence + noreply)
- ✅ Reply-To configuré par agence fonctionne
- ✅ Templates emails utilisent variables correctement
- ✅ Modification noreply dans Admin Settings fonctionne

---

### 4. FLUX PAIEMENTS (Stripe)

**État : ⚠️ Nécessite Configuration Stripe**

#### Composants Clés
- Edge Function `create-payment-checkout` - Création session Stripe
- Edge Function `create-syndic-checkout` - Abonnement Syndic
- Edge Function `stripe-syndic-webhook` - Traitement webhooks
- Page `Payments` - Gestion paiements résidents
- Page `Syndic` - Abonnement et fonctionnalités syndic

#### Flux Paiement Résident
```
1. Résident va sur /payments
2. Voit liste des charges à payer
3. Clique sur "Payer"
4. Appel edge function create-payment-checkout
5. Création session Stripe Checkout
6. Redirection vers Stripe
7. Paiement effectué
8. Webhook reçu
9. Mise à jour statut dans payments table
10. Notification résident
```

#### Flux Abonnement Syndic
```
1. Syndic essaie d'accéder /syndic
2. Vérification syndic_subscription_status
3. Si inactif → Paywall affiché
4. Clic sur "S'abonner"
5. Appel create-syndic-checkout
6. Création Stripe Subscription
7. Redirection vers Stripe
8. Abonnement souscrit
9. Webhook reçu
10. Mise à jour agencies.syndic_subscription_status
11. Accès débloqué instantanément
```

#### Points de Test Critiques
- ⚠️ Stripe API keys configurées
- ⚠️ Webhooks configurés sur Stripe Dashboard
- ⚠️ Edge functions déployées
- ✅ Paywall syndic fonctionne
- ✅ Redirection Stripe correcte
- ✅ Retour après paiement
- ✅ Mise à jour statuts DB

---

### 5. FLUX GESTION RÉSIDENCE (Manager)

**État : ✅ Fonctionnel**

#### Composants Clés
- Page `Admin` - Gestion résidence (onglets)
- `ResidencesManagement` - CRUD résidences
- `BuildingsManagement` - CRUD bâtiments
- `LotsManagement` - CRUD lots/appartements
- `UsersManagement` - Gestion utilisateurs
- `ResidenceQRDialog` - Génération QR codes

#### Flux Création Résidence
```
1. Manager clique "Nouvelle résidence"
2. Formulaire :
   ├─ Nom
   ├─ Adresse
   ├─ Ville
   ├─ Code postal
   └─ Type (Copropriété, Location, etc.)
3. Validation et insertion DB (residences)
4. Résidence créée et affichée
5. Génération automatic court ID (8 premiers chars UUID)
```

#### Flux Création Lots en Masse
```
1. Clic "Création en masse"
2. Configuration :
   ├─ Nombre d'étages (ex: 5)
   ├─ Appartements par étage (ex: 4)
   ├─ Préfixe de porte (ex: A, B, C, D)
   └─ Bâtiment (si plusieurs)
3. Calcul : 5 étages × 4 apparts = 20 lots
4. Génération automatique :
   ├─ Étage 1: 1A, 1B, 1C, 1D
   ├─ Étage 2: 2A, 2B, 2C, 2D
   ├─ ...
   └─ Étage 5: 5A, 5B, 5C, 5D
5. Insertion en masse dans lots table
```

#### Flux Génération QR Codes
```
1. Manager va sur Tenants ou Admin
2. Clic "QR Code d'invitation" ou "Partager"
3. Choix du mode :
   ├─ Global → 1 QR pour toute la résidence
   └─ Par bâtiment → 1 QR par bâtiment
4. Génération URLs :
   ├─ /join?residence={uuid}
   └─ /join?residence={uuid}&building={uuid}
5. Conversion en QR code (qrcode.react)
6. Options :
   ├─ Télécharger PNG
   ├─ Copier lien
   ├─ Partager (Email, SMS, WhatsApp, etc.)
   └─ Plateformes immobilières
```

#### Points de Test Critiques
- ✅ Création résidence
- ✅ Création bâtiments
- ✅ Création lots (manuel et en masse)
- ✅ QR codes générés correctement
- ✅ URLs fonctionnelles
- ✅ Partage multi-canaux
- ✅ Permissions RLS respectées

---

### 6. FLUX TICKETS

**État : ✅ Fonctionnel**

#### Composants Clés
- Page `Tickets` - Liste des tickets
- Page `NewTicket` - Création ticket
- Page `TicketDetail` - Détail et gestion
- `TicketLocationSelector` - Sélection localisation

#### Flux Création Ticket (Résident)
```
1. Résident va sur /tickets
2. Clic "Nouveau ticket"
3. Sélection localisation :
   ├─ Lieu commun (hall, parking, etc.)
   └─ Mon appartement
4. Formulaire :
   ├─ Titre (ex: "Fuite d'eau salle de bain")
   ├─ Description détaillée
   ├─ Catégorie (Plomberie, Électricité, etc.)
   ├─ Priorité (Basse, Normale, Haute, Urgente)
   └─ Photos (optionnel, upload multiple)
5. Validation et insertion DB (tickets)
6. Statut initial: "pending"
7. Notification envoyée au manager
8. Email envoyé au manager (si configuré)
```

#### Flux Traitement Ticket (Manager)
```
1. Manager reçoit notification
2. Va sur /tickets
3. Voit liste de tous les tickets résidence
4. Clic sur un ticket
5. Page détail :
   ├─ Infos ticket (titre, description, photos)
   ├─ Localisation
   ├─ Résident demandeur
   └─ Historique commentaires
6. Actions possibles :
   ├─ Changer statut (En cours, Résolu, Fermé)
   ├─ Ajouter commentaire
   ├─ Assigner à prestataire
   ├─ Planifier intervention
   └─ Ajouter photos/documents
7. Chaque action génère notification
```

#### États des Tickets
```
pending → in_progress → resolved → closed
   ↓          ↓            ↓
rejected   cancelled   reopened
```

#### Points de Test Critiques
- ✅ Création ticket avec photos
- ✅ Sélection localisation
- ✅ Notifications temps réel
- ✅ Changement de statut
- ✅ Commentaires
- ✅ Assignation prestataire
- ✅ Permissions (résident voit ses tickets, manager voit tous)

---

### 7. FLUX DOCUMENTS

**État : ✅ Fonctionnel**

#### Composants Clés
- Page `Documents` - Liste documents
- `ImportDocumentDialog` - Upload documents manager
- `UserDocumentUploadDialog` - Upload documents résident
- `DocumentRequestsSection` - Demandes de documents

#### Flux Upload Document (Manager)
```
1. Manager va sur /documents
2. Clic "Importer un document"
3. Sélection fichier(s) :
   ├─ Types supportés: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
   └─ Taille max: 10MB par fichier
4. Configuration :
   ├─ Nom du document
   ├─ Catégorie (Règlement, PV AG, Charges, etc.)
   ├─ Description
   └─ Visibilité :
       ├─ Tous les résidents
       ├─ Propriétaires uniquement
       └─ Locataires uniquement
5. Upload vers Supabase Storage
6. Insertion DB (documents table)
7. Génération URL publique signée
8. Notification résidents (si configuré)
```

#### Flux Upload Document (Résident)
```
1. Résident va sur /documents
2. Clic "Mes documents" ou "Uploader"
3. Sélection fichier
4. Configuration :
   ├─ Nom
   ├─ Type (Assurance, Bail, Quittance, etc.)
   └─ Privé (visible uniquement par lui et manager)
5. Upload vers Supabase Storage
6. Insertion DB avec user_id
```

#### Storage Buckets
```
documents/
  ├─ {residence_id}/
  │   ├─ shared/ (documents communs)
  │   └─ private/ (documents privés)
  └─ {user_id}/ (documents personnels)
```

#### Points de Test Critiques
- ✅ Upload fichiers multiples formats
- ✅ Upload avec taille max respectée
- ✅ Storage RLS (accès restreint)
- ✅ URLs signées générées
- ✅ Téléchargement fonctionne
- ✅ Suppression fonctionne
- ✅ Permissions visibilité respectées

---

### 8. FLUX SYNDIC (Fonctionnalités Avancées)

**État : ✅ Fonctionnel avec Paywall**

#### Composants Clés
- Page `Syndic` - Hub syndic
- `LotTantiemes` - Gestion tantiemes
- `NewCoproCallDialog` - Appels de fonds
- `DistributionKeys` - Clés de répartition
- `WorksFund` - Fonds de travaux
- `InviteSyndicDialog` - Multi-syndics

#### Flux Gestion Tantiemes
```
1. Syndic va sur /syndic → Onglet "Tantiemes"
2. Liste de tous les lots de la résidence
3. Pour chaque lot :
   ├─ Numéro lot
   ├─ Propriétaire
   ├─ Type
   └─ Tantiemes (input)
4. Saisie des tantiemes
5. Validation :
   ├─ Total doit = 10000/10000
   └─ Alerte si pas égal
6. Sauvegarde
7. Mise à jour lots.tantieme
```

#### Flux Appel de Charges
```
1. Syndic va sur "Appels de fonds"
2. Clic "Nouvel appel"
3. Configuration :
   ├─ Montant total (ex: 50000€)
   ├─ Période (T1 2024, T2 2024, etc.)
   ├─ Type (charges courantes, travaux, etc.)
   ├─ Date limite paiement
   └─ Description
4. Calcul automatique par lot :
   ├─ Lot A (tantieme 500/10000) → 2500€
   ├─ Lot B (tantieme 300/10000) → 1500€
   └─ ...
5. Création dans copro_calls
6. Création paiements individuels (payments)
7. Génération emails automatiques
8. Envoi à tous les propriétaires
```

#### Flux Clés de Répartition
```
1. Création clé personnalisée
   ├─ Nom: "Ascenseur"
   ├─ Description: "Frais ascenseur"
   └─ Lots concernés: Étages 2-5 uniquement
2. Attribution tantiemes spécifiques
3. Utilisation pour appels de charges ciblés
```

#### Flux Multi-Syndics
```
1. Syndic A gère Résidence X
2. Syndic A veut partager avec Syndic B
3. Clic "Inviter un syndic"
4. Saisie :
   ├─ Email Syndic B
   ├─ Résidences à partager
   └─ Permissions (lecture, écriture)
5. Insertion dans lot_shares
6. Email d'invitation envoyé
7. Syndic B accepte
8. Syndic B voit résidence dans sa liste
9. Les deux syndics peuvent gérer
```

#### Points de Test Critiques
- ✅ Paywall actif si pas d'abonnement
- ✅ Gestion tantiemes avec validation 10000
- ✅ Calcul répartition correct
- ✅ Création appel de charges
- ✅ Génération paiements individuels
- ✅ Clés de répartition personnalisées
- ✅ Multi-syndics fonctionnel

---

### 9. FLUX ADMIN PLATEFORME

**État : ✅ Fonctionnel**

#### Composants Clés
- Pages `Admin*` - Différentes sections admin
- `AdminClients` - Gestion agences
- `AdminUsers` - Gestion utilisateurs globale
- `AdminSettings` - Configuration plateforme
- `EmailTemplatesManagement` - Templates emails

#### Flux Gestion Agences
```
1. Admin va sur /admin/clients
2. Liste de toutes les agences
3. Filtres :
   ├─ Type (Bailleur, Syndic, Les deux)
   ├─ Statut abonnement
   └─ Trial / Payant
4. Clic sur une agence
5. Onglets :
   ├─ Infos générales (édition)
   ├─ Résidences gérées
   ├─ Équipe (membres)
   ├─ Abonnements (Stripe)
   ├─ Statistiques
   └─ Lots partagés
6. Actions possibles :
   ├─ Modifier infos agence
   ├─ Suspendre/Activer
   ├─ Prolonger trial
   ├─ Ajouter/Retirer résidences
   └─ Gérer membres équipe
```

#### Flux Configuration Emails
```
1. Admin va sur /admin/global-settings
2. Onglet "Email"
3. Configuration SMTP :
   ├─ Host (ex: smtp.gmail.com)
   ├─ Port (ex: 587)
   ├─ Username
   ├─ Password
   ├─ From email (noreply)
   └─ From name
4. Test de connexion
5. Sauvegarde dans app_config
6. Tous les emails utilisent ce SMTP
```

#### Flux Email Templates
```
1. Admin va sur /admin/emails
2. Liste des templates :
   ├─ invitation_resident
   ├─ password_reset
   ├─ new_ticket
   ├─ appel_charges
   └─ ...
3. Clic sur un template
4. Éditeur :
   ├─ Sujet
   ├─ Corps (HTML)
   ├─ Variables disponibles
   └─ Prévisualisation
5. Modification
6. Sauvegarde dans email_templates
7. Emails futurs utilisent nouveau template
```

#### Points de Test Critiques
- ✅ Accès restreint aux admins uniquement
- ✅ Liste agences complète
- ✅ Modification agences
- ✅ Configuration SMTP
- ✅ Test email
- ✅ Templates modifiables
- ✅ Variables remplacées correctement
- ✅ Logs d'audit enregistrés

---

## SÉCURITÉ ET PERMISSIONS

### Row Level Security (RLS)

**État : ✅ Activé sur Toutes les Tables Critiques**

#### Principe
```
Chaque table a des policies RLS qui limitent l'accès selon :
  ├─ Le rôle de l'utilisateur (resident, manager, admin)
  ├─ La résidence concernée
  ├─ Le propriétaire des données
  └─ Le statut d'abonnement
```

#### Exemples de Policies

**Table `tickets`**
```sql
-- Résidents : voir leurs propres tickets
CREATE POLICY "Residents can view their own tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    reporter_id = auth.uid()
    OR residence_id IN (
      SELECT residence_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

-- Managers : voir tous les tickets de leurs résidences
CREATE POLICY "Managers can view all residence tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'admin')
      AND residence_id = tickets.residence_id
    )
  );
```

**Table `documents`**
```sql
-- Documents selon visibilité
CREATE POLICY "Users can view documents based on visibility"
  ON documents FOR SELECT
  TO authenticated
  USING (
    -- Document public ou
    visibility = 'all'
    -- Document privé et c'est le propriétaire ou
    OR (visibility = 'private' AND user_id = auth.uid())
    -- Manager de la résidence
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'admin')
      AND residence_id = documents.residence_id
    )
  );
```

**Table `payments`**
```sql
-- Résidents : leurs propres paiements
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'admin')
      AND residence_id = payments.residence_id
    )
  );
```

#### Storage RLS

**Bucket `documents`**
```sql
-- Upload : uniquement si membre de la résidence
CREATE POLICY "Users can upload to their residence folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT residence_id::text FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

-- Download : selon RLS de la table documents
CREATE POLICY "Users can download authorized documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM documents
      WHERE file_path = storage.objects.name
      -- Suivi des policies documents
    )
  );
```

---

## DÉTECTION ET GESTION D'ERREURS

### Système de Logging

**État : ✅ Implémenté**

#### Architecture
```
src/lib/errors/
  ├─ errorTypes.ts         → Types d'erreurs
  ├─ errorHandler.ts       → Gestionnaire global
  ├─ errorLogger.ts        → Logger vers Supabase
  ├─ apiErrorHandler.ts    → Erreurs API
  └─ validationHelpers.ts  → Validation données
```

#### Flux d'Erreur
```
1. Erreur se produit dans l'app
   ├─ Erreur réseau (API)
   ├─ Erreur validation
   ├─ Erreur base de données
   └─ Erreur JavaScript

2. Capturée par Error Boundary ou try/catch

3. Traitement par errorHandler
   ├─ Identification type d'erreur
   ├─ Extraction infos contexte
   └─ Formatage message user-friendly

4. Logging dans error_logs table
   ├─ Message
   ├─ Stack trace
   ├─ User ID
   ├─ URL
   ├─ User agent
   └─ Timestamp

5. Affichage à l'utilisateur
   ├─ Toast notification
   ├─ Message d'erreur
   └─ Actions possibles

6. Admin peut voir dans /admin/bug-reports
```

#### Error Boundary
```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>

// En cas d'erreur React:
// 1. Affichage page d'erreur
// 2. Log automatique
// 3. Possibilité de rafraîchir
// 4. Contact support
```

---

## PERFORMANCE ET OPTIMISATION

### Points d'Attention

#### 1. Taille du Bundle
**Constat** : Bundle JavaScript volumineux (3MB)

**Recommandations** :
- ✅ Lazy loading des pages
- ⚠️ Code splitting à améliorer
- ⚠️ Tree shaking des dépendances
- ⚠️ Analyser bundle avec vite-bundle-visualizer

#### 2. Requêtes Base de Données
**Bonnes pratiques actuelles** :
- ✅ Use de `maybeSingle()` au lieu de `single()`
- ✅ Sélection de colonnes spécifiques (pas de `SELECT *`)
- ✅ Index sur colonnes fréquemment queryed
- ✅ RLS optimisé

**À surveiller** :
- ⚠️ N+1 queries dans certaines listes
- ⚠️ Pagination à implémenter sur grandes listes

#### 3. Images et Assets
**Bonnes pratiques** :
- ✅ Compression images
- ✅ Lazy loading images
- ✅ SVG pour icônes et logo

**À améliorer** :
- ⚠️ CDN pour assets statiques
- ⚠️ WebP format
- ⚠️ Responsive images

#### 4. Caching
**Actuellement** :
- ✅ React Query pour cache API
- ✅ Service Worker (PWA)
- ✅ localStorage pour préférences

---

## MOBILE ET PWA

### État Actuel

#### PWA
**Configuré** : ✅ Service Worker présent
**Installable** : ✅ Manifest.json configuré
**Offline** : ⚠️ Partiel (pages en cache)

#### Capacitor
**Installé** : ✅ Configuré pour Android/iOS
**Utilisé** : ⚠️ Pas d'APIs natives utilisées actuellement

**Potentiel** :
- Push notifications natives
- Caméra native (pour QR scanner)
- Partage natif
- Background sync

#### Responsive Design
**État** : ✅ Entièrement responsive
**Breakpoints** :
- Mobile : < 640px
- Tablet : 640px - 1024px
- Desktop : > 1024px

**Navigation Mobile** : ✅ Hamburger menu + bottom nav

---

## TESTS PRIORITAIRES

### Top 10 Tests à Faire EN PRIORITÉ

1. **✅ Scanner QR Code avec Caméra**
   - Ouvrir /pending
   - Cliquer "Scanner le QR code"
   - Vérifier demande permission caméra
   - Scanner un QR code
   - Vérifier navigation vers /join

2. **✅ Rejoindre Résidence (Appartement Libre)**
   - Après scan QR code
   - Sélectionner un appartement libre
   - Vérifier attribution automatique
   - Vérifier redirection dashboard

3. **✅ Rejoindre Résidence (Appartement Occupé)**
   - Sélectionner appartement avec "Code requis"
   - Entrer le code
   - Vérifier attribution comme occupant
   - Vérifier accès dashboard

4. **✅ Créer un Ticket avec Photos**
   - En tant que résident
   - Aller sur /tickets → Nouveau
   - Remplir formulaire
   - Ajouter 2-3 photos
   - Soumettre
   - Vérifier notification manager

5. **✅ Reset Password**
   - Page login → Mot de passe oublié
   - Entrer email
   - Vérifier email reçu (avec noreply@kopro.app)
   - Cliquer lien
   - Changer mot de passe
   - Vérifier connexion avec nouveau MDP

6. **✅ Upload Document**
   - En tant que résident ou manager
   - Aller sur /documents
   - Upload un PDF
   - Vérifier fichier dans liste
   - Télécharger le fichier
   - Vérifier contenu correct

7. **✅ Création Résidence + Lots en Masse**
   - En tant que manager
   - Créer nouvelle résidence
   - Créer bâtiment
   - Utiliser création en masse (ex: 3 étages × 4 apparts)
   - Vérifier 12 lots créés
   - Vérifier numérotation (1A, 1B, 1C, 1D, 2A, etc.)

8. **✅ Génération et Partage QR Code**
   - En tant que manager
   - Aller sur Tenants
   - Clic "QR Code d'invitation"
   - Télécharger le QR code PNG
   - Vérifier fichier téléchargé
   - Scanner avec téléphone
   - Vérifier atterrissage correct

9. **✅ Changement de Résidence**
   - En tant qu'utilisateur avec 2+ résidences
   - Cliquer sélecteur résidence
   - Changer de résidence
   - Vérifier données changent immédiatement
   - Vérifier tickets, documents, etc. filtrés

10. **✅ Permissions RLS**
    - Créer 2 comptes résidents dans 2 résidences différentes
    - En tant que Résident A
    - Essayer d'accéder aux tickets de Résident B
    - Vérifier accès refusé
    - Essayer d'accéder aux documents de Résident B
    - Vérifier accès refusé

---

## BUGS POTENTIELS IDENTIFIÉS

### 🔴 Critiques (À Tester en Priorité)

#### 1. Permission Caméra sur Safari iOS
**Problème Potentiel** : Safari iOS peut avoir des comportements différents pour getUserMedia()

**Test** :
- Ouvrir sur iPhone Safari
- Tenter scan QR code
- Vérifier si permission demandée
- Vérifier si caméra s'active

**Workaround si bug** : Fallback automatique sur saisie manuelle

#### 2. Upload Fichiers Volumineux
**Problème Potentiel** : Timeout ou erreur sur fichiers > 10MB

**Test** :
- Upload fichier 15MB
- Vérifier message d'erreur approprié
- Tester avec connexion lente

#### 3. QR Code Non Détecté
**Problème Potentiel** : Certains formats QR code peuvent ne pas être détectés

**Test** :
- QR code avec couleurs personnalisées
- QR code de faible qualité
- QR code avec logo au centre

### 🟡 Moyens

#### 4. Notifications Temps Réel
**Problème Potentiel** : Délai dans notifications si WebSocket déconnecté

**Test** :
- 2 navigateurs ouverts
- Créer ticket dans navigateur A
- Vérifier notification dans navigateur B
- Mesurer délai

#### 5. Pagination Grandes Listes
**Problème Potentiel** : Performance dégradée sur listes > 100 éléments

**Test** :
- Résidence avec 200+ lots
- Charger page liste lots
- Mesurer temps de chargement
- Vérifier scroll fluide

#### 6. Concurrent Edits
**Problème Potentiel** : 2 utilisateurs modifient même donnée simultanément

**Test** :
- 2 managers ouvrent même ticket
- Les deux changent le statut différemment
- Vérifier comportement
- Vérifier pas de perte de données

### 🟢 Mineurs

#### 7. Dark Mode Incomplete
**Problème Potentiel** : Certains composants pas optimisés pour dark mode

**Test** :
- Activer dark mode
- Parcourir toutes les pages
- Vérifier contrastes suffisants
- Vérifier lisibilité

#### 8. Emails Non Reçus
**Problème Potentiel** : Emails en spam ou non envoyés si SMTP mal configuré

**Test** :
- Vérifier dossier spam
- Vérifier logs edge function
- Tester avec plusieurs providers email (Gmail, Outlook, etc.)

---

## CHECKLIST DE MISE EN PRODUCTION

### Avant le Lancement

#### Configuration
- [ ] SMTP configuré et testé
- [ ] Stripe connecté (API keys production)
- [ ] Webhooks Stripe configurés
- [ ] Domain email configuré (noreply@votre-domaine.com)
- [ ] Variables d'environnement production définies
- [ ] Edge functions déployées en production

#### Sécurité
- [ ] RLS activé sur toutes les tables
- [ ] Storage policies configurées
- [ ] API keys sécurisées (pas en clair dans le code)
- [ ] HTTPS activé
- [ ] CORS configuré correctement
- [ ] Rate limiting sur edge functions

#### Performance
- [ ] Build de production testé
- [ ] Bundle size analysé et optimisé
- [ ] Images optimisées
- [ ] Lazy loading activé
- [ ] Service worker testé
- [ ] Cache stratégies définies

#### Tests
- [ ] Tous les parcours critiques testés
- [ ] Tests sur différents navigateurs
- [ ] Tests sur mobile (iOS et Android)
- [ ] Tests de charge (si possible)
- [ ] Tests de sécurité (pénétration basique)

#### Documentation
- [ ] README à jour
- [ ] Guide utilisateur (résidents)
- [ ] Guide admin (managers)
- [ ] API documentation (si applicable)
- [ ] Contact support défini

#### Monitoring
- [ ] Error logging actif
- [ ] Analytics configuré
- [ ] Alertes configurées (downtimes, erreurs critiques)
- [ ] Backup automatique DB configuré

---

## RESSOURCES ET CONTACTS

### Documentation Technique
- **Supabase** : https://supabase.com/docs
- **React Query** : https://tanstack.com/query/latest
- **Shadcn/ui** : https://ui.shadcn.com/
- **Tailwind CSS** : https://tailwindcss.com/docs
- **Vite** : https://vitejs.dev/

### Services Externes
- **Stripe** : Dashboard pour paiements et abonnements
- **Supabase** : Dashboard pour DB, Auth, Storage
- **Capacitor** : Pour fonctionnalités natives mobile

### Support
- **Bug Reports** : Via /admin/bug-reports dans l'app
- **Logs** : Consultables dans Supabase Dashboard
- **Monitoring** : À configurer (Sentry, LogRocket, etc.)

---

**Document créé le** : 04/02/2026
**Dernière mise à jour** : 04/02/2026
**Version** : 1.0
