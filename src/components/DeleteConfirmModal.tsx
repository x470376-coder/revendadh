import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2 } from "lucide-react";
import { triggerAudio } from "../hooks/useGoals";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  soundEnabled: boolean;
  confirmBtnId?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  soundEnabled,
  confirmBtnId,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-[#07090D]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none animate-fade-in"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#111827] border border-red-500/15 p-6 rounded-2xl w-full max-w-sm relative animate-slide-up shadow-2xl text-center"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
          >
            <div className="font-sans">
              {/* Trash Icon block */}
              <div className="mx-auto w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500 mb-4">
                <Trash2 size={20} className="stroke-[2.5]" />
              </div>

              <h3 className="font-display font-black text-sm uppercase tracking-wide text-white mb-2">
                {title}
              </h3>
              <p className="text-slate-400 text-xs mb-6 pr-1 leading-relaxed">
                {description}
              </p>

              <div className="flex gap-3 text-xs">
                <button
                  onClick={() => {
                    triggerAudio("click", soundEnabled);
                    onClose();
                  }}
                  className="flex-1 bg-transparent hover:bg-purple-500/5 border border-purple-500/15 text-slate-400 font-bold py-2.5 rounded-xl cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  id={confirmBtnId || "confirm-delete-modal-btn"}
                  onClick={() => {
                    onConfirm();
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 duration-200"
                >
                  Confirmar Excluir
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
