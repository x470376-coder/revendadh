import React from "react";
import { Download, Printer } from "lucide-react";
import { Product } from "../types";
import { exportToCSV, exportToPrintHTML } from "../components/ExportEngine";
import { triggerAudio } from "../hooks/useGoals";

interface RelatoriosProps {
  products: Product[];
  stats: {
    lucroRealizado: number;
    lucroPrevisto: number;
    ticketMedio: number;
  };
  soundEnabled: boolean;
}

export const Relatorios: React.FC<RelatoriosProps> = ({
  products,
  stats,
  soundEnabled,
}) => {
  return (
    <div className="flex flex-col gap-5 animate-fade-in font-sans">
      <div className="flex justify-between items-center font-sans">
        <div>
          <h2 className="font-display font-bold text-xl text-white m-0">Relatórios de Lucro</h2>
          <span className="text-xs text-slate-400 mt-1 block">Dados consolidados de performance</span>
        </div>
        <div className="flex gap-2">
          <button
            id="export-csv-btn"
            onClick={() => {
              triggerAudio("click", soundEnabled);
              exportToCSV(products);
            }}
            className="p-2 border border-purple-500/10 bg-[#111827] hover:border-purple-500/25 hover:bg-[#111827] text-slate-300 hover:text-white rounded-lg text-xs cursor-pointer shadow-sm transition-all"
            title="Exportar dados para Excel (.CSV)"
          >
            <Download size={15} />
          </button>
          <button
            id="print-table-btn"
            onClick={() => {
              triggerAudio("click", soundEnabled);
              exportToPrintHTML(products);
            }}
            className="p-2 border border-purple-500/10 bg-[#111827] hover:border-purple-500/25 hover:bg-[#111827] text-slate-300 hover:text-white rounded-lg text-xs cursor-pointer shadow-sm transition-all"
            title="Imprimir relatório completo"
          >
            <Printer size={15} />
          </button>
        </div>
      </div>

      {/* Breakdown analytical list metrics */}
      <div className="bg-[#111827] border border-purple-500/15 p-5 rounded-2xl flex flex-col gap-3.5 shadow-sm">
        <span className="text-xs font-sans font-extrabold uppercase text-slate-400 tracking-wider">
          Desempenho no Período
        </span>

        <div className="flex justify-between items-center py-2 border-b border-purple-500/10">
          <span className="text-slate-400 text-xs font-medium">Lucro Líquido Realizado</span>
          <span className="font-sans font-bold text-emerald-400 font-semibold">
            R$ {stats.lucroRealizado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-purple-500/10">
          <span className="text-slate-555 text-xs font-medium">Aguardando Liquidação</span>
          <span className="font-sans font-bold text-slate-200">
            R$ {stats.lucroPrevisto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-purple-500/10">
          <span className="text-slate-405 text-xs font-medium">Ticket Médio por Venda</span>
          <span className="font-sans font-bold text-slate-200">
            R$ {stats.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between items-center py-2">
          <span className="text-slate-405 text-xs font-medium">Melhor Categoria Ativa</span>
          <span className="font-sans font-bold text-purple-400">Apple/iPhones</span>
        </div>
      </div>

      {/* Category margins simulator/estimation details */}
      <div className="bg-[#111827]/60 border border-purple-500/10 p-4.5 rounded-2xl font-sans text-slate-300">
        <span className="text-xs font-sans font-extrabold uppercase text-purple-400 tracking-wider block mb-2">
          Projeção por Círculos de Lucro
        </span>
        <p className="text-xs text-slate-350 leading-relaxed mb-0 font-sans">
          A categoria mais lucrativa registrada até o momento é <strong className="text-white">Apple/iPhones</strong>,
          apresentando ROI médio de <strong className="text-emerald-400 font-semibold">35.2%</strong> por transação efetuada. Siga
          reinvestindo faturamento no giro de eletrônicos rápidos de consumo elevado para maior faturamento líquido
          mensal.
        </p>
      </div>

      {/* Export manual info note */}
      <div className="text-[11px] text-slate-500 italic text-center font-sans">
        Relatório exportado compatível com planilhas Excel, Google Sheets, LibreOffice, Apple Numbers e formato PDF oficial
        para impressão física.
      </div>
    </div>
  );
};
