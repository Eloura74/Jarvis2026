import { HandlerContext } from "../types/app.types";

interface ConsultMemoryArgs {
  query: string;
}

export const handleConsultMemory = async (
  args: ConsultMemoryArgs,
  ctx: HandlerContext & { speak?: (text: string) => void },
) => {
  const { query } = args;
  const { addLog, speak } = ctx;
  addLog(`🧠 Searching memory for: "${query}"`, "KERNEL", "info");

  try {
    const response = await fetch(
      `http://localhost:3001/api/memory/search?q=${encodeURIComponent(query)}`,
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      // Formater les résultats pour l'IA
      const contextData = data.results.map(
        (r: { name: string; path: string; preview: string }) => ({
          file: r.name,
          path: r.path,
          content: r.preview,
        }),
      );

      const topResult = data.results[0];
      const summaryMsg = `J'ai trouvé ${data.count} document${data.count > 1 ? "s" : ""} pertinent${data.count > 1 ? "s" : ""}, Monsieur. Fichier ${topResult.name} : ${topResult.preview.substring(0, 150)}`;

      if (speak) speak(summaryMsg);

      return {
        status: "success",
        data: contextData,
        message: summaryMsg,
      };
    } else {
      const notFoundMsg = `Je n'ai trouvé aucun document correspondant à "${query}" dans votre mémoire locale.`;
      if (speak) speak(notFoundMsg);
      return {
        status: "warning",
        data: [],
        message: notFoundMsg,
      };
    }
  } catch (error) {
    addLog(`Memory search failed: ${error}`, "SYSTEM", "error");
    if (speak) speak("Désolé Monsieur, la recherche dans la mémoire locale a échoué.");
    return {
      status: "error",
      message: "Failed to consult memory.",
    };
  }
};
