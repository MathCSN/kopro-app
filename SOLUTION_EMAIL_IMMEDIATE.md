# 🚀 SOLUTION IMMÉDIATE - Emails qui marchent en 2 minutes !

## Le Problème
Aucun serveur SMTP n'est configuré, donc les emails ne partent pas.

## La Solution la Plus Rapide (0 configuration)

### Option 1 : Ethereal Email (Recommandé pour TESTER)

1. Va sur https://ethereal.email/
2. Clique sur "Create Ethereal Account"
3. Tu obtiens des identifiants SMTP instantanément (sans inscription !)
4. Copie les infos affichées

5. **Exécute cette requête SQL dans Supabase** :

```sql
-- D'abord, on doit avoir une résidence pour la config SMTP
-- (la table exige residence_id NOT NULL)

-- Si tu n'as pas encore de résidence, crée-en une :
INSERT INTO residences (name, address, city)
VALUES ('Test Résidence', '123 Rue Test', 'Paris')
RETURNING id;

-- Note l'ID retourné, puis :
INSERT INTO smtp_configs (
  residence_id,
  host,
  port,
  username,
  password,
  from_email,
  from_name,
  use_tls,
  is_active
) VALUES (
  'REMPLACE_PAR_ID_RESIDENCE',  -- L'ID de la résidence ci-dessus
  'smtp.ethereal.email',
  587,
  'TON_USERNAME_ETHEREAL',  -- Ex: john.doe123@ethereal.email
  'TON_PASSWORD_ETHEREAL',   -- Le password généré
  'noreply@kopro.app',
  'KOPRO',
  true,
  true
);
```

6. **Les emails n'arrivent PAS dans ta vraie boîte** mais tu peux les voir sur https://ethereal.email/messages
7. Clique sur le lien dans l'email pour reset ton mot de passe !

---

## Option 2 : Gmail (Plus réaliste mais prend 5 min)

### Étapes :

1. **Active la validation en 2 étapes** sur ton compte Gmail
   - https://myaccount.google.com/signinoptions/two-step-verification

2. **Génère un mot de passe d'application**
   - https://myaccount.google.com/apppasswords
   - Nomme-le "KOPRO Test"
   - Copie le mot de passe (16 caractères, sans espaces)

3. **Exécute dans Supabase** :

```sql
-- Récupère l'ID d'une résidence existante
SELECT id FROM residences LIMIT 1;

-- Puis :
INSERT INTO smtp_configs (
  residence_id,
  host,
  port,
  username,
  password,
  from_email,
  from_name,
  use_tls,
  is_active
) VALUES (
  'ID_RESIDENCE_ICI',
  'smtp.gmail.com',
  587,
  'ton-email@gmail.com',  -- Ton Gmail
  'xxxx xxxx xxxx xxxx',   -- Le mot de passe d'application (colle-le sans espaces)
  'noreply@kopro.app',
  'KOPRO',
  true,
  true
);
```

4. **Les vrais emails arriveront dans ta boîte Gmail !**

---

## Option 3 : Mailtrap (Gratuit, excellent pour dev)

1. Inscris-toi sur https://mailtrap.io/ (gratuit)
2. Dans ton inbox de test, copie les identifiants SMTP
3. Exécute :

```sql
SELECT id FROM residences LIMIT 1;

INSERT INTO smtp_configs (
  residence_id,
  host,
  port,
  username,
  password,
  from_email,
  from_name,
  use_tls,
  is_active
) VALUES (
  'ID_RESIDENCE_ICI',
  'sandbox.smtp.mailtrap.io',
  587,
  'TON_USERNAME_MAILTRAP',  -- Depuis ton inbox
  'TON_PASSWORD_MAILTRAP',
  'noreply@kopro.app',
  'KOPRO',
  true,
  true
);
```

---

## TEST IMMÉDIAT

1. **Va sur ton app** → Page login
2. Clique sur **"Mot de passe oublié"**
3. Entre ton email
4. Attends 5-10 secondes
5. **Vérifie** :
   - **Ethereal** : https://ethereal.email/messages
   - **Gmail** : Ta boîte de réception (et spam)
   - **Mailtrap** : Ton inbox Mailtrap

6. **Clique sur le lien** dans l'email
7. **Entre un nouveau mot de passe**
8. **Connecte-toi** avec le nouveau mot de passe

---

## Si ça ne marche toujours pas...

### Vérifier les logs de la fonction edge :

1. Va dans **Supabase Dashboard**
2. **Edge Functions** → **send-email**
3. Clique sur **"Logs"**
4. Refais une demande de reset password
5. Regarde les logs pour voir l'erreur exacte

### Erreurs communes :

**"residence_id required"**
→ La fonction send-email cherche une config SMTP mais `residence_id` n'est pas fourni

**Solution** : Modifie la fonction `request-password-reset` pour passer un residence_id ou NULL.

**"No SMTP config found"**
→ Vérifie que `is_active = true` dans ta config

```sql
SELECT * FROM smtp_configs WHERE is_active = true;
```

**"SMTP error 535"**
→ Mauvais username/password. Revérifie tes identifiants.

---

## LA VRAIE FIX (À faire après les tests)

Le problème structurel est que `smtp_configs` exige un `residence_id`, mais les emails système (reset password) ne sont pas liés à une résidence.

### Solution permanente :

Modifier la migration pour permettre `residence_id` NULL pour les configs globales :

```sql
-- Dans une nouvelle migration
ALTER TABLE smtp_configs
ALTER COLUMN residence_id DROP NOT NULL;

-- Puis créer une config globale :
INSERT INTO smtp_configs (
  residence_id,  -- NULL = global
  host,
  port,
  username,
  password,
  from_email,
  from_name,
  use_tls,
  is_active
) VALUES (
  NULL,  -- Config globale !
  'smtp.gmail.com',
  587,
  'ton-email@gmail.com',
  'ton-mot-de-passe-app',
  'noreply@kopro.app',
  'KOPRO',
  true,
  true
);
```

---

## Résumé : Choisis ta solution

| Solution | Temps | Emails réels ? | Gratuit ? | Recommandé pour |
|----------|-------|----------------|-----------|-----------------|
| **Ethereal** | 1 min | Non (test) | ✅ | Tests rapides |
| **Gmail** | 5 min | ✅ Oui | ✅ | Tests réalistes |
| **Mailtrap** | 3 min | Non (test) | ✅ | Développement |
| **SendGrid** | 10 min | ✅ Oui | ✅ 100/jour | Production |
| **Brevo** | 10 min | ✅ Oui | ✅ 300/jour | Production |

**Pour tester MAINTENANT** : Utilise **Ethereal** (30 secondes)
**Pour tester avec vrais emails** : Utilise **Gmail** (5 minutes)
**Pour la production** : Utilise **SendGrid ou Brevo**
