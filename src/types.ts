export type ProductStatus = "Em estoque" | "Vendido" | "Reservado";

export type ProductCategory = 
  | "Apple/iPhones" 
  | "Celulares/Android" 
  | "Eletrodomésticos" 
  | "Veículos" 
  | "Games/Consoles" 
  | "Acessórios Premium" 
  | "Colecionáveis/Moda"
  | "Outros";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  valorInvestido: number;
  valorVenda: number;
  frete: number;
  taxas: number;
  cliente: string;
  formaPagamento: string;
  status: ProductStatus;
  dataEntrada: string;
  dataVenda?: string;
  imageUrl?: string;
  observacoes?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  achievedAmount: number;
  deadlineMonth: string; // e.g. "05" (May)
  deadlineYear: string;  // e.g. "2026"
  createdAt: string;
}

export interface TradeNotification {
  id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "goal" | "info";
  timestamp: string;
  read: boolean;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}
