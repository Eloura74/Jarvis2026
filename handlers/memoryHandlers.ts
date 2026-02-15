import { HandlerContext } from "../types/app.types";

interface ConsultMemoryArgs {
  query: string;
}

export const handleConsultMemory = async (
  args: ConsultMemoryArgs,
  ctx: HandlerContext,
) => {
  const { query } = args;
  ctx.addLog(`🧠 Searching memory for: "${query}"`, "KERNEL", "info");

  try {
    const response = await fetch(
      `http://localhost:3001/api/memory/search?q=${encodeURIComponent(query)}`,
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      // Formater les résultats pour l'IA
      const contextData = data.results.map((r: any) => ({
        file: r.name,
        path: r.path,
        content: r.preview,
      }));

      return {
        status: "success",
        data: contextData,
        message: `Found ${data.count} relevant items.`,
      };
    } else {
      return {
        status: "warning",
        data: [],
        message: "No relevant information found in memory.",
      };
    }
  } catch (error) {
    ctx.addLog(`Memory search failed: ${error}`, "SYSTEM", "error");
    return {
      status: "error",
      message: "Failed to consult memory.",
    };
  }
};
