import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeSpending(spendings: any[]) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analise os seguintes gastos públicos da Prefeitura de Presidente Prudente e identifique anomalias (gastos excessivos, fornecedores repetidos sem justificativa, desvios da média).
    Dados: ${JSON.stringify(spendings)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            isAnomaly: { type: Type.BOOLEAN },
            anomalyReason: { type: Type.STRING },
          },
          required: ["id", "isAnomaly"],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]");
}

export async function generateReport(data: any, type: 'daily' | 'weekly') {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Gere um relatório ${type === 'daily' ? 'diário' : 'semanal'} de fiscalização pública para Presidente Prudente.
    Inclua destaques sobre vereadores e gastos.
    Dados: ${JSON.stringify(data)}`,
    config: {
      systemInstruction: "Você é um auditor público focado em transparência e clareza para o cidadão comum.",
    },
  });

  return response.text;
}

export async function generateSocialPost(anomaly: any) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Crie uma postagem para redes sociais (Instagram/Twitter) alertando sobre esta irregularidade detectada: ${JSON.stringify(anomaly)}.
    Seja direto, use emojis e chame a atenção para a fiscalização pública.`,
  });

  return response.text;
}
