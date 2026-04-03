import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  Menu, 
  X,
  TrendingUp,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import Dashboard from "./components/Dashboard";
import Councilors from "./components/Councilors";
import Spending from "./components/Spending";
import Reports from "./components/Reports";

type View = "dashboard" | "councilors" | "spending" | "reports";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "councilors", label: "Vereadores", icon: Users },
    { id: "spending", label: "Gastos Públicos", icon: DollarSign },
    { id: "reports", label: "Relatórios IA", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-slate-900 text-white transition-all duration-300 flex flex-col fixed h-full z-50",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 font-bold text-xl text-blue-400"
            >
              <ShieldAlert className="w-8 h-8" />
              <span>Prudente</span>
            </motion.div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group",
                currentView === item.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={22} className={cn(
                "transition-transform group-hover:scale-110",
                currentView === item.id ? "text-white" : "text-slate-400"
              )} />
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className={cn(
            "flex items-center gap-3",
            !isSidebarOpen && "justify-center"
          )}>
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
              PP
            </div>
            {isSidebarOpen && (
              <div>
                <p className="text-sm font-medium">Presidente Prudente</p>
                <p className="text-xs text-slate-500">Fiscalização Ativa</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        isSidebarOpen ? "ml-64" : "ml-20"
      )}>
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <h2 className="text-2xl font-bold text-slate-800 capitalize">
            {currentView === 'spending' ? 'Gastos Públicos' : currentView}
          </h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={async () => {
                const res = await fetch("/api/sync", { method: "POST" });
                const data = await res.json();
                alert(data.message);
              }}
              className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100 hover:bg-blue-100 transition-colors"
            >
              <TrendingUp size={18} />
              Sincronizar Dados
            </button>
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Sincronizado
            </div>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === "dashboard" && <Dashboard />}
              {currentView === "councilors" && <Councilors />}
              {currentView === "spending" && <Spending />}
              {currentView === "reports" && <Reports />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
