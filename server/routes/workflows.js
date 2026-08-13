import express from "express";
import fs from "fs/promises";
import path from "path";

const router = express.Router();
const DATA_FILE = path.join(process.cwd(), "server", "data", "workflows_store.json");

/**
 * Lit les workflows depuis le fichier JSON
 */
async function loadWorkflows() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    // Par défaut, retourner quelques routines prédéfinies
    return [
      {
        id: "wf_1",
        name: "Mode Focus Travail",
        actions: ["Spotify Focus", "Open VS Code", "Lights Office Dim"],
        icon: "briefcase",
        triggerCount: 5
      },
      {
        id: "wf_2",
        name: "Mode Cinéma",
        actions: ["Lights Off", "Volume 40%", "Open Netflix"],
        icon: "film",
        triggerCount: 3
      },
      {
        id: "wf_3",
        name: "Départ Bureau",
        actions: ["All Lights Off", "Lock PC", "Stop Music"],
        icon: "log-out",
        triggerCount: 2
      }
    ];
  }
}

/**
 * Sauvegarde les workflows dans le fichier JSON
 */
async function saveWorkflows(workflows) {
  try {
    const dir = path.dirname(DATA_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(workflows, null, 2));
  } catch (err) {
    console.error("❌ Erreur sauvegarde workflows_store.json:", err);
  }
}

/**
 * GET /api/workflows
 * Lister tous les workflows
 */
router.get("/", async (req, res) => {
  const workflows = await loadWorkflows();
  res.json({ success: true, count: workflows.length, workflows });
});

/**
 * POST /api/workflows
 * Créer un nouveau workflow
 */
router.post("/", async (req, res) => {
  const { name, actions, icon } = req.body;
  if (!name || !Array.isArray(actions) || actions.length === 0) {
    return res.status(400).json({ error: "Nom et au moins une action requis" });
  }

  const workflows = await loadWorkflows();
  
  // Remplacer si existant ou créer
  const existingIndex = workflows.findIndex(w => w.name.toLowerCase() === name.toLowerCase());
  const newWorkflow = {
    id: existingIndex !== -1 ? workflows[existingIndex].id : `wf_${Date.now()}`,
    name,
    actions,
    icon: icon || "zap",
    triggerCount: existingIndex !== -1 ? workflows[existingIndex].triggerCount : 0,
    updatedAt: new Date().toISOString()
  };

  if (existingIndex !== -1) {
    workflows[existingIndex] = newWorkflow;
  } else {
    workflows.push(newWorkflow);
  }

  await saveWorkflows(workflows);
  console.log(`✨ [Workflows API] Workflow enregistré : "${name}" (${actions.length} étapes)`);
  res.json({ success: true, workflow: newWorkflow });
});

/**
 * DELETE /api/workflows/:idOrName
 * Supprimer un workflow
 */
router.delete("/:idOrName", async (req, res) => {
  const target = req.params.idOrName.toLowerCase();
  let workflows = await loadWorkflows();

  const filtered = workflows.filter(
    w => w.id.toLowerCase() !== target && w.name.toLowerCase() !== target
  );

  if (filtered.length === workflows.length) {
    return res.status(404).json({ error: "Workflow non trouvé" });
  }

  await saveWorkflows(filtered);
  console.log(`🗑️ [Workflows API] Workflow supprimé : "${target}"`);
  res.json({ success: true, message: "Workflow supprimé" });
});

/**
 * POST /api/workflows/:idOrName/run
 * Incrémente le compteur d'utilisation d'un workflow
 */
router.post("/:idOrName/run", async (req, res) => {
  const target = req.params.idOrName.toLowerCase();
  const workflows = await loadWorkflows();

  const wf = workflows.find(
    w => w.id.toLowerCase() === target || w.name.toLowerCase() === target
  );

  if (!wf) {
    return res.status(404).json({ error: "Workflow non trouvé" });
  }

  wf.triggerCount = (wf.triggerCount || 0) + 1;
  await saveWorkflows(workflows);

  res.json({ success: true, workflow: wf });
});

export default router;
