import { useState, useEffect } from "react";
import { Councilor } from "../types";
import { Award, TrendingUp, Search } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "@/src/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function Councilors() {
  const [councilors, setCouncilors] = useState<Councilor[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

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
              <button className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">VER DETALHES</button>
              <div className="flex gap-1">
                {c.rankingScore > 90 && <Award size={16} className="text-yellow-500" />}
                {c.attendanceRate === 100 && <TrendingUp size={16} className="text-green-500" />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
