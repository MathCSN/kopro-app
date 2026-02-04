# Configuration des Emails KOPRO

## Configuration Actuelle

L'adresse email noreply actuelle est : **noreply@kopro.app**

Cette adresse est utilisée pour :
- Tous les emails envoyés par les agences (Bailleurs et Syndics)
- Les emails de réinitialisation de mot de passe
- Tous les emails système

## Comment Changer le Domaine Email

Quand vous aurez votre propre domaine configuré, voici comment mettre à jour l'adresse noreply **partout automatiquement** :

### Étape 1 : Configurer votre domaine email

Avant de changer l'adresse dans KOPRO, assurez-vous que :
1. Votre domaine est configuré pour envoyer des emails
2. Vous avez configuré les enregistrements SPF, DKIM et DMARC
3. Vous pouvez envoyer des emails depuis une adresse noreply@votre-domaine.com

### Étape 2 : Mettre à jour la configuration dans KOPRO

1. Connectez-vous en tant qu'administrateur
2. Allez dans **Admin → Paramètres**
3. Cliquez sur l'onglet **Email**
4. Dans le champ "Adresse email noreply (FROM)", remplacez `noreply@kopro.app` par `noreply@votre-domaine.com`
5. Cliquez sur **Enregistrer la configuration**

**C'EST TOUT !** 🎉

### Que se passe-t-il après ?

Une fois l'adresse noreply mise à jour dans les paramètres, elle sera automatiquement utilisée pour :

✅ **Tous les emails des agences** - Les emails envoyés par les Bailleurs et Syndics utiliseront automatiquement la nouvelle adresse
✅ **Réinitialisation de mot de passe** - Les emails de reset password utiliseront la nouvelle adresse
✅ **Tous les emails système** - Tous les emails de la plateforme utiliseront la nouvelle adresse

### Architecture Technique

Le système utilise une configuration centralisée dans la table `app_config` avec la clé `noreply_email`.

**Points d'utilisation :**
- `useSendEmail` hook : Récupère automatiquement l'adresse depuis la BDD
- `send-email` edge function : Utilise l'adresse configurée
- `request-password-reset` edge function : Récupère l'adresse depuis la BDD

**Comportement des emails :**
- **FROM (expéditeur)** : Nom de l'agence <noreply@votre-domaine.com>
- **REPLY-TO (répondre à)** : Email de contact de l'agence (configuré dans Admin → Clients)

### Exemple

Si un Syndic nommé "Sérénity" envoie un email :
- **Avant** : Sérénity <noreply@kopro.app>
- **Après** : Sérénity <noreply@votre-domaine.com>
- **Reply-To** : contact@serenity-syndic.fr (configuré dans les paramètres de l'agence)

### Configuration par Agence

Chaque agence peut aussi configurer son propre email de contact dans **Admin → Clients** :
1. Cliquez sur une agence
2. Remplissez le champ "Email de contact (Reply-To)"
3. Cet email sera utilisé comme adresse de réponse pour tous les emails de cette agence

## Support

Si vous avez des questions ou besoin d'aide, contactez le support technique.
