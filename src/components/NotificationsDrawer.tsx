import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { TradeNotification } from "../types";
import { triggerAudio } from "../utils/audioUtils";

interface NotificationsDrawerProps {
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  notifications: TradeNotification[];
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  soundEnabled: boolean;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isNotificationsOpen,
  setIsNotificationsOpen,
  notifications,
  markNotificationAsRead,
  markAllAsRead,
  clearNotifications,
  soundEnabled,
}) => {
  return (
    <AnimatePresence>
      {isNotificationsOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5 z-55 select-none font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#111827] border border-purple-500/15 rounded-3xl p-5 w-full max-w-[310px] relative shadow-2xl flex flex-col"
            initial={{ scale: 0.93 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.93 }}
            transition={{ type: "spring", damping: 25 }}
          >
            <button
              onClick={() => {
                triggerAudio("click", soundEnabled);
                setIsNotificationsOpen(false);
              }}
              className="absolute top-3.5 right-3.5 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-all animate-fade-in"
              title="Fechar Alertas"
            >
              <X size={14} />
            </button>

            <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-500/10 pr-6">
              <span className="font-display font-black text-xs uppercase tracking-wider text-white">
                Alertas / Notificações
              </span>
              <div className="flex gap-2">
                <button
                  id="mark-all-read-btn"
                  onClick={() => {
                    triggerAudio("click", soundEnabled);
                    markAllAsRead();
                  }}
                  className="text-[9px] text-purple-400 uppercase font-extrabold tracking-wider hover:underline cursor-pointer"
                >
                  Lidos
                </button>
                <span className="text-slate-600 text-[9px]">•</span>
                <button
                  id="clear-all-notifs-btn"
                  onClick={() => {
                    triggerAudio("click", soundEnabled);
                    clearNotifications();
                  }}
                  className="text-[9px] text-purple-400 uppercase font-extrabold tracking-wider hover:underline cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 select-none pr-1">
              {notifications.length === 0 ? (
                <p className="text-[11px] text-slate-405 italic text-center py-6 block w-full m-0 leading-normal">
                  Sem alertas registrados no momento.
                </p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      triggerAudio("click", soundEnabled);
                      markNotificationAsRead(notif.id);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                      notif.read
                        ? "bg-[#0D1117] border-purple-500/5 opacity-55"
                        : "bg-[#0D1117] border-purple-500/15 hover:border-purple-500/30"
                    }`}
                  >
                    <div className="flex items-start gap-2 justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            notif.type === "success" || notif.type === "goal"
                              ? "bg-purple-600"
                              : notif.type === "warning"
                              ? "bg-amber-500"
                              : "bg-red-400"
                          }`}
                        />
                        <span className="font-sans font-bold text-[11px] text-slate-100 leading-tight block truncate pr-1">
                          {notif.title}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 shrink-0 select-none">
                        {new Date(notif.timestamp).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal mt-1 m-0 text-left">
                      {notif.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                triggerAudio("click", soundEnabled);
                setIsNotificationsOpen(false);
              }}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-sans text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer mt-4 shadow-md shadow-purple-600/15"
            >
              Fechar Alertas
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
