/**
 * Service de navigation web intelligente pour JARVIS (Frontend)
 *
 * Fonctionnalités :
 * - Recherche Google/YouTube/Wikipedia/GitHub
 * - Navigation URLs directes
 * - Gestion favoris locaux
 *
 * @module webNavigationService
 */

// ============================================================================
// TYPES
// ============================================================================

export type SearchEngine =
  | "google"
  | "google_images"
  | "youtube"
  | "wikipedia"
  | "github";

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  createdAt: number;
  tags?: string[];
}

// ============================================================================
// RECHERCHE WEB
// ============================================================================

/**
 * Effectue une recherche sur un moteur spécifique
 *
 * @param engine - Moteur de recherche
 * @param query - Requête utilisateur
 * @returns URL construite
 */
export function buildSearchUrl(engine: SearchEngine, query: string): string {
  const encodedQuery = encodeURIComponent(query);

  const urls: Record<SearchEngine, string> = {
    google: `https://www.google.com/search?q=${encodedQuery}`,
    google_images: `https://www.google.com/search?q=${encodedQuery}&tbm=isch`,
    youtube: `https://www.youtube.com/results?search_query=${encodedQuery}`,
    wikipedia: `https://fr.wikipedia.org/wiki/${encodedQuery.replace(/%20/g, "_")}`,
    github: `https://github.com/search?q=${encodedQuery}&type=repositories`,
  };

  return urls[engine];
}

/**
 * Ouvre une recherche dans un nouvel onglet
 *
 * @param engine - Moteur de recherche
 * @param query - Requête
 */
export function searchWeb(engine: SearchEngine, query: string): boolean {
  try {
    const url = buildSearchUrl(engine, query);
    window.open(url, "_blank");

    console.log(`🌐 Recherche ${engine}: "${query}"`);
    return true;
  } catch (error) {
    console.error("Erreur searchWeb:", error);
    return false;
  }
}

// ============================================================================
// NAVIGATION
// ============================================================================

/**
 * Ouvre une URL dans un nouvel onglet
 *
 * @param url - URL à ouvrir
 */
export function openUrl(url: string): boolean {
  try {
    // Normaliser URL (ajouter https:// si manquant)
    let normalizedUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      normalizedUrl = `https://${url}`;
    }

    window.open(normalizedUrl, "_blank");

    console.log(`🌐 URL ouverte: ${normalizedUrl}`);
    return true;
  } catch (error) {
    console.error("Erreur openUrl:", error);
    return false;
  }
}

// ============================================================================
// FAVORIS
// ============================================================================

const BOOKMARKS_KEY = "jarvis_bookmarks";

/**
 * Récupère tous les favoris
 */
export function getBookmarks(): Bookmark[] {
  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erreur getBookmarks:", error);
    return [];
  }
}

/**
 * Ajoute un favori
 *
 * @param title - Titre du favori
 * @param url - URL
 * @param tags - Tags optionnels
 */
export function addBookmark(
  title: string,
  url: string,
  tags?: string[],
): Bookmark {
  const bookmarks = getBookmarks();

  const newBookmark: Bookmark = {
    id: Date.now().toString(),
    title,
    url,
    createdAt: Date.now(),
    tags,
  };

  bookmarks.push(newBookmark);
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));

  console.log(`⭐ Favori ajouté: ${title}`);
  return newBookmark;
}

/**
 * Supprime un favori
 *
 * @param id - ID du favori
 */
export function deleteBookmark(id: string): boolean {
  try {
    const bookmarks = getBookmarks();
    const filtered = bookmarks.filter((b) => b.id !== id);

    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));

    console.log(`🗑️ Favori supprimé: ${id}`);
    return true;
  } catch (error) {
    console.error("Erreur deleteBookmark:", error);
    return false;
  }
}

/**
 * Ouvre un favori par titre (recherche floue)
 *
 * @param title - Titre du favori
 */
export function openBookmark(title: string): boolean {
  const bookmarks = getBookmarks();

  // Recherche floue (normalisation lowercase)
  const found = bookmarks.find((b) =>
    b.title.toLowerCase().includes(title.toLowerCase()),
  );

  if (found) {
    openUrl(found.url);
    console.log(`⭐ Favori ouvert: ${found.title}`);
    return true;
  }

  console.warn(`❌ Favori non trouvé: ${title}`);
  return false;
}
