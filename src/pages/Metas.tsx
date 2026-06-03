import React from "react";
import { motion } from "motion/react";
import { Edit3, Trash2, Target } from "lucide-react";
import { Goal } from "../types";
import { triggerAudio } from "../utils/audioUtils";

interface MetasProps {
  setEditingGoal: (goal: Goal | null) => void;
  setGoalTitle: (title: string) => void;
  setGoalTargetAmount: (amount: string) => void;
  setIsGoalFormOpen: (open: boolean) => void;
  activeGoal: Goal | null;
  handleEditGoalClick: (goal: Goal) => void;
  handleDeleteGoal: (id: string) => void;
  goalProgressPercent: number;
  stats: {
    lucroRealizado: number;
    lucroPrevisto: number;
  };
  goals: Goal[];
  soundEnabled: boolean;
}

export const Metas: React.FC<MetasProps> = ({
  setEditingGoal,
  setGoalTitle,
  setGoalTargetAmount,
  setIsGoalFormOpen,
  activeGoal,
  handleEditGoalClick,
  handleDeleteGoal,
  goalProgressPercent,
  stats,
  goals,
  soundEnabled,
}) => {
  return (
    <div className="flex flex-col gap-5 animate-fade-in font-sans">
      <div className="flex justify-between items-center font-sans">
        <div>
          <h2 className="font-display font-bold text-xl text-white m-0">Metas Financeiras</h2>
          <span className="text-xs text-slate-400 mt-1 block font-medium">
            Insira e acompanhe seus objetivos
          </span>
        </div>
        <button
          id="adjust-goal-btn"
          onClick={() => {
            triggerAudio("click", soundEnabled);
            setEditingGoal(null);
            setGoalTitle("");
            setGoalTargetAmount("");
            setIsGoalFormOpen(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-xl text-xs font-sans font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md shadow-purple-600/10"
        >
          + Adicionar Meta
        </button>
      </div>

      {activeGoal ? (
        <div className="bg-[#111827] border border-purple-500/15 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] text-purple-400 uppercase font-sans tracking-wide font-extrabold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Meta Principal Ativa
              </span>
              <h3 className="font-sans font-extrabold text-base text-white m-0 mt-1">{activeGoal.title}</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleEditGoalClick(activeGoal)}
                className="p-1 px-[10px] bg-purple-500/15 hover:bg-purple-500/35 text-purple-400 rounded-lg cursor-pointer transition-all border border-purple-500/10 flex items-center justify-center animate-fade-in"
                title="Editar Meta"
              >
                <Edit3 size={13} className="shrink-0" />
              </button>
              <button
                onClick={() => handleDeleteGoal(activeGoal.id)}
                className="p-1 px-[10px] bg-purple-500/15 hover:bg-purple-500/35 text-red-400 hover:text-white rounded-lg cursor-pointer transition-all border border-purple-500/10 flex items-center justify-center animate-fade-in"
                title="Apagar Meta"
              >
                <Trash2 size={13} className="shrink-0" />
              </button>
              <Target
                className="text-purple-500 filter drop-shadow-[0_0_4px_rgba(139,92,246,0.3)] ml-1"
                size={24}
              />
            </div>
          </div>

          <div className="my-5">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-sans font-bold">
              <span>Progresso Completo</span>
              <span className="text-white font-extrabold">{goalProgressPercent}%</span>
            </div>

            {/* Simple progress bar without glow effects */}
            <div className="h-3.5 w-full bg-[#0D1117] border border-purple-500/10 rounded-full overflow-hidden p-0.5">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.35)] rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${goalProgressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              ></motion.div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-purple-500/10 text-xs font-sans">
            <div>
              <span className="text-slate-400 block uppercase text-[10px] font-bold">Alcançado</span>
              <span className="font-sans font-extrabold text-white text-sm">
                R$ {stats.lucroRealizado.toLocaleString("pt-BR")}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase text-[10px] font-bold">Restante</span>
              <span className="font-sans font-bold text-purple-450 text-sm font-semibold">
                R$ {Math.max(0, activeGoal.targetAmount - stats.lucroRealizado).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-slate-500 italic border border-dashed border-purple-500/15 bg-purple-500/5 rounded-2xl font-sans font-medium">
          Nenhuma meta de faturamento definida no momento.
        </div>
      )}

      {/* Outras Metas List */}
      {goals.length > 1 && (
        <div className="bg-[#111827] border border-purple-500/15 p-5 rounded-2xl shadow-sm flex flex-col gap-3">
          <span className="text-xs font-sans font-extrabold uppercase text-slate-400 tracking-wider">
            Outros Objetivos & Metas
          </span>
          <div className="grid grid-cols-1 gap-2 mx-0.5">
            {goals.slice(1).map((goal) => {
              const progressPct = Math.min(100, Math.round((stats.lucroRealizado / goal.targetAmount) * 100));
              return (
                <div
                  key={goal.id}
                  className="p-3 bg-[#0D1117] border border-purple-500/5 hover:border-purple-500/15 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-all animate-fade-in"
                >
                  <div className="min-w-0 flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-sans font-bold text-white truncate text-xs">{goal.title}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                          progressPct >= 100
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/10"
                        }`}
                      >
                        {progressPct >= 100 ? "Concluída" : `${progressPct}%`}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-slate-400 font-sans">
                      <span>Meta: R$ {goal.targetAmount.toLocaleString("pt-BR")}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700 hidden sm:inline"></span>
                      <span>Restante: R$ {Math.max(0, goal.targetAmount - stats.lucroRealizado).toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-slate-800 sm:border-t-0">
                    <button
                      onClick={() => handleEditGoalClick(goal)}
                      className="p-1 px-[12px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg cursor-pointer transition-all border border-purple-500/10 font-bold text-[10.5px] flex items-center gap-1"
                    >
                      <Edit3 size={11} /> Editar
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1 px-[12px] bg-purple-500/10 hover:bg-purple-500/20 text-red-400 hover:text-white rounded-lg cursor-pointer transition-all border border-purple-500/10 font-bold text-[10.5px] flex items-center gap-1"
                    >
                      <Trash2 size={11} /> Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Extra tips dynamic list matches monthly stats */}
      <div className="bg-[#111827] border border-purple-500/15 p-5 rounded-2xl shadow-sm">
        <span className="text-xs font-sans font-extrabold uppercase text-slate-400 tracking-wider block mb-2">
          Monitoramento de Desempenho
        </span>
        <div className="text-xs text-slate-350 leading-relaxed font-sans">
          {stats.lucroRealizado >= 5000 ? (
            <span className="text-emerald-400 font-bold font-semibold">
              Excelente! Você já superou a barreira de faturamento alto estabelecida! Continue girando estoque.
            </span>
          ) : (
            <span>
              Com seu estoque ativo e faturamento estimado aguardando venda com lucro potencial de{" "}
              <strong className="text-white">R$ {stats.lucroPrevisto.toLocaleString("pt-BR")}</strong>, ao vender seus
              produtos você conseguirá alcançar faturamentos robustos de{" "}
              <strong className="text-purple-400">
                {(((stats.lucroRealizado + stats.lucroPrevisto) / (activeGoal?.targetAmount || 5000)) * 105).toFixed(0)}%
              </strong>{" "}
              de seu objetivo atual imediatamente.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
