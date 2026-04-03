import { useState, useEffect } from "react";
import { Councilor } from "../types";
import { Award, TrendingUp, Search, X, CheckCircle2, Clock, Calendar, BarChart3 } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "@/src/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

export default function Councilors() {
  const [councilors, setCouncilors] = useState<Councilor[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedCouncilor, setSelectedCouncilor] = useState<Councilor | null>(null);

  useEffect(() => {
    const q = query(collection(db, "councilors"), orderBy("rankingScore", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Councilor));
      setCouncilors(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "councilors");
      setError("Erro ao carregar vereadores.");
    });

    return () => unsubscribe();
  }, []);

  const filtered = councilors.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.party.toLowerCase().includes(search.toLowerCase())
  );

  if (error) return <div className="p-8 text-red-600 bg-red-50 rounded-xl border border-red-100">{error}</div>;
  if (councilors.length === 0) return <div className="flex items-center justify-center h-64">Carregando vereadores...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar vereador ou partido..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Ordenar por:</span>
          <select className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500">
            <option>Ranking</option>
            <option>Projetos</option>
            <option>Presença</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {filtered.map((c, idx) => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{c.name}</h4>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{c.party}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">#{idx + 1}</div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">No Ranking</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-1">Projetos</p>
                  <p className="font-bold text-slate-800">{c.projectsPresented}</p>
                </div>
                <div className="text-center border-x border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">Aprovados</p>
                  <p className="font-bold text-green-600">{c.projectsApproved}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-1">Presença</p>
                  <p className="font-bold text-slate-800">{c.attendanceRate}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-500 uppercase">Score de Atividade</span>
                  <span className="text-blue-600">{c.rankingScore}/100</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${c.rankingScore}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <button 
                onClick={() => setSelectedCouncilor(c)}
                className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
              >
                VER DETALHES
              </button>
              <div className="flex gap-1">
                {c.rankingScore > 90 && <Award size={16} className="text-yellow-500" />}
                {c.attendanceRate === 100 && <TrendingUp size={16} className="text-green-500" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Councilor Details Modal */}
      <AnimatePresence>
        {selectedCouncilor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCouncilor(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-bold">
                      {selectedCouncilor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{selectedCouncilor.name}</h3>
                      <p className="text-slate-500 font-medium">{selectedCouncilor.party} • Vereador de Presidente Prudente</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedCouncilor(null)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <BarChart3 size={16} />
                      <span className="text-xs font-bold uppercase">Atividade</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{selectedCouncilor.rankingScore}%</p>
                    <p className="text-[10px] text-slate-400 mt-1">Score Geral</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <Calendar size={16} />
                      <span className="text-xs font-bold uppercase">Presença</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{selectedCouncilor.attendanceRate}%</p>
                    <p className="text-[10px] text-slate-400 mt-1">Sessões Ordinárias</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <CheckCircle2 size={16} />
                      <span className="text-xs font-bold uppercase">Eficácia</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{selectedCouncilor.projectsApproved}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Projetos Aprovados</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <Clock size={18} className="text-blue-600" />
                    Últimas Atividades Legislativas
                  </h4>
                  <div className="space-y-4">
                    {selectedCouncilor.recentProjects && selectedCouncilor.recentProjects.length > 0 ? (
                      selectedCouncilor.recentProjects.map((project, i) => (
                        <div key={i} className="p-4 rounded-xl border border-slate-100 hover:border-blue-100 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="text-sm font-bold text-slate-800">{project.title}</h5>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full",
                              project.status === "Aprovado" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                            )}>
                              {project.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">Apresentado em {new Date(project.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic">Nenhuma atividade recente registrada.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setSelectedCouncilor(null)}
                  className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
