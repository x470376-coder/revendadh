import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { triggerAudio } from "../hooks/useGoals";

interface QrCodeModalProps {
  isQrModalOpen: boolean;
  setIsQrModalOpen: (open: boolean) => void;
  firebaseUid: string | null;
  soundEnabled: boolean;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isQrModalOpen,
  setIsQrModalOpen,
  firebaseUid,
  soundEnabled,
}) => {
  return (
    <AnimatePresence>
      {isQrModalOpen && (
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none font-sans text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#111827] border border-purple-500/15 rounded-3xl p-5 w-full max-w-[270px] relative shadow-2xl"
            initial={{ scale: 0.93 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.93 }}
            transition={{ type: "spring", damping: 25 }}
          >
            <button
              onClick={() => {
                triggerAudio("click", soundEnabled);
                setIsQrModalOpen(false);
              }}
              className="absolute top-3.5 right-3.5 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-all"
            >
              <X size={14} />
            </button>

            <h4 className="font-display font-black text-white text-xs uppercase tracking-wider mb-1.5 mt-1">
              Sincronia QR Code
            </h4>
            <p className="text-[10px] text-slate-400 px-2 leading-relaxed mb-4">
              Espelhe seu estoque e acompanhe as vendas lendo este código de segurança em outro smartphone:
            </p>

            {/* Visual simulated QR graphic with high fidelity design elements */}
            <div className="w-36 h-36 bg-white p-2.5 rounded-2xl mx-auto flex items-center justify-center relative border border-slate-700 shadow-md mb-4 overflow-hidden">
              <div className="w-full h-full border border-slate-150 relative flex flex-col justify-between p-1">
                {/* Brackets */}
                <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-3 border-l-3 border-purple-500"></div>
                <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-3 border-r-3 border-purple-500"></div>
                <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-3 border-l-3 border-purple-500"></div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-3 border-r-3 border-purple-500"></div>
                <div className="w-full h-full flex flex-col gap-1 justify-center opacity-90">
                  <div className="flex justify-between">
                    <div className="w-5 h-5 bg-slate-900 border-2 border-slate-900 rounded-[1px]"></div>
                    <div className="flex-1 px-1 flex flex-col gap-0.5">
                      <div className="h-1 bg-slate-900 rounded-[1px]"></div>
                      <div className="h-1 bg-slate-900 rounded-[1px]"></div>
                    </div>
                    <div className="w-5 h-5 bg-slate-900 border-2 border-slate-900 rounded-[1px]"></div>
                  </div>
                  <div className="flex-1 flex gap-1">
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="h-1 bg-slate-900 rounded-[1px]"></div>
                      <div className="h-1 bg-slate-900 bg-purple-600 rounded-[1px] animate-pulse"></div>
                    </div>
                    <div className="w-6 h-6 bg-slate-900 rounded-[1px] mt-auto"></div>
                    <div className="flex-1 flex flex-col justify-end gap-1">
                      <div className="h-1 bg-slate-900 rounded-[1px]"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="w-5 h-5 bg-slate-900 border-2 border-slate-900 rounded-[1px]"></div>
                    <div className="flex-1 px-1 flex flex-col justify-end gap-1">
                      <div className="h-1 bg-slate-900 rounded-[1px]"></div>
                    </div>
                    <div className="w-4 h-4 bg-slate-900 rounded-[1px]"></div>
                  </div>
                </div>
                <div className="absolute left-0 right-0 h-0.5 bg-purple-600 top-0 animate-bounce"></div>
              </div>
            </div>

            <div className="bg-[#0D1117] px-3 py-2 rounded-xl border border-purple-500/5 text-center mb-4.5">
              <span className="font-mono text-[9px] text-slate-500 block uppercase tracking-wide">
                Código de Sincronia
              </span>
              <span className="font-mono text-xs font-bold text-slate-300 block tracking-widest mt-0.5">
                FLXP-{firebaseUid ? "LIVE" : "DEMO"}
              </span>
            </div>

            <button
              onClick={() => {
                triggerAudio("click", soundEnabled);
                setIsQrModalOpen(false);
              }}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-sans text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer shadow-md shadow-purple-600/15"
            >
              Fechar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
