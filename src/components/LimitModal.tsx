import React from "react";
import { motion } from "motion/react";
import { Rocket } from "lucide-react";
import { triggerAudio } from "../hooks/useGoals";

interface LimitModalProps {
  showLimitModal: boolean;
  setShowLimitModal: (show: boolean) => void;
  limitModalType: "products" | "sales";
  setActiveTab: (tab: "dashboard" | "produtos" | "estoque" | "relatorios" | "metas" | "perfil" | "planos") => void;
  soundEnabled: boolean;
}

export const LimitModal: React.FC<LimitModalProps> = ({
  showLimitModal,
  setShowLimitModal,
  limitModalType,
  setActiveTab,
  soundEnabled,
}) => {
  if (!showLimitModal) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-[#07090D]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-[#111827] border-2 border-purple-500 p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-slide-up overflow-hidden"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
      >
        {/* Background glowing particles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12"></div>

        <div className="text-center relative z-10 font-sans">
          {/* Header Icon badge */}
          <div className="mx-auto w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 shadow-[0_0_15px_rgba(139,92,246,0.22)] animate-bounce-subtle">
            <Rocket size={24} className="stroke-[2.5]" />
          </div>

          <h3 className="font-display font-black text-lg text-white mb-2 tracking-tight">
            Tudo pronto para crescer 🚀
          </h3>

          <p className="text-slate-355 text-xs leading-relaxed mb-6 font-medium">
            {limitModalType === "products" ? (
              "Você atingiu o limite de 3 produtos do plano gratuito. Assine o Plano PRO para cadastrar produtos ilimitados, gerar relatórios completos e acompanhar seu crescimento sem restrições."
            ) : (
              "Você atingiu o limite de 3 vendas do plano gratuito. Assine o Plano PRO para cadastrar vendas ilimitadas, gerar relatórios completos e acompanhar seu crescimento sem restrições."
            )}
          </p>

          {/* Grid for core benefits summary inside prompt */}
          <div className="bg-[#0D1117] border border-purple-500/5 rounded-xl p-3.5 mb-6 text-left flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10.5px] text-slate-350 font-bold">
              <span className="text-emerald-500">✓</span>
              <span>Produtos e Vendas Ilimitadas</span>
            </div>
            <div className="flex items-center gap-2 text-[10.5px] text-slate-355 font-bold">
              <span className="text-emerald-500">✓</span>
              <span>Relatórios e Análises sem bloqueios</span>
            </div>
            <div className="flex items-center gap-2 text-[10.5px] text-slate-355 font-bold">
              <span className="text-emerald-500">✓</span>
              <span>Backup Automático na Nuvem</span>
            </div>
          </div>

          <div className="flex gap-3 text-xs font-sans">
            <button
              id="limit-modal-now-not-btn"
              onClick={() => {
                triggerAudio("click", soundEnabled);
                setShowLimitModal(false);
              }}
              className="flex-1 bg-transparent hover:bg-neutral-850 border border-purple-500/15 text-slate-400 font-extrabold py-3 rounded-xl cursor-pointer transition-all duration-200"
            >
              Agora Não
            </button>
            <button
              id="limit-modal-go-plans-btn"
              onClick={() => {
                triggerAudio("click", soundEnabled);
                setActiveTab("planos");
                setShowLimitModal(false);
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black py-3 rounded-xl cursor-pointer transition-all duration-200 active:scale-95 shadow-lg shadow-purple-600/15"
            >
              Ver Planos
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
