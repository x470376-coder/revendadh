import React from "react";
import { Product } from "../types";
import { triggerAudio } from "../hooks/useGoals";

interface EstoqueProps {
  products: Product[];
  stats: {
    investidoEstoque: number;
    lucroPrevisto: number;
    estoqueCount: number;
    reservadoCount: number;
  };
  setSelectedProduct: (product: Product) => void;
  soundEnabled: boolean;
}

export const Estoque: React.FC<EstoqueProps> = ({
  products,
  stats,
  setSelectedProduct,
  soundEnabled,
}) => {
  const activeProducts = products.filter((p) => p.status !== "Vendido");

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div>
        <h2 className="font-display font-bold text-xl text-white m-0 font-sans">Estoque de Arbitragem</h2>
        <span className="text-xs text-slate-400 mt-1 block font-medium">
          Ativos comprados aguardando finalização
        </span>
      </div>

      {/* Stock Summary metrics header */}
      <div className="bg-[#111827] border border-purple-500/15 p-5 rounded-2xl grid grid-cols-2 gap-4 shadow-sm">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-sans font-bold">
            Capital Investido
          </span>
          <span className="text-lg font-sans font-extrabold text-white block mt-1">
            R$ {stats.investidoEstoque.toLocaleString("pt-BR")}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-sans font-bold">
            Retorno Esperado
          </span>
          <span className="text-lg font-sans font-extrabold text-purple-400 block mt-1">
            R$ {(stats.investidoEstoque + stats.lucroPrevisto).toLocaleString("pt-BR")}
          </span>
        </div>
        <div className="col-span-2 pt-3 mt-1 border-t border-purple-500/10 flex justify-between items-center text-xs font-sans">
          <span className="text-slate-400 font-medium">Unidades estocadas</span>
          <span className="font-sans font-bold text-slate-350">
            {stats.estoqueCount + stats.reservadoCount} produtos
          </span>
        </div>
      </div>

      {/* Stagnated items listing explicitly or alerts */}
      <div className="flex flex-col gap-3 mt-1">
        <span className="text-xs font-sans font-extrabold uppercase text-slate-400 tracking-wider">
          Produtos Ativos
        </span>

        {activeProducts.map((p) => {
          const dateObj = new Date(p.dataEntrada);
          const daysOld = Math.ceil(
            Math.abs(new Date().getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
          );
          const isStagnated = daysOld > 10;
          const totalCost = p.valorInvestido + p.frete + p.taxas;

          return (
            <div
              id={`stock-card-${p.id}`}
              key={p.id}
              onClick={() => {
                triggerAudio("click", soundEnabled);
                setSelectedProduct(p);
              }}
              className={`border rounded-2xl p-4 flex gap-3.5 cursor-pointer hover:shadow-sm transition-all ${
                isStagnated ? "border-amber-500/30 bg-amber-500/5" : "border-purple-500/15 bg-[#111827]"
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-[#0D1117] border border-purple-500/10 overflow-hidden shrink-0">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/fallback-product.png";
                  }}
                />
              </div>

              <div className="flex-1 min-w-0 font-sans">
                <div className="flex justify-between items-start">
                  <h4 className="font-sans font-bold text-xs text-white truncate pr-2 m-0 mt-0.5">{p.name}</h4>
                  <span
                    className={`text-[9.5px] shrink-0 font-sans px-2 py-0.5 rounded font-extrabold border uppercase leading-none ${
                      p.status === "Reservado"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="flex justify-between items-end mt-2.5 text-[11px]">
                  <span className="text-slate-400">
                    Custo:{" "}
                    <span className="font-sans font-semibold text-slate-350">
                      R$ {totalCost.toLocaleString("pt-BR")}
                    </span>
                  </span>
                  <span className="font-sans text-right text-slate-400 font-semibold">
                    Entrada: {daysOld} {daysOld === 1 ? "dia" : "dias"} atrás {isStagnated && "⚠️"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {activeProducts.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-500 italic border border-dashed border-purple-500/15 rounded-2xl bg-purple-500/5 font-sans font-medium">
            Parabéns! Você vendeu 100% do estoque. Registre novos flips ativos para girar mais capital.
          </div>
        )}
      </div>
    </div>
  );
};
