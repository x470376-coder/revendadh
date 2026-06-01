import { Product, Goal } from "./types";

export const initialProducts: Product[] = [
  {
    id: "prod-1",
    name: "iPhone 15 Pro Max 256GB - Titânio Natural",
    category: "Apple/iPhones",
    valorInvestido: 4500,
    valorVenda: 6100,
    frete: 120,
    taxas: 80,
    cliente: "Guilherme Santos",
    formaPagamento: "Pix",
    status: "Vendido",
    dataEntrada: "2026-05-01",
    dataVenda: "2026-05-26",
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80",
    observacoes: "Minucioso estado de conservação, completo na caixa com NF."
  },
  {
    id: "prod-2",
    name: "Apple Watch Ultra 2 Ocean Band",
    category: "Apple/iPhones",
    valorInvestido: 3200,
    valorVenda: 4550,
    frete: 60,
    taxas: 40,
    cliente: "Mariana Alencar",
    formaPagamento: "Cartão de Crédito",
    status: "Vendido",
    dataEntrada: "2026-05-05",
    dataVenda: "2026-05-27",
    imageUrl: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&q=80",
    observacoes: "Garantia Apple até maio de 2027. Bateria 100%."
  },
  {
    id: "prod-3",
    name: "PlayStation 5 Slim 1TB + 2 Controles",
    category: "Games/Consoles",
    valorInvestido: 2300,
    valorVenda: 3500,
    frete: 90,
    taxas: 30,
    cliente: "Bruno Gagliasso",
    formaPagamento: "Pix",
    status: "Vendido",
    dataEntrada: "2026-05-10",
    dataVenda: "2026-05-22",
    imageUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&q=80",
    observacoes: "Original, caixa lacrada. Despaixado via motoboy."
  },
  {
    id: "prod-4",
    name: "MacBook Pro M3 Pro 14\" Space Black",
    category: "Apple/iPhones",
    valorInvestido: 8500,
    valorVenda: 12900,
    frete: 180,
    taxas: 120,
    cliente: "Rodrigo Melo (Advogado)",
    formaPagamento: "Pix + Crédito",
    status: "Reservado",
    dataEntrada: "2026-05-12",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80",
    observacoes: "Reservado com sinal de R$ 2.000. Entrega em mãos agendada."
  },
  {
    id: "prod-5",
    name: "BMW G 310 GS Sport Edition 2024",
    category: "Veículos",
    valorInvestido: 22000,
    valorVenda: 29900,
    frete: 450,
    taxas: 250,
    cliente: "Carlos Eduardo",
    formaPagamento: "Financiamento bancário",
    status: "Em estoque",
    dataEntrada: "2026-05-14",
    imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80",
    observacoes: "Peguei em leilão de seguradora de SP, impecável. Baixa quilometragem."
  },
  {
    id: "prod-6",
    name: "iPad Pro M4 11\" Liquid Retina 256GB Slim",
    category: "Apple/iPhones",
    valorInvestido: 5300,
    valorVenda: 7450,
    frete: 90,
    taxas: 50,
    cliente: "",
    formaPagamento: "",
    status: "Em estoque",
    dataEntrada: "2026-05-20",
    imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80",
    observacoes: "Importado dos EUA, novo lacrado na caixa oficial."
  }
];

export const initialGoals: Goal[] = [
  {
    id: "goal-1",
    title: "Ganhar R$ 5.000 este mês",
    targetAmount: 5000,
    achievedAmount: 4000, // calculated from sales profit
    deadlineMonth: "05",
    deadlineYear: "2026",
    createdAt: "2026-05-01T12:00:00Z"
  }
];
