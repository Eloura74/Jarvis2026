import puppeteer from "puppeteer-core";
import * as cheerio from "cheerio";
import path from "path";
import os from "os";

/**
 * Service de Scraping Web Avancé (Puppeteer-core)
 * Utilise le Chrome local pour bypasser les 403 et render le JavaScript.
 */
class WebScraper {
  constructor() {
    // Chemin vers le Chrome local de l'utilisateur (détecté précédemment)
    this.chromePath = path.join(
      os.homedir(),
      "AppData",
      "Local",
      "Google",
      "Chrome",
      "Application",
      "chrome.exe",
    );
  }

  /**
   * Scrape une page web via Puppeteer.
   * @param {string} input - URL ou terme de recherche
   */
  async scrape(input) {
    let url = input;

    // 1. Détection URL ou Recherche (Via DDG pour trouver le lien)
    if (!input.startsWith("http")) {
      console.log(`🔍 [WebScraper] Recherche auto pour : "${input}"`);
      url = await this.searchAndGetFirstUrl(input);
      if (!url) {
        throw new Error("Aucun résultat trouvé pour cette recherche.");
      }
      console.log(`🎯 [WebScraper] Résultat trouvé : ${url}`);
    }

    console.log(`🌐 [WebScraper] Lancement Puppeteer pour : ${url}`);

    let browser = null;
    try {
      browser = await puppeteer.launch({
        executablePath: this.chromePath,
        headless: true, // "new" n'est plus nécessaire dans les versions récentes
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-blink-features=AutomationControlled", // Bypass détection bot
        ],
      });

      const page = await browser.newPage();

      // Mimic a real user
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      );
      await page.setViewport({ width: 1280, height: 800 });

      // 2. Navigation
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

      // 3. Attendre un peu pour le dynamic content (si besoin)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 4. Récupérer le HTML après rendu JS
      const html = await page.content();
      const title = await page.title();

      // 5. Analyse avec Cheerio (plus rapide pour le DOM cleanup)
      const $ = cheerio.load(html);

      // Nettoyage standard
      $(
        "script, style, noscript, iframe, link, meta, svg, nav, footer, header, aside",
      ).remove();

      // Extraction intelligente du contenu
      let content = "";
      const selectors = [
        "article",
        "main",
        ".post-content",
        ".entry-content",
        "#content",
        "body",
      ];

      for (const selector of selectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          element
            .find(
              ".ad, .advertisement, .share-buttons, .related-posts, .menu, .sidebar",
            )
            .remove();
          content = element.text().trim();
          if (content.length > 300) break;
        }
      }

      const cleanText = content.replace(/\s+/g, " ").substring(0, 50000);
      console.log(
        `✅ [WebScraper] Succès : ${title} (${cleanText.length} chars)`,
      );

      return {
        url,
        title,
        content: cleanText,
      };
    } catch (error) {
      console.error(`❌ [WebScraper] Erreur Puppeteer : ${error.message}`);
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  }

  /**
   * Recherche sur DuckDuckGo (HTML) pour trouver le premier lien.
   * On garde "fetch" ici car DDG HTML est très léger et passe bien.
   */
  async searchAndGetFirstUrl(query) {
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      const html = await response.text();
      const $ = cheerio.load(html);
      const firstLink = $(".result__a").first().attr("href");

      if (firstLink) {
        if (firstLink.startsWith("http")) return firstLink;
        if (firstLink.includes("uddg=")) {
          const urlParams = new URLSearchParams(firstLink.split("?")[1]);
          const realUrl = urlParams.get("uddg");
          if (realUrl) return decodeURIComponent(realUrl);
        }
      }
      return null;
    } catch (error) {
      console.error("❌ [WebScraper] Erreur DDG:", error);
      return null;
    }
  }
}

export default new WebScraper();
