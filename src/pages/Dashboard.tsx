import React from "react";
import { 
  Calendar, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  Package, 
  ChevronRight, 
  Brain 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { triggerAudio } from "../utils/audioUtils";

const COLORS_CHART = ["#00FF66", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#14B8A6", "#EF4444"];

interface DashboardProps {
  timeFilter: "Hoje" | "Semana" | "Mês" | "Ano" | "Personalizado";
  setTimeFilter: (filter: "Hoje" | "Semana" | "Mês" | "Ano" | "Personalizado") => void;
  setIsCustomDateModalOpen: (open: boolean) => void;
  customStartDate: string;
  customEndDate: string;
  setCustomStartDate: (date: string) => void;
  setCustomEndDate: (date: string) => void;
  showValues: boolean;
  setShowValues: React.Dispatch<React.SetStateAction<boolean>>;
  dashboardStats: {
    lucroRealizado: number;
    lucroPrevisto: number;
    totalVendidos: number;
    roiRealizado: number;
    vendasCount: number;
    estoqueCount: number;
  };
  handlePortfolioAIAnalysis: () => void;
  isAnalyzing: boolean;
  aiReport: string;
  profitTimelineData: any[];
  categoryChartData: any[];
  stats: {
    vendasCount: number;
    estoqueCount: number;
    reservadoCount: number;
  };
  setActiveTab: (tab: "dashboard" | "produtos" | "estoque" | "relatorios" | "metas" | "perfil" | "planos") => void;
  soundEnabled: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  timeFilter,
  setTimeFilter,
  setIsCustomDateModalOpen,
  customStartDate,
  customEndDate,
  setCustomStartDate,
  setCustomEndDate,
  showValues,
  setShowValues,
  dashboardStats,
  handlePortfolioAIAnalysis,
  isAnalyzing,
  aiReport,
  profitTimelineData,
  categoryChartData,
  stats,
  setActiveTab,
  soundEnabled,
}) => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in font-sans">
      {/* Brand Title and Subtitle Header */}
      <div className="text-center md:pb-2 pt-1">
        <span className="inline-block bg-purple-500/10 text-purple-400 font-sans text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-purple-500/15 mb-3">
          Visão Geral Financeira
        </span>
        <h2 className="font-display font-black text-2xl text-white m-0 tracking-tight">RevendaX Dashboard</h2>
        <p className="text-slate-400 text-xs mt-1.5 max-w-md mx-auto leading-relaxed">
          Controle total das suas vendas em um só lugar
        </p>
      </div>

      {/* Period Filter Switcher Bar (Image 2 style) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2.5 select-none animate-fade-in">
          <div className="flex bg-[#0D1117] border border-purple-500/10 rounded-2xl p-1 gap-1 flex-1 overflow-x-auto">
            {(["Hoje", "Semana", "Mês", "Ano"] as const).map((f) => (
              <button
                id={`time-filter-${f}`}
                key={f}
                onClick={() => {
                  setTimeFilter(f);
                  triggerAudio("click", soundEnabled);
                }}
                className={`text-[11px] px-3.5 py-2 rounded-xl font-sans font-bold transition-all cursor-pointer flex-1 text-center whitespace-nowrap ${
                  timeFilter === f
                    ? "bg-purple-600 text-white font-extrabold shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              triggerAudio("click", soundEnabled);
              setIsCustomDateModalOpen(true);
            }}
            className={`p-3 rounded-2xl cursor-pointer active:scale-95 transition-all ${
              timeFilter === "Personalizado"
                ? "bg-purple-600 text-white border border-purple-500/15 shadow-[0_0_12px_rgba(139,92,246,0.30)]"
                : "bg-slate-900 border border-purple-500/10 hover:border-purple-500/20 text-slate-400 hover:text-white"
            }`}
            title="Intervalo Personalizado"
          >
            <Calendar size={16} />
          </button>
        </div>

        {/* Custom filter summary strip */}
        {timeFilter === "Personalizado" && (customStartDate || customEndDate) && (
          <div className="flex items-center justify-between bg-purple-500/5 border border-purple-500/10 rounded-2xl px-4 py-2 text-[10.5px] text-slate-300 select-none animate-fade-in">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
              <span className="font-medium">
                Período ativo:{" "}
                <span className="font-bold text-purple-400">
                  {customStartDate ? customStartDate.split("-").reverse().join("/") : "Início"}
                </span>{" "}
                a{" "}
                <span className="font-bold text-purple-400">
                  {customEndDate ? customEndDate.split("-").reverse().join("/") : "Fim"}
                </span>
              </span>
            </div>
            <button
              onClick={() => {
                triggerAudio("click", soundEnabled);
                setCustomStartDate("");
                setCustomEndDate("");
                setTimeFilter("Mês");
              }}
              className="text-purple-450 hover:text-purple-400 font-extrabold uppercase text-[9px] hover:underline cursor-pointer"
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* MAIN STATS SECTION (Perfect replica of image) */}
      <div className="flex flex-col gap-4">
        {/* CARD 1: LUCRO BRUTO REALIZADO */}
        <div className="bg-[#111827]/90 border border-purple-500/10 p-5 rounded-3xl flex flex-col relative justify-between overflow-hidden shadow-md select-none">
          {/* Upper line: Title, Helper info trigger, and Eye toggler */}
          <div className="flex items-center justify-between w-full text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest">
                Lucro Bruto Realizado
              </span>
              <button
                onClick={() => {
                  triggerAudio("click", soundEnabled);
                  alert(
                    "Este card consolida o faturamento descontando custos (valor investido, frete e taxas) para vendas concluídas no período de " +
                      timeFilter +
                      "."
                  );
                }}
                className="hover:text-white transition-all text-slate-550 cursor-help"
              >
                <HelpCircle size={13} />
              </button>
            </div>

            <button
              onClick={() => {
                triggerAudio("click", soundEnabled);
                setShowValues((prev) => {
                  const next = !prev;
                  localStorage.setItem("revendax_show_values", String(next));
                  return next;
                });
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-850 cursor-pointer active:scale-95 transition-all"
              title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
            >
              {showValues ? <Eye size={17} /> : <EyeOff size={17} />}
            </button>
          </div>

          {/* Big Numeric Value display */}
          <div className="my-4">
            <span className="block text-3xl font-display font-black tracking-tight text-white">
              R${" "}
              {showValues
                ? dashboardStats.lucroRealizado.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "••••••"}
            </span>
          </div>

          {/* Footer details row */}
          <div className="flex items-end justify-between border-t border-purple-500/5 pt-3 w-full">
            <div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 block">
                Vendas no Período
              </span>
              <span className="text-sm font-display font-bold text-white mt-0.5 block">
                {showValues ? `${dashboardStats.vendasCount} itens` : "•• itens"}
              </span>
            </div>

            {/* ROI pill button */}
            {(() => {
              const roiVal = dashboardStats.roiRealizado;
              const isPositive = roiVal > 0;
              const isNegative = roiVal < 0;
              const bgClass = isPositive
                ? "bg-emerald-500/10 hover:bg-emerald-500/20"
                : isNegative
                ? "bg-red-500/10 hover:bg-red-500/20"
                : "bg-slate-500/10 hover:bg-slate-500/20";
              const textClass = isPositive
                ? "text-emerald-400"
                : isNegative
                ? "text-red-400"
                : "text-slate-400";
              const iconClass = isPositive
                ? "text-emerald-555"
                : isNegative
                ? "text-red-555"
                : "text-slate-555";
              const borderClass = isPositive
                ? "border-emerald-500/20"
                : isNegative
                ? "border-red-500/20"
                : "border-slate-500/20";

              return (
                <div
                  className={`flex items-center gap-1.5 ${bgClass} px-3 py-1.5 rounded-2xl border ${borderClass} transition-all select-none cursor-pointer`}
                >
                  <TrendingUp
                    size={11.5}
                    className={`${iconClass} ${isPositive ? "animate-pulse" : ""}`}
                  />
                  <span className={`text-[10.5px] ${textClass} font-sans font-extrabold uppercase tracking-wide`}>
                    ROI {roiVal > 0 ? "+" : ""}
                    {roiVal.toFixed(2)}%
                  </span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* SPLIT BENTO GRID (Row of twin dashboard cards) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 select-none">
          {/* Col 1: Total Vendido */}
          <div className="bg-[#111827]/80 border border-purple-500/10 p-5 rounded-3xl flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-sans font-extrabold block">
                Total Vendido
              </span>
              <span className="block text-lg font-display font-extrabold text-white mt-2 pb-1">
                R${" "}
                {showValues
                  ? dashboardStats.totalVendidos.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "••••••"}
              </span>
            </div>
            <span className="text-[9.5px] text-slate-500 font-sans font-medium mt-1">Somas brutas acumuladas</span>
          </div>

          {/* Col 2: Lucro Previsto */}
          <div className="bg-[#111827]/80 border border-purple-500/10 p-5 rounded-3xl flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-sans font-extrabold block">
                Lucro Previsto
              </span>
              <span className="block text-lg font-display font-extrabold text-purple-400 mt-2 pb-1">
                R${" "}
                {showValues
                  ? dashboardStats.lucroPrevisto.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "••••••"}
              </span>
            </div>
            <span className="text-[9.5px] text-purple-400/80 font-sans font-extrabold tracking-wide uppercase mt-1">
              Lucro em estoque
            </span>
          </div>
        </div>

        {/* CUBE LINE WIDGET (Ativos bar) */}
        <div
          onClick={() => {
            triggerAudio("click", soundEnabled);
            setActiveTab("estoque");
          }}
          className="bg-[#111827]/80 hover:bg-slate-900 border border-purple-500/10 hover:border-purple-500/20 p-4 rounded-2xl flex justify-between items-center shadow-sm select-none cursor-pointer transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
              <Package size={14} />
            </div>
            <span className="font-sans font-bold text-xs text-white uppercase tracking-wider">Ativos em Estoque</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-white font-display font-black text-xs">{dashboardStats.estoqueCount}</span>
            <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Itens</span>
            <ChevronRight size={14} className="text-slate-500 ml-1" />
          </div>
        </div>
      </div>

      {/* FINANCIAL COGNITIVE ADVISOR CARD (Xavier Brick's intelligent assistant) */}
      <div className="bg-purple-500/5 border border-purple-500/15 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-purple-400" />
            <span className="font-sans font-bold text-xs uppercase text-slate-200 tracking-wider">Insights de Mercado (AI)</span>
          </div>
          <button
            id="run-ai-analysis-btn"
            onClick={handlePortfolioAIAnalysis}
            disabled={isAnalyzing}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-[10.5px] uppercase tracking-wider font-sans font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-md shadow-purple-600/10 active:scale-95"
          >
            {isAnalyzing ? "Calculando..." : "Ver Análise"}
          </button>
        </div>

        {aiReport ? (
          <div className="p-3.5 bg-[#0D1117] rounded-xl text-[12px] leading-relaxed text-slate-350 font-sans border border-purple-500/10 shadow-sm max-h-48 overflow-y-auto whitespace-pre-wrap">
            {aiReport}
          </div>
        ) : (
          <div className="text-[12px] text-slate-400 leading-relaxed m-0 font-sans">
            "Se continuar nesse ritmo você pode lucrar R$ {(dashboardStats.lucroRealizado * 1.45).toFixed(0)} este período." Clique no botão acima para rodar o motor analítico do Gemini e gerar as margens recomendadas por categoria e alertas de giro!
          </div>
        )}
      </div>

      {/* ACTIVE CHART: lucro ao longo do tempo */}
      <div className="bg-[#111827] border border-purple-500/15 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
        <span className="text-xs font-sans font-extrabold uppercase text-slate-300 tracking-wider block mb-4">
          Lucro ao longo do tempo
        </span>
        <div className="h-44 w-full">
          {profitTimelineData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-550 italic font-sans font-medium">
              Realize de fato sua primeira venda para plotar a faturamento do mês.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitTimelineData}>
                <XAxis dataKey="date" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                <ChartTooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid rgba(139, 92, 246, 0.2)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "#FFFFFF",
                  }}
                  labelStyle={{ color: "#A855F7", fontWeight: "bold" }}
                />
                <Line
                  type="monotone"
                  dataKey="lucro"
                  stroke="#A855F7"
                  strokeWidth={2.5}
                  dot={{ fill: "#A855F7", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* DISTRIBUTION CHART */}
      <div className="bg-[#111827] border border-purple-500/15 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
        <span className="text-xs font-sans font-extrabold uppercase text-slate-300 tracking-wider block mb-4">
          Distribuição ativa de estoque
        </span>
        <div className="h-36 w-full flex items-center justify-between gap-3">
          <div className="w-[110px] h-full relative">
            {categoryChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-550 italic font-sans font-medium">
                Sem itens
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={42}
                    paddingAngle={2}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_CHART[index % COLORS_CHART.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legends lists */}
          <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-32 text-[10px] text-slate-400 font-sans font-medium">
            {categoryChartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: COLORS_CHART[index % COLORS_CHART.length] }}
                  ></span>
                  <span className="truncate text-slate-300">{entry.name}</span>
                </div>
                <span className="font-mono text-white font-bold ml-1">{entry.value}</span>
              </div>
            ))}
            {categoryChartData.length === 0 && (
              <span className="text-xs text-slate-500 italic font-sans font-normal">
                Cadastre mais para visualizar.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* THREE STATUS PRODUCT DIRECT CARDS */}
      <div className="flex flex-col gap-3 animate-fade-in">
        <span className="text-xs font-sans font-extrabold uppercase text-slate-400 tracking-wider">
          Monitoramento Rápido
        </span>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3.5 text-center text-xs">
          <div className="p-3.5 bg-[#111827] border border-purple-500/15 rounded-xl shadow-sm">
            <span className="text-purple-400 font-display font-bold text-lg block">{stats.vendasCount}</span>
            <span className="text-[10px] text-slate-400 font-sans font-bold uppercase transition-all">Vendidos</span>
          </div>
          <div className="p-3.5 bg-[#111827] border border-purple-500/15 rounded-xl shadow-sm">
            <span className="text-slate-200 font-display font-bold text-lg block">{stats.estoqueCount}</span>
            <span className="text-[10px] text-slate-400 font-sans font-bold uppercase transition-all">
              Em estoque
            </span>
          </div>
          <div className="p-3.5 bg-[#111827] border border-purple-500/15 rounded-xl shadow-sm">
            <span className="text-amber-500 font-display font-bold text-lg block">{stats.reservadoCount}</span>
            <span className="text-[10px] text-slate-400 font-sans font-bold uppercase transition-all">
              Reservados
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
