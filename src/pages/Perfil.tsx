import React from "react";
import { Rocket, Database } from "lucide-react";
import { triggerAudio } from "../hooks/useGoals";

interface UserProfile {
  name?: string;
  email?: string;
  picture?: string;
}

interface PerfilProps {
  userProfile: UserProfile | null;
  userPlan: "free" | "pro" | "premium" | "empresarial";
  stats: {
    totalVendidos: number;
  };
  setActiveTab: (tab: "dashboard" | "produtos" | "estoque" | "relatorios" | "metas" | "perfil" | "planos") => void;
  isOnline: boolean;
  handleLogout: () => void;
  soundEnabled: boolean;
}

export const Perfil: React.FC<PerfilProps> = ({
  userProfile,
  userPlan,
  stats,
  setActiveTab,
  isOnline,
  handleLogout,
  soundEnabled,
}) => {
  return (
    <div className="flex flex-col gap-4 animate-fade-in font-sans">
      {/* Avatar header card */}
      <div className="bg-[#111827] border border-purple-500/15 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
        {userProfile?.picture ? (
          <img
            src={userProfile.picture}
            alt={userProfile.name}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl border border-purple-500/30 object-cover shrink-0 shadow-md animate-fade-in"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-sans font-bold text-2xl text-purple-400 shadow-sm shrink-0">
            XB
          </div>
        )}
        <div className="font-sans">
          <div className="flex items-center gap-1.5 animate-fade-in">
            <h3 className="font-sans font-extrabold text-lg text-white m-0">
              {userProfile?.name || "Xavier Brick"}
            </h3>
            <span className="bg-purple-600 text-white font-sans text-[8.5px] uppercase font-bold px-2 py-0.5 rounded-md leading-none shadow-[0_0_8px_rgba(139,92,246,0.4)]">
              {userPlan === "free" ? "Gratuito" : userPlan === "pro" ? "PRO" : userPlan === "premium" ? "Premium" : "Empresarial"}
            </span>
          </div>
          <span className="text-xs text-slate-400 block mt-0.5 font-medium">
            {userProfile?.email || "Offline Local Cloud Sandbox"}
          </span>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <span className="text-xs text-purple-400 font-bold font-semibold">
              Total faturado: R$ {stats.totalVendidos.toLocaleString("pt-BR")}
            </span>
            <span className="text-slate-650">|</span>
            <button
              onClick={() => {
                triggerAudio("click", soundEnabled);
                setActiveTab("planos");
              }}
              className="text-xs text-purple-450 hover:text-white font-bold flex items-center gap-1.5 cursor-pointer hover:underline transition-all"
            >
              <Rocket size={12} className="text-purple-450" />
              <span>Gerenciar Plano</span>
            </button>
          </div>
        </div>
      </div>

      {/* CLOUD DATABASE SYNC STATUS PANEL */}
      <div className="bg-[#111827] border border-purple-500/15 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-purple-500/10">
          <div className="flex items-center gap-2">
            <Database size={16} className={isOnline ? "text-purple-550 animate-pulse" : "text-amber-500"} />
            <span className="font-sans font-bold text-xs uppercase text-white tracking-wider">
              Banco de Dados Sincronizado
            </span>
          </div>
          {isOnline ? (
            <div className="flex items-center gap-1.5 bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/20 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[9px] text-emerald-400 font-sans font-extrabold uppercase tracking-wide">
                Ativo
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-[9px] text-amber-400 font-sans font-extrabold uppercase tracking-wide">
                Cache Offline
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3 font-medium">
          {isOnline ? (
            "Sua conta está integrada ao banco de dados em tempo real da nuvem. Todos os seus dados de estoque, produtos, metas, relatórios e notificações são salvos de forma protegida e síncrona automaticamente."
          ) : (
            "Você está offline. O RevendaX está operando em cache local offline ultra seguro via IndexedDB. Suas alterações pendentes serão sincronizadas automaticamente com a nuvem assim que sua internet for reestabelecida."
          )}
        </p>

        <div className="bg-[#0D1117] border border-purple-500/10 rounded-xl p-3 flex flex-col gap-2 font-mono text-[10px] text-slate-400">
          <div className="flex justify-between">
            <span>Status Conexão:</span>
            <span className={isOnline ? "text-emerald-450 font-bold font-sans" : "text-amber-500 font-bold font-sans"}>
              {isOnline ? "CONECTADO" : "NÃO DETECTADA (OFFLINE)"}
            </span>
          </div>
          <div className="flex justify-between font-sans text-slate-400">
            <span>Sincronia Múltiplos Dispositivos:</span>
            <span className="text-white font-sans font-medium">
              {isOnline ? "Ativada (Firestore)" : "Pendente (Fila local)"}
            </span>
          </div>
        </div>

        {/* Log out / system lock button */}
        <button
          id="logout-btn"
          onClick={handleLogout}
          className="w-full border border-purple-600/20 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 py-3 rounded-xl font-sans font-bold text-xs transition-colors cursor-pointer mt-4 active:scale-98 shadow-sm"
        >
          Sair da Conta Google
        </button>
      </div>
    </div>
  );
};
