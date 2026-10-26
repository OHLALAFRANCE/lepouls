// Connexion à Supabase. Les deux valeurs se trouvent dans Supabase > Project Settings > API.
// La clé « anon / publishable » est faite pour être publique : elle ne donne accès qu'aux totaux
// et à la ligne de chaque personne. Ne jamais mettre ici la clé « service_role / secret ».
// Tant que ces champs sont vides, le site fonctionne en mode démonstration.
window.LEPOULS_CONFIG = {
  supabaseUrl: "https://ntusuyzyxkrntpknxpbe.supabase.co",
  supabaseAnonKey: "sb_publishable_zOdpcr23wmsITTY4v3_N6w_jjPs1rb3"
};
