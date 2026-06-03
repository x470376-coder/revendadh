export type ProductStatus = "Em estoque" | "Vendido" | "Reservado";

export type ProductCategory = 
  | "Apple/iPhones" 
  | "Celulares/Android" 
  | "Games/Consoles" 
  | "Acessórios Premium" 
  | "Veículos" 
  | "Eletrodomésticos" 
  | "Colecionáveis/Moda"
  | "Outros";

export const CATEGORIES: ProductCategory[] = [
  "Apple/iPhones",
  "Celulares/Android",
  "Games/Consoles",
  "Acessórios Premium",
  "Veículos",
  "Eletrodomésticos",
  "Colecionáveis/Moda",
  "Outros"
];

export const CATEGORY_IMAGES: Record<ProductCategory, string> = {
  "Apple/iPhones": "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&q=80",
  "Celulares/Android": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
  "Games/Consoles": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&q=80",
  "Acessórios Premium": "https://images.unsplash.com/photo-1544117515-3c4017217f0d?w=400&q=80",
  "Veículos": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80",
  "Eletrodomésticos": "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&q=80",
  "Colecionáveis/Moda": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
  "Outros": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"
};

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
