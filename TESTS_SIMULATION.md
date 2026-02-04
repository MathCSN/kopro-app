# Guide de Simulation et Tests - Application KOPRO

Ce document contient tous les parcours utilisateurs à tester pour vérifier le bon fonctionnement de l'application KOPRO.

---

## TABLE DES MATIÈRES

1. [Tests de Base - Scanner QR Code](#1-tests-de-base---scanner-qr-code)
2. [Tests d'Authentification](#2-tests-dauthentification)
3. [Tests Parcours Résident](#3-tests-parcours-résident)
4. [Tests Parcours Manager/Bailleur](#4-tests-parcours-managerbailleur)
5. [Tests Parcours Syndic](#5-tests-parcours-syndic)
6. [Tests Parcours Admin](#6-tests-parcours-admin)
7. [Tests Fonctionnalités Critiques](#7-tests-fonctionnalités-critiques)
8. [Tests Mobile et Permissions](#8-tests-mobile-et-permissions)
9. [Checklist Complète](#9-checklist-complète)

---

## 1. TESTS DE BASE - SCANNER QR CODE

### 🎯 Objectif
Vérifier que le scanner QR code fonctionne correctement et que la caméra s'active.

### 📋 Scénarios à Tester

#### Scénario 1.1 : Scan QR Code Réussi (Nouveau Résident)
**Étapes :**
1. Créer un compte résident → Atterrissage sur `/pending`
2. Cliquer sur "Scanner le QR code"
3. **VÉRIFIER** : La caméra doit s'activer
4. **VÉRIFIER** : Le navigateur demande la permission caméra
5. Scanner le QR code d'une résidence
6. **VÉRIFIER** : Navigation vers `/join?residence=...`
7. **VÉRIFIER** : Affichage de la page de sélection d'appartement
8. Sélectionner un appartement libre
9. **VÉRIFIER** : Message de succès "Bienvenue !"
10. **VÉRIFIER** : Redirection vers `/dashboard`

**Résultat Attendu :**
- ✅ La caméra s'active
- ✅ Le QR code est détecté
- ✅ Le résident est ajouté à la résidence
- ✅ Le résident peut accéder au dashboard

#### Scénario 1.2 : Permission Caméra Refusée
**Étapes :**
1. Sur `/pending`, cliquer sur "Scanner le QR code"
2. **REFUSER** la permission caméra
3. **VÉRIFIER** : Message d'erreur "Impossible d'accéder à la caméra"
4. **VÉRIFIER** : Affichage automatique du champ de saisie manuelle

**Résultat Attendu :**
- ✅ Fallback sur saisie manuelle
- ✅ Possibilité d'entrer le code manuellement

#### Scénario 1.3 : Saisie Manuelle du Code
**Étapes :**
1. Sur `/pending`, cliquer sur "Entrer un code manuellement"
2. Entrer l'ID ou le code court d'une résidence
3. Cliquer sur "Rejoindre"
4. **VÉRIFIER** : Navigation vers `/join?residence=...`

**Résultat Attendu :**
- ✅ La saisie manuelle fonctionne comme alternative au scan

#### Scénario 1.4 : QR Code avec Building ID
**Étapes :**
1. Scanner un QR code contenant un building_id
2. **VÉRIFIER** : Navigation vers `/join?residence=...&building=...`
3. **VÉRIFIER** : Seuls les appartements du building sont affichés
4. **VÉRIFIER** : Nom du building affiché sous le titre

**Résultat Attendu :**
- ✅ Filtrage par building fonctionne

#### Scénario 1.5 : QR Code via URL Courte (/r/...)
**Étapes :**
1. Scanner un QR code `/r/{shortCode}`
2. **VÉRIFIER** : Navigation vers `/r/{shortCode}` (ResidenceLanding)
3. **VÉRIFIER** : Affichage des infos de la résidence
4. Cliquer sur "Continuer"
5. **VÉRIFIER** : Navigation vers `/join?residence=...`

**Résultat Attendu :**
- ✅ Les URLs courtes sont résolues correctement

---

## 2. TESTS D'AUTHENTIFICATION

### 🎯 Objectif
Vérifier tous les flux d'authentification et d'inscription.

### 📋 Scénarios à Tester

#### Scénario 2.1 : Inscription Résident
**Étapes :**
1. Aller sur `/auth/register-resident`
2. Remplir tous les champs obligatoires
3. **VÉRIFIER** : Indicateur d'étapes (1 → 2 → 3)
4. Soumettre le formulaire
5. **VÉRIFIER** : Compte créé dans Supabase Auth
6. **VÉRIFIER** : Profil créé dans `profiles`
7. **VÉRIFIER** : Redirection vers `/pending`

**Résultat Attendu :**
- ✅ Compte créé avec succès
- ✅ Navigation vers page pending

#### Scénario 2.2 : Inscription Manager
**Étapes :**
1. Aller sur `/auth/register-manager`
2. Remplir le formulaire
3. Soumettre
4. **VÉRIFIER** : Rôle 'manager' créé dans `user_roles`
5. **VÉRIFIER** : Redirection vers `/dashboard` ou `/pending`

**Résultat Attendu :**
- ✅ Manager créé avec rôle approprié

#### Scénario 2.3 : Compte Trial (Agence)
**Étapes :**
1. Aller sur `/auth/register-trial`
2. Remplir les infos de l'agence
3. Soumettre
4. **VÉRIFIER** : Agence créée dans `agencies`
5. **VÉRIFIER** : `trial_expires_at` défini à 30 jours
6. **VÉRIFIER** : Banner "Période d'essai" visible sur le dashboard

**Résultat Attendu :**
- ✅ Compte trial créé
- ✅ Accès limité dans le temps

#### Scénario 2.4 : Connexion
**Étapes :**
1. Aller sur `/auth/login`
2. Entrer email et mot de passe
3. Cliquer sur "Se connecter"
4. **VÉRIFIER** : Session créée
5. **VÉRIFIER** : Redirection selon le rôle :
   - Admin → `/admin/platform`
   - Manager → `/dashboard`
   - Résident → `/dashboard`
   - Sans rôle → `/pending`

**Résultat Attendu :**
- ✅ Connexion réussie
- ✅ Redirection appropriée selon le rôle

#### Scénario 2.5 : Mot de Passe Oublié
**Étapes :**
1. Sur `/auth/login`, cliquer sur "Mot de passe oublié ?"
2. Entrer l'email
3. Soumettre
4. **VÉRIFIER** : Appel à la fonction `request-password-reset`
5. **VÉRIFIER** : Token créé dans `password_reset_tokens`
6. **VÉRIFIER** : Email envoyé (si SMTP configuré)
7. Cliquer sur le lien dans l'email
8. **VÉRIFIER** : Navigation vers `/reset-password?token=...`
9. Entrer nouveau mot de passe
10. **VÉRIFIER** : Mot de passe mis à jour
11. **VÉRIFIER** : Token marqué comme utilisé

**Résultat Attendu :**
- ✅ Email de reset envoyé
- ✅ Mot de passe réinitialisé avec succès

#### Scénario 2.6 : Déconnexion
**Étapes :**
1. Depuis n'importe quelle page authentifiée
2. Cliquer sur le menu utilisateur
3. Cliquer sur "Se déconnecter"
4. **VÉRIFIER** : Session Supabase détruite
5. **VÉRIFIER** : Redirection vers `/`

**Résultat Attendu :**
- ✅ Déconnexion réussie
- ✅ Accès aux pages protégées impossible

---

## 3. TESTS PARCOURS RÉSIDENT

### 🎯 Objectif
Vérifier toutes les fonctionnalités accessibles aux résidents.

### 📋 Scénarios à Tester

#### Scénario 3.1 : Rejoindre Appartement Libre
**Étapes :**
1. Scanner QR code de la résidence
2. Sur `/join`, voir la liste des appartements
3. **VÉRIFIER** : Badge "Disponible" pour appartements sans résident principal
4. Cliquer sur un appartement libre
5. **VÉRIFIER** : Pas de demande de code
6. **VÉRIFIER** : Création automatique de :
   - `user_roles` avec role='resident'
   - `occupancies` avec type='owner'
   - `lots.primary_resident_id` = user.id
7. **VÉRIFIER** : Message "Bienvenue !"
8. **VÉRIFIER** : Redirection vers `/dashboard`

**Résultat Attendu :**
- ✅ Résident devient propriétaire principal
- ✅ Accès au dashboard

#### Scénario 3.2 : Rejoindre Appartement Occupé (avec code)
**Étapes :**
1. Scanner QR code
2. Cliquer sur un appartement avec badge "Code requis"
3. **VÉRIFIER** : Écran "Appartement occupé"
4. Entrer le code d'appartement (join_code du lot)
5. **VÉRIFIER** : Validation du code
6. **VÉRIFIER** : Création de :
   - `user_roles` avec role='resident'
   - `occupancies` avec type='occupant'
   - PAS de modification du `primary_resident_id`
7. **VÉRIFIER** : Message "Bienvenue !"

**Résultat Attendu :**
- ✅ Résident ajouté comme occupant
- ✅ Partage de l'appartement fonctionnel

#### Scénario 3.3 : Code d'Appartement Incorrect
**Étapes :**
1. Sur l'écran "Code requis"
2. Entrer un code incorrect
3. **VÉRIFIER** : Toast "Code incorrect"
4. **VÉRIFIER** : Possibilité de réessayer
5. **VÉRIFIER** : Possibilité de choisir un autre appartement

**Résultat Attendu :**
- ✅ Gestion d'erreur appropriée

#### Scénario 3.4 : Dashboard Résident
**Étapes :**
1. Se connecter en tant que résident
2. **VÉRIFIER** : Affichage du dashboard
3. **VÉRIFIER** : Sidebar avec les options :
   - Accueil
   - Tickets
   - Documents
   - Annuaire
   - Chat
   - Paiements
   - Mon Foyer
   - Coffre-fort
   - etc.
4. **VÉRIFIER** : Sélecteur de résidence (si plusieurs résidences)

**Résultat Attendu :**
- ✅ Dashboard accessible
- ✅ Navigation fonctionnelle

#### Scénario 3.5 : Créer un Ticket
**Étapes :**
1. Aller sur `/tickets`
2. Cliquer sur "Nouveau ticket"
3. **VÉRIFIER** : Sélection de localisation (lieu commun ou appartement)
4. Remplir :
   - Titre
   - Description
   - Catégorie
   - Priorité
5. Ajouter des photos (optionnel)
6. Soumettre
7. **VÉRIFIER** : Ticket créé dans `tickets`
8. **VÉRIFIER** : Statut = "pending"
9. **VÉRIFIER** : Notification au manager

**Résultat Attendu :**
- ✅ Ticket créé avec succès
- ✅ Visible dans la liste des tickets

#### Scénario 3.6 : Uploader un Document
**Étapes :**
1. Aller sur `/documents`
2. Cliquer sur "Importer un document"
3. Sélectionner un fichier
4. **VÉRIFIER** : Upload vers Supabase Storage
5. **VÉRIFIER** : Document créé dans `documents`
6. **VÉRIFIER** : Fichier accessible depuis la liste

**Résultat Attendu :**
- ✅ Upload fonctionnel
- ✅ Document visible et téléchargeable

#### Scénario 3.7 : Accéder à l'Annuaire
**Étapes :**
1. Aller sur `/directory`
2. **VÉRIFIER** : Liste des résidents de la résidence
3. **VÉRIFIER** : Infos affichées selon permissions
4. **VÉRIFIER** : Possibilité de contacter (si email/téléphone visible)

**Résultat Attendu :**
- ✅ Annuaire accessible
- ✅ Respect des permissions RLS

#### Scénario 3.8 : Chat avec Autres Résidents
**Étapes :**
1. Aller sur `/chat`
2. Cliquer sur "Nouvelle conversation"
3. Sélectionner un résident
4. Envoyer un message
5. **VÉRIFIER** : Message créé dans `messages`
6. **VÉRIFIER** : Conversation visible
7. **VÉRIFIER** : Temps réel (si WebSocket actif)

**Résultat Attendu :**
- ✅ Chat fonctionnel
- ✅ Messages envoyés et reçus

#### Scénario 3.9 : Voir et Payer les Charges
**Étapes :**
1. Aller sur `/payments`
2. **VÉRIFIER** : Liste des paiements à effectuer
3. **VÉRIFIER** : Historique des paiements
4. Cliquer sur "Payer" (si Stripe configuré)
5. **VÉRIFIER** : Redirection vers Stripe Checkout
6. Simuler paiement
7. **VÉRIFIER** : Webhook reçu
8. **VÉRIFIER** : Statut mis à jour dans `payments`

**Résultat Attendu :**
- ✅ Paiements visibles
- ✅ Stripe integration fonctionnelle (si configuré)

#### Scénario 3.10 : Gérer Mon Foyer
**Étapes :**
1. Aller sur `/household`
2. **VÉRIFIER** : Liste des occupants de l'appartement
3. Cliquer sur "Inviter un membre"
4. Générer un code de partage
5. **VÉRIFIER** : `join_code` créé/mis à jour sur le lot
6. Partager le code
7. **VÉRIFIER** : Autre utilisateur peut rejoindre avec ce code

**Résultat Attendu :**
- ✅ Gestion du foyer fonctionnelle
- ✅ Codes de partage générés

---

## 4. TESTS PARCOURS MANAGER/BAILLEUR

### 🎯 Objectif
Vérifier les fonctionnalités de gestion immobilière.

### 📋 Scénarios à Tester

#### Scénario 4.1 : Créer une Résidence
**Étapes :**
1. Se connecter en tant que manager/bailleur
2. Aller sur la page de gestion des résidences
3. Cliquer sur "Nouvelle résidence"
4. Remplir :
   - Nom
   - Adresse
   - Ville
   - Code postal
5. Soumettre
6. **VÉRIFIER** : Résidence créée dans `residences`
7. **VÉRIFIER** : Manager a accès à cette résidence

**Résultat Attendu :**
- ✅ Résidence créée
- ✅ Visible dans la liste

#### Scénario 4.2 : Créer des Bâtiments
**Étapes :**
1. Dans une résidence
2. Cliquer sur "Nouveau bâtiment"
3. Entrer le nom
4. Soumettre
5. **VÉRIFIER** : Bâtiment créé dans `buildings`
6. **VÉRIFIER** : `building_id` lié à la résidence

**Résultat Attendu :**
- ✅ Bâtiment créé et visible

#### Scénario 4.3 : Créer des Lots/Appartements
**Étapes :**
1. Cliquer sur "Nouveau lot"
2. Remplir :
   - Numéro de lot
   - Étage
   - Porte
   - Type (Appartement, Local, Parking, etc.)
   - Bâtiment (si plusieurs)
3. Soumettre
4. **VÉRIFIER** : Lot créé dans `lots`
5. **VÉRIFIER** : Lot visible dans la liste

**Résultat Attendu :**
- ✅ Lot créé avec succès

#### Scénario 4.4 : Création en Masse de Lots
**Étapes :**
1. Cliquer sur "Création en masse"
2. Définir :
   - Nombre d'étages
   - Appartements par étage
   - Préfixe de porte
3. Soumettre
4. **VÉRIFIER** : Tous les lots créés d'un coup
5. **VÉRIFIER** : Numérotation cohérente

**Résultat Attendu :**
- ✅ Création en masse fonctionnelle
- ✅ Gain de temps significatif

#### Scénario 4.5 : Générer QR Code de la Résidence
**Étapes :**
1. Dans la liste des résidences ou page tenants
2. Cliquer sur "QR Code d'invitation" ou "Partager"
3. **VÉRIFIER** : QR code affiché
4. **VÉRIFIER** : URL générée (format `/r/{shortCode}` ou `/join?residence=...`)
5. Télécharger le QR code
6. **VÉRIFIER** : Image PNG téléchargée

**Résultat Attendu :**
- ✅ QR code généré
- ✅ Téléchargement fonctionnel

#### Scénario 4.6 : Générer QR Code par Bâtiment
**Étapes :**
1. Dans la vue QR codes
2. Sélectionner "Par bâtiment"
3. **VÉRIFIER** : Un QR code par bâtiment
4. **VÉRIFIER** : URLs contiennent `&building={id}`
5. Scanner un QR code de bâtiment
6. **VÉRIFIER** : Seuls les lots de ce bâtiment sont affichés

**Résultat Attendu :**
- ✅ QR codes par bâtiment fonctionnels

#### Scénario 4.7 : Partager la Résidence (Email, SMS, WhatsApp)
**Étapes :**
1. Cliquer sur "Partager"
2. **VÉRIFIER** : Options de partage :
   - Copier le lien
   - Email
   - SMS
   - WhatsApp
   - Facebook
   - Plateformes immobilières
3. Cliquer sur "Email"
4. **VÉRIFIER** : Client email s'ouvre avec lien pré-rempli

**Résultat Attendu :**
- ✅ Toutes les options de partage fonctionnent

#### Scénario 4.8 : Gérer les Tickets
**Étapes :**
1. Aller sur `/tickets`
2. **VÉRIFIER** : Liste de tous les tickets de la résidence
3. Cliquer sur un ticket
4. **VÉRIFIER** : Détails du ticket
5. Changer le statut
6. Ajouter un commentaire
7. Assigner à un prestataire
8. **VÉRIFIER** : Notifications envoyées

**Résultat Attendu :**
- ✅ Gestion des tickets complète

#### Scénario 4.9 : Inviter un Locataire Spécifique
**Étapes :**
1. Aller sur la liste des lots
2. Cliquer sur un lot
3. Cliquer sur "Inviter un locataire"
4. Entrer l'email du locataire
5. **VÉRIFIER** : Email d'invitation envoyé
6. **VÉRIFIER** : Lien d'invitation contient le lot_id
7. Le locataire clique sur le lien
8. **VÉRIFIER** : Attribution automatique au bon lot

**Résultat Attendu :**
- ✅ Invitation spécifique fonctionnelle

#### Scénario 4.10 : Voir le Dashboard Manager
**Étapes :**
1. Se connecter en tant que manager
2. **VÉRIFIER** : Statistiques affichées :
   - Nombre de résidences
   - Nombre de locataires
   - Tickets ouverts
   - Paiements en attente
3. **VÉRIFIER** : Graphiques et charts
4. **VÉRIFIER** : Activité récente

**Résultat Attendu :**
- ✅ Dashboard informatif
- ✅ Vue d'ensemble complète

---

## 5. TESTS PARCOURS SYNDIC

### 🎯 Objectif
Vérifier les fonctionnalités spécifiques aux syndics de copropriété.

### 📋 Scénarios à Tester

#### Scénario 5.1 : Accéder au Portail Syndic
**Étapes :**
1. Se connecter en tant que syndic
2. Aller sur `/syndic`
3. **VÉRIFIER** : Accès si abonnement actif
4. **VÉRIFIER** : Paywall si pas d'abonnement

**Résultat Attendu :**
- ✅ Contrôle d'accès basé sur abonnement

#### Scénario 5.2 : Gérer les Tantiemes
**Étapes :**
1. Aller sur `/syndic` → Onglet "Tantiemes"
2. **VÉRIFIER** : Liste de tous les lots
3. Définir les tantiemes pour chaque lot
4. **VÉRIFIER** : Total = 10000/10000
5. Sauvegarder
6. **VÉRIFIER** : `lots.tantieme` mis à jour

**Résultat Attendu :**
- ✅ Gestion des tantiemes fonctionnelle
- ✅ Validation 10000/10000

#### Scénario 5.3 : Créer un Appel de Charges
**Étapes :**
1. Aller sur "Appels de fonds"
2. Cliquer sur "Nouvel appel"
3. Remplir :
   - Montant total
   - Période
   - Type (charges courantes, travaux, etc.)
4. **VÉRIFIER** : Calcul automatique par lot selon tantiemes
5. Soumettre
6. **VÉRIFIER** : Appel créé dans `copro_calls`
7. **VÉRIFIER** : Paiements individuels créés dans `payments`

**Résultat Attendu :**
- ✅ Appel de charges créé
- ✅ Répartition correcte selon tantiemes

#### Scénario 5.4 : Gérer les Clés de Répartition
**Étapes :**
1. Aller sur "Clés de répartition"
2. Créer une nouvelle clé (ex: Ascenseur, Eau chaude, etc.)
3. Assigner des lots à cette clé
4. Définir les tantiemes spécifiques
5. **VÉRIFIER** : Clé créée dans `distribution_keys`

**Résultat Attendu :**
- ✅ Clés de répartition personnalisées

#### Scénario 5.5 : Gérer le Fonds de Travaux
**Étapes :**
1. Aller sur "Fonds de travaux"
2. **VÉRIFIER** : Solde actuel
3. Ajouter une entrée (cotisation ou dépense)
4. **VÉRIFIER** : Solde mis à jour
5. **VÉRIFIER** : Historique visible

**Résultat Attendu :**
- ✅ Suivi du fonds de travaux précis

#### Scénario 5.6 : Inviter un Autre Syndic
**Étapes :**
1. Cliquer sur "Inviter un syndic"
2. Entrer l'email
3. Sélectionner les résidences à partager
4. Définir les permissions
5. Soumettre
6. **VÉRIFIER** : Email d'invitation envoyé
7. **VÉRIFIER** : Partage créé dans `lot_shares` ou table de partage

**Résultat Attendu :**
- ✅ Multi-syndics possible

#### Scénario 5.7 : Souscrire à l'Abonnement Syndic
**Étapes :**
1. Cliquer sur "S'abonner"
2. **VÉRIFIER** : Redirection vers Stripe Checkout
3. Simuler paiement réussi
4. **VÉRIFIER** : Webhook traité
5. **VÉRIFIER** : `agencies.syndic_subscription_status` = 'active'
6. **VÉRIFIER** : Accès débloqué au portail syndic

**Résultat Attendu :**
- ✅ Abonnement fonctionnel
- ✅ Accès immédiat après paiement

---

## 6. TESTS PARCOURS ADMIN

### 🎯 Objectif
Vérifier les fonctionnalités d'administration plateforme.

### 📋 Scénarios à Tester

#### Scénario 6.1 : Accéder au Panel Admin
**Étapes :**
1. Se connecter avec un compte admin
2. **VÉRIFIER** : Accès à `/admin/platform`
3. **VÉRIFIER** : Tabs visibles :
   - Dashboard
   - Clients (Agences)
   - Utilisateurs
   - Résidences
   - Tickets
   - Rapports
   - Comptabilité
   - Paramètres

**Résultat Attendu :**
- ✅ Panel admin accessible
- ✅ Toutes les sections visibles

#### Scénario 6.2 : Gérer les Agences
**Étapes :**
1. Aller sur "Clients"
2. **VÉRIFIER** : Liste de toutes les agences
3. Cliquer sur une agence
4. **VÉRIFIER** : Détails :
   - Informations générales
   - Résidences gérées
   - Membres de l'équipe
   - Abonnements
   - Statistiques
5. Modifier les infos
6. **VÉRIFIER** : Sauvegarde réussie

**Résultat Attendu :**
- ✅ Gestion complète des agences

#### Scénario 6.3 : Créer une Agence Manuellement
**Étapes :**
1. Cliquer sur "Nouvelle agence"
2. Remplir :
   - Nom
   - Type (Bailleur/Syndic)
   - Email de contact
   - Infos de facturation
3. Soumettre
4. **VÉRIFIER** : Agence créée dans `agencies`
5. **VÉRIFIER** : Admin peut gérer cette agence

**Résultat Attendu :**
- ✅ Création manuelle possible

#### Scénario 6.4 : Gérer les Utilisateurs
**Étapes :**
1. Aller sur "Utilisateurs"
2. **VÉRIFIER** : Liste de tous les utilisateurs de la plateforme
3. Filtrer par rôle, agence, résidence
4. Cliquer sur un utilisateur
5. Modifier le rôle
6. Désactiver/Activer le compte
7. Réinitialiser le mot de passe
8. **VÉRIFIER** : Modifications appliquées

**Résultat Attendu :**
- ✅ Gestion centralisée des utilisateurs

#### Scénario 6.5 : Voir Toutes les Résidences
**Étapes :**
1. Aller sur "Résidences"
2. **VÉRIFIER** : Liste de toutes les résidences de toutes les agences
3. Filtrer par agence
4. Cliquer sur une résidence
5. **VÉRIFIER** : Accès aux données de la résidence
6. Modifier les infos si besoin

**Résultat Attendu :**
- ✅ Vue d'ensemble complète

#### Scénario 6.6 : Configurer les Tarifs
**Étapes :**
1. Aller sur "Paramètres" → "Tarification"
2. Modifier les prix :
   - Abonnement Bailleur
   - Abonnement Syndic
   - Options supplémentaires
3. Sauvegarder
4. **VÉRIFIER** : Nouveaux prix appliqués sur Stripe
5. **VÉRIFIER** : Affichage mis à jour sur la page de tarifs

**Résultat Attendu :**
- ✅ Gestion des tarifs centralisée

#### Scénario 6.7 : Gérer les Email Templates
**Étapes :**
1. Aller sur "Paramètres" → "Emails"
2. **VÉRIFIER** : Liste des templates :
   - Invitation résident
   - Reset password
   - Nouvelle demande
   - etc.
3. Cliquer sur un template
4. Modifier le contenu (HTML + variables)
5. Prévisualiser
6. Sauvegarder
7. **VÉRIFIER** : Template mis à jour dans `email_templates`

**Résultat Attendu :**
- ✅ Personnalisation des emails

#### Scénario 6.8 : Voir les Logs d'Audit
**Étapes :**
1. Aller sur "Audit"
2. **VÉRIFIER** : Liste de toutes les actions :
   - Connexions
   - Modifications
   - Suppressions
   - Erreurs
3. Filtrer par :
   - Utilisateur
   - Date
   - Type d'action
   - Agence

**Résultat Attendu :**
- ✅ Traçabilité complète

#### Scénario 6.9 : Gérer les Bug Reports
**Étapes :**
1. Aller sur "Bug Reports"
2. **VÉRIFIER** : Liste de tous les bugs rapportés
3. Cliquer sur un bug
4. **VÉRIFIER** : Détails :
   - Description
   - Étapes de reproduction
   - Infos technique (user agent, URL, etc.)
   - Screenshots
5. Changer le statut
6. Ajouter un commentaire

**Résultat Attendu :**
- ✅ Suivi des bugs centralisé

#### Scénario 6.10 : Configurer SMTP Global
**Étapes :**
1. Aller sur "Paramètres" → "Email"
2. Configurer SMTP :
   - Host
   - Port
   - Username
   - Password
   - Adresse noreply
3. Tester la connexion
4. Sauvegarder
5. **VÉRIFIER** : Config sauvegardée dans `app_config`
6. Envoyer un email test
7. **VÉRIFIER** : Email reçu

**Résultat Attendu :**
- ✅ SMTP configuré pour toute la plateforme

---

## 7. TESTS FONCTIONNALITÉS CRITIQUES

### 🎯 Objectif
Vérifier les fonctionnalités transversales critiques.

### 📋 Scénarios à Tester

#### Scénario 7.1 : Gestion des Permissions (RLS)
**Étapes :**
1. Se connecter en tant que résident A
2. Essayer d'accéder aux données d'un résident B d'une autre résidence
3. **VÉRIFIER** : Accès refusé (RLS bloque)
4. Se connecter en tant que manager
5. **VÉRIFIER** : Accès uniquement aux résidences gérées
6. Se connecter en tant qu'admin
7. **VÉRIFIER** : Accès à tout

**Résultat Attendu :**
- ✅ RLS fonctionne correctement
- ✅ Isolation des données par résidence

#### Scénario 7.2 : Upload de Fichiers (Storage)
**Étapes :**
1. Uploader différents types de fichiers :
   - Image (JPG, PNG)
   - PDF
   - Document (DOCX, XLSX)
2. **VÉRIFIER** : Fichiers stockés dans Supabase Storage
3. **VÉRIFIER** : URLs publiques générées
4. **VÉRIFIER** : Permissions Storage respectées (RLS)
5. Télécharger un fichier
6. Supprimer un fichier
7. **VÉRIFIER** : Suppression effective

**Résultat Attendu :**
- ✅ Storage fonctionnel
- ✅ Sécurité respectée

#### Scénario 7.3 : Notifications en Temps Réel
**Étapes :**
1. Ouvrir l'app sur 2 navigateurs (2 utilisateurs)
2. Utilisateur A crée un ticket
3. **VÉRIFIER** : Utilisateur B (manager) reçoit notification
4. **VÉRIFIER** : Icône cloche mise à jour
5. Cliquer sur la notification
6. **VÉRIFIER** : Navigation vers le ticket

**Résultat Attendu :**
- ✅ Notifications temps réel fonctionnelles
- ✅ WebSocket ou polling actif

#### Scénario 7.4 : Recherche Globale
**Étapes :**
1. Dans la barre de recherche globale
2. Entrer un terme (nom, adresse, etc.)
3. **VÉRIFIER** : Résultats affichés :
   - Résidences
   - Utilisateurs
   - Tickets
   - Documents
4. Cliquer sur un résultat
5. **VÉRIFIER** : Navigation vers la page correspondante

**Résultat Attendu :**
- ✅ Recherche globale fonctionnelle

#### Scénario 7.5 : Sélecteur de Résidence
**Étapes :**
1. Se connecter avec un compte ayant accès à plusieurs résidences
2. **VÉRIFIER** : Sélecteur de résidence visible dans le header
3. Changer de résidence
4. **VÉRIFIER** : Données affichées changent immédiatement
5. **VÉRIFIER** : Context mis à jour (ResidenceContext)

**Résultat Attendu :**
- ✅ Multi-résidence fonctionnel
- ✅ Changement instantané

#### Scénario 7.6 : Mode Hors Ligne
**Étapes :**
1. Ouvrir l'app
2. Couper la connexion internet
3. **VÉRIFIER** : Indicateur "Hors ligne" affiché
4. Essayer de naviguer
5. **VÉRIFIER** : Données en cache affichées (si PWA)
6. Rétablir la connexion
7. **VÉRIFIER** : Indicateur disparaît
8. **VÉRIFIER** : Synchronisation automatique

**Résultat Attendu :**
- ✅ Détection hors ligne
- ✅ Graceful degradation

#### Scénario 7.7 : Export de Données
**Étapes :**
1. Depuis différentes listes (tickets, résidents, paiements)
2. Cliquer sur "Exporter"
3. Choisir le format (CSV, Excel, PDF)
4. **VÉRIFIER** : Fichier téléchargé
5. Ouvrir le fichier
6. **VÉRIFIER** : Données correctes et formatées

**Résultat Attendu :**
- ✅ Export fonctionnel
- ✅ Formats multiples supportés

#### Scénario 7.8 : Import de Données en Masse
**Étapes :**
1. Préparer un fichier CSV de résidents/lots
2. Cliquer sur "Importer"
3. Sélectionner le fichier
4. **VÉRIFIER** : Prévisualisation des données
5. Valider
6. **VÉRIFIER** : Données importées dans la DB
7. **VÉRIFIER** : Gestion des doublons
8. **VÉRIFIER** : Rapport d'import (succès/erreurs)

**Résultat Attendu :**
- ✅ Import en masse fonctionnel
- ✅ Validation des données

#### Scénario 7.9 : Gestion des Erreurs
**Étapes :**
1. Déclencher une erreur réseau (débrancher internet)
2. **VÉRIFIER** : Message d'erreur user-friendly
3. Déclencher une erreur 404
4. **VÉRIFIER** : Page 404 personnalisée
5. Déclencher une erreur 500
6. **VÉRIFIER** : Error boundary attrape l'erreur
7. **VÉRIFIER** : Log d'erreur envoyé dans `error_logs`

**Résultat Attendu :**
- ✅ Gestion d'erreurs robuste
- ✅ Logging centralisé

#### Scénario 7.10 : Thème Sombre/Clair
**Étapes :**
1. Cliquer sur l'icône thème
2. Changer de thème
3. **VÉRIFIER** : Toute l'interface change immédiatement
4. **VÉRIFIER** : Préférence sauvegardée dans localStorage
5. Rafraîchir la page
6. **VÉRIFIER** : Thème persisté

**Résultat Attendu :**
- ✅ Toggle thème fonctionnel
- ✅ Persistance du choix

---

## 8. TESTS MOBILE ET PERMISSIONS

### 🎯 Objectif
Vérifier le comportement sur mobile et les permissions systèmes.

### 📋 Scénarios à Tester

#### Scénario 8.1 : Responsive Design
**Étapes :**
1. Ouvrir l'app sur mobile (ou simulateur)
2. Tester toutes les pages principales
3. **VÉRIFIER** : Affichage adapté (breakpoints)
4. **VÉRIFIER** : Navigation mobile (hamburger menu)
5. **VÉRIFIER** : Boutons et interactions accessibles
6. Tourner l'écran (portrait/paysage)
7. **VÉRIFIER** : Adaptation automatique

**Résultat Attendu :**
- ✅ Interface optimisée pour mobile
- ✅ Navigation intuitive

#### Scénario 8.2 : Permission Caméra (Mobile)
**Étapes :**
1. Sur mobile, scanner un QR code
2. **VÉRIFIER** : Demande de permission native
3. Accepter
4. **VÉRIFIER** : Caméra s'active
5. Scanner le QR code
6. **VÉRIFIER** : Détection réussie

**Résultat Attendu :**
- ✅ Permission caméra gérée
- ✅ QR scanner fonctionne sur mobile

#### Scénario 8.3 : Permission Caméra (Refusée)
**Étapes :**
1. Scanner QR code
2. Refuser la permission
3. **VÉRIFIER** : Message d'erreur
4. **VÉRIFIER** : Instructions pour activer la permission dans les paramètres
5. **VÉRIFIER** : Fallback sur saisie manuelle

**Résultat Attendu :**
- ✅ Gestion du refus gracieuse
- ✅ Alternative proposée

#### Scénario 8.4 : Upload Photo depuis Mobile
**Étapes :**
1. Créer un ticket
2. Cliquer sur "Ajouter une photo"
3. **VÉRIFIER** : Options :
   - Prendre une photo
   - Choisir depuis la galerie
4. Prendre une photo
5. **VÉRIFIER** : Upload réussi
6. **VÉRIFIER** : Prévisualisation affichée

**Résultat Attendu :**
- ✅ Upload photo mobile fonctionnel
- ✅ Accès galerie et caméra

#### Scénario 8.5 : Notifications Push (si activées)
**Étapes :**
1. Sur mobile, accepter les notifications
2. Recevoir une notification (nouveau ticket, message, etc.)
3. **VÉRIFIER** : Notification native affichée
4. Cliquer sur la notification
5. **VÉRIFIER** : App s'ouvre sur la bonne page

**Résultat Attendu :**
- ✅ Push notifications fonctionnelles

#### Scénario 8.6 : Partage Native (Mobile)
**Étapes :**
1. Sur une résidence, cliquer sur "Partager"
2. **VÉRIFIER** : Sheet de partage natif apparaît
3. **VÉRIFIER** : Options système (SMS, Email, WhatsApp, etc.)
4. Partager via une app
5. **VÉRIFIER** : Lien partagé correctement

**Résultat Attendu :**
- ✅ API de partage native utilisée

#### Scénario 8.7 : PWA - Installation
**Étapes :**
1. Ouvrir l'app dans le navigateur mobile
2. **VÉRIFIER** : Prompt "Ajouter à l'écran d'accueil"
3. Installer la PWA
4. **VÉRIFIER** : Icône ajoutée sur l'écran d'accueil
5. Ouvrir depuis l'icône
6. **VÉRIFIER** : App s'ouvre en mode standalone (sans barre d'adresse)

**Résultat Attendu :**
- ✅ PWA installable
- ✅ Mode standalone fonctionnel

#### Scénario 8.8 : PWA - Offline Support
**Étapes :**
1. Installer la PWA
2. Naviguer sur plusieurs pages
3. Couper la connexion
4. Essayer de naviguer
5. **VÉRIFIER** : Pages en cache accessibles
6. **VÉRIFIER** : Message si page non disponible

**Résultat Attendu :**
- ✅ Cache fonctionnel
- ✅ Service Worker actif

#### Scénario 8.9 : Gestes Mobile
**Étapes :**
1. Sur mobile, essayer :
   - Swipe pour fermer les modales
   - Pull-to-refresh
   - Pinch-to-zoom (désactivé sur certaines pages)
2. **VÉRIFIER** : Comportement approprié

**Résultat Attendu :**
- ✅ Gestes natifs supportés où approprié

#### Scénario 8.10 : Performance Mobile
**Étapes :**
1. Ouvrir DevTools mobile
2. Activer le throttling (3G, slow 4G)
3. Naviguer dans l'app
4. **VÉRIFIER** : Chargement raisonnable
5. **VÉRIFIER** : Loaders visibles pendant chargement
6. **VÉRIFIER** : Pas de freeze de l'interface

**Résultat Attendu :**
- ✅ Performance acceptable sur connexions lentes
- ✅ Feedback visuel pendant chargement

---

## 9. CHECKLIST COMPLÈTE

### ✅ Authentification & Comptes
- [ ] Inscription résident fonctionne
- [ ] Inscription manager fonctionne
- [ ] Inscription trial (agence) fonctionne
- [ ] Connexion fonctionne
- [ ] Déconnexion fonctionne
- [ ] Mot de passe oublié fonctionne
- [ ] Reset password avec token fonctionne
- [ ] Redirection selon rôle correcte

### ✅ QR Code & Caméra
- [ ] Scanner QR code active la caméra
- [ ] Permission caméra demandée
- [ ] QR code détecté correctement
- [ ] Navigation après scan correcte
- [ ] Fallback saisie manuelle fonctionne
- [ ] QR codes par bâtiment fonctionnent
- [ ] URLs courtes (/r/) résolues
- [ ] Génération QR code manager fonctionne
- [ ] Téléchargement QR code fonctionne
- [ ] Partage QR code (social) fonctionne

### ✅ Rejoindre Résidence
- [ ] Liste des appartements affichée
- [ ] Sélection appartement libre fonctionne
- [ ] Sélection appartement occupé demande code
- [ ] Validation code d'appartement fonctionne
- [ ] Création occupancy dans DB
- [ ] Création user_roles dans DB
- [ ] Message de bienvenue affiché
- [ ] Redirection vers dashboard

### ✅ Dashboard & Navigation
- [ ] Dashboard résident accessible
- [ ] Dashboard manager accessible
- [ ] Dashboard admin accessible
- [ ] Sidebar navigation fonctionne
- [ ] Mobile nav (hamburger) fonctionne
- [ ] Sélecteur de résidence fonctionne
- [ ] Changement de résidence met à jour les données
- [ ] Toutes les pages sont accessibles

### ✅ Tickets
- [ ] Création ticket fonctionne
- [ ] Upload photo dans ticket fonctionne
- [ ] Sélection localisation fonctionne
- [ ] Liste tickets affichée
- [ ] Détail ticket accessible
- [ ] Changement statut fonctionne (manager)
- [ ] Commentaires fonctionnent
- [ ] Assignation prestataire fonctionne
- [ ] Notifications envoyées

### ✅ Documents
- [ ] Upload document fonctionne
- [ ] Liste documents affichée
- [ ] Téléchargement document fonctionne
- [ ] Suppression document fonctionne
- [ ] Permissions RLS respectées

### ✅ Résidents & Annuaire
- [ ] Annuaire affiché
- [ ] Infos résidents selon permissions
- [ ] Recherche dans l'annuaire fonctionne
- [ ] Contact résidents fonctionne

### ✅ Chat
- [ ] Nouvelle conversation fonctionne
- [ ] Envoi message fonctionne
- [ ] Réception message fonctionne
- [ ] Temps réel fonctionnel
- [ ] Historique accessible

### ✅ Paiements
- [ ] Liste paiements affichée
- [ ] Intégration Stripe fonctionne
- [ ] Checkout Stripe accessible
- [ ] Webhook traité correctement
- [ ] Statut paiement mis à jour
- [ ] Historique paiements complet

### ✅ Gestion Résidences (Manager)
- [ ] Création résidence fonctionne
- [ ] Création bâtiments fonctionne
- [ ] Création lots fonctionne
- [ ] Création en masse lots fonctionne
- [ ] Modification résidence fonctionne
- [ ] Suppression (soft delete) fonctionne

### ✅ Syndic
- [ ] Accès portail syndic (paywall)
- [ ] Gestion tantiemes fonctionne
- [ ] Création appel de charges fonctionne
- [ ] Répartition selon tantiemes correcte
- [ ] Clés de répartition fonctionnent
- [ ] Fonds de travaux géré
- [ ] Multi-syndics (partage) fonctionne
- [ ] Abonnement Stripe fonctionne

### ✅ Admin Platform
- [ ] Panel admin accessible
- [ ] Gestion agences fonctionne
- [ ] Gestion utilisateurs fonctionne
- [ ] Gestion résidences globale fonctionne
- [ ] Configuration tarifs fonctionne
- [ ] Email templates modifiables
- [ ] Logs d'audit visibles
- [ ] Bug reports gérés
- [ ] Configuration SMTP fonctionne
- [ ] Config noreply email fonctionne

### ✅ Sécurité & Permissions
- [ ] RLS bloque accès non autorisés
- [ ] Isolation par résidence fonctionne
- [ ] Permissions rôles respectées
- [ ] Storage RLS fonctionnel
- [ ] Pas de fuite de données entre résidences

### ✅ Fonctionnalités Transversales
- [ ] Notifications temps réel fonctionnent
- [ ] Recherche globale fonctionne
- [ ] Export données (CSV, Excel, PDF) fonctionne
- [ ] Import en masse fonctionne
- [ ] Thème sombre/clair fonctionne
- [ ] Gestion erreurs robuste
- [ ] Logs erreurs dans error_logs
- [ ] Offline detection fonctionne

### ✅ Mobile & Responsive
- [ ] Interface responsive sur mobile
- [ ] Navigation mobile intuitive
- [ ] Permission caméra mobile fonctionne
- [ ] Upload photo mobile fonctionne
- [ ] Partage natif fonctionne
- [ ] PWA installable
- [ ] Mode standalone fonctionne
- [ ] Offline support (cache) fonctionne
- [ ] Performance mobile acceptable
- [ ] Gestes natifs supportés

### ✅ Emails
- [ ] Email reset password envoyé
- [ ] Email invitation résident envoyé
- [ ] Email notification ticket envoyé
- [ ] Email appel de charges envoyé
- [ ] Emails utilisent noreply configuré
- [ ] Reply-To configuré par agence
- [ ] Templates personnalisables
- [ ] SMTP configuré et fonctionnel

---

## INSTRUCTIONS POUR LES TESTS

### Ordre Recommandé

1. **Commencer par les bases** : Authentification et QR code
2. **Tester le parcours résident complet** : De l'inscription au dashboard
3. **Tester le parcours manager** : Création résidences, lots, QR codes
4. **Tester les fonctionnalités avancées** : Syndic, admin, paiements
5. **Tester mobile et permissions**
6. **Tester la sécurité** : RLS, permissions, isolation

### Outils Utiles

- **Chrome DevTools** : Pour simuler mobile, throttling, et debug
- **Supabase Dashboard** : Pour vérifier les données en DB
- **Stripe Dashboard** : Pour voir les paiements et webhooks
- **Console du navigateur** : Pour voir les erreurs JavaScript
- **Network tab** : Pour vérifier les requêtes API

### Rapporter les Bugs

Pour chaque bug trouvé, noter :
- **Étapes de reproduction** : Comment reproduire le bug
- **Résultat attendu** : Ce qui devrait se passer
- **Résultat obtenu** : Ce qui se passe réellement
- **Environnement** : Navigateur, device, OS
- **Screenshots** : Si applicable
- **Console logs** : Erreurs dans la console

### Tests Automatisés (Futur)

Cette checklist peut servir de base pour créer des tests automatisés (E2E) avec Playwright ou Cypress.

---

**Bon tests ! 🚀**
