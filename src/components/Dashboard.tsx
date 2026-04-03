import { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, 
  AlertCircle, 
  Users, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar,
  ChevronRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { cn } from "@/src/lib/utils";
import { db, handleFirestoreError, OperationType } from "@/src/firebase";
import { collection, onSnapshot, query, limit, orderBy } from "firebase/firestore";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const REVENUE_COLORS = ['#6366f1', '#8b5cf6', '#d946ef'];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [councilors, setCouncilors] = useState<any[]>([]);
  const [spendings, setSpendings] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [period, setPeriod] = useState("30");
  const [spendingType, setSpendingType] = useState("all");
  const [selectedCouncilor, setSelectedCouncilor] = useState("all");

  useEffect(() => {
    const councilorsQuery = query(collection(db, "councilors"), limit(20));
    const unsubscribeCouncilors = onSnapshot(councilorsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCouncilors(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "councilors");
      setError("Erro ao carregar vereadores.");
    });

    const spendingsQuery = query(collection(db, "spending"), orderBy("date", "desc"), limit(50));
    const unsubscribeSpendings = onSnapshot(spendingsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSpendings(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "spending");
      setError("Erro ao carregar gastos.");
    });

    return () => {
      unsubscribeCouncilors();
      unsubscribeSpendings();
    };
  }, []);

  const filteredSpendings = useMemo(() => {
    return spendings.filter(s => {
      const matchesType = spendingType === "all" || s.category === spendingType;
      // In a real app, we'd filter by date and councilor relation here
      return matchesType;
    });
  }, [spendings, spendingType]);

  useEffect(() => {
    if (councilors.length > 0 || spendings.length > 0) {
      setStats({
        totalSpending: filteredSpendings.reduce((acc, s) => acc + (s.amount || 0), 0),
        anomaliesCount: filteredSpendings.filter(s => s.isAnomaly).length,
        topCouncilor: councilors.sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0))[0] || { name: "N/A", party: "N/A" },
      });
    }
  }, [councilors, filteredSpendings]);

  if (error) return <div className="p-8 text-red-600 bg-red-50 rounded-xl border border-red-100">{error}</div>;
  if (!stats) return <div className="flex items-center justify-center h-64">Carregando dados do Firestore...</div>;

  const expenseData = [
    { name: 'Saúde', value: 450000 },
    { name: 'Educação', value: 300000 },
    { name: 'Obras', value: 200000 },
    { name: 'Gabinete', value: 50000 },
    { name: 'Outros', value: 120000 },
  ];

  const revenueData = [
    { name: 'Federal', value: 600000 },
    { name: 'Estadual', value: 300000 },
    { name: 'Municipal', value: 200000 },
  ];

  return (
    <div className="space-y-8">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <Calendar size={18} className="text-slate-400" />
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-transparent text-sm font-medium outline-none text-slate-700"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Este ano</option>
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <Filter size={18} className="text-slate-400" />
          <select 
            value={spendingType}
            onChange={(e) => setSpendingType(e.target.value)}
            className="bg-transparent text-sm font-medium outline-none text-slate-700"
          >
            <option value="all">Todas Categorias</option>
            <option value="Saúde">Saúde</option>
            <option value="Educação">Educação</option>
            <option value="Obras">Obras</option>
            <option value="Gabinete">Gabinete</option>
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <Users size={18} className="text-slate-400" />
          <select 
            value={selectedCouncilor}
            onChange={(e) => setSelectedCouncilor(e.target.value)}
            className="bg-transparent text-sm font-medium outline-none text-slate-700 max-w-[150px]"
          >
            <option value="all">Todos Vereadores</option>
            {councilors.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
          Aplicar Filtros
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Gastos" 
          value={`R$ ${(stats.totalSpending / 1000000).toFixed(1)}M`}
          change="+12%"
          trend="up"
          icon={DollarSign}
          color="blue"
        />
        <StatCard 
          title="Anomalias Detectadas" 
          value={stats.anomaliesCount}
          change="-2"
          trend="down"
          icon={AlertCircle}
          color="red"
        />
        <StatCard 
          title="Melhor Vereador" 
          value={stats.topCouncilor.name}
          subValue={stats.topCouncilor.party}
          icon={Users}
          color="green"
        />
        <StatCard 
          title="Taxa de Transparência" 
          value="98%"
          change="+2%"
          trend="up"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Despesas por Categoria</h3>
            <TrendingUp size={20} className="text-slate-400" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={80} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Origem das Receitas</h3>
            <DollarSign size={20} className="text-slate-400" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={REVENUE_COLORS[index % REVENUE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Councilor Ranking Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Ranking de Atividade Legislativa</h3>
          <button className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline">
            Ver Ranking Completo <ChevronRight size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vereador</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Partido</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Projetos</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Presença</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {councilors.slice(0, 5).map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {c.name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-slate-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                      {c.party}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-slate-600">
                    {c.projectsPresented}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-medium text-slate-700">{c.attendanceRate}%</span>
                      <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${c.attendanceRate}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-bold",
                        c.rankingScore > 80 ? "text-green-600" : c.rankingScore > 60 ? "text-amber-600" : "text-red-600"
                      )}>
                        {c.rankingScore}
                      </span>
                    </div>
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

function StatCard({ title, value, subValue, change, trend, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-xl", colors[color])}>
          <Icon size={24} />
        </div>
        {change && (
          <div className={cn(
            "flex items-center text-xs font-bold px-2 py-1 rounded-full",
            trend === 'up' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          )}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {change}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
        {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
      </div>
    </div>
  );
}

function AlertItem({ type, title, desc, time }: any) {
  const icons: any = {
    high: <AlertCircle className="text-red-500" />,
    medium: <AlertCircle className="text-amber-500" />,
    low: <AlertCircle className="text-blue-500" />,
  };

  return (
    <div className="p-6 flex gap-4 hover:bg-slate-50 transition-colors">
      <div className="mt-1">{icons[type]}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h5 className="font-bold text-slate-800">{title}</h5>
          <span className="text-xs text-slate-400">{time}</span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
