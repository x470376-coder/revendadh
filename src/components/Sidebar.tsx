import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Layers, 
  Package, 
  ShoppingBag, 
  PieChart as PieIcon, 
  Target, 
  Rocket, 
  Settings, 
  Smartphone, 
  LogOut
} from "lucide-react";
import { BrandLogoCompact } from "./BrandLogo";
import { triggerAudio } from "../utils/audioUtils";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  activeTab: "dashboard" | "produtos" | "estoque" | "relatorios" | "metas" | "perfil" | "planos";
  handleTabChange: (tab: "dashboard" | "produtos" | "estoque" | "relatorios" | "metas" | "perfil" | "planos") => void;
  userProfile: { name: string; email: string; picture: string } | null;
  handleLogout: () => void;
  soundEnabled: boolean;
  onOpenInstallGuide: () => void;
  userPlan: "free" | "pro" | "premium" | "empresarial";
  isMaster?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  activeTab,
  handleTabChange,
  userProfile,
  handleLogout,
  soundEnabled,
  onOpenInstallGuide,
  userPlan,
  isMaster = false,
}) => {
  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* Dark Overlay backdrop - Fixed Viewport */}
          <motion.div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[98] cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
          />
          {/* Sliding visual Drawer - Fixed Viewport to eliminate empty scroll gaps */}
          <motion.div
            className="fixed inset-y-0 left-0 w-[270px] bg-[#111827] border-r border-purple-500/15 pt-[calc(20px+env(safe-area-inset-top,0px))] px-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] flex flex-col justify-between z-[99] shadow-2xl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
          >
            <div className="flex flex-col gap-5 select-none font-sans">
              {/* Top row */}
              <div className="flex items-center justify-between pb-3.5 border-b border-purple-500/10">
                <BrandLogoCompact size="sm" />
                <button
                  onClick={() => {
                    triggerAudio("click", soundEnabled);
                    setIsSidebarOpen(false);
                  }}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Profile Widget */}
              <div className="p-3 bg-[#0D1117] border border-purple-500/10 rounded-2xl flex items-center gap-3 shadow-sm">
                {userProfile?.picture ? (
                  <img
                    src={userProfile.picture}
                    alt={userProfile.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-xl border border-purple-500/15 object-cover shrink-0 shadow-[0_0_6px_rgba(139,92,246,0.1)]"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-500 font-extrabold text-xs">
                    RX
                  </div>
                )}
                <div className="truncate flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h4 className="text-xs font-sans font-bold text-white truncate leading-none">
                      {userProfile?.name || "Xavier Brick"}
                    </h4>
                  </div>
                  <p className="text-[10.5px] text-slate-450 truncate leading-none m-0 font-normal tracking-wide">
                    {userProfile?.email || "usuario@revendax.com"}
                  </p>

                  {/* Badge de plano — só aparece se não for free */}
                  {userPlan !== "free" && (() => {
                    const planConfig = {
                      pro: {
                        label: "PRO",
                        bg: "bg-gradient-to-r from-blue-600 to-blue-500",
                        glow: "shadow-[0_0_8px_rgba(59,130,246,0.5)]",
                        icon: "⚡",
                      },
                      premium: {
                        label: "PREMIUM",
                        bg: "bg-gradient-to-r from-purple-600 to-purple-500",
                        glow: "shadow-[0_0_8px_rgba(139,92,246,0.5)]",
                        icon: "✦",
                      },
                      empresarial: {
                        label: "EMPRESARIAL",
                        bg: "bg-gradient-to-r from-amber-500 to-orange-500",
                        glow: "shadow-[0_0_8px_rgba(245,158,11,0.5)]",
                        icon: "🏢",
                      },
                    }[userPlan];

                    return (
                      <div className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-white text-[9px] font-sans font-black uppercase tracking-widest ${planConfig.bg} ${planConfig.glow}`}>
                        <span>{planConfig.icon}</span>
                        <span>{planConfig.label}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Menu navigation */}
              <nav className="flex flex-col gap-1.5 text-xs font-sans font-semibold text-slate-400 tracking-wide">
                <button
                  onClick={() => {
                    handleTabChange("dashboard");
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all border ${
                    activeTab === "dashboard"
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/15 shadow-[0_0_10px_rgba(139,92,246,0.05)] font-bold"
                      : "border-transparent hover:bg-slate-800/40 hover:text-slate-200"
                  }`}
                >
                  <Layers size={15} />
                  <span>Início Dashboard</span>
                </button>
                <button
                  onClick={() => {
                    handleTabChange("estoque");
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all border ${
                    activeTab === "estoque"
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/15 shadow-[0_0_10px_rgba(139,92,246,0.05)] font-bold"
                      : "border-transparent hover:bg-slate-800/40 hover:text-slate-200"
                  }`}
                >
                  <Package size={15} />
                  <span>Estoque Ativo</span>
                </button>
                <button
                  onClick={() => {
                    handleTabChange("produtos");
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all border ${
                    activeTab === "produtos"
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/15 shadow-[0_0_10px_rgba(139,92,246,0.05)] font-bold"
                      : "border-transparent hover:bg-slate-800/40 hover:text-slate-200"
                  }`}
                >
                  <ShoppingBag size={15} />
                  <span>Vendas e Giro</span>
                </button>
                <button
                  onClick={() => {
                    handleTabChange("relatorios");
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all border ${
                    activeTab === "relatorios"
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/15 shadow-[0_0_10px_rgba(139,92,246,0.05)] font-bold"
                      : "border-transparent hover:bg-slate-800/40 hover:text-slate-200"
                  }`}
                >
                  <PieIcon size={15} />
                  <span>Relatórios de Margem</span>
                </button>
                <button
                  onClick={() => {
                    handleTabChange("metas");
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all border ${
                    activeTab === "metas"
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/15 shadow-[0_0_10px_rgba(139,92,246,0.05)] font-bold"
                      : "border-transparent hover:bg-slate-800/40 hover:text-slate-200"
                  }`}
                >
                  <Target size={15} />
                  <span>Metas Mensais</span>
                </button>
                {isMaster && (
                  <button
                    onClick={() => {
                      handleTabChange("planos");
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all border ${
                      activeTab === "planos"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/15 shadow-[0_0_10px_rgba(139,92,246,0.05)] font-bold"
                        : "border-transparent hover:bg-slate-800/40 hover:text-slate-200"
                    }`}
                  >
                    <Rocket size={15} />
                    <span>Planos & Assinatura</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    handleTabChange("perfil");
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all border ${
                    activeTab === "perfil"
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/15 shadow-[0_0_10px_rgba(139,92,246,0.05)] font-bold"
                      : "border-transparent hover:bg-slate-800/40 hover:text-slate-200"
                  }`}
                >
                  <Settings size={15} />
                  <span>Ajustes Gerais</span>
                </button>
              </nav>
            </div>

            {/* Extra drawer buttons at bottom - aligned tightly with physical screen bottom */}
            <div className="flex flex-col gap-1.5 font-sans select-none border-t border-slate-800/50 pt-3.5 mb-2">
              <button
                onClick={() => {
                  triggerAudio("click", soundEnabled);
                  onOpenInstallGuide();
                  setIsSidebarOpen(false);
                }}
                className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left text-purple-400 hover:bg-purple-500/5 cursor-pointer text-xs font-bold transition-all"
              >
                <Smartphone size={15} className="text-purple-500 animate-pulse" />
                <span>Instalar no Celular</span>
              </button>

              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left text-slate-500 hover:text-white hover:bg-slate-800/60 cursor-pointer text-xs font-bold transition-all"
              >
                <LogOut size={15} />
                <span>Terminar Sessão</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
