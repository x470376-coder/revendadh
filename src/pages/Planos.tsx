import React from "react";
import { Sparkles } from "lucide-react";
import { TradeNotification } from "../types";
import { triggerAudio } from "../hooks/useGoals";

interface PlanosProps {
  userPlan: "free" | "pro" | "premium" | "empresarial";
  setUserPlan: (plan: "free" | "pro" | "premium" | "empresarial") => void;
  setNotifications: React.Dispatch<React.SetStateAction<TradeNotification[]>>;
  soundEnabled: boolean;
}

export const Planos: React.FC<PlanosProps> = ({
  userPlan,
  setUserPlan,
  setNotifications,
  soundEnabled,
}) => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in font-sans">
      {/* Header Title section */}
      <div className="text-center md:pb-2 pt-2">
        <span className="inline-block bg-purple-500/10 text-purple-400 font-sans text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-purple-500/15 mb-3.5">
          Monetização Segura
        </span>
        <h2 className="font-display font-black text-2xl text-white m-0 tracking-tight font-sans">Escolha seu Plano</h2>
        <p className="text-slate-400 text-xs mt-2 max-w-md mx-auto leading-relaxed">
          Controle suas revendas, acompanhe seus lucros e desbloqueie recursos avançados.
        </p>
      </div>

      {/* Responsive Grid for plans of cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* CARD 1: GRATUITO */}
        <div
          className={`bg-[#111827] border ${
            userPlan === "free"
              ? "border-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.06)]"
              : "border-purple-500/15"
          } rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-purple-500/30 transform hover:-translate-y-1 relative group`}
        >
          <div>
            {/* Icon & Name */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform duration-300">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-300"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              {userPlan === "free" && (
                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/15 text-[9px] uppercase tracking-wider font-sans font-bold px-2 py-0.5 rounded">
                  Ativo
                </span>
              )}
            </div>

            <h3 className="font-sans font-extrabold text-base text-white m-0">Gratuito</h3>
            <div className="flex items-baseline gap-1 mt-2 mb-4">
              <span className="text-xl font-display font-black text-white">R$ 0</span>
              <span className="text-slate-500 text-[10px]">/ sempre</span>
            </div>

            {/* Features list */}
            <span className="text-[10px] uppercase font-sans font-black text-slate-500 tracking-wider block mb-3">
              Recursos
            </span>
            <ul className="flex flex-col gap-2.5 p-0 m-0 mb-6 text-xs text-slate-300 font-sans leading-relaxed list-none">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Até 3 produtos cadastrados</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Até 3 vendas registradas</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Dashboard básico</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Controle simples de estoque</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Cadastro de clientes</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Controle básico de lucro</span>
              </li>

              {/* Limitations */}
              <li className="text-slate-650 flex items-start gap-2.5">
                <span className="text-purple-500/40 mt-0.5 shrink-0">✗</span>
                <span>Produtos ilimitados</span>
              </li>
              <li className="text-slate-650 flex items-start gap-2.5">
                <span className="text-purple-500/40 mt-0.5 shrink-0">✗</span>
                <span>Relatórios avançados</span>
              </li>
              <li className="text-slate-650 flex items-start gap-2.5">
                <span className="text-purple-500/40 mt-0.5 shrink-0">✗</span>
                <span>Exportação PDF</span>
              </li>
              <li className="text-slate-650 flex items-start gap-2.5">
                <span className="text-purple-500/40 mt-0.5 shrink-0">✗</span>
                <span>Exportação Excel</span>
              </li>
              <li className="text-slate-650 flex items-start gap-2.5">
                <span className="text-purple-500/40 mt-0.5 shrink-0">✗</span>
                <span>Backup automático</span>
              </li>
              <li className="text-slate-650 flex items-start gap-2.5">
                <span className="text-purple-500/40 mt-0.5 shrink-0">✗</span>
                <span>IA de análise</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => {
              triggerAudio("click", soundEnabled);
              setUserPlan("free");
              const activeNotif: TradeNotification = {
                id: `plan-${Date.now()}`,
                title: "Plano Alterado",
                message: "Você voltou para o Plano Gratuito. Limitações de 3 produtos e 3 vendas reativadas.",
                type: "info",
                timestamp: new Date().toISOString(),
                read: false,
              };
              setNotifications((prev) => [activeNotif, ...prev]);
            }}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all text-center block cursor-pointer active:scale-95 duration-200 ${
              userPlan === "free"
                ? "bg-[#0D1117] border border-purple-500/20 text-slate-400"
                : "bg-transparent border border-purple-500/20 text-purple-400 hover:bg-purple-500/10"
            }`}
          >
            {userPlan === "free" ? "Plano Atual" : "Começar Grátis"}
          </button>
        </div>

        {/* CARD 2: PLANO PRO */}
        <div
          className={`bg-[#111827] border-2 ${
            userPlan === "pro" ? "border-purple-500 shadow-[0_0_20px_rgba(139,92,246,0.15)] bg-slate-900/40" : "border-purple-500/20"
          } rounded-2xl p-6 flex flex-col justify-between transition-all duration-350 hover:border-purple-500 transform hover:-translate-y-1.5 relative group overflow-hidden`}
        >
          <div className="absolute top-0 right-0 bg-purple-600 text-white font-sans text-[8px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-bl-xl shadow-md z-10 flex items-center gap-1">
            <Sparkles size={8} className="animate-spin" />
            MAIS POPULAR
          </div>

          <div>
            {/* Icon & Name */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-400"
                >
                  <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5M14 2c4 4 2 12.5 2 12.5s-8.5 2-12.5-2c3.5-3.5 6-4 6-4s.5-2.5 4.5-6.5z"></path>
                  <path d="M12 12l9 9M16 8l5 5"></path>
                </svg>
              </div>
              {userPlan === "pro" && (
                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/15 text-[9px] uppercase tracking-wider font-sans font-bold px-2 py-0.5 rounded">
                  Ativo
                </span>
              )}
            </div>

            <h3 className="font-sans font-extrabold text-base text-white m-0">PRO</h3>
            <div className="flex items-baseline gap-1 mt-2 mb-4">
              <span className="text-xl font-display font-black text-white">R$ 9,90</span>
              <span className="text-slate-500 text-[10px]">/ mês</span>
            </div>

            {/* Features list */}
            <span className="text-[10px] uppercase font-sans font-black text-slate-500 tracking-wider block mb-3">
              Recursos
            </span>
            <ul className="flex flex-col gap-2.5 p-0 m-0 mb-6 text-xs text-slate-300 font-sans leading-relaxed list-none">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span className="font-bold text-white">Produtos ilimitados</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span className="font-bold text-white">Vendas ilimitadas</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Clientes ilimitados</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Dashboard avançado</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Metas e Desafios</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Relatórios completos</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Exportação PDF</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Exportação Excel</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Backup automático</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Notificações inteligentes</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => {
              triggerAudio("success", soundEnabled);
              setUserPlan("pro");
              const activeNotif: TradeNotification = {
                id: `plan-${Date.now()}`,
                title: "🏆 Assinatura PRO Concluída!",
                message: "Parabéns! Você acaba de desbloquear produtos ilimitados, vendas sem fronteiras e relatórios analíticos de alta conversão.",
                type: "success",
                timestamp: new Date().toISOString(),
                read: false,
              };
              setNotifications((prev) => [activeNotif, ...prev]);
            }}
            className={`w-full py-3 rounded-xl text-xs font-bold transition-all text-center block cursor-pointer shadow-lg active:scale-95 duration-200 ${
              userPlan === "pro"
                ? "bg-[#0D1117] border border-purple-500/20 text-slate-400"
                : "bg-purple-600 text-white hover:bg-purple-700 shadow-purple-500/15 font-extrabold"
            }`}
          >
            {userPlan === "pro" ? "Plano Ativo" : "Assinar PRO"}
          </button>
        </div>

        {/* CARD 3: PLANO PREMIUM */}
        <div
          className={`bg-[#111827] border ${
            userPlan === "premium"
              ? "border-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.06)]"
              : "border-purple-500/15"
          } rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-purple-500/30 transform hover:-translate-y-1 relative group`}
        >
          <div>
            {/* Icon & Name */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform duration-300">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-500"
                >
                  <path d="M6 3h12l4 6-10 13L2 9z"></path>
                  <path d="M11 3 8 9l4 13 4-13-3-6"></path>
                  <path d="M2 9h20"></path>
                </svg>
              </div>
              {userPlan === "premium" && (
                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/15 text-[9px] uppercase tracking-wider font-sans font-bold px-2 py-0.5 rounded">
                  Ativo
                </span>
              )}
            </div>

            <h3 className="font-sans font-extrabold text-base text-white m-0">Premium</h3>
            <div className="flex items-baseline gap-1 mt-2 mb-4">
              <span className="text-xl font-display font-black text-white font-sans">R$ 19,90</span>
              <span className="text-slate-500 text-[10px]">/ mês</span>
            </div>

            {/* Features list */}
            <span className="text-[10px] uppercase font-sans font-black text-slate-500 tracking-wider block mb-3">
              Recursos
            </span>
            <ul className="flex flex-col gap-2.5 p-0 m-0 mb-6 text-xs text-slate-300 font-sans leading-relaxed list-none">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span className="font-bold text-white">Tudo do PRO</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span className="text-amber-400 font-semibold">Inteligência de negócio</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Sugestão automática de preços</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Previsão de lucro mensal</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Insights estratégicos</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Estatísticas avançadas</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Produtos mais rentáveis</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Produtos de menor desempenho</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Suporte prioritário VIP</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => {
              triggerAudio("success", soundEnabled);
              setUserPlan("premium");
              const activeNotif: TradeNotification = {
                id: `plan-${Date.now()}`,
                title: "👑 Upgrade Premium Concluido!",
                message: "Bem-vindo ao topo! Você desbloqueou o painel analítico com previsão de lucros, produtos de melhor performance e insights da IA de negócios.",
                type: "success",
                timestamp: new Date().toISOString(),
                read: false,
              };
              setNotifications((prev) => [activeNotif, ...prev]);
            }}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all text-center block cursor-pointer active:scale-95 duration-200 ${
              userPlan === "premium"
                ? "bg-[#0D1117] border border-purple-500/20 text-slate-400"
                : "bg-transparent border border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
            }`}
          >
            {userPlan === "premium" ? "Plano Ativo" : "Assinar Premium"}
          </button>
        </div>

        {/* CARD 4: PLANO EMPRESARIAL */}
        <div
          className={`bg-[#111827] border ${
            userPlan === "empresarial"
              ? "border-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.06)]"
              : "border-purple-500/15"
          } rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-purple-500/30 transform hover:-translate-y-1 relative group`}
        >
          <div>
            {/* Icon & Name */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform duration-300">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-550"
                >
                  <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
                </svg>
              </div>
              {userPlan === "empresarial" && (
                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/15 text-[9px] uppercase tracking-wider font-sans font-bold px-2 py-0.5 rounded">
                  Ativo
                </span>
              )}
            </div>

            <h3 className="font-sans font-extrabold text-base text-white m-0">Empresarial</h3>
            <div className="flex items-baseline gap-1 mt-2 mb-4">
              <span className="text-xl font-display font-black text-white font-sans">R$ 39,90</span>
              <span className="text-slate-500 text-[10px]">/ mês</span>
            </div>

            {/* Features list */}
            <span className="text-[10px] uppercase font-sans font-black text-slate-500 tracking-wider block mb-3">
              Recursos
            </span>
            <ul className="flex flex-col gap-2.5 p-0 m-0 mb-6 text-xs text-slate-300 font-sans leading-relaxed list-none">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span className="font-bold text-white">Tudo do Premium</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span className="text-purple-400 font-semibold">Múltiplos usuários</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Controle de equipe</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Permissões por usuário</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Dashboard de equipe</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Gestão empresarial completa</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                <span>Controle de funcionários</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => {
              triggerAudio("success", soundEnabled);
              setUserPlan("empresarial");
              const activeNotif: TradeNotification = {
                id: `plan-${Date.now()}`,
                title: "👑 Assinatura Empresarial Ativa!",
                message: "Controle de usuários e equipe desbloqueado para o seu ecossistema RevendaX. Siga alavancando suas vendas!",
                type: "success",
                timestamp: new Date().toISOString(),
                read: false,
              };
              setNotifications((prev) => [activeNotif, ...prev]);
            }}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all text-center block cursor-pointer active:scale-95 duration-200 ${
              userPlan === "empresarial"
                ? "bg-[#0D1117] border border-purple-500/20 text-slate-400"
                : "bg-transparent border border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            }`}
          >
            {userPlan === "empresarial" ? "Plano Ativo" : "Assinar Empresarial"}
          </button>
        </div>
      </div>

      {/* CONVERSÃO SOCIAL VALUE / INDICATORS */}
      <div className="bg-[#111827] border border-purple-500/15 p-6 rounded-2xl shadow-sm mt-4">
        <h4 className="text-xs font-sans font-extrabold uppercase text-slate-400 tracking-wider mb-4 text-center">
          Por que fazer parte de nossa comunidade premium?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="flex items-start gap-3 animate-fade-in">
            <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 text-xs font-bold leading-none shrink-0 border border-purple-500/15">
              🚀
            </span>
            <div>
              <span className="text-[11px] font-bold text-white block">Alta Conversão</span>
              <span className="text-[10px] text-slate-400 leading-normal block mt-0.5">
                Mais de 1.000 revendedores utilizam a nossa plataforma diariamente.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 animate-fade-in">
            <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 text-xs font-bold leading-none shrink-0 border border-purple-500/15">
              📊
            </span>
            <div>
              <span className="text-[11px] font-bold text-white block">Controle Total</span>
              <span className="text-[10px] text-slate-400 leading-normal block mt-0.5">
                Visão unificada de faturamento, custos de frete, impostos e lucro líquido.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 animate-fade-in">
            <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 text-xs font-bold leading-none shrink-0 border border-purple-500/15">
              🔒
            </span>
            <div>
              <span className="text-[11px] font-bold text-white block">Dados Seguros</span>
              <span className="text-[10px] text-slate-400 leading-normal block mt-0.5">
                Sincronização em tempo real e cópias de segurança criptografadas na nuvem.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 animate-fade-in">
            <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 text-xs font-bold leading-none shrink-0 border border-purple-500/15">
              📈
            </span>
            <div>
              <span className="text-[11px] font-bold text-white block">Giro Escalável</span>
              <span className="text-[10px] text-slate-400 leading-normal block mt-0.5">
                Alavanque o giro estocável do seu negócio com métricas empresariais robustas.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
