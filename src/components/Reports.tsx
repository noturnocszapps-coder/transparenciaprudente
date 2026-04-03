import { useState, useEffect } from "react";
import { FileText, Sparkles, Send, Share2, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { db, handleFirestoreError, OperationType } from "@/src/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";

export default function Reports() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setIsGenerating(true);
    try {
      // In a real app, this would call a cloud function or the backend
      // For now we simulate and save to Firestore if admin (mocked)
      const mockReport = `# Relatório de Fiscalização - Presidente Prudente\n\n## Resumo da Semana\n\nNesta semana, a IA detectou uma anomalia significativa no setor de **Educação**, com um gasto de R$ 500.000,00 para reformas que está 40% acima da média histórica para o período.\n\n### Desempenho Legislativo\n- **Maria Oliveira** lidera o ranking com 100% de presença e 8 projetos aprovados.\n- **Pedro Santos** apresenta a menor taxa de atividade, com apenas 60% de score.\n\n### Alertas de Transparência\nA prefeitura manteve os dados atualizados, porém a descrição de alguns contratos de 'Gabinete' permanece genérica, dificultando a fiscalização detalhada.`;
      
      setReport(mockReport);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("date", "desc"), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setReport(snapshot.docs[0].data().content);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "reports");
      setError("Erro ao carregar relatórios.");
    });

    return () => unsubscribe();
  }, []);

  if (error) return <div className="p-8 text-red-600 bg-red-50 rounded-xl border border-red-100">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="text-blue-200" />
          <h3 className="text-xl font-bold">Gerador de Relatórios Autônomo</h3>
        </div>
        <p className="text-blue-100 mb-8 leading-relaxed">
          Nossa IA analisa diariamente o Diário Oficial e o Portal da Transparência para gerar resumos simplificados e detectar irregularidades automaticamente.
        </p>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={generate}
            disabled={isGenerating}
            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? "Analisando Dados..." : "Gerar Relatório Semanal"}
          </button>
          <button className="bg-blue-500/30 text-white border border-blue-400/30 px-6 py-3 rounded-xl font-bold hover:bg-blue-500/40 transition-colors">
            Configurar Alertas Diários
          </button>
        </div>
      </div>

      {report && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <FileText size={20} className="text-blue-600" />
              Relatório Gerado pela IA
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                <Share2 size={18} />
              </button>
              <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                <Download size={18} />
              </button>
            </div>
          </div>
          <div className="p-8 prose prose-slate max-w-none">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Send size={16} className="text-blue-600" />
              Sugestão de Postagem Social
            </h4>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm text-slate-600 italic">
              "🚨 ALERTA DE FISCALIZAÇÃO: Detectamos um gasto de R$ 500k em reformas escolares em Presidente Prudente que está 40% ACIMA da média! Transparência é direito do cidadão. Confira os detalhes no Prudente Transparente. #FiscalizaPrudente #Transparencia"
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
