# Configuration SMTP Rapide - KOPRO

## Pourquoi les emails ne partent pas ?

Aucun serveur SMTP n'est configuré. L'application essaie d'envoyer des emails mais n'a pas de serveur d'envoi configuré.

## Solution Rapide : Utiliser Gmail

### Étape 1 : Créer un mot de passe d'application Gmail

1. Va sur https://myaccount.google.com/security
2. Active la validation en 2 étapes (si pas déjà fait)
3. Va sur "Mots de passe des applications" : https://myaccount.google.com/apppasswords
4. Crée un nouveau mot de passe d'application :
   - Nom : "KOPRO App"
   - Copie le mot de passe généré (16 caractères)

### Étape 2 : Configurer dans Supabase

Exécute cette requête SQL dans Supabase :

```sql
-- Configuration SMTP avec Gmail
INSERT INTO smtp_configs (
  residence_id,
  host,
  port,
  username,
  password,
  from_email,
  from_name,
  is_active
) VALUES (
  NULL,  -- NULL = configuration globale
  'smtp.gmail.com',
  587,
  'ton-email@gmail.com',  -- REMPLACE avec ton email Gmail
  'xxxx xxxx xxxx xxxx',   -- REMPLACE avec le mot de passe d'application
  'noreply@kopro.app',
  'KOPRO',
  true
);
```

### Étape 3 : Tester

1. Va sur la page de connexion
2. Clique sur "Mot de passe oublié"
3. Entre ton email
4. Tu devrais recevoir l'email dans les secondes qui suivent !

---

## Solution Alternative : Autres Fournisseurs SMTP

### SendGrid (Gratuit jusqu'à 100 emails/jour)

```sql
INSERT INTO smtp_configs (
  residence_id, host, port, username, password,
  from_email, from_name, is_active
) VALUES (
  NULL,
  'smtp.sendgrid.net',
  587,
  'apikey',  -- Littéralement "apikey"
  'TON_SENDGRID_API_KEY',  -- Remplace avec ta clé API
  'noreply@kopro.app',
  'KOPRO',
  true
);
```

### Brevo (ex-Sendinblue) - Gratuit jusqu'à 300 emails/jour

```sql
INSERT INTO smtp_configs (
  residence_id, host, port, username, password,
  from_email, from_name, is_active
) VALUES (
  NULL,
  'smtp-relay.brevo.com',
  587,
  'TON_EMAIL_BREVO',
  'TON_SMTP_KEY_BREVO',
  'noreply@kopro.app',
  'KOPRO',
  true
);
```

### MailHog (Pour Développement Local)

Si tu veux tester sans vraiment envoyer d'emails :

```sql
INSERT INTO smtp_configs (
  residence_id, host, port, username, password,
  from_email, from_name, is_active
) VALUES (
  NULL,
  'localhost',
  1025,
  '',
  '',
  'noreply@kopro.app',
  'KOPRO',
  true
);
```

Puis lance MailHog : `docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog`
Les emails seront visibles sur http://localhost:8025

---

## Vérifier que ça marche

### Dans Supabase Dashboard

1. Va dans "Database" → "smtp_configs"
2. Tu devrais voir ta configuration avec `is_active = true`

### Dans les logs Edge Functions

1. Va dans "Edge Functions" → "send-email"
2. Clique sur "Logs"
3. Fais une demande de reset password
4. Tu devrais voir dans les logs :
   - "Sending email to..."
   - Soit succès, soit erreur SMTP

### Test complet

```
1. Logout si connecté
2. Page login → "Mot de passe oublié"
3. Entre ton email
4. Message : "Un email a été envoyé"
5. Vérifie ta boîte email (et spam !)
6. Clique sur le lien
7. Entre nouveau mot de passe
8. Connecte-toi avec le nouveau mot de passe
```

---

## Dépannage

### "SMTP error: 535"
→ Mauvais username/password. Vérifie tes identifiants.

### "SMTP error: 587"
→ Port bloqué. Essaye le port 465 (SSL) ou 2525.

### Email pas reçu
1. Vérifie le dossier spam
2. Vérifie les logs de la fonction edge
3. Vérifie que `is_active = true` dans smtp_configs
4. Attends 2-3 minutes (parfois délai)

### Email en spam
→ Normal en dev. En production, configure SPF/DKIM/DMARC sur ton domaine.

---

## Pour la Production

1. **Utilise un vrai domaine email** (pas gmail.com)
2. **Configure SPF** : `v=spf1 include:_spf.google.com ~all`
3. **Configure DKIM** dans Gmail ou ton provider
4. **Configure DMARC** : `v=DMARC1; p=none; rua=mailto:postmaster@ton-domaine.com`
5. **Utilise SendGrid/Brevo** pour meilleure délivrabilité
6. **Chauffe ton domaine** (augmente progressivement le volume d'envoi)

---

## Interface Admin pour Configurer SMTP

Dans l'app, tu peux aussi configurer SMTP via :
- **Admin** → **Paramètres** → **Email**

Mais pour tester rapidement, utilise directement SQL comme ci-dessus !
