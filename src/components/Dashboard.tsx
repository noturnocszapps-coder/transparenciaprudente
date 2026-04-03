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
  ChevronRight,
  ShieldCheck,
  Search,
  ExternalLink,
  FileText
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
import { motion } from "motion/react";

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
  if (!stats) return <div className="flex items-center justify-center h-64">Carregando dados do portal...</div>;

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
    <div className="space-y-10 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-16 text-white shadow-2xl">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full bg-blue-500/20 px-4 py-1.5 text-xs font-bold tracking-wider text-blue-400 uppercase">
              <ShieldCheck size={14} /> Portal Oficial de Transparência
            </span>
            <span className="text-xs text-slate-400">Atualizado em: {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          <h1 className="mb-6 font-serif text-5xl font-black leading-tight md:text-6xl">
            Fiscalização Cidadã de <span className="text-blue-400">Presidente Prudente</span>
          </h1>
          <p className="mb-10 text-lg leading-relaxed text-slate-300">
            Acompanhe em tempo real como o dinheiro público está sendo investido. 
            Nossa IA analisa cada centavo para garantir que a transparência seja a regra, não a exceção.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="text" 
                placeholder="O que você deseja fiscalizar hoje?"
                className="w-full rounded-2xl bg-white/10 border border-white/10 py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <button className="rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all">
              Pesquisar
            </button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Orçamento Executado" 
          value={`R$ ${(stats.totalSpending / 1000000).toFixed(1)}M`}
          change="+12.4%"
          trend="up"
          icon={DollarSign}
          color="blue"
          description="Total investido no período selecionado"
        />
        <StatCard 
          title="Alertas de IA" 
          value={stats.anomaliesCount}
          change="-2"
          trend="down"
          icon={AlertCircle}
          color="red"
          description="Gastos com padrões fora da média"
        />
        <StatCard 
          title="Líder de Atividade" 
          value={stats.topCouncilor.name}
          subValue={stats.topCouncilor.party}
          icon={Users}
          color="green"
          description="Vereador com maior score legislativo"
        />
        <StatCard 
          title="Índice de Acesso" 
          value="98.2%"
          change="+2.1%"
          trend="up"
          icon={TrendingUp}
          color="purple"
          description="Disponibilidade dos dados públicos"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Charts Column */}
        <div className="xl:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Gastos por Área</h3>
                  <p className="text-sm text-slate-500">Distribuição setorial do orçamento</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <BarChart3 size={20} className="text-slate-400" />
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} width={80} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Fontes de Receita</h3>
                  <p className="text-sm text-slate-500">Origem dos recursos municipais</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <PieChartIcon size={20} className="text-slate-400" />
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={10}
                      dataKey="value"
                    >
                      {revenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={REVENUE_COLORS[index % REVENUE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Councilor Ranking Table */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Destaques Legislativos</h3>
                <p className="text-sm text-slate-500">Ranking baseado em produtividade e presença</p>
              </div>
              <button className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all">
                Ver Ranking Completo <ChevronRight size={16} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Vereador</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Projetos</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Presença</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {councilors.slice(0, 4).map((c, idx) => (
                    <tr key={c.id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                              {c.name.charAt(0)}
                            </div>
                            {idx === 0 && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                                <span className="text-[8px] text-white font-black">★</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-slate-800">{c.name}</span>
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{c.party}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center text-sm font-medium text-slate-600">
                        {c.projectsPresented}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-700">{c.attendanceRate}%</span>
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${c.attendanceRate}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={cn(
                          "inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-black",
                          c.rankingScore > 85 ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {c.rankingScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Latest Reports Card */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900">Relatórios de IA</h3>
              <FileText size={20} className="text-blue-600" />
            </div>
            <div className="space-y-6">
              <ReportItem 
                title="Análise de Gastos em Saúde"
                date="Hoje, 10:45"
                desc="IA detectou variação de 15% na compra de insumos hospitalares em comparação ao mês anterior."
                status="high"
              />
              <ReportItem 
                title="Relatório de Eficiência Legislativa"
                date="Ontem, 16:20"
                desc="Consolidado semanal de projetos apresentados e taxa de aprovação por bancada."
                status="medium"
              />
              <ReportItem 
                title="Auditoria de Contratos de Obras"
                date="02 Abr, 09:15"
                desc="Verificação de conformidade em 3 novos contratos de pavimentação urbana."
                status="low"
              />
            </div>
            <button className="w-full mt-8 py-4 rounded-2xl border-2 border-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              Ver Todos Relatórios <ExternalLink size={16} />
            </button>
          </div>

          {/* Quick Links / Resources */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2rem] text-white shadow-xl">
            <h3 className="text-xl font-bold mb-6">Recursos Externos</h3>
            <div className="space-y-4">
              <a href="#" className="flex items-center justify-between p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all">
                <span className="text-sm font-bold">Portal da Transparência</span>
                <ChevronRight size={18} />
              </a>
              <a href="#" className="flex items-center justify-between p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all">
                <span className="text-sm font-bold">Diário Oficial do Município</span>
                <ChevronRight size={18} />
              </a>
              <a href="#" className="flex items-center justify-between p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all">
                <span className="text-sm font-bold">Câmara Municipal</span>
                <ChevronRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, change, trend, icon: Icon, color, description }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    red: "bg-red-50 text-red-600 border-red-100",
    green: "bg-green-50 text-green-600 border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-6">
        <div className={cn("p-4 rounded-2xl border", colors[color])}>
          <Icon size={28} />
        </div>
        {change && (
          <div className={cn(
            "flex items-center text-xs font-black px-3 py-1.5 rounded-full",
            trend === 'up' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          )}>
            {trend === 'up' ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
            {change}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
        <h4 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h4>
        {subValue && <p className="text-sm font-bold text-blue-600 mt-1">{subValue}</p>}
        <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

function ReportItem({ title, desc, date, status }: any) {
  const statusColors: any = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-blue-500",
  };

  return (
    <div className="group cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", statusColors[status])} />
          <span className="text-xs font-bold text-slate-400">{date}</span>
        </div>
      </div>
      <h5 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-1">{title}</h5>
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{desc}</p>
    </div>
  );
}

// Missing icons from lucide-react
function BarChart3(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

function PieChartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
