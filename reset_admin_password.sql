-- Script pour réinitialiser le mot de passe admin
--
-- IMPORTANT: Ce script doit être exécuté dans le SQL Editor de Supabase Dashboard
--
-- Compte: cousinmathis31@gmail.com
-- Nouveau mot de passe: Admin123!
-- User ID: 02ebfd5c-02ad-4886-b118-6066ba2c89ec

-- Note: Supabase ne permet pas de définir directement un mot de passe via SQL
-- Il faut utiliser l'interface admin de Supabase ou une edge function

-- INSTRUCTIONS:
-- 1. Va dans Supabase Dashboard → Authentication → Users
-- 2. Trouve l'utilisateur: cousinmathis31@gmail.com
-- 3. Clique sur les 3 points → "Reset Password"
-- 4. Option 1: Envoie un email de reset (nécessite SMTP configuré)
-- 5. Option 2: Ou définis un nouveau mot de passe temporaire directement

-- Alternative: Utilise le Dashboard pour définir le mot de passe
-- Dashboard → Authentication → Users → cousinmathis31@gmail.com → Edit User → Set Password

SELECT
    'User ID: ' || id as info,
    'Email: ' || email,
    'Created: ' || created_at::text
FROM auth.users
WHERE email = 'cousinmathis31@gmail.com';
