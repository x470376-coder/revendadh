import React from "react";
import { Tag, Clock, Wallet, User, Calendar, Edit3, Trash2, ChevronRight } from "lucide-react";
import { Product } from "../types";
import { triggerAudio } from "../utils/audioUtils";

interface ProductCardProps {
  product: Product;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onSelect: () => void;
  soundEnabled: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  onSelect,
  soundEnabled,
}) => {
  const profit = product.valorVenda - product.valorInvestido - product.frete - product.taxas;

  return (
    <div
      id={`flip-card-${product.id}`}
      onClick={() => {
        triggerAudio("click", soundEnabled);
        onSelect();
      }}
      className="bg-[#111827] border border-purple-500/15 hover:border-purple-500/25 hover:shadow-[0_0_15px_rgba(139,92,246,0.06)] transition-all p-4.5 rounded-2xl cursor-pointer relative flex flex-col shadow-sm"
    >
      {/* Upper Row: Image + Main details */}
      <div className="flex gap-4 items-start">
        {/* Product Thumbnail image rounded-2xl */}
        <div className="w-[72px] h-[72px] rounded-xl bg-[#0D1117] border border-purple-500/10 overflow-hidden shrink-0">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/fallback-product.png";
            }}
          />
        </div>

        {/* Main details next to image */}
        <div className="flex-1 min-w-0 font-sans">
          <div className="flex items-start justify-between gap-2.5">
            <h3 className="font-sans font-extrabold text-sm md:text-base text-white m-0 truncate leading-snug">
              {product.name}
            </h3>

            {/* Elegantly styled status badge on the top-right */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold font-sans tracking-wider uppercase border shrink-0 ${
                product.status === "Vendido"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : product.status === "Reservado"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-purple-500/10 text-purple-400 border-purple-500/20"
              }`}
            >
              {product.status === "Vendido" && <span className="text-[10px]">✓</span>}
              {product.status === "Reservado" && <span className="text-[10px]">⌛</span>}
              {product.status === "Em estoque" && <span className="text-[10px]">📦</span>}
              {product.status}
            </span>
          </div>

          {/* Badges container */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {/* Category */}
            <span className="inline-flex items-center gap-1 bg-[#0D1117] border border-purple-500/10 text-slate-300 py-0.5 px-2 rounded-lg text-[9px] font-sans font-semibold">
              <Tag size={10} className="text-purple-400 shrink-0" />
              {product.category}
            </span>

            {/* Days since purchase */}
            <span className="inline-flex items-center gap-1 bg-[#0D1117] border border-purple-500/10 text-slate-300 py-0.5 px-2 rounded-lg text-[9px] font-sans font-semibold">
              <Clock size={10} className="text-purple-400 shrink-0" />
              {(() => {
                const daysOld = Math.max(
                  0,
                  Math.floor(
                    (new Date().getTime() - new Date(product.dataEntrada).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                );
                return `${daysOld} ${daysOld === 1 ? "dia" : "dias"}`;
              })()}
            </span>

            {/* Payment Method */}
            {product.formaPagamento && (
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 py-0.5 px-2.5 rounded-lg text-[9px] font-sans font-bold">
                <Wallet size={10} className="text-emerald-400 shrink-0" />
                {product.formaPagamento}
              </span>
            )}

            {/* Buyer / Cliente */}
            {product.cliente && (
              <span className="inline-flex items-center gap-1 bg-purple-500/10 border border-purple-500/15 text-purple-400 py-0.5 px-2.5 rounded-lg text-[9px] font-sans font-bold">
                <User size={10} className="text-purple-400 shrink-0" />
                Para: {product.cliente}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Middle Row: Financial details grid */}
      <div className="grid grid-cols-3 gap-2 mt-4 mb-2.5 px-1 bg-transparent border-t border-purple-500/10 pt-3">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-bold block">
            Investido
          </span>
          <span className="text-xs sm:text-sm font-sans font-bold text-white mt-0.5 block whitespace-nowrap">
            R$ {product.valorInvestido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-bold block">
            Venda
          </span>
          <span className="text-xs sm:text-sm font-sans font-bold text-white mt-0.5 block whitespace-nowrap">
            R$ {product.valorVenda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-bold block">
            Frete
          </span>
          <span className="text-xs sm:text-sm font-sans font-bold text-white mt-0.5 block whitespace-nowrap">
            R$ {product.frete.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Bottom Footer Row with divider */}
      <div className="border-t border-purple-500/10 mt-3 pt-3.5 flex flex-wrap items-center justify-between gap-y-2.5 gap-x-2">
        <div className="min-w-0">
          <span className="text-[10px] text-slate-400 block font-sans font-medium uppercase tracking-wider">
            {product.status === "Vendido" ? "Lucro Realizado" : "Lucro Estimado"}
          </span>
          <span className="text-xs sm:text-sm font-sans font-black text-emerald-400 block whitespace-nowrap mt-0.5 leading-none">
            + R$ {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-350 text-xs bg-[#0D1117] py-1 px-2.5 rounded-lg border border-purple-500/10">
          <Calendar size={11} className="text-purple-400 shrink-0" />
          <span className="font-sans font-semibold text-[9px] text-slate-300 select-none whitespace-nowrap leading-none mt-0.5 uppercase">
            {new Date(product.dataVenda || product.dataEntrada).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto xs:ml-0">
          {/* Edit button */}
          <button
            id={`edit-btn-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(e);
            }}
            className="w-8 h-8 rounded-full bg-[#0D1117] border border-purple-500/10 hover:border-purple-500/25 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:bg-purple-500/5 active:scale-95 shrink-0"
            title="Editar"
          >
            <Edit3 size={11} />
          </button>

          {/* Delete button */}
          <button
            id={`delete-btn-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(e);
            }}
            className="w-8 h-8 rounded-full bg-purple-500/10 text-red-400 border border-purple-500/20 flex items-center justify-center hover:bg-purple-500/20 transition-all cursor-pointer shadow-purple-600/10 shadow-sm active:scale-95 shrink-0"
            title="Excluir"
          >
            <Trash2 size={11} />
          </button>

          {/* Details button */}
          <button
            id={`details-btn-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              triggerAudio("click", soundEnabled);
              onSelect();
            }}
            className="bg-purple-600 hover:bg-purple-700 border border-purple-500/20 text-white font-sans text-[10px] font-semibold py-1.5 px-3 rounded-full flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
          >
            Detalhes <ChevronRight size={11} className="text-slate-400 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
