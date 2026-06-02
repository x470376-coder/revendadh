import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Smartphone } from "lucide-react";
import { triggerAudio } from "../hooks/useGoals";

interface PwaInstallModalProps {
  showInstallGuideModal: boolean;
  setShowInstallGuideModal: (show: boolean) => void;
  soundEnabled: boolean;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  showInstallGuideModal,
  setShowInstallGuideModal,
  soundEnabled,
}) => {
  return (
    <AnimatePresence>
      {showInstallGuideModal && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[110] select-none font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#111827] border border-purple-500/15 rounded-3xl p-5 w-full max-w-[280px] relative shadow-2xl"
            initial={{ scale: 0.93 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.93 }}
            transition={{ type: "spring", damping: 25 }}
          >
            <button
              onClick={() => {
                triggerAudio("click", soundEnabled);
                setShowInstallGuideModal(false);
              }}
              className="absolute top-3.5 right-3.5 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-all"
            >
              <X size={14} />
            </button>

            <div className="text-center mb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-2.5">
                <Smartphone size={18} className="animate-bounce" />
              </div>
              <h4 className="font-display font-black text-white text-xs uppercase tracking-wider">Instalar no iPhone</h4>
              <p className="text-[10px] text-slate-355 mt-1.5 leading-relaxed">
                Para instalar o app no seu iPhone ou dispositivo móvel compatível, siga as etapas abaixo:
              </p>
            </div>

            {/* Step items (Exact replica of photo styling) */}
            <div className="flex flex-col gap-2.5 mb-4 text-[10px] text-slate-300 font-sans">
              <div className="flex gap-2.5 p-2.5 bg-slate-900 border border-purple-500/5 rounded-xl items-start">
                <div className="w-5 h-5 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 font-extrabold text-[9px] shrink-0">
                  1
                </div>
                <div>
                  <span className="font-extrabold text-white block">Toque em Compartilhar</span>
                  <span className="text-[9px] text-slate-450 mt-0.5 block leading-normal">
                    Ícone na barra inferior do Safari (quadrado com seta para cima).
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 p-2.5 bg-slate-900 border border-purple-500/5 rounded-xl items-start">
                <div className="w-5 h-5 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 font-extrabold text-[9px] shrink-0">
                  2
                </div>
                <div>
                  <span className="font-extrabold text-white block">Role e Adicionar à Tela de Início</span>
                  <span className="text-[9px] text-slate-450 mt-0.5 block leading-normal">
                    Selecione a opção "Adicionar à Tela de Início" na listagem.
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 p-2.5 bg-slate-900 border border-purple-500/5 rounded-xl items-start">
                <div className="w-5 h-5 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 font-extrabold text-[9px] shrink-0">
                  3
                </div>
                <div>
                  <span className="font-extrabold text-white block">Aperte em Adicionar</span>
                  <span className="text-[9px] text-slate-450 mt-0.5 block leading-normal">
                    Adicione na barra de menus para usufruir da experiência nativa completa!
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
