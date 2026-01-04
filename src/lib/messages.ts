// Centralized French messages for the application

export const AUTH_MESSAGES = {
  // Login errors
  INVALID_CREDENTIALS: "Email ou mot de passe incorrect",
  EMAIL_NOT_CONFIRMED: "Veuillez confirmer votre email avant de vous connecter",
  TOO_MANY_REQUESTS: "Trop de tentatives. Veuillez réessayer plus tard.",
  NETWORK_ERROR: "Erreur de connexion. Vérifiez votre connexion internet.",
  
  // Signup errors
  USER_ALREADY_EXISTS: "Un compte existe déjà avec cet email. Connectez-vous.",
  PASSWORD_TOO_WEAK: "Le mot de passe ne respecte pas les critères de sécurité",
  INVALID_EMAIL: "Adresse email invalide",
  PASSWORDS_DONT_MATCH: "Les mots de passe ne correspondent pas",
  
  // Validation
  FIRST_NAME_REQUIRED: "Prénom requis",
  LAST_NAME_REQUIRED: "Nom requis",
  EMAIL_REQUIRED: "Email requis",
  PASSWORD_REQUIRED: "Mot de passe requis",
  PASSWORD_MIN_LENGTH: "Le mot de passe doit contenir au moins 8 caractères",
  SIREN_INVALID: "Le SIREN doit contenir 9 chiffres",
  SIRET_INVALID: "Le SIRET doit contenir 14 chiffres",
  SIREN_OR_SIRET_REQUIRED: "SIREN (9 chiffres) ou SIRET (14 chiffres) requis",
  
  // Success
  LOGIN_SUCCESS: "Connexion réussie",
  SIGNUP_SUCCESS: "Inscription réussie ! Bienvenue sur Kopro.",
  LOGOUT_SUCCESS: "Déconnexion réussie",
  PASSWORD_RESET_SENT: "Email de réinitialisation envoyé",
  
  // QR / Residence
  QR_INVALID: "QR code invalide : aucune résidence détectée.",
  RESIDENCE_NOT_FOUND: "Résidence introuvable.",
  NO_RESIDENCE_SPECIFIED: "Aucune résidence spécifiée dans le lien.",
  ALREADY_MEMBER: "Vous êtes déjà membre de cette résidence.",
  
  // General
  UNKNOWN_ERROR: "Une erreur est survenue. Veuillez réessayer.",
  LOADING: "Chargement...",
};

export const FORM_LABELS = {
  EMAIL: "Email",
  PASSWORD: "Mot de passe",
  CONFIRM_PASSWORD: "Confirmer le mot de passe",
  FIRST_NAME: "Prénom",
  LAST_NAME: "Nom",
  PHONE: "Téléphone",
  COMPANY: "Nom de l'agence",
  SIREN_SIRET: "SIREN ou SIRET",
  REMEMBER_ME: "Rester connecté",
};

export const BUTTON_LABELS = {
  LOGIN: "Se connecter",
  SIGNUP: "Créer mon compte",
  LOGOUT: "Se déconnecter",
  CONTINUE: "Continuer",
  BACK: "Retour",
  FORGOT_PASSWORD: "Mot de passe oublié ?",
  GO_TO_LOGIN: "Aller à la connexion",
  SCAN_QR: "Scanner le QR code",
  ENTER_CODE: "Entrer un code",
};

// Parse Supabase auth error to French
export function parseAuthError(error: Error | null): string {
  if (!error) return AUTH_MESSAGES.UNKNOWN_ERROR;
  
  const message = error.message.toLowerCase();
  
  if (message.includes("invalid login credentials")) {
    return AUTH_MESSAGES.INVALID_CREDENTIALS;
  }
  if (message.includes("email not confirmed")) {
    return AUTH_MESSAGES.EMAIL_NOT_CONFIRMED;
  }
  if (message.includes("user already registered") || message.includes("already been registered")) {
    return AUTH_MESSAGES.USER_ALREADY_EXISTS;
  }
  if (message.includes("password")) {
    return AUTH_MESSAGES.PASSWORD_TOO_WEAK;
  }
  if (message.includes("rate limit") || message.includes("too many")) {
    return AUTH_MESSAGES.TOO_MANY_REQUESTS;
  }
  if (message.includes("network") || message.includes("fetch")) {
    return AUTH_MESSAGES.NETWORK_ERROR;
  }
  
  return error.message || AUTH_MESSAGES.UNKNOWN_ERROR;
}

// Validate SIREN (9 digits) or SIRET (14 digits)
export function validateSirenSiret(value: string): { valid: boolean; error?: string } {
  const cleaned = value.replace(/\s/g, '');
  
  if (!cleaned) {
    return { valid: false, error: AUTH_MESSAGES.SIREN_OR_SIRET_REQUIRED };
  }
  
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: "Le SIREN/SIRET ne doit contenir que des chiffres" };
  }
  
  if (cleaned.length === 9) {
    return { valid: true }; // Valid SIREN
  }
  
  if (cleaned.length === 14) {
    return { valid: true }; // Valid SIRET
  }
  
  if (cleaned.length < 9) {
    return { valid: false, error: AUTH_MESSAGES.SIREN_INVALID };
  }
  
  if (cleaned.length > 9 && cleaned.length < 14) {
    return { valid: false, error: AUTH_MESSAGES.SIRET_INVALID };
  }
  
  return { valid: false, error: AUTH_MESSAGES.SIREN_OR_SIRET_REQUIRED };
}
