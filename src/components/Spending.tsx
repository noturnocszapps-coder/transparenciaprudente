import { useState, useEffect, useMemo } from "react";
import { Spending as SpendingType, Councilor } from "../types";
import { AlertTriangle, Download, Filter, Search, User } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { db, handleFirestoreError, OperationType } from "@/src/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function Spending() {
  const [spendings, setSpendings] = useState<SpendingType[]>([]);
  const [councilors, setCouncilors] = useState<Councilor[]>([]);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [councilorFilter, setCouncilorFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Spendings
    const qSpending = query(collection(db, "spending"), orderBy("date", "desc"));
    const unsubSpending = onSnapshot(qSpending, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpendingType));
      setSpendings(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "spending");
      setError("Erro ao carregar gastos.");
    });

    // Fetch Councilors
    const qCouncilors = query(collection(db, "councilors"), orderBy("name", "asc"));
    const unsubCouncilors = onSnapshot(qCouncilors, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Councilor));
      setCouncilors(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "councilors");
    });

    return () => {
      unsubSpending();
      unsubCouncilors();
    };
  }, []);

  const filtered = useMemo(() => {
    return spendings.filter(s => {
      const matchesAnomaly = filter === "all" || (filter === "anomalies" && s.isAnomaly);
      const matchesCategory = categoryFilter === "all" || s.category === categoryFilter;
      const matchesCouncilor = councilorFilter === "all" || s.councilorId === councilorFilter;
      const matchesSearch = s.description.toLowerCase().includes(search.toLowerCase()) || 
                           s.supplier.toLowerCase().includes(search.toLowerCase());
      return matchesAnomaly && matchesCategory && matchesCouncilor && matchesSearch;
    });
  }, [spendings, filter, categoryFilter, councilorFilter, search]);

  if (error) return <div className="p-8 text-red-600 bg-red-50 rounded-xl border border-red-100">{error}</div>;
  if (spendings.length === 0) return <div className="flex items-center justify-center h-64">Carregando gastos...</div>;

  const categories = Array.from(new Set(spendings.map(s => s.category)));

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por descrição ou fornecedor..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <Filter size={18} className="text-slate-400" />
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-transparent text-sm font-medium outline-none text-slate-700"
          >
            <option value="all">Todas Categorias</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <User size={18} className="text-slate-400" />
          <select 
            value={councilorFilter}
            onChange={(e) => setCouncilorFilter(e.target.value)}
            className="bg-transparent text-sm font-medium outline-none text-slate-700 max-w-[150px]"
          >
            <option value="all">Todos Vereadores</option>
            {councilors.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setFilter(filter === "anomalies" ? "all" : "anomalies")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              filter === "anomalies" ? "bg-red-600 text-white shadow-lg shadow-red-200" : "bg-white text-red-600 border border-red-100"
            )}
          >
            <AlertTriangle size={16} />
            Anomalias
          </button>
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fornecedor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className={cn(
                  "hover:bg-slate-50 transition-colors",
                  s.isAnomaly && "bg-red-50/30"
                )}>
                  <td className="px-6 py-4 text-sm text-slate-600">{s.date}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-800">{s.description}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{s.supplier}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                      {s.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    R$ {s.amount.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    {s.isAnomaly ? (
                      <div className="flex items-center gap-2 text-red-600 group relative cursor-help">
                        <AlertTriangle size={18} />
                        <span className="text-xs font-bold">Anomalia</span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl z-50">
                          {s.anomalyReason}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-green-600">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
