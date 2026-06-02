import { Product } from "../types";

export interface SalesStats {
  lucroRealizado: number;
  totalVendidos: number;
  vendasCount: number;
  estoqueCount: number;
  reservadoCount: number;
  investidoEstoque: number;
  lucroPrevisto: number;
  ticketMedio: number;
  roiRealizado: number;
}

export function calcStats(productList: Product[]): SalesStats {
  let totalVendidos = 0;
  let lucroRealizado = 0;
  let totalInvestidoEstoque = 0;
  let lucroPrevistoEstoque = 0;
  let totalInvestidoVendas = 0;
  let totalContagemVendido = 0;
  let totalContagemEstoque = 0;
  let totalContagemReservado = 0;

  productList.forEach(p => {
    const profit = p.valorVenda - p.valorInvestido - p.frete - p.taxas;
    if (p.status === "Vendido") {
      totalVendidos += p.valorVenda;
      lucroRealizado += profit;
      totalInvestidoVendas += p.valorInvestido + p.frete + p.taxas;
      totalContagemVendido += 1;
    } else if (p.status === "Em estoque") {
      totalInvestidoEstoque += p.valorInvestido + p.frete + p.taxas;
      lucroPrevistoEstoque += profit;
      totalContagemEstoque += 1;
    } else if (p.status === "Reservado") {
      totalInvestidoEstoque += p.valorInvestido + p.frete + p.taxas;
      lucroPrevistoEstoque += profit;
      totalContagemReservado += 1;
    }
  });

  const ticketMedio = totalContagemVendido > 0 ? totalVendidos / totalContagemVendido : 0;
  const roiRealizado = totalInvestidoVendas > 0 ? (lucroRealizado / totalInvestidoVendas) * 100 : 0;

  return {
    lucroRealizado,
    totalVendidos,
    vendasCount: totalContagemVendido,
    estoqueCount: totalContagemEstoque,
    reservadoCount: totalContagemReservado,
    investidoEstoque: totalInvestidoEstoque,
    lucroPrevisto: lucroPrevistoEstoque,
    ticketMedio,
    roiRealizado
  };
}
