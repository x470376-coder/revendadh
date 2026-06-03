import React from "react";
import { Plus, Search, X, Filter } from "lucide-react";
import { Product } from "../types";
import { ProductCard } from "../components/ProductCard";
import { triggerAudio } from "../utils/audioUtils";

interface ProdutosProps {
  filteredProducts: Product[];
  setIsFormOpen: (open: boolean) => void;
  productSearch: string;
  setProductSearch: (search: string) => void;
  productCategoryFilter: string;
  setProductCategoryFilter: (cat: string) => void;
  productStatusFilter: string;
  setProductStatusFilter: (stat: string) => void;
  startEditProduct: (product: Product, e: React.MouseEvent) => void;
  handleDeleteProduct: (id: string, e: React.MouseEvent) => void;
  setSelectedProduct: (product: Product) => void;
  soundEnabled: boolean;
}

export const Produtos: React.FC<ProdutosProps> = ({
  filteredProducts,
  setIsFormOpen,
  productSearch,
  setProductSearch,
  productCategoryFilter,
  setProductCategoryFilter,
  productStatusFilter,
  setProductStatusFilter,
  startEditProduct,
  handleDeleteProduct,
  setSelectedProduct,
  soundEnabled,
}) => {
  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-white m-0">Lista de Produtos</h2>
          <span className="text-xs text-slate-400 mt-1 block font-medium">
            Gerencie seu inventário de alto valor
          </span>
        </div>
        <button
          id="add-new-flip-btn"
          onClick={() => {
            triggerAudio("click", soundEnabled);
            setIsFormOpen(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-3.5 rounded-xl font-sans font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md shadow-purple-600/10 animate-pulse animate-bounce-subtle"
        >
          <Plus size={14} /> Novo Produto
        </button>
      </div>

      {/* Search and Filters Drawer */}
      <div className="bg-[#111827] border border-purple-500/15 p-4 rounded-xl flex flex-col gap-3 shadow-sm">
        <div className="relative">
          <input
            id="product-search-bar"
            type="text"
            placeholder="Buscar por nome, cliente ou observações..."
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              triggerAudio("click", soundEnabled);
            }}
            className="w-full bg-[#0D1117] border border-purple-500/15 py-2.5 pl-9 pr-8 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 focus:bg-[#0D1117] placeholder-slate-500 transition-all font-sans"
          />
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </div>
          {productSearch && (
            <button
              onClick={() => {
                setProductSearch("");
                triggerAudio("click", soundEnabled);
              }}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="relative">
            <select
              id="product-category-filter"
              value={productCategoryFilter}
              onChange={(e) => {
                setProductCategoryFilter(e.target.value);
                triggerAudio("click", soundEnabled);
              }}
              className="w-full bg-[#0D1117] border border-purple-500/15 py-2 px-3.5 rounded-xl text-[10.5px] font-sans font-semibold text-slate-300 focus:outline-none focus:border-purple-500 focus:bg-[#0D1117] appearance-none cursor-pointer"
            >
              <option value="Todas" className="bg-[#111827] text-white">Categorias (Todas)</option>
              <option value="Apple/iPhones" className="bg-[#111827] text-white">Apple/iPhones</option>
              <option value="Celulares/Android" className="bg-[#111827] text-white">Celulares/Android</option>
              <option value="Games/Consoles" className="bg-[#111827] text-white">Games/Consoles</option>
              <option value="Acessórios Premium" className="bg-[#111827] text-white">Acessórios Premium</option>
              <option value="Veículos" className="bg-[#111827] text-white">Veículos</option>
              <option value="Eletrodomésticos" className="bg-[#111827] text-white">Eletrodomésticos</option>
              <option value="Colecionáveis/Moda" className="bg-[#111827] text-white">Colecionáveis/Moda</option>
              <option value="Outros" className="bg-[#111827] text-white">Outros</option>
            </select>
            <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-400">
              <Filter size={10} />
            </div>
          </div>

          <div className="relative">
            <select
              id="product-status-filter"
              value={productStatusFilter}
              onChange={(e) => {
                setProductStatusFilter(e.target.value);
                triggerAudio("click", soundEnabled);
              }}
              className="w-full bg-[#0D1117] border border-purple-500/15 py-2 px-3.5 rounded-xl text-[10.5px] font-sans font-semibold text-slate-300 focus:outline-none focus:border-purple-500 focus:bg-[#0D1117] appearance-none cursor-pointer"
            >
              <option value="Todos" className="bg-[#111827] text-white">
                Status (Todos)
              </option>
              <option value="Em estoque" className="bg-[#111827] text-white">
                Em estoque
              </option>
              <option value="Reservado" className="bg-[#111827] text-white">
                Reservado
              </option>
              <option value="Vendido" className="bg-[#111827] text-white">
                Vendido
              </option>
            </select>
            <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-400">
              <Filter size={10} />
            </div>
          </div>
        </div>

        {(productSearch || productCategoryFilter !== "Todas" || productStatusFilter !== "Todos") && (
          <div className="flex justify-between items-center bg-purple-500/5 border border-purple-500/15 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] text-purple-400 font-sans font-semibold">
              Encontrados: {filteredProducts.length} itens
            </span>
            <button
              onClick={() => {
                triggerAudio("click", soundEnabled);
                setProductSearch("");
                setProductCategoryFilter("Todas");
                setProductStatusFilter("Todos");
              }}
              className="text-[10px] text-purple-400 hover:text-purple-300 uppercase font-sans font-bold cursor-pointer"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Displaying listing */}
      <div className="flex flex-col gap-4 animate-fade-in">
        {filteredProducts.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onEdit={(e) => startEditProduct(p, e)}
            onDelete={(e) => handleDeleteProduct(p.id, e)}
            onSelect={() => setSelectedProduct(p)}
            soundEnabled={soundEnabled}
          />
        ))}

        {filteredProducts.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-500 italic font-sans font-medium">
            Nenhum flip de produto cadastrado no momento. Use o botão + para registrar um!
          </div>
        )}
      </div>
    </div>
  );
};
