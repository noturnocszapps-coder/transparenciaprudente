import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock data stored in memory for demo
  let councilors = [
    { id: "1", name: "João Silva", party: "PL", projectsPresented: 15, projectsApproved: 5, attendanceRate: 95, rankingScore: 85, lastUpdate: new Date().toISOString() },
    { id: "2", name: "Maria Oliveira", party: "PT", projectsPresented: 12, projectsApproved: 8, attendanceRate: 100, rankingScore: 92, lastUpdate: new Date().toISOString() },
    { id: "3", name: "Pedro Santos", party: "MDB", projectsPresented: 8, projectsApproved: 2, attendanceRate: 80, rankingScore: 60, lastUpdate: new Date().toISOString() },
  ];

  let spendings = [
    { id: "s1", date: "2026-03-25", category: "Saúde", description: "Compra de medicamentos", amount: 150000, supplier: "Pharma S.A.", isAnomaly: false },
    { id: "s2", date: "2026-03-26", category: "Educação", description: "Reforma de escola", amount: 500000, supplier: "ConstruTudo Ltda", isAnomaly: true, anomalyReason: "Gasto 40% acima da média para reformas similares." },
    { id: "s3", date: "2026-03-27", category: "Gabinete", description: "Material de escritório", amount: 5000, supplier: "Papelaria Central", isAnomaly: false },
  ];

  // API Routes
  app.get("/api/councilors", (req, res) => res.json(councilors));
  app.get("/api/spendings", (req, res) => res.json(spendings));
  app.get("/api/stats", (req, res) => {
    res.json({
      totalSpending: spendings.reduce((acc, s) => acc + s.amount, 0),
      anomaliesCount: spendings.filter(s => s.isAnomaly).length,
      topCouncilor: councilors.sort((a, b) => b.rankingScore - a.rankingScore)[0],
    });
  });

  app.post("/api/sync", async (req, res) => {
    try {
      // In a real scenario, we would fetch HTML from:
      // http://transparencia.presidenteprudente.sp.gov.br/
      // https://www.camarapprudente.sp.gov.br/
      
      const prompt = `Acesse os dados públicos de Presidente Prudente (Portal da Transparência e Câmara Municipal). 
      Extraia informações recentes sobre novos gastos e atividades dos vereadores. 
      Retorne um resumo em JSON das novas descobertas.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ urlContext: {} }],
        }
      });

      // For demo, we just simulate the update
      res.json({ status: "success", message: "Dados sincronizados com sucesso via IA.", summary: response.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "error", message: "Falha na sincronização." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
