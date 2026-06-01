import React, { useState, useEffect, useMemo } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Brain, 
  DollarSign, 
  Package, 
  Layers, 
  Target, 
  User, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  ClipboardList, 
  Bell, 
  Smartphone, 
  Laptop, 
  Database, 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX, 
  Download, 
  Printer, 
  Lock, 
  ChevronRight, 
  Clock, 
  Tag, 
  TrendingDown, 
  X, 
  ShoppingBag, 
  PieChart as PieIcon, 
  CheckCircle, 
  Calendar, 
  HelpCircle,
  Search,
  Filter,
  Camera,
  Upload,
  Wallet,
  Menu,
  Eye,
  EyeOff,
  QrCode,
  Share2,
  Rocket,
  Gem,
  Crown
} from "lucide-react";

import { db, auth, OperationType, handleFirestoreError } from "./firebase";
import { signInAnonymously, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  setDoc, 
  doc, 
  deleteDoc, 
  getDocFromServer 
} from "firebase/firestore";

import { Product, ProductCategory, ProductStatus, Goal, TradeNotification, SupabaseConfig } from "./types";
import { initialProducts, initialGoals } from "./mockData";
import { revendaxAudio } from "./components/AudioEngine";
import { exportToCSV, exportToPrintHTML } from "./components/ExportEngine";
import { BrandLogoBig, BrandLogoCompact } from "./components/BrandLogo";

// Categories available for products
const CATEGORIES: ProductCategory[] = [
  "Apple/iPhones",
  "Celulares/Android",
  "Games/Consoles",
  "Acessórios Premium",
  "Veículos",
  "Eletrodomésticos",
  "Colecionáveis/Moda",
  "Outros"
];

// Aesthetic mock image bank for category fallbacks
const CATEGORY_IMAGES: Record<ProductCategory, string> = {
  "Apple/iPhones": "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&q=80",
  "Celulares/Android": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
  "Games/Consoles": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&q=80",
  "Acessórios Premium": "https://images.unsplash.com/photo-1544117515-3c4017217f0d?w=400&q=80",
  "Veículos": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80",
  "Eletrodomésticos": "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&q=80",
  "Colecionáveis/Moda": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
  "Outros": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"
};

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as ChartTooltip, PieChart, Pie, Cell } from "recharts";

export default function App() {
  // Navigation & Shell States
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isSplashLoading, setIsSplashLoading] = useState(true);
  const [isTabChanging, setIsTabChanging] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("revendax_logged_in") === "true";
  });
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; picture: string } | null>(() => {
    const saved = localStorage.getItem("revendax_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<any>(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(() => {
    return localStorage.getItem("revendax_pwa_dismissed") !== "true";
  });
  const [activeTab, setActiveTab] = useState<"dashboard" | "produtos" | "estoque" | "relatorios" | "metas" | "perfil" | "planos">("dashboard");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Splash load timing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Soft page tab transitions loading 380ms
  const handleTabChange = (tab: "dashboard" | "produtos" | "estoque" | "relatorios" | "metas" | "perfil" | "planos") => {
    if (activeTab === tab) return;
    triggerAudio("click");
    setIsSidebarOpen(false);
    setIsTabChanging(true);
    const timer = setTimeout(() => {
      setActiveTab(tab);
      setIsTabChanging(false);
    }, 380);
  };

  // Subscription plan states
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "premium" | "empresarial">(() => {
    return (localStorage.getItem("revendax_user_plan") as "free" | "pro" | "premium" | "empresarial") || "free";
  });
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalType, setLimitModalType] = useState<"products" | "sales">("products");

  // Layout presentation states (Giro App layout style)
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [showValues, setShowValues] = useState(() => {
    return localStorage.getItem("revendax_show_values") !== "false";
  });

  // Database / Local state
  const [products, setProducts] = useState<Product[]>(() => {
    const loggedIn = localStorage.getItem("revendax_logged_in") === "true";
    if (loggedIn) return [];
    const saved = localStorage.getItem("revendax_products");
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const loggedIn = localStorage.getItem("revendax_logged_in") === "true";
    if (loggedIn) return [];
    const saved = localStorage.getItem("revendax_goals");
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<TradeNotification[]>(() => {
    const loggedIn = localStorage.getItem("revendax_logged_in") === "true";
    if (loggedIn) return [];
    return [
      {
        id: "notif-1",
        title: "Boas-vindas ao Xavier Brick!",
        message: "Cadastre seus produtos de iPhones, eletrônicos ou veículos para monitorar seus lucros.",
        type: "info",
        timestamp: new Date().toISOString(),
        read: false
      }
    ];
  });

  // Firebase Real-time Persistent Engine
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

  useEffect(() => {
    // Critical connection test as per SKILL guidelines
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    // Trace Auth changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUid(user.uid);
      } else {
        setFirebaseUid(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Track network connectivity
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync products in real-time
  useEffect(() => {
    if (!firebaseUid) return;

    const q = query(collection(db, "products"), where("ownerId", "==", firebaseUid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Product);
      });
      setProducts(list.sort((a, b) => b.dataEntrada.localeCompare(a.dataEntrada)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `products`);
    });

    return () => unsubscribe();
  }, [firebaseUid]);

  // Sync goals in real-time
  useEffect(() => {
    if (!firebaseUid) return;

    const q = query(collection(db, "goals"), where("ownerId", "==", firebaseUid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Goal[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Goal);
      });
      setGoals(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `goals`);
    });

    return () => unsubscribe();
  }, [firebaseUid]);

  // Sync notifications in real-time
  useEffect(() => {
    if (!firebaseUid) return;

    const q = query(collection(db, "notifications"), where("ownerId", "==", firebaseUid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: TradeNotification[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as TradeNotification);
      });
      setNotifications(list.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `notifications`);
    });

    return () => unsubscribe();
  }, [firebaseUid]);

  // Filters State for Dashboard ("Hoje" | "Semana" | "Mês" | "Ano" | "Personalizado")
  const [timeFilter, setTimeFilter] = useState<"Hoje" | "Semana" | "Mês" | "Ano" | "Personalizado">("Mês");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
  
  // Interactive notification center toggling state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Search & Filter States for listings ('Produtos') and inventory ('Estoque')
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("Todas");
  const [productStatusFilter, setProductStatusFilter] = useState<string>("Todos");

  // Supabase Sync settings State
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => {
    const saved = localStorage.getItem("revendax_supabase");
    return saved ? JSON.parse(saved) : { url: "", anonKey: "", isConnected: false };
  });

  // Intel/AI states
  const [aiReport, setAiReport] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedCost, setSuggestedCost] = useState({ name: "", category: "Apple/iPhones" as ProductCategory, price: 0, margin: 0, explanation: "" });
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);

  // Form states (Create / Edit Product)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<ProductCategory>("Apple/iPhones");
  const [formValorInvestido, setFormValorInvestido] = useState("");
  const [formValorVenda, setFormValorVenda] = useState("");
  const [formFrete, setFormFrete] = useState("");
  const [formTaxas, setFormTaxas] = useState("");
  const [formCliente, setFormCliente] = useState("");
  const [formFormaPagamento, setFormFormaPagamento] = useState("");
  const [formStatus, setFormStatus] = useState<ProductStatus>("Em estoque");
  const [formObservacoes, setFormObservacoes] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");

  // Goal Form State
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalTitle, setGoalTitle] = useState("");
  
  // Selected Product detail Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Custom modal state for safe deletion confirmation inside sandbox iframe
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  // Save changes to localStorage automatically
  useEffect(() => {
    localStorage.setItem("revendax_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("revendax_goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("revendax_supabase", JSON.stringify(supabaseConfig));
  }, [supabaseConfig]);

  useEffect(() => {
    localStorage.setItem("revendax_user_plan", userPlan);
  }, [userPlan]);

  // Audio system helper
  const triggerAudio = (type: "click" | "success" | "goal" | "stagnation") => {
    if (!soundEnabled) return;
    if (type === "click") revendaxAudio.playClick();
    if (type === "success") revendaxAudio.playSaleSuccess();
    if (type === "goal") revendaxAudio.playGoalReached();
    if (type === "stagnation") revendaxAudio.playStagnationAlert();
  };

  // Automated notification engine & alerts for stagnated items (more than 10 days in stock)
  useEffect(() => {
    const stagnatedAlerts = products.filter(p => {
      if (p.status !== "Em estoque") return false;
      const entryDate = new Date(p.dataEntrada);
      const diffTime = Math.abs(new Date().getTime() - entryDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 10;
    });

    if (stagnatedAlerts.length > 0) {
      const hasExist = notifications.some(n => n.type === "warning");
      if (!hasExist) {
        const newNotif: TradeNotification = {
          id: `stagnated-${Date.now()}`,
          title: "⚠️ Alerta de Estoque Parado",
          message: `Você tem ${stagnatedAlerts.length} ${stagnatedAlerts.length === 1 ? 'produto parado' : 'produtos parados'} há mais de 10 dias. Considere revisar o valor de venda ou anunciar ofertas rápidas!`,
          type: "warning",
          timestamp: new Date().toISOString(),
          read: false
        };
        if (firebaseUid) {
          setDoc(doc(db, "notifications", newNotif.id), { ...newNotif, ownerId: firebaseUid })
            .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${newNotif.id}`));
        } else {
          setNotifications(prev => [newNotif, ...prev]);
        }
        triggerAudio("stagnation");
      }
    }
  }, [products, firebaseUid]);

  // Auto-dismiss the active unread popup notification after 8 seconds of showing
  useEffect(() => {
    if (isNotificationsOpen) return;
    const activeNotif = notifications.find(n => !n.read);
    if (!activeNotif) return;

    const timer = setTimeout(() => {
      if (firebaseUid) {
        setDoc(doc(db, "notifications", activeNotif.id), { ...activeNotif, read: true, ownerId: firebaseUid })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${activeNotif.id}`));
      } else {
        setNotifications(prev => prev.map(n => n.id === activeNotif.id ? { ...n, read: true } : n));
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [notifications, firebaseUid, isNotificationsOpen]);

  // Google OAuth triggers
  const handleGoogleLogin = async () => {
    try {
      triggerAudio("click");
      // 1. Try standard Firebase Google Authentication first for cloud-native login
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const profile = {
        name: user.displayName || "Usuário RevendaX Premium",
        email: user.email || "",
        picture: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
      };
      
      setUserProfile(profile);
      setIsLoggedIn(true);
      localStorage.setItem("revendax_logged_in", "true");
      localStorage.setItem("revendax_user", JSON.stringify(profile));
      
      const welcomeNotif: TradeNotification = {
        id: `welcome-${Date.now()}`,
        title: `Olá, ${profile.name}! 👋`,
        message: `Autenticação Google realizada com sucesso. Bem-vindo de volta ao seu painel premium RevendaX.`,
        type: "success",
        timestamp: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [welcomeNotif, ...prev]);
      triggerAudio("success");
      
    } catch (firebaseErr: any) {
      console.warn("Firebase Google Auth AuthPopup not initialized or failed, falling back to simulated OAuth:", firebaseErr);
      
      // 2. Fallback to standard backend server OAuth callback / simulated login
      try {
        const response = await fetch('/api/auth/url');
        if (!response.ok) {
          throw new Error('Falha ao obter URL de autenticação');
        }
        const { url } = await response.json();
        
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const authWindow = window.open(
          url,
          'oauth_popup',
          `width=${width},height=${height},left=${left},top=${top}`
        );
        
        if (!authWindow) {
          alert('Por favor, permita popups neste site para efetuar login com o Google.');
        }
      } catch (error) {
        console.error('Google OAuth trigger failed:', error);
        alert('Erro inesperado ao iniciar autenticação Google.');
      }
    }
  };

  const handleLogout = () => {
    triggerAudio("click");
    setLoadingAction("Encerrando sessão...");
    
    setTimeout(() => {
      signOut(auth).catch(err => console.error("Sign out from Firebase failed:", err));
      setIsLoggedIn(false);
      setUserProfile(null);
      localStorage.removeItem("revendax_logged_in");
      localStorage.removeItem("revendax_user");
      // Wipes logged-in secure data and restores clean, empty states offline
      setProducts([]);
      setGoals([]);
      setNotifications([
        {
          id: "notif-1",
          title: "Boas-vindas ao Xavier Brick!",
          message: "Cadastre seus produtos de iPhones, eletrônicos ou veículos para monitorar seus lucros.",
          type: "info",
          timestamp: new Date().toISOString(),
          read: false
        }
      ]);
      setLoadingAction(null);
    }, 750);
  };

  // Google OAuth postMessage message handler
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('0.0.0.0') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const user = event.data?.user;
        if (user) {
          setUserProfile(user);
          setIsLoggedIn(true);
          localStorage.setItem("revendax_logged_in", "true");
          localStorage.setItem("revendax_user", JSON.stringify(user));

          // Clear mock/demo products immediately upon login to wait for clean user account database
          setProducts([]);
          setGoals([]);

          const welcomeNotif: TradeNotification = {
            id: `welcome-${Date.now()}`,
            title: `Olá, ${user.name}! 👋`,
            message: `Autenticação Google realizada com sucesso. Bem-vindo de volta ao seu painel premium RevendaX.`,
            type: "success",
            timestamp: new Date().toISOString(),
            read: false
          };
          setNotifications([welcomeNotif]);
          triggerAudio("success");
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);

    // Watch for PWA setup
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setPwaInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('message', handleOAuthMessage);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [soundEnabled]);

  const handlePwaInstall = async () => {
    triggerAudio("click");
    setShowInstallGuideModal(true);
    if (pwaInstallPrompt) {
      try {
        pwaInstallPrompt.prompt();
        const { outcome } = await pwaInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          setPwaInstallPrompt(null);
          setShowPwaPrompt(false);
          localStorage.setItem("revendax_pwa_dismissed", "true");
        }
      } catch (err) {
        console.warn("PWA prompt error:", err);
      }
    }
  };

  const dismissPwaPrompt = () => {
    triggerAudio("click");
    setShowPwaPrompt(false);
    localStorage.setItem("revendax_pwa_dismissed", "true");
  };

  // Filter products by search terms, category dropdown, and status dropdown inside listings
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                            (p.cliente || "").toLowerCase().includes(productSearch.toLowerCase()) ||
                            p.id.toLowerCase().includes(productSearch.toLowerCase()) ||
                            (p.observacoes || "").toLowerCase().includes(productSearch.toLowerCase());
      
      const matchesCategory = productCategoryFilter === "Todas" || p.category === productCategoryFilter;
      const matchesStatus = productStatusFilter === "Todos" || p.status === productStatusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, productSearch, productCategoryFilter, productStatusFilter]);

  // Dashboard period filter logic (dynamically evaluated based on YYYY-MM-DD input strings)
  const dashboardProducts = useMemo(() => {
    // Current UTC/Local alignment: 2026-05-27
    const today = new Date("2026-05-27");
    today.setHours(23, 59, 59, 999);

    return products.filter(p => {
      if (timeFilter === "Ano") {
        return true; // Simple presentation of active year items
      }

      const targetDateStr = p.status === "Vendido" ? (p.dataVenda || p.dataEntrada) : p.dataEntrada;
      if (!targetDateStr) return timeFilter !== "Personalizado";

      const itemDate = new Date(targetDateStr);

      if (timeFilter === "Personalizado") {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          if (itemDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) return false;
        }
        return true;
      }

      const diffMs = today.getTime() - itemDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (timeFilter === "Hoje") {
        return targetDateStr === "2026-05-27" || diffDays <= 1.1;
      }
      if (timeFilter === "Semana") {
        return diffDays <= 7.1;
      }
      if (timeFilter === "Mês") {
        return diffDays <= 30.1;
      }
      return true;
    });
  }, [products, timeFilter, customStartDate, customEndDate]);

  // Global historical statistics summary
  const stats = useMemo(() => {
    let totalVendidos = 0;
    let lucroRealizado = 0;
    let totalInvestidoEstoque = 0;
    let lucroPrevistoEstoque = 0;
    let totalInvestidoVendas = 0;
    let totalContagemVendido = 0;
    let totalContagemEstoque = 0;
    let totalContagemReservado = 0;

    products.forEach(p => {
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
  }, [products]);

  // Dashboard filtered/active statistics summary
  const dashboardStats = useMemo(() => {
    let totalVendidos = 0;
    let lucroRealizado = 0;
    let totalInvestidoEstoque = 0;
    let lucroPrevistoEstoque = 0;
    let totalInvestidoVendas = 0;
    let totalContagemVendido = 0;
    let totalContagemEstoque = 0;
    let totalContagemReservado = 0;

    dashboardProducts.forEach(p => {
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
  }, [dashboardProducts]);

  // Chart data: Distribution by category (active stock values) within dashboard period
  const categoryChartData = useMemo(() => {
    const data: Record<string, { name: string; value: number }> = {};
    dashboardProducts.forEach(p => {
      if (p.status !== "Vendido") {
        const cat = p.category;
        if (!data[cat]) {
          data[cat] = { name: cat, value: 0 };
        }
        data[cat].value += 1;
      }
    });
    return Object.values(data);
  }, [dashboardProducts]);

  // Colors for category cells
  const COLORS_CHART = ["#00FF66", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#14B8A6", "#EF4444"];

  // Line Chart Data: Profit over timeline (sold items) within dashboard period
  const profitTimelineData = useMemo(() => {
    const sortedSold = dashboardProducts
      .filter(p => p.status === "Vendido" && p.dataVenda)
      .sort((a, b) => new Date(a.dataVenda!).getTime() - new Date(b.dataVenda!).getTime());

    let runningProfit = 0;
    return sortedSold.map((p, idx) => {
      const profit = p.valorVenda - p.valorInvestido - p.frete - p.taxas;
      runningProfit += profit;
      return {
        date: p.dataVenda ? new Date(p.dataVenda).toLocaleDateString('pt-BR', {day: 'numeric', month: 'short'}) : `Item ${idx+1}`,
        lucro: runningProfit,
        profitItem: profit,
        name: p.name
      };
    });
  }, [dashboardProducts]);

  // active goals completion progress
  const activeGoal = goals[0] || null;
  const goalProgressPercent = useMemo(() => {
    if (!activeGoal) return 0;
    const currentProfit = stats.lucroRealizado;
    const pct = (currentProfit / activeGoal.targetAmount) * 100;
    return Math.min(100, Math.max(0, parseFloat(pct.toFixed(1))));
  }, [activeGoal, stats.lucroRealizado]);

  // Check goal completed notification
  useEffect(() => {
    if (activeGoal && stats.lucroRealizado >= activeGoal.targetAmount) {
      const alreadyNotified = notifications.some(n => n.type === "goal");
      if (!alreadyNotified) {
        const goalNotif: TradeNotification = {
          id: `goal-reach-${Date.now()}`,
          title: "🎉 Meta Atingida com Sucesso!",
          message: `Parabéns! Seu lucro realizado de R$ ${stats.lucroRealizado.toLocaleString('pt-BR')} ultrapassou sua meta financeira de R$ ${activeGoal.targetAmount}!`,
          type: "goal",
          timestamp: new Date().toISOString(),
          read: false
        };
        if (firebaseUid) {
          setDoc(doc(db, "notifications", goalNotif.id), { ...goalNotif, ownerId: firebaseUid })
            .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${goalNotif.id}`));
        } else {
          setNotifications(prev => [goalNotif, ...prev]);
        }
        triggerAudio("goal");
      }
    }
  }, [activeGoal, stats.lucroRealizado, firebaseUid]);

  // Call Express API for Gemini Intelligence: Analyzes active stockpile and sales performance
  const handlePortfolioAIAnalysis = async () => {
    triggerAudio("click");
    setIsAnalyzing(true);
    setAiReport("");
    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: products,
          goal: activeGoal?.targetAmount || 5000,
          currentMonthSalesCount: stats.vendasCount,
          currentMonthSalesCost: products.filter(p => p.status === "Vendido").reduce((acc, currentVal) => acc + (currentVal.valorInvestido + currentVal.frete + currentVal.taxas), 0),
          currentMonthSalesRevenue: stats.totalVendidos
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setAiReport(resData.analysis);
      } else {
        setAiReport(`### ❌ Falha na Análise\nOcorreu um erro no processador de IA: ${resData.error}`);
      }
    } catch (err: any) {
      setAiReport(`### ❌ Erro de Conexão\nNão foi possível conectar ao servidor de inteligência para gerar a análise: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Call Express API for Gemini to suggest a target price for active form
  const handleAISuggestPrice = async () => {
    triggerAudio("click");
    if (!formName) return alert("Por favor, preencha o Nome do Produto antes de solicitar sugestão de IA.");
    setIsSuggestingPrice(true);
    
    try {
      const response = await fetch("/api/gemini/suggest-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          category: formCategory,
          cost: Number(formValorInvestido) || 0,
          frete: Number(formFrete) || 0,
          taxas: Number(formTaxas) || 0
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setFormValorVenda(resData.suggestedPrice.toString());
        setSuggestedCost({
          name: formName,
          category: formCategory,
          price: resData.suggestedPrice,
          margin: resData.margin,
          explanation: resData.explanation
        });
        
        const newNotif: TradeNotification = {
          id: `ai-suggest-${Date.now()}`,
          title: "💡 Sugestão de Preço Inteligente",
          message: `IA recomendou R$ ${resData.suggestedPrice} para o item ${formName}, alegando margem líquida de ${resData.margin}%.`,
          type: "success",
          timestamp: new Date().toISOString(),
          read: false
        };
        if (firebaseUid) {
          setDoc(doc(db, "notifications", newNotif.id), { ...newNotif, ownerId: firebaseUid })
            .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${newNotif.id}`));
        } else {
          setNotifications(prev => [newNotif, ...prev]);
        }
        triggerAudio("success");
      }
    } catch (e: any) {
      console.error(e);
      alert("Não foi possível processar a recomendação de preço de venda no momento.");
    } finally {
      setIsSuggestingPrice(false);
    }
  };

  // Add / Edit Product save handler
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAudio("click");

    // Subscription limits validation
    if (userPlan === "free") {
      if (!editingProduct) {
        // Creating new product
        if (products.length >= 3) {
          setLimitModalType("products");
          setShowLimitModal(true);
          triggerAudio("stagnation");
          setIsFormOpen(false);
          return;
        }
        if (formStatus === "Vendido") {
          const soldCount = products.filter(p => p.status === "Vendido").length;
          if (soldCount >= 3) {
            setLimitModalType("sales");
            setShowLimitModal(true);
            triggerAudio("stagnation");
            setIsFormOpen(false);
            return;
          }
        }
      } else {
        // Editing existing product
        const wasSoldBefore = editingProduct.status === "Vendido";
        if (!wasSoldBefore && formStatus === "Vendido") {
          const soldCount = products.filter(p => p.status === "Vendido").length;
          if (soldCount >= 3) {
            setLimitModalType("sales");
            setShowLimitModal(true);
            triggerAudio("stagnation");
            setIsFormOpen(false);
            return;
          }
        }
      }
    }
    setIsSavingProduct(true);
    setLoadingAction(editingProduct ? "Atualizando item..." : "Criando item...");

    setTimeout(() => {
      const costVal = parseFloat(formValorInvestido) || 0;
      const saleVal = parseFloat(formValorVenda) || 0;
      const freteVal = parseFloat(formFrete) || 0;
      const taxesVal = parseFloat(formTaxas) || 0;

      const savedImg = formImageUrl.trim() || CATEGORY_IMAGES[formCategory];

      const prodData: Product = {
        id: editingProduct?.id || `prod-${Date.now()}`,
        name: formName,
        category: formCategory,
        valorInvestido: costVal,
        valorVenda: saleVal,
        frete: freteVal,
        taxas: taxesVal,
        cliente: formCliente,
        formaPagamento: formFormaPagamento,
        status: formStatus,
        dataEntrada: editingProduct?.dataEntrada || new Date().toISOString().split('T')[0],
        dataVenda: formStatus === "Vendido" ? (editingProduct?.dataVenda || new Date().toISOString().split('T')[0]) : undefined,
        imageUrl: savedImg,
        observacoes: formObservacoes
      };

      if (editingProduct) {
        // Modify
        if (firebaseUid) {
          setDoc(doc(db, "products", prodData.id), { ...prodData, ownerId: firebaseUid })
            .catch(err => handleFirestoreError(err, OperationType.WRITE, `products/${prodData.id}`));
          
          const newNotif: TradeNotification = {
            id: `edit-${Date.now()}`,
            title: "Produto Atualizado",
            message: `As especificações de "${formName}" foram modificadas com sucesso.`,
            type: "info",
            timestamp: new Date().toISOString(),
            read: false
          };
          setDoc(doc(db, "notifications", newNotif.id), { ...newNotif, ownerId: firebaseUid })
            .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${newNotif.id}`));
        } else {
          setProducts(prev => prev.map(p => p.id === editingProduct.id ? prodData : p));
          
          const newNotif: TradeNotification = {
            id: `edit-${Date.now()}`,
            title: "Produto Atualizado",
            message: `As especificações de "${formName}" foram modificadas com sucesso.`,
            type: "info",
            timestamp: new Date().toISOString(),
            read: false
          };
          setNotifications(prev => [newNotif, ...prev]);
        }
      } else {
        // Create new
        if (firebaseUid) {
          setDoc(doc(db, "products", prodData.id), { ...prodData, ownerId: firebaseUid })
            .catch(err => handleFirestoreError(err, OperationType.WRITE, `products/${prodData.id}`));
          
          const newNotif: TradeNotification = {
            id: `create-${Date.now()}`,
            title: formStatus === "Vendido" ? "🏆 Nova Venda Registrada!" : "Estoque Adicionado",
            message: formStatus === "Vendido" 
              ? `Arbitragem concluída para "${formName}". Lucro gerado imediato!` 
              : `Item "${formName}" integrado nas prateleiras virtuais.`,
            type: formStatus === "Vendido" ? "success" : "info",
            timestamp: new Date().toISOString(),
            read: false
          };
          setDoc(doc(db, "notifications", newNotif.id), { ...newNotif, ownerId: firebaseUid })
            .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${newNotif.id}`));
        } else {
          setProducts(prev => [prodData, ...prev]);
          
          const newNotif: TradeNotification = {
            id: `create-${Date.now()}`,
            title: formStatus === "Vendido" ? "🏆 Nova Venda Registrada!" : "Estoque Adicionado",
            message: formStatus === "Vendido" 
              ? `Arbitragem concluída para "${formName}". Lucro gerado imediato!` 
              : `Item "${formName}" integrado nas prateleiras virtuais.`,
            type: formStatus === "Vendido" ? "success" : "info",
            timestamp: new Date().toISOString(),
            read: false
          };
          setNotifications(prev => [newNotif, ...prev]);
        }
        
        if (formStatus === "Vendido") {
          triggerAudio("success");
        }
      }

      // Reset Form
      setIsFormOpen(false);
      setEditingProduct(null);
      clearFormFields();
      setIsSavingProduct(false);
      setLoadingAction(null);
    }, 750);
  };

  const clearFormFields = () => {
    setFormName("");
    setFormCategory("Apple/iPhones");
    setFormValorInvestido("");
    setFormValorVenda("");
    setFormFrete("");
    setFormTaxas("");
    setFormCliente("");
    setFormFormaPagamento("");
    setFormStatus("Em estoque");
    setFormObservacoes("");
    setFormImageUrl("");
    setSuggestedCost({ name: "", category: "Apple/iPhones", price: 0, margin: 0, explanation: "" });
  };

  // Open Edit Product Modal
  const startEditProduct = (prod: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerAudio("click");
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormValorInvestido(prod.valorInvestido.toString());
    setFormValorVenda(prod.valorVenda.toString());
    setFormFrete(prod.frete.toString());
    setFormTaxas(prod.taxas.toString());
    setFormCliente(prod.cliente || "");
    setFormFormaPagamento(prod.formaPagamento || "");
    setFormStatus(prod.status);
    setFormObservacoes(prod.observacoes || "");
    setFormImageUrl(prod.imageUrl || "");
    setIsFormOpen(true);
  };

  // Delete product action
  const handleDeleteProduct = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProductToDelete(id);
  };

  // Live compression of photo uploaded from cell phone / file selector
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    triggerAudio("click");
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new globalThis.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
          setFormImageUrl(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Create / Update Goal Event
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAudio("click");
    const amountNum = parseFloat(goalTargetAmount) || 0;
    if (amountNum <= 0) return alert("Por favor, digite um valor de meta maior que zero.");

    const titleText = goalTitle.trim() || `Ganhar R$ ${amountNum.toLocaleString('pt-BR')} este mês`;

    if (editingGoal) {
      const updatedGoal: Goal = {
        ...editingGoal,
        title: titleText,
        targetAmount: amountNum,
        achievedAmount: stats.lucroRealizado,
      };

      if (firebaseUid) {
        setDoc(doc(db, "goals", updatedGoal.id), { ...updatedGoal, ownerId: firebaseUid })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `goals/${updatedGoal.id}`));

        const newNotif: TradeNotification = {
          id: `goal-updated-${Date.now()}`,
          title: "🎯 Meta Atualizada",
          message: `Sua meta "${titleText}" foi atualizada para R$ ${amountNum.toLocaleString('pt-BR')}.`,
          type: "info",
          timestamp: new Date().toISOString(),
          read: false
        };
        setDoc(doc(db, "notifications", newNotif.id), { ...newNotif, ownerId: firebaseUid })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${newNotif.id}`));
      } else {
        setGoals(prev => prev.map(g => g.id === editingGoal.id ? updatedGoal : g));

        const newNotif: TradeNotification = {
          id: `goal-updated-${Date.now()}`,
          title: "🎯 Meta Atualizada",
          message: `Sua meta "${titleText}" foi atualizada para R$ ${amountNum.toLocaleString('pt-BR')}.`,
          type: "info",
          timestamp: new Date().toISOString(),
          read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
      }
    } else {
      const newGoal: Goal = {
        id: `goal-${Date.now()}`,
        title: titleText,
        targetAmount: amountNum,
        achievedAmount: stats.lucroRealizado,
        deadlineMonth: "05",
        deadlineYear: "2026",
        createdAt: new Date().toISOString()
      };

      if (firebaseUid) {
        setDoc(doc(db, "goals", newGoal.id), { ...newGoal, ownerId: firebaseUid })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `goals/${newGoal.id}`));

        const newNotif: TradeNotification = {
          id: `goal-created-${Date.now()}`,
          title: "🎯 Meta Criada",
          message: `Sua nova meta de faturamento é "${titleText}" de R$ ${amountNum.toLocaleString('pt-BR')}. Rumo ao topo!`,
          type: "info",
          timestamp: new Date().toISOString(),
          read: false
        };
        setDoc(doc(db, "notifications", newNotif.id), { ...newNotif, ownerId: firebaseUid })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${newNotif.id}`));
      } else {
        setGoals(prev => [newGoal, ...prev]);

        const newNotif: TradeNotification = {
          id: `goal-created-${Date.now()}`,
          title: "🎯 Meta Criada",
          message: `Sua nova meta de faturamento é "${titleText}" de R$ ${amountNum.toLocaleString('pt-BR')}. Rumo ao topo!`,
          type: "info",
          timestamp: new Date().toISOString(),
          read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
      }
    }

    setIsGoalFormOpen(false);
    setGoalTargetAmount("");
    setGoalTitle("");
    setEditingGoal(null);
    triggerAudio("goal");
  };

  // Delete Goal Event
  const handleDeleteGoal = (goalId: string) => {
    triggerAudio("click");
    setGoalToDelete(goalId);
  };

  // Confirm Delete Goal Event
  const handleConfirmDeleteGoal = (goalId: string) => {
    if (firebaseUid) {
      deleteDoc(doc(db, "goals", goalId))
        .catch(err => handleFirestoreError(err, OperationType.DELETE, `goals/${goalId}`));

      const deleteNotif: TradeNotification = {
        id: `goal-deleted-${Date.now()}`,
        title: "🗑️ Meta Apagada",
        message: "Uma meta financeira foi removida do seu painel.",
        type: "warning",
        timestamp: new Date().toISOString(),
        read: false
      };
      setDoc(doc(db, "notifications", deleteNotif.id), { ...deleteNotif, ownerId: firebaseUid })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${deleteNotif.id}`));
    } else {
      setGoals(prev => prev.filter(g => g.id !== goalId));

      const deleteNotif: TradeNotification = {
        id: `goal-deleted-${Date.now()}`,
        title: "🗑️ Meta Apagada",
        message: "Uma meta financeira foi removida do seu painel.",
        type: "warning",
        timestamp: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [deleteNotif, ...prev]);
    }
    setGoalToDelete(null);
    triggerAudio("click");
  };

  // Edit Goal Trigger Click
  const handleEditGoalClick = (goal: Goal) => {
    triggerAudio("click");
    setEditingGoal(goal);
    setGoalTitle(goal.title);
    setGoalTargetAmount(goal.targetAmount.toString());
    setIsGoalFormOpen(true);
  };

  // Clear notifications
  const clearAllNotifications = () => {
    triggerAudio("click");
    if (firebaseUid) {
      notifications.forEach(n => {
        deleteDoc(doc(db, "notifications", n.id))
          .catch(err => handleFirestoreError(err, OperationType.DELETE, `notifications/${n.id}`));
      });
    } else {
      setNotifications([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090D] text-slate-100 flex flex-col justify-start items-center p-0 sm:p-4 md:p-8 transition-all duration-300 relative overflow-x-hidden">
      
      {/* Splash Loading PWA Screen */}
      <AnimatePresence>
        {isSplashLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="fixed inset-0 bg-[#07090D] z-[9999] flex flex-col items-center justify-center select-none"
          >
            {/* Cinematic background glow orb */}
            <div className="absolute inset-x-0 top-1/4 h-[350px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-subtle"></div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center justify-center text-center p-6 relative z-10"
            >
              {/* Premium Brand Logo (matches login screen) */}
              <BrandLogoBig className="mb-8" />

              {/* Seamless high-fidelity glowing progress bar */}
              <div className="w-56 h-[4px] bg-slate-950 border border-purple-500/15 rounded-full overflow-hidden relative shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                <div className="absolute top-0 bottom-0 h-full bg-gradient-to-r from-purple-600 via-purple-400 to-purple-500 rounded-full animate-loadingBar" />
              </div>

              {/* Loading subtext with breath state indicator */}
              <motion.span
                initial={{ opacity: 1 }}
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="text-[9.5px] font-sans font-bold uppercase tracking-[0.2em] text-purple-400 mt-4 filter drop-shadow-[0_0_4px_rgba(139,92,246,0.2)]"
              >
                Iniciando Painel...
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Change Loader Bar & Veil */}
      <AnimatePresence>
        {isTabChanging && (
          <>
            {/* Safe click shield - prevents double tap sync issues */}
            <div className="fixed inset-0 bg-transparent z-[9997] cursor-wait" />
            
            {/* Top Linear Progress bar */}
            <motion.div 
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed top-0 inset-x-0 h-[4px] bg-[#07090D] z-[9998] origin-top pointer-events-none"
            >
              <div className="h-full bg-gradient-to-r from-purple-700 via-purple-500 to-purple-600 animate-loadingBar w-full" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global Action Loader Modal Popup */}
      <AnimatePresence>
        {loadingAction && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-[#07090D]/55 backdrop-blur-[1px] z-[9990] flex items-center justify-center p-4 cursor-default select-none"
          >
            <motion.div
              initial={{ scale: 0.94, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 15 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              className="bg-[#111827] border border-purple-500/15 p-5 rounded-2xl flex items-center gap-4 shadow-[0_10px_35px_rgba(0,0,0,0.6)] w-full max-w-[280px]"
            >
              <div className="relative shrink-0">
                <div className="absolute -inset-1.5 bg-purple-500/15 rounded-full blur animate-pulse"></div>
                <div className="relative w-10 h-10 bg-[#07090D] border border-purple-500/20 rounded-full flex items-center justify-center">
                  <svg className="animate-spin h-4.5 w-4.5 text-purple-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-15" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
              <div className="text-left truncate min-w-0 flex-1">
                <h4 className="text-white text-[11px] font-sans font-bold uppercase tracking-wider mb-0.5">Sincronizando</h4>
                <p className="text-slate-400 text-[10.5px] font-sans font-normal m-0 truncate" title={loadingAction}>{loadingAction}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Soft gradient accent in the background */}
      <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none z-0"></div>

      {/* Main Container Wrapper */}
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center relative z-10 h-full">
        
        {/* DOUBLE VIEWPORT: SIMULATOR LAYOUT VS FULLSCREEN PORTAL */}
        {!isLoggedIn ? (
          /* TELA 1 - LOGIN PREMIUM COM GOOGLE */
          <div className="w-full min-h-[85vh] flex flex-col justify-center items-center px-4 relative">
            <div className="w-full max-w-md bg-[#111827]/80 backdrop-blur-xl border border-purple-500/20 shadow-[0_0_40px_rgba(139, 92, 246,0.15)] rounded-3xl p-10 flex flex-col justify-center items-center relative overflow-hidden animate-fade-in glow-purple">
              
              {/* Abstract decorative elements for SaaS layout */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col items-center justify-center mb-8 relative z-10">
                <BrandLogoBig />
              </div>

              <p className="text-center text-slate-300 text-xs md:text-sm font-sans mb-8 leading-relaxed max-w-xs relative z-10">
                Boas-vindas ao RevendaX. Monitore seus lucros, ordens e estoque com controle total em um só lugar.
              </p>

              {/* Offline Warning for Login */}
              {!isOnline && (
                <div className="w-full mb-5 bg-amber-500/15 border border-amber-500/20 text-amber-500 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-semibold relative z-10 animate-fade-in font-sans">
                  <WifiOff size={16} className="shrink-0 animate-pulse text-amber-400" />
                  <span>Você está desconectado. Conecte-se à internet para realizar login com o Google.</span>
                </div>
              )}

              {/* Continuing with Google Sign-in action */}
              <button
                id="login-google-btn"
                onClick={handleGoogleLogin}
                disabled={!isOnline}
                className="w-full py-4 px-6 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(139, 92, 246,0.3)] rounded-2xl transition-all duration-300 flex items-center justify-center gap-3.5 cursor-pointer font-sans font-bold text-sm transform hover:-translate-y-0.5 enabled:active:scale-95 group relative z-10"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Continuar com Google</span>
              </button>

              <div className="mt-8 text-center text-[10px] text-slate-500 font-sans tracking-widest uppercase relative z-10">
                Acesso Autenticado de Alta Segurança
              </div>
            </div>
          </div>
        ) : (
          /* WORKSPACE WRAPPER - RESPONSIVE SAAS LAYOUT */
          <div className="w-full bg-[#0D1117] border-x-0 border-y sm:border border-purple-500/10 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-start items-stretch min-h-screen sm:min-h-[800px] animate-fade-in relative">
            
            {/* Main Inside Canvas Screen */}
            <div className="flex flex-col text-sm bg-[#07090D] text-slate-100 transition-all p-0 flex-1 min-h-[calc(100vh-60px)] sm:min-h-[780px]">
              
              {/* Simulated Header and Active notifications bubble */}
              <div className="px-5 pt-[calc(14px+env(safe-area-inset-top,0px))] pb-3.5 flex justify-between items-center border-b border-purple-500/10 bg-[#111827] shadow-sm z-20 select-none">
                {/* Hamburger menu trigger */}
                <button 
                  id="sidebar-toggle-btn"
                  onClick={() => { triggerAudio("click"); setIsSidebarOpen(true); }}
                  className="p-2 bg-[#0D1117] hover:bg-[#1a2333] border border-purple-500/10 hover:border-purple-500/20 text-slate-350 hover:text-white rounded-xl transition-all cursor-pointer active:scale-95"
                  title="Menu Lateral"
                >
                  <Menu size={18} />
                </button>

                <BrandLogoCompact size="sm" />

                {/* Right quick actions row */}
                <div className="flex items-center gap-2">
                  {/* QR Code / Sim Scanner trigger */}
                  <button
                    onClick={() => { triggerAudio("click"); setIsQrModalOpen(true); }}
                    className="p-2 bg-[#0D1117] hover:bg-[#1a2333] border border-purple-500/10 text-slate-330 hover:text-white rounded-xl transition-all cursor-pointer active:scale-95"
                    title="Dispositivo Seguro QR"
                  >
                    <QrCode size={16} />
                  </button>

                  {/* Settings quick shortcut */}
                  <button
                    onClick={() => { triggerAudio("click"); setActiveTab("perfil"); }}
                    className={`p-2 border rounded-xl transition-all cursor-pointer active:scale-95 ${activeTab === 'perfil' ? 'bg-purple-500/15 border-purple-500/30 text-purple-650' : 'bg-[#0D1117] border-purple-500/10 text-slate-330 hover:bg-[#1a2333] hover:text-white'}`}
                    title="Configurações"
                  >
                    <Settings size={16} />
                  </button>

                  {/* Bell Notifications */}
                  <button 
                    id="header-notifications-bell"
                    onClick={() => {
                      triggerAudio("click");
                      setIsNotificationsOpen(!isNotificationsOpen);
                    }} 
                    className={`p-2 hover:bg-[#1a2333] active:scale-[0.97] transition-all cursor-pointer relative rounded-xl border ${isNotificationsOpen ? 'bg-[#1a2333] text-purple-400 border-purple-500/30' : 'bg-[#0D1117] text-slate-330 border-purple-500/10'}`}
                    title="Notificações"
                  >
                    <Bell size={16} />
                    {notifications.filter(n=>!n.read).length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-600 border border-[#07090D] animate-ping"></span>
                    )}
                  </button>
                </div>
              </div>

              {/* Connection Status Banner */}
              {!isOnline && (
                <div className="bg-amber-500/10 border-b border-amber-500/15 px-6 py-2.5 flex items-center gap-2 justify-between animate-fade-in text-amber-500 select-none">
                  <div className="flex items-center gap-2.5">
                    <WifiOff size={14} className="animate-pulse text-amber-500" />
                    <span className="font-sans text-xs font-semibold">Sem conexão com a internet — operando em modo offline seguro (Cache do Firestore ativo)</span>
                  </div>
                  <span className="text-[10px] font-mono tracking-wider font-extrabold bg-amber-500/20 px-2 py-0.5 rounded-md uppercase text-amber-400">offline local</span>
                </div>
              )}

              {/* INTERACTIVE ALERTS DRAWER CENTER (Visible when bell is toggled open) */}
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5 z-55 select-none font-sans"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-[#111827] border border-purple-500/15 rounded-3xl p-5 w-full max-w-[310px] relative shadow-2xl flex flex-col"
                      initial={{ scale: 0.93 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.93 }}
                      transition={{ type: "spring", damping: 25 }}
                    >
                      <button
                        onClick={() => { triggerAudio("click"); setIsNotificationsOpen(false); }}
                        className="absolute top-3.5 right-3.5 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-all animate-fade-in"
                        title="Fechar Alertas"
                      >
                        <X size={14} />
                      </button>

                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-500/10 pr-6">
                        <span className="font-display font-black text-xs uppercase tracking-wider text-white">Alertas / Notificações</span>
                        <div className="flex gap-2">
                          <button 
                            id="mark-all-read-btn"
                            onClick={() => {
                              triggerAudio("click");
                              if (firebaseUid) {
                                notifications.forEach(n => {
                                  if (!n.read) {
                                    setDoc(doc(db, "notifications", n.id), { ...n, read: true, ownerId: firebaseUid })
                                      .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${n.id}`));
                                  }
                                });
                              } else {
                                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                              }
                            }}
                            className="text-[9px] text-purple-400 uppercase font-extrabold tracking-wider hover:underline cursor-pointer"
                          >
                            Lidos
                          </button>
                          <span className="text-slate-600 text-[9px]">•</span>
                          <button 
                            id="clear-all-notifs-btn"
                            onClick={() => {
                              triggerAudio("click");
                              if (firebaseUid) {
                                notifications.forEach(n => {
                                  deleteDoc(doc(db, "notifications", n.id))
                                    .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${n.id}`));
                                });
                              } else {
                                setNotifications([]);
                              }
                            }}
                            className="text-[9px] text-purple-400 uppercase font-extrabold tracking-wider hover:underline cursor-pointer"
                          >
                            Limpar
                          </button>
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-2 select-none pr-1">
                        {notifications.length === 0 ? (
                          <p className="text-[11px] text-slate-405 italic text-center py-6 block w-full m-0 leading-normal">Sem alertas registrados no momento.</p>
                        ) : (
                          notifications.map(notif => (
                            <div 
                              key={notif.id}
                              onClick={() => {
                                triggerAudio("click");
                                if (firebaseUid) {
                                  setDoc(doc(db, "notifications", notif.id), { ...notif, read: true, ownerId: firebaseUid })
                                    .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${notif.id}`));
                                } else {
                                  setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                                }
                              }}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                                notif.read ? 'bg-[#0D1117] border-purple-500/5 opacity-55' : 'bg-[#0D1117] border-purple-500/15 hover:border-purple-500/30'
                              }`}
                            >
                              <div className="flex items-start gap-2 justify-between">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    notif.type === 'success' || notif.type === 'goal' ? 'bg-purple-600' :
                                    notif.type === 'warning' ? 'bg-amber-500' : 'bg-red-400'
                                  }`} />
                                  <span className="font-sans font-bold text-[11px] text-slate-100 leading-tight block truncate pr-1">{notif.title}</span>
                                </div>
                                <span className="text-[9px] font-mono text-slate-500 shrink-0 select-none">
                                  {new Date(notif.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-normal mt-1 m-0 text-left">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>

                      <button
                        onClick={() => { triggerAudio("click"); setIsNotificationsOpen(false); }}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-sans text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer mt-4 shadow-md shadow-purple-600/15"
                      >
                        Fechar Alertas
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* PWA INSTALLATION BANNER */}
              {showPwaPrompt && (
                <div className="mx-6 mt-3 p-4 bg-[#111827] border border-purple-500/25 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in shadow-[0_0_15px_rgba(139, 92, 246,0.05)] select-none">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20 shrink-0">
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-white text-xs uppercase tracking-wider">Instalar RevendaX no Aparelho?</h4>
                      <p className="text-[11.5px] text-slate-300 mt-1 leading-relaxed">
                        Desfrute de carregamento instantâneo offline, layout otimizado para celular em tela cheia e notificações rápidas de inteligência de arbitragem.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={handlePwaInstall}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-sans text-xs font-bold rounded-lg cursor-pointer transition-all active:scale-95 shadow-md shadow-purple-600/20"
                    >
                      Instalar Aplicativo
                    </button>
                    <button
                      onClick={dismissPwaPrompt}
                      className="px-2.5 py-1.5 bg-[#0D1117] hover:bg-slate-850 border border-slate-700 text-slate-300 font-sans text-xs font-semibold rounded-lg cursor-pointer transition-all"
                    >
                      Agora Não
                    </button>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS DROPDOWN HUD (Floating absolute unread alert if master center is closed) */}
              {!isNotificationsOpen && notifications.some(n => !n.read) && (
                <div className="absolute top-[68px] left-[24px] right-[24px] z-45 select-none animate-slide-up">
                  {(() => {
                    const activeNotif = notifications.find(n => !n.read);
                    if (!activeNotif) return null;
                    return (
                      <div className="bg-[#111827]/98 backdrop-blur-md border border-purple-500/20 rounded-2xl p-3.5 flex gap-3.5 items-start justify-between relative shadow-2xl">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              activeNotif.type === 'goal' ? 'bg-purple-600' :
                              activeNotif.type === 'warning' ? 'bg-amber-500' : 'bg-red-400'
                            }`}></span>
                            <span className="font-display font-black text-[10px] uppercase tracking-wider text-white">{activeNotif.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-normal m-0 text-left">{activeNotif.message}</p>
                        </div>
                        <button 
                          onClick={() => {
                            triggerAudio("click");
                            if (firebaseUid) {
                              setDoc(doc(db, "notifications", activeNotif.id), { ...activeNotif, read: true, ownerId: firebaseUid })
                                .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${activeNotif.id}`));
                            } else {
                              setNotifications(prev => prev.map(n => n.id === activeNotif.id ? { ...n, read: true } : n));
                            }
                          }}
                          className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer shrink-0"
                          title="Ignorar"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* CORE TAB NAVIGATION CONTAINER */}
              {/* ---------------------------------------------------- */}
              <div className="flex-1 px-5 py-3 relative">
                  
                  {/* TELA 2: DASHBOARD TAB */}
                  {activeTab === "dashboard" && (
                    <div className="flex flex-col gap-6 animate-fade-in font-sans">
                      
                      {/* Brand Title and Subtitle Header */}
                      <div className="text-center md:pb-2 pt-1">
                        <span className="inline-block bg-purple-500/10 text-purple-400 font-sans text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-purple-500/15 mb-3">
                          Visão Geral Financeira
                        </span>
                        <h2 className="font-display font-black text-2xl text-white m-0 tracking-tight">RevendaX Dashboard</h2>
                        <p className="text-slate-400 text-xs mt-1.5 max-w-md mx-auto leading-relaxed">
                          Controle total das suas vendas em um só lugar
                        </p>
                      </div>
                      
                      {/* Period Filter Switcher Bar (Image 2 style) */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2.5 select-none animate-fade-in">
                          <div className="flex bg-[#0D1117] border border-purple-500/10 rounded-2xl p-1 gap-1 flex-1 overflow-x-auto">
                            {(["Hoje", "Semana", "Mês", "Ano"] as const).map(f => (
                              <button
                                id={`time-filter-${f}`}
                                key={f}
                                onClick={() => { setTimeFilter(f); triggerAudio("click"); }}
                                className={`text-[11px] px-3.5 py-2 rounded-xl font-sans font-bold transition-all cursor-pointer flex-1 text-center whitespace-nowrap ${timeFilter === f ? 'bg-purple-600 text-white font-extrabold shadow-[0_0_12px_rgba(139, 92, 246,0.3)]' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                          <button 
                            onClick={() => { 
                              triggerAudio("click");
                              setIsCustomDateModalOpen(true);
                            }}
                            className={`p-3 rounded-2xl cursor-pointer active:scale-95 transition-all ${timeFilter === "Personalizado" ? 'bg-purple-600 text-white border border-purple-500/15 shadow-[0_0_12px_rgba(139, 92, 246,0.30)]' : 'bg-slate-900 border border-purple-500/10 hover:border-purple-500/20 text-slate-400 hover:text-white'}`}
                            title="Intervalo Personalizado"
                          >
                            <Calendar size={16} />
                          </button>
                        </div>

                        {/* Custom filter summary strip */}
                        {timeFilter === "Personalizado" && (customStartDate || customEndDate) && (
                          <div className="flex items-center justify-between bg-purple-500/5 border border-purple-500/10 rounded-2xl px-4 py-2 text-[10.5px] text-slate-300 select-none animate-fade-in">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                              <span className="font-medium">Período ativo: <span className="font-bold text-purple-400">{customStartDate ? customStartDate.split('-').reverse().join('/') : "Início"}</span> a <span className="font-bold text-purple-400">{customEndDate ? customEndDate.split('-').reverse().join('/') : "Fim"}</span></span>
                            </div>
                            <button 
                              onClick={() => {
                                triggerAudio("click");
                                setCustomStartDate("");
                                setCustomEndDate("");
                                setTimeFilter("Mês");
                              }}
                              className="text-purple-450 hover:text-purple-400 font-extrabold uppercase text-[9px] hover:underline cursor-pointer"
                            >
                              Limpar
                            </button>
                          </div>
                        )}
                      </div>

                      {/* MAIN STATS SECTION (Perfect replica of image) */}
                      <div className="flex flex-col gap-4">
                        
                        {/* CARD 1: LUCRO BRUTO REALIZADO */}
                        <div className="bg-[#111827]/90 border border-purple-500/10 p-5 rounded-3xl flex flex-col relative justify-between overflow-hidden shadow-md select-none">
                          {/* Upper line: Title, Helper info trigger, and Eye toggler */}
                          <div className="flex items-center justify-between w-full text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest">Lucro Bruto Realizado</span>
                              <button 
                                onClick={() => {
                                  triggerAudio("click");
                                  alert("Este card consolida o faturamento descontando custos (valor investido, frete e taxas) para vendas concluídas no período de " + timeFilter + ".");
                                }}
                                className="hover:text-white transition-all text-slate-500 cursor-help"
                              >
                                <HelpCircle size={13} />
                              </button>
                            </div>
                            
                            <button 
                              onClick={() => {
                                triggerAudio("click");
                                setShowValues(prev => {
                                  const next = !prev;
                                  localStorage.setItem("revendax_show_values", String(next));
                                  return next;
                                });
                              }}
                              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-850 cursor-pointer active:scale-95 transition-all"
                              title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
                            >
                              {showValues ? <Eye size={17} /> : <EyeOff size={17} />}
                            </button>
                          </div>

                          {/* Big Numeric Value display */}
                          <div className="my-4">
                            <span className="block text-3xl font-display font-black tracking-tight text-white">
                              R$ {showValues ? dashboardStats.lucroRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••"}
                            </span>
                          </div>

                          {/* Footer details row */}
                          <div className="flex items-end justify-between border-t border-purple-500/5 pt-3 w-full">
                            <div>
                              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 block">Vendas no Período</span>
                              <span className="text-sm font-display font-bold text-white mt-0.5 block">
                                {showValues ? `${dashboardStats.vendasCount} itens` : "•• itens"}
                              </span>
                            </div>

                            {/* ROI pill button */}
                            {(() => {
                              const roiVal = dashboardStats.roiRealizado;
                              const isPositive = roiVal > 0;
                              const isNegative = roiVal < 0;
                              const bgClass = isPositive ? "bg-emerald-500/10 hover:bg-emerald-500/20" : isNegative ? "bg-red-500/10 hover:bg-red-500/20" : "bg-slate-500/10 hover:bg-slate-500/20";
                              const textClass = isPositive ? "text-emerald-400" : isNegative ? "text-red-400" : "text-slate-400";
                              const iconClass = isPositive ? "text-emerald-500" : isNegative ? "text-red-500" : "text-slate-500";
                              const borderClass = isPositive ? "border-emerald-500/20" : isNegative ? "border-red-500/20" : "border-slate-500/20";

                              return (
                                <div className={`flex items-center gap-1.5 ${bgClass} px-3 py-1.5 rounded-2xl border ${borderClass} transition-all select-none cursor-pointer`}>
                                  <TrendingUp size={11.5} className={`${iconClass} ${isPositive ? 'animate-pulse' : ''}`} />
                                  <span className={`text-[10.5px] ${textClass} font-sans font-extrabold uppercase tracking-wide`}>
                                    ROI {roiVal > 0 ? "+" : ""}{roiVal.toFixed(2)}%
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* SPLIT BENTO GRID (Row of twin dashboard cards) */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-4 select-none">
                          
                          {/* Col 1: Total Vendido */}
                          <div className="bg-[#111827]/80 border border-purple-500/10 p-5 rounded-3xl flex flex-col justify-between shadow-sm">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-sans font-extrabold block">Total Vendido</span>
                              <span className="block text-lg font-display font-extrabold text-white mt-2 pb-1">
                                R$ {showValues ? dashboardStats.totalVendidos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••"}
                              </span>
                            </div>
                            <span className="text-[9.5px] text-slate-500 font-sans font-medium mt-1">Somas brutas acumuladas</span>
                          </div>

                          {/* Col 2: Lucro Previsto */}
                          <div className="bg-[#111827]/80 border border-purple-500/10 p-5 rounded-3xl flex flex-col justify-between shadow-sm">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-sans font-extrabold block">Lucro Previsto</span>
                              <span className="block text-lg font-display font-extrabold text-purple-400 mt-2 pb-1">
                                R$ {showValues ? dashboardStats.lucroPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••"}
                              </span>
                            </div>
                            <span className="text-[9.5px] text-purple-400/80 font-sans font-extrabold tracking-wide uppercase mt-1">Lucro em estoque</span>
                          </div>

                        </div>

                        {/* CUBE LINE WIDGET (Ativos bar) */}
                        <div 
                          onClick={() => { triggerAudio("click"); setActiveTab("estoque"); }}
                          className="bg-[#111827]/80 hover:bg-slate-900 border border-purple-500/10 hover:border-purple-500/20 p-4 rounded-2xl flex justify-between items-center shadow-sm select-none cursor-pointer transition-all active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
                              <Package size={14} />
                            </div>
                            <span className="font-sans font-bold text-xs text-white uppercase tracking-wider">Ativos em Estoque</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <span className="text-white font-display font-black text-xs">{dashboardStats.estoqueCount}</span>
                            <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Itens</span>
                            <ChevronRight size={14} className="text-slate-500 ml-1" />
                          </div>
                        </div>

                      </div>

                      {/* FINANCIAL COGNITIVE ADVISOR CARD (Xavier Brick's intelligent assistant) */}
                      <div className="bg-purple-500/5 border border-purple-500/15 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3.5">
                          <div className="flex items-center gap-2">
                            <Brain size={16} className="text-purple-400" />
                            <span className="font-sans font-bold text-xs uppercase text-slate-200 tracking-wider">Insights de Mercado (AI)</span>
                          </div>
                          <button 
                            id="run-ai-analysis-btn"
                            onClick={handlePortfolioAIAnalysis} 
                            disabled={isAnalyzing}
                            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-[10.5px] uppercase tracking-wider font-sans font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-md shadow-purple-600/10 active:scale-95"
                          >
                            {isAnalyzing ? "Calculando..." : "Ver Análise"}
                          </button>
                        </div>

                        {aiReport ? (
                          <div className="p-3.5 bg-[#0D1117] rounded-xl text-[12px] leading-relaxed text-slate-350 font-sans border border-purple-500/10 shadow-sm max-h-48 overflow-y-auto whitespace-pre-wrap">
                            {/* Simple text interpretation */}
                            {aiReport}
                          </div>
                        ) : (
                          <div className="text-[12px] text-slate-400 leading-relaxed m-0 font-sans">
                            "Se continuar nesse ritmo você pode lucrar R$ {(dashboardStats.lucroRealizado * 1.45).toFixed(0)} este período." Clique no botão acima para rodar o motor analítico do Gemini e gerar as margens recomendadas por categoria e alertas de giro!
                          </div>
                        )}
                      </div>

                      {/* ACTIVE CHART: lucro ao longo do tempo */}
                      <div className="bg-[#111827] border border-purple-500/15 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                        <span className="text-xs font-sans font-extrabold uppercase text-slate-300 tracking-wider block mb-4">Lucro ao longo do tempo</span>
                        <div className="h-44 w-full">
                          {profitTimelineData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-xs text-slate-550 italic font-sans">
                              Realize de fato sua primeira venda para plotar a curva de faturamento do mês.
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={profitTimelineData}>
                                <XAxis dataKey="date" stroke="#475569" fontSize={9} tickLine={false} />
                                <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                                <ChartTooltip 
                                  contentStyle={{ background: "#111827", border: "1px solid rgba(139, 92, 246, 0.2)", borderRadius: "8px", fontSize: "11px", color: "#FFFFFF" }}
                                  labelStyle={{ color: "#A855F7", fontWeight: "bold" }}
                                />
                                <Line type="monotone" dataKey="lucro" stroke="#A855F7" strokeWidth={2.5} dot={{ fill: "#A855F7", r: 3 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>

                      {/* DISTRIBUTION CHART */}
                      <div className="bg-[#111827] border border-purple-500/15 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                        <span className="text-xs font-sans font-extrabold uppercase text-slate-300 tracking-wider block mb-4">Distribuição ativa de estoque</span>
                        <div className="h-36 w-full flex items-center justify-between gap-3">
                          <div className="w-[110px] h-full relative">
                            {categoryChartData.length === 0 ? (
                              <div className="h-full flex items-center justify-center text-xs text-slate-500 italic font-sans font-medium">Sem itens</div>
                            ) : (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={2}>
                                    {categoryChartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS_CHART[index % COLORS_CHART.length]} />
                                    ))}
                                  </Pie>
                                </PieChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                          
                          {/* Legends lists */}
                          <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-32 text-[10px] text-slate-400 font-sans font-medium">
                            {categoryChartData.map((entry, index) => (
                              <div key={entry.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="w-1.5 h-1.5 rounded-full inline-block shrink-0" style={{ backgroundColor: COLORS_CHART[index % COLORS_CHART.length] }}></span>
                                  <span className="truncate text-slate-300">{entry.name}</span>
                                </div>
                                <span className="font-mono text-white font-bold ml-1">{entry.value}</span>
                              </div>
                            ))}
                            {categoryChartData.length === 0 && (
                              <span className="text-xs text-slate-500 italic font-sans font-normal">Cadastre mais para visualizar.</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* THREE STATUS PRODUCT DIRECT CARDS */}
                      <div className="flex flex-col gap-3 animate-fade-in">
                        <span className="text-xs font-sans font-extrabold uppercase text-slate-400 tracking-wider">Monitoramento Rápido</span>
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-3.5 text-center text-xs">
                          <div className="p-3.5 bg-[#111827] border border-purple-500/15 rounded-xl shadow-sm">
                            <span className="text-purple-400 font-display font-bold text-lg block">{stats.vendasCount}</span>
                            <span className="text-[10px] text-slate-400 font-sans font-bold uppercase transition-all">Vendidos</span>
                          </div>
                          <div className="p-3.5 bg-[#111827] border border-purple-500/15 rounded-xl shadow-sm">
                            <span className="text-slate-200 font-display font-bold text-lg block">{stats.estoqueCount}</span>
                            <span className="text-[10px] text-slate-400 font-sans font-bold uppercase transition-all">Em estoque</span>
                          </div>
                          <div className="p-3.5 bg-[#111827] border border-purple-500/15 rounded-xl shadow-sm">
                            <span className="text-amber-500 font-display font-bold text-lg block">{stats.reservadoCount}</span>
                            <span className="text-[10px] text-slate-400 font-sans font-bold uppercase transition-all">Reservados</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TELA 4: PRODUCTS LIST TAB */}
                  {activeTab === "produtos" && (
                    <div className="flex flex-col gap-5 animate-fade-in">
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-display font-bold text-xl text-white m-0">Lista de Produtos</h2>
                          <span className="text-xs text-slate-450 mt-1 block font-medium">Gerencie seu inventário de alto valor</span>
                        </div>
                        <button 
                          id="add-new-flip-btn"
                          onClick={() => { triggerAudio("click"); setIsFormOpen(true); }}
                          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-3.5 rounded-xl font-sans font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md shadow-purple-600/10 animate-pulse"
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
                            onChange={(e) => { setProductSearch(e.target.value); triggerAudio("click"); }}
                            className="w-full bg-[#0D1117] border border-purple-500/15 py-2.5 pl-9 pr-8 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 focus:bg-[#0D1117] placeholder-slate-500 transition-all font-sans"
                          />
                          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-450">
                            <Search size={14} />
                          </div>
                          {productSearch && (
                            <button 
                              onClick={() => { setProductSearch(""); triggerAudio("click"); }}
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
                              onChange={(e) => { setProductCategoryFilter(e.target.value); triggerAudio("click"); }}
                              className="w-full bg-[#0D1117] border border-purple-500/15 py-2 px-3.5 rounded-xl text-[10.5px] font-sans font-semibold text-slate-300 focus:outline-none focus:border-purple-500 focus:bg-[#0D1117] appearance-none cursor-pointer"
                            >
                              <option value="Todas" className="bg-[#111827] text-white">Categorias (Todas)</option>
                              <option value="Apple/iPhones" className="bg-[#111827] text-white">Apple/iPhones</option>
                              <option value="iPad/Apple Watch" className="bg-[#111827] text-white">iPad/Apple Watch</option>
                              <option value="Xiaomi/Redmi" className="bg-[#111827] text-white">Xiaomi/Redmi</option>
                              <option value="Xiaomi/POCO" className="bg-[#111827] text-white">Xiaomi/POCO</option>
                              <option value="Smartphones Outros" className="bg-[#111827] text-white">Smartphones Outros</option>
                              <option value="Eletrônicos/Consoles" className="bg-[#111827] text-white">Eletrônicos/Consoles</option>
                              <option value="Veículos/Motos/Carros" className="bg-[#111827] text-white">Veículos/Motos/Carros</option>
                              <option value="Importados Relógios" className="bg-[#111827] text-white">Importados Relógios</option>
                            </select>
                            <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-450">
                              <Filter size={10} />
                            </div>
                          </div>

                          <div className="relative">
                            <select
                              id="product-status-filter"
                              value={productStatusFilter}
                              onChange={(e) => { setProductStatusFilter(e.target.value); triggerAudio("click"); }}
                              className="w-full bg-[#0D1117] border border-purple-500/15 py-2 px-3.5 rounded-xl text-[10.5px] font-sans font-semibold text-slate-300 focus:outline-none focus:border-purple-500 focus:bg-[#0D1117] appearance-none cursor-pointer"
                            >
                              <option value="Todos" className="bg-[#111827] text-white">Status (Todos)</option>
                              <option value="Em estoque" className="bg-[#111827] text-white">Em estoque</option>
                              <option value="Reservado" className="bg-[#111827] text-white">Reservado</option>
                              <option value="Vendido" className="bg-[#111827] text-white">Vendido</option>
                            </select>
                            <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-450">
                              <Filter size={10} />
                            </div>
                          </div>
                        </div>

                        {(productSearch || productCategoryFilter !== "Todas" || productStatusFilter !== "Todos") && (
                          <div className="flex justify-between items-center bg-purple-500/5 border border-purple-500/15 px-3 py-1.5 rounded-xl">
                            <span className="text-[10px] text-purple-400 font-sans font-semibold">Encontrados: {filteredProducts.length} itens</span>
                            <button 
                              onClick={() => {
                                triggerAudio("click");
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
                        {filteredProducts.map(p => {
                          const profit = p.valorVenda - p.valorInvestido - p.frete - p.taxas;
                          const totalCost = p.valorInvestido + p.frete + p.taxas;

                          return (
                            <div 
                              id={`flip-card-${p.id}`}
                              key={p.id} 
                              onClick={() => { triggerAudio("click"); setSelectedProduct(p); }}
                              className="bg-[#111827] border border-purple-500/15 hover:border-purple-500/25 hover:shadow-[0_0_15px_rgba(139, 92, 246,0.06)] transition-all p-4.5 rounded-2xl cursor-pointer relative flex flex-col shadow-sm"
                            >
                              {/* Upper Row: Image + Main details */}
                              <div className="flex gap-4 items-start">
                                {/* Product Thumbnail image rounded-2xl */}
                                <div className="w-[72px] h-[72px] rounded-xl bg-[#0D1117] border border-purple-500/10 overflow-hidden shrink-0">
                                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                </div>

                                {/* Main details next to image */}
                                <div className="flex-1 min-w-0 font-sans">
                                  <div className="flex items-start justify-between gap-2.5">
                                    <h3 className="font-sans font-extrabold text-sm md:text-base text-white m-0 truncate leading-snug">
                                      {p.name}
                                    </h3>
                                    
                                    {/* Elegantly styled status badge on the top-right */}
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold font-sans tracking-wider uppercase border shrink-0 ${
                                      p.status === 'Vendido' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                      p.status === 'Reservado' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                                      'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                    }`}>
                                      {p.status === 'Vendido' && <span className="text-[10px]">✓</span>}
                                      {p.status === 'Reservado' && <span className="text-[10px]">⌛</span>}
                                      {p.status === 'Em estoque' && <span className="text-[10px]">📦</span>}
                                      {p.status}
                                    </span>
                                  </div>

                                  {/* Badges container */}
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {/* Category */}
                                    <span className="inline-flex items-center gap-1 bg-[#0D1117] border border-purple-500/10 text-slate-300 py-0.5 px-2 rounded-lg text-[9px] font-sans font-semibold">
                                      <Tag size={10} className="text-purple-400 shrink-0" />
                                      {p.category}
                                    </span>

                                    {/* Days since purchase */}
                                    <span className="inline-flex items-center gap-1 bg-[#0D1117] border border-purple-500/10 text-slate-300 py-0.5 px-2 rounded-lg text-[9px] font-sans font-semibold">
                                      <Clock size={10} className="text-purple-400 shrink-0" />
                                      {(() => {
                                        const daysOld = Math.max(0, Math.floor((new Date().getTime() - new Date(p.dataEntrada).getTime()) / (1000 * 60 * 60 * 24)));
                                        return `${daysOld} ${daysOld === 1 ? 'dia' : 'dias'}`;
                                      })()}
                                    </span>

                                    {/* Payment Method */}
                                    {p.formaPagamento && (
                                      <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/15 text-emerald-450 py-0.5 px-2.5 rounded-lg text-[9px] font-sans font-bold">
                                        <Wallet size={10} className="text-emerald-400 shrink-0" />
                                        {p.formaPagamento}
                                      </span>
                                    )}

                                    {/* Buyer / Cliente */}
                                    {p.cliente && (
                                      <span className="inline-flex items-center gap-1 bg-purple-500/10 border border-purple-500/15 text-purple-400 py-0.5 px-2.5 rounded-lg text-[9px] font-sans font-bold">
                                        <User size={10} className="text-purple-400 shrink-0" />
                                        Para: {p.cliente}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Middle Row: Financial details grid with beautiful sans-serif display of modern currency digits */}
                              <div className="grid grid-cols-3 gap-2 mt-4 mb-2.5 px-1 bg-transparent border-t border-purple-500/10 pt-3">
                                <div>
                                  <span className="text-[10px] text-slate-450 uppercase tracking-wider font-sans font-bold block">Investido</span>
                                  <span className="text-xs sm:text-sm font-sans font-bold text-white mt-0.5 block whitespace-nowrap">
                                    R$ {p.valorInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-455 uppercase tracking-wider font-sans font-bold block">Venda</span>
                                  <span className="text-xs sm:text-sm font-sans font-bold text-white mt-0.5 block whitespace-nowrap">
                                    R$ {p.valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-450 uppercase tracking-wider font-sans font-bold block">Frete</span>
                                  <span className="text-xs sm:text-sm font-sans font-bold text-white mt-0.5 block whitespace-nowrap">
                                    R$ {p.frete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>

                              {/* Bottom Footer Row with divider - optimized layout matching the screenshot spacing beautifully */}
                              <div className="border-t border-purple-500/10 mt-3 pt-3.5 flex flex-wrap items-center justify-between gap-y-2.5 gap-x-2">
                                <div className="min-w-0">
                                  <span className="text-[10px] text-slate-450 block font-sans font-medium uppercase tracking-wider">
                                    {p.status === 'Vendido' ? 'Lucro Realizado' : 'Lucro Estimado'}
                                  </span>
                                  <span className="text-xs sm:text-sm font-sans font-black text-emerald-450 block whitespace-nowrap mt-0.5 leading-none">
                                    + R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-1.5 text-slate-350 text-xs bg-[#0D1117] py-1 px-2.5 rounded-lg border border-purple-500/10">
                                  <Calendar size={11} className="text-purple-400 shrink-0" />
                                  <span className="font-sans font-semibold text-[9px] text-slate-300 select-none whitespace-nowrap leading-none mt-0.5 uppercase">
                                    {new Date(p.dataVenda || p.dataEntrada).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 ml-auto xs:ml-0">
                                  {/* Edit button with responsive sizing */}
                                  <button
                                    id={`edit-btn-${p.id}`}
                                    onClick={(e) => { e.stopPropagation(); startEditProduct(p, e); }}
                                    className="w-8 h-8 rounded-full bg-[#0D1117] border border-purple-500/10 hover:border-purple-500/25 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:bg-purple-500/5 active:scale-95 shrink-0"
                                    title="Editar"
                                  >
                                    <Edit3 size={11} />
                                  </button>

                                  {/* Delete button (beautiful red bin exact copy of reference design) */}
                                  <button
                                    id={`delete-btn-${p.id}`}
                                    onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id, e); }}
                                    className="w-8 h-8 rounded-full bg-purple-500/10 text-red-400 border border-purple-500/20 flex items-center justify-center hover:bg-purple-500/20 transition-all cursor-pointer shadow-purple-600/10 shadow-sm active:scale-95 shrink-0"
                                    title="Excluir"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                  
                                  {/* Detalhes button rounded-full */}
                                  <button
                                    id={`details-btn-${p.id}`}
                                    onClick={(e) => { e.stopPropagation(); triggerAudio("click"); setSelectedProduct(p); }}
                                    className="bg-purple-600 hover:bg-purple-700 border border-purple-500/20 text-white font-sans text-[10px] font-semibold py-1.5 px-3 rounded-full flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                                  >
                                    Detalhes <ChevronRight size={11} className="text-slate-400 shrink-0" />
                                  </button>
                                </div>
                              </div>

                            </div>
                          );
                        })}

                        {filteredProducts.length === 0 && (
                          <div className="py-12 text-center text-xs text-slate-500 italic font-sans font-medium">
                            Nenhum flip de produto cadastrado no momento. Use o botão + para registrar um!
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* TELA 6: ESTOQUE TAB */}
                  {activeTab === "estoque" && (
                    <div className="flex flex-col gap-5 animate-fade-in">
                      <div>
                        <h2 className="font-display font-bold text-xl text-white m-0 font-sans">Estoque de Arbitragem</h2>
                        <span className="text-xs text-slate-450 mt-1 block font-medium">Ativos comprados aguardando finalização</span>
                      </div>

                      {/* Stock Summary metrics header */}
                      <div className="bg-[#111827] border border-purple-500/15 p-5 rounded-2xl grid grid-cols-2 gap-4 shadow-sm">
                        <div>
                          <span className="text-[10px] text-slate-450 uppercase tracking-widest block font-sans font-bold">Capital Investido</span>
                          <span className="text-lg font-sans font-extrabold text-white block mt-1">R$ {stats.investidoEstoque.toLocaleString('pt-BR')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-450 uppercase tracking-widest block font-sans font-bold">Retorno Esperado</span>
                          <span className="text-lg font-sans font-extrabold text-purple-400 block mt-1">R$ {(stats.investidoEstoque + stats.lucroPrevisto).toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="col-span-2 pt-3 mt-1 border-t border-purple-500/10 flex justify-between items-center text-xs font-sans">
                          <span className="text-slate-400 font-medium">Unidades estocadas</span>
                          <span className="font-sans font-bold text-slate-350">{stats.estoqueCount + stats.reservadoCount} produtos</span>
                        </div>
                      </div>

                      {/* Stagnated items listing explicitly or alerts */}
                      <div className="flex flex-col gap-3 mt-1">
                        <span className="text-xs font-sans font-extrabold uppercase text-slate-400 tracking-wider">Produtos Ativos</span>

                        {products.filter(p => p.status !== "Vendido").map(p => {
                          const profit = p.valorVenda - p.valorInvestido - p.frete - p.taxas;
                          const totalCost = p.valorInvestido + p.frete + p.taxas;
                          const dateObj = new Date(p.dataEntrada);
                          const daysOld = Math.ceil(Math.abs(new Date().getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
                          const isStagnated = daysOld > 10;

                          return (
                            <div 
                              id={`stock-card-${p.id}`}
                              key={p.id}
                              onClick={() => { triggerAudio("click"); setSelectedProduct(p); }}
                              className={`border rounded-2xl p-4 flex gap-3.5 cursor-pointer hover:shadow-sm transition-all ${
                                isStagnated ? 'border-amber-500/30 bg-amber-500/5' : 'border-purple-500/15 bg-[#111827]'
                              }`}
                            >
                              <div className="w-12 h-12 rounded-lg bg-[#0D1117] border border-purple-500/10 overflow-hidden shrink-0">
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              </div>
                              
                              <div className="flex-1 min-w-0 font-sans">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-sans font-bold text-xs text-white truncate pr-2 m-0 mt-0.5">{p.name}</h4>
                                  <span className={`text-[9.5px] shrink-0 font-sans px-2 py-0.5 rounded font-extrabold border uppercase leading-none ${
                                    p.status === 'Reservado' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                  }`}>
                                    {p.status}
                                  </span>
                                </div>

                                <div className="flex justify-between items-end mt-2.5 text-[11px]">
                                  <span className="text-slate-450">
                                    Custo: <span className="font-sans font-semibold text-slate-350">R$ {totalCost.toLocaleString('pt-BR')}</span>
                                  </span>
                                  <span className="font-sans text-right text-slate-450 font-medium font-semibold">
                                    Entrada: {daysOld} {daysOld === 1 ? 'dia' : 'dias'} atrás {isStagnated && "⚠️"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {products.filter(p => p.status !== "Vendido").length === 0 && (
                          <div className="py-12 text-center text-xs text-slate-500 italic border border-dashed border-purple-500/15 rounded-2xl bg-purple-500/5 font-sans font-medium">
                            Parabéns! Você vendeu 100% do estoque. Registre novos flips ativos para girar mais capital.
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* TELA 7: REPORTS TAB */}
                  {activeTab === "relatorios" && (
                    <div className="flex flex-col gap-5 animate-fade-in font-sans">
                      <div className="flex justify-between items-center font-sans">
                        <div>
                          <h2 className="font-display font-bold text-xl text-white m-0">Relatórios de Lucro</h2>
                          <span className="text-xs text-slate-450 mt-1 block">Dados consolidados de performance</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            id="export-csv-btn"
                            onClick={() => { triggerAudio("click"); exportToCSV(products); }}
                            className="p-2 border border-purple-500/10 bg-[#111827] hover:border-purple-500/25 hover:bg-[#111827] text-slate-300 hover:text-white rounded-lg text-xs cursor-pointer shadow-sm transition-all"
                            title="Exportar dados para Excel (.CSV)"
                          >
                            <Download size={15} />
                          </button>
                          <button 
                            id="print-table-btn"
                            onClick={() => { triggerAudio("click"); exportToPrintHTML(products); }}
                            className="p-2 border border-purple-500/10 bg-[#111827] hover:border-purple-500/25 hover:bg-[#111827] text-slate-300 hover:text-white rounded-lg text-xs cursor-pointer shadow-sm transition-all"
                            title="Imprimir relatório completo"
                          >
                            <Printer size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Breakdown analytical list metrics */}
                      <div className="bg-[#111827] border border-purple-500/15 p-5 rounded-2xl flex flex-col gap-3.5 shadow-sm">
                        <span className="text-xs font-sans font-extrabold uppercase text-slate-400 tracking-wider">Desempenho no Período</span>
                        
                        <div className="flex justify-between items-center py-2 border-b border-purple-500/10">
                          <span className="text-slate-450 text-xs font-medium">Lucro Líquido Realizado</span>
                          <span className="font-sans font-bold text-emerald-400">R$ {stats.lucroRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-purple-500/10">
                          <span className="text-slate-455 text-xs font-medium">Aguardando Liquidação</span>
                          <span className="font-sans font-bold text-slate-205">R$ {stats.lucroPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-purple-500/10">
                          <span className="text-slate-450 text-xs font-medium">Ticket Médio por Venda</span>
                          <span className="font-sans font-bold text-slate-205">R$ {stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex justify-between items-center py-2">
                          <span className="text-slate-450 text-xs font-medium">Melhor Categoria Ativa</span>
                          <span className="font-sans font-bold text-purple-400">Apple/iPhones</span>
                        </div>
                      </div>

                      {/* Category margins simulator/estimation details */}
                      <div className="bg-[#111827]/60 border border-purple-500/10 p-4.5 rounded-2xl font-sans text-slate-300">
                        <span className="text-xs font-sans font-extrabold uppercase text-purple-400 tracking-wider block mb-2">Projeção por Círculos de Lucro</span>
                        <p className="text-xs text-slate-350 leading-relaxed mb-0 font-sans">
                          A categoria mais lucrativa registrada até o momento é <strong className="text-white">Apple/iPhones</strong>, apresentando ROI médio de <strong className="text-emerald-400">35.2%</strong> por transação efetuada. Siga reinvestindo faturamento no giro de eletrônicos rápidos de consumo elevado para maior faturamento líquido mensal.
                        </p>
                      </div>

                      {/* Export manual info note */}
                      <div className="text-[11px] text-slate-500 italic text-center font-sans">
                        Relatório exportado compatível com planilhas Excel, Google Sheets, LibreOffice, Apple Numbers e formato PDF oficial para impressão física.
                      </div>
                    </div>
                  )}

                  {/* TELA 8: METAS TAB */}
                  {activeTab === "metas" && (
                    <div className="flex flex-col gap-5 animate-fade-in font-sans">
                      <div className="flex justify-between items-center font-sans">
                        <div>
                          <h2 className="font-display font-bold text-xl text-white m-0">Metas Financeiras</h2>
                          <span className="text-xs text-slate-450 mt-1 block">Insira e acompanhe seus objetivos</span>
                        </div>
                        <button 
                          id="adjust-goal-btn"
                          onClick={() => { triggerAudio("click"); setEditingGoal(null); setGoalTitle(""); setGoalTargetAmount(""); setIsGoalFormOpen(true); }}
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
                                className="p-1 px-[10px] bg-purple-500/15 hover:bg-purple-500/35 text-purple-400 rounded-lg cursor-pointer transition-all border border-purple-500/10 flex items-center justify-center"
                                title="Editar Meta"
                              >
                                <Edit3 size={13} className="shrink-0" />
                              </button>
                              <button 
                                onClick={() => handleDeleteGoal(activeGoal.id)}
                                className="p-1 px-[10px] bg-purple-500/15 hover:bg-purple-500/35 text-red-400 hover:text-white rounded-lg cursor-pointer transition-all border border-purple-500/10 flex items-center justify-center"
                                title="Apagar Meta"
                              >
                                <Trash2 size={13} className="shrink-0" />
                              </button>
                              <Target className="text-purple-500 filter drop-shadow-[0_0_4px_rgba(139, 92, 246,0.3)] ml-1" size={24} />
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
                                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 shadow-[0_0_8px_rgba(139, 92, 246,0.35)] rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: `${goalProgressPercent}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              ></motion.div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-purple-500/10 text-xs font-sans">
                            <div>
                              <span className="text-slate-450 block uppercase text-[10px] font-bold">Alcançado</span>
                              <span className="font-sans font-extrabold text-white text-sm">R$ {stats.lucroRealizado.toLocaleString('pt-BR')}</span>
                            </div>
                            <div>
                              <span className="text-slate-455 block uppercase text-[10px] font-bold">Restante</span>
                              <span className="font-sans font-extrabold text-purple-400 text-sm">
                                R$ {Math.max(0, activeGoal.targetAmount - stats.lucroRealizado).toLocaleString('pt-BR')}
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
                          <span className="text-xs font-sans font-extrabold uppercase text-slate-400 tracking-wider">Outros Objetivos & Metas</span>
                          <div className="grid grid-cols-1 gap-2 mx-0.5">
                            {goals.slice(1).map((goal) => {
                              const progressPct = Math.min(100, Math.round((stats.lucroRealizado / goal.targetAmount) * 100));
                              return (
                                <div key={goal.id} className="p-3 bg-[#0D1117] border border-purple-500/5 hover:border-purple-500/15 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-all">
                                  <div className="min-w-0 flex-1 w-full">
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                      <span className="font-sans font-bold text-white truncate text-xs">{goal.title}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${progressPct >= 100 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-purple-500/10 text-purple-400 border border-purple-500/10'}`}>
                                        {progressPct >= 100 ? "Concluída" : `${progressPct}%`}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-slate-400 font-sans">
                                      <span>Meta: R$ {goal.targetAmount.toLocaleString('pt-BR')}</span>
                                      <span className="w-1 h-1 rounded-full bg-slate-700 hidden sm:inline"></span>
                                      <span>Restante: R$ {Math.max(0, goal.targetAmount - stats.lucroRealizado).toLocaleString('pt-BR')}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-slate-800 sm:border-t-0">
                                    <button 
                                      onClick={() => handleEditGoalClick(goal)}
                                      className="p-1 px-[12px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-650 rounded-lg cursor-pointer transition-all border border-purple-500/10 font-bold text-[10.5px] flex items-center gap-1"
                                    >
                                      <Edit3 size={11} /> Editar
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteGoal(goal.id)}
                                      className="p-1 px-[12px] bg-purple-500/10 hover:bg-purple-500/20 text-red-500 hover:text-white rounded-lg cursor-pointer transition-all border border-purple-500/10 font-bold text-[10.5px] flex items-center gap-1"
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
                        <span className="text-xs font-sans font-extrabold uppercase text-slate-400 tracking-wider block mb-2">Monitoramento de Desempenho</span>
                        <div className="text-xs text-slate-300 leading-relaxed font-sans">
                          {stats.lucroRealizado >= 5000 ? (
                            <span className="text-emerald-400 font-bold">Excelente! Você já superou a barreira de faturamento alto estabelecida! Continue girando estoque.</span>
                          ) : (
                            <span>Com seu estoque ativo e faturamento estimado aguardando venda com lucro potencial de <strong className="text-white">R$ {stats.lucroPrevisto.toLocaleString('pt-BR')}</strong>, ao vender seus produtos você conseguirá alcançar faturamentos robustos de <strong className="text-purple-400">{((stats.lucroRealizado + stats.lucroPrevisto) / (activeGoal?.targetAmount || 5000) * 105).toFixed(0)}%</strong> de seu objetivo atual imediatamente.</span>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TELA 9: USER PROFILE / CONFIG PANEL */}
                  {activeTab === "planos" && (
                    <div className="flex flex-col gap-6 animate-fade-in font-sans">
                      
                      {/* Header Title section */}
                      <div className="text-center md:pb-2 pt-2">
                        <span className="inline-block bg-purple-500/10 text-purple-400 font-sans text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-purple-500/15 mb-3.5">
                          Monetização Segura
                        </span>
                        <h2 className="font-display font-black text-2xl text-white m-0 tracking-tight">Escolha seu Plano</h2>
                        <p className="text-slate-400 text-xs mt-2 max-w-md mx-auto leading-relaxed">
                          Controle suas revendas, acompanhe seus lucros e desbloqueie recursos avançados.
                        </p>
                      </div>

                      {/* Responsive Grid for plans of cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        
                        {/* CARD 1: GRATUITO */}
                        <div className={`bg-[#111827] border ${userPlan === 'free' ? 'border-purple-500 shadow-[0_0_15px_rgba(139, 92, 246,0.06)]' : 'border-purple-500/15'} rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-purple-500/30 transform hover:-translate-y-1 relative group`}>
                          <div>
                            {/* Icon & Name */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform duration-300">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                </svg>
                              </div>
                              {userPlan === 'free' && (
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
                            <span className="text-[10px] uppercase font-sans font-black text-slate-500 tracking-wider block mb-3">Recursos</span>
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
                              <li className="text-slate-600 flex items-start gap-2.5">
                                <span className="text-purple-500/40 mt-0.5 shrink-0">✗</span>
                                <span>Produtos ilimitados</span>
                              </li>
                              <li className="text-slate-600 flex items-start gap-2.5">
                                <span className="text-purple-500/40 mt-0.5 shrink-0">✗</span>
                                <span>Relatórios avançados</span>
                              </li>
                              <li className="text-slate-600 flex items-start gap-2.5">
                                <span className="text-purple-500/40 mt-0.5 shrink-0">✗</span>
                                <span>Exportação PDF</span>
                              </li>
                              <li className="text-slate-600 flex items-start gap-2.5">
                                <span className="text-purple-500/40 mt-0.5 shrink-0">✗</span>
                                <span>Exportação Excel</span>
                              </li>
                              <li className="text-slate-600 flex items-start gap-2.5">
                                <span className="text-purple-500/40 mt-0.5 shrink-0">✗</span>
                                <span>Backup automático</span>
                              </li>
                              <li className="text-slate-600 flex items-start gap-2.5">
                                <span className="text-purple-500/40 mt-0.5 shrink-0">✗</span>
                                <span>IA de análise</span>
                              </li>
                            </ul>
                          </div>

                          <button 
                            onClick={() => {
                              triggerAudio("click");
                              setUserPlan("free");
                              const activeNotif: TradeNotification = {
                                id: `plan-${Date.now()}`,
                                title: "Plano Alterado",
                                message: "Você voltou para o Plano Gratuito. Limitações de 3 produtos e 3 vendas reativadas.",
                                type: "info",
                                timestamp: new Date().toISOString(),
                                read: false
                              };
                              setNotifications(prev => [activeNotif, ...prev]);
                            }}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all text-center block cursor-pointer active:scale-95 duration-200 ${userPlan === 'free' ? 'bg-[#0D1117] border border-purple-500/20 text-slate-400' : 'bg-transparent border border-purple-500/20 text-purple-400 hover:bg-purple-500/10'}`}
                          >
                            {userPlan === 'free' ? "Plano Atual" : "Começar Grátis"}
                          </button>
                        </div>

                        {/* CARD 2: PLANO PRO */}
                        <div className={`bg-[#111827] border-2 ${userPlan === 'pro' ? 'border-purple-500 shadow-[0_0_20px_rgba(139, 92, 246,0.15)] bg-slate-900/40' : 'border-purple-500'} rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-purple-500 transform hover:-translate-y-1.5 relative group overflow-hidden`}>
                          
                          <div className="absolute top-0 right-0 bg-purple-600 text-white font-sans text-[8px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-bl-xl shadow-md z-10 flex items-center gap-1">
                            <Sparkles size={8} className="animate-spin" />
                            MAIS POPULAR
                          </div>

                          <div>
                            {/* Icon & Name */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_10px_rgba(139, 92, 246,0.2)]">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                                  <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5M14 2c4 4 2 12.5 2 12.5s-8.5 2-12.5-2c3.5-3.5 6-4 6-4s.5-2.5 4.5-6.5z"></path>
                                  <path d="M12 12l9 9M16 8l5 5"></path>
                                </svg>
                              </div>
                              {userPlan === 'pro' && (
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
                            <span className="text-[10px] uppercase font-sans font-black text-slate-500 tracking-wider block mb-3">Recursos</span>
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
                              triggerAudio("success");
                              setUserPlan("pro");
                              const activeNotif: TradeNotification = {
                                id: `plan-${Date.now()}`,
                                title: "🏆 Assinatura PRO Concluída!",
                                message: "Parabéns! Você acaba de desbloquear produtos ilimitados, vendas sem fronteiras e relatórios analíticos de alta conversão.",
                                type: "success",
                                timestamp: new Date().toISOString(),
                                read: false
                              };
                              setNotifications(prev => [activeNotif, ...prev]);
                            }}
                            className={`w-full py-3 rounded-xl text-xs font-bold transition-all text-center block cursor-pointer shadow-lg active:scale-95 duration-200 ${userPlan === 'pro' ? 'bg-[#0D1117] border border-purple-500/20 text-slate-400' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-500/15 font-extrabold pb-3'}`}
                          >
                            {userPlan === 'pro' ? "Plano Ativo" : "Assinar PRO"}
                          </button>
                        </div>

                        {/* CARD 3: PLANO PREMIUM */}
                        <div className={`bg-[#111827] border ${userPlan === 'premium' ? 'border-purple-500 shadow-[0_0_15px_rgba(139, 92, 246,0.06)]' : 'border-purple-500/15'} rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-purple-500/30 transform hover:-translate-y-1 relative group`}>
                          <div>
                            {/* Icon & Name */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform duration-300">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                                  <path d="M6 3h12l4 6-10 13L2 9z"></path>
                                  <path d="M11 3 8 9l4 13 4-13-3-6"></path>
                                  <path d="M2 9h20"></path>
                                </svg>
                              </div>
                              {userPlan === 'premium' && (
                                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/15 text-[9px] uppercase tracking-wider font-sans font-bold px-2 py-0.5 rounded">
                                  Ativo
                                </span>
                              )}
                            </div>

                            <h3 className="font-sans font-extrabold text-base text-white m-0">Premium</h3>
                            <div className="flex items-baseline gap-1 mt-2 mb-4">
                              <span className="text-xl font-display font-black text-white">R$ 19,90</span>
                              <span className="text-slate-500 text-[10px]">/ mês</span>
                            </div>

                            {/* Features list */}
                            <span className="text-[10px] uppercase font-sans font-black text-slate-500 tracking-wider block mb-3">Recursos</span>
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
                              triggerAudio("success");
                              setUserPlan("premium");
                              const activeNotif: TradeNotification = {
                                id: `plan-${Date.now()}`,
                                title: "👑 Upgrade Premium Concluido!",
                                message: "Bem-vindo ao topo! Você desbloqueou o painel analítico com previsão de lucros, produtos de melhor performance e insights da IA de negócios.",
                                type: "success",
                                timestamp: new Date().toISOString(),
                                read: false
                              };
                              setNotifications(prev => [activeNotif, ...prev]);
                            }}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all text-center block cursor-pointer active:scale-95 duration-200 ${userPlan === 'premium' ? 'bg-[#0D1117] border border-purple-500/20 text-slate-400' : 'bg-transparent border border-amber-500/30 text-amber-500 hover:bg-amber-500/10'}`}
                          >
                            {userPlan === 'premium' ? "Plano Ativo" : "Assinar Premium"}
                          </button>
                        </div>

                        {/* CARD 4: PLANO EMPRESARIAL */}
                        <div className={`bg-[#111827] border ${userPlan === 'empresarial' ? 'border-purple-500 shadow-[0_0_15px_rgba(139, 92, 246,0.06)]' : 'border-purple-500/15'} rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-purple-500/30 transform hover:-translate-y-1 relative group`}>
                          <div>
                            {/* Icon & Name */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform duration-300">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                                  <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
                                </svg>
                              </div>
                              {userPlan === 'empresarial' && (
                                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/15 text-[9px] uppercase tracking-wider font-sans font-bold px-2 py-0.5 rounded">
                                  Ativo
                                </span>
                              )}
                            </div>

                            <h3 className="font-sans font-extrabold text-base text-white m-0">Empresarial</h3>
                            <div className="flex items-baseline gap-1 mt-2 mb-4">
                              <span className="text-xl font-display font-black text-white">R$ 39,90</span>
                              <span className="text-slate-500 text-[10px]">/ mês</span>
                            </div>

                            {/* Features list */}
                            <span className="text-[10px] uppercase font-sans font-black text-slate-500 tracking-wider block mb-3">Recursos</span>
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
                              triggerAudio("success");
                              setUserPlan("empresarial");
                              const activeNotif: TradeNotification = {
                                id: `plan-${Date.now()}`,
                                title: "👑 Assinatura Empresarial Ativa!",
                                message: "Controle de usuários e equipe desbloqueado para o seu ecossistema RevendaX. Siga alavancando suas vendas!",
                                type: "success",
                                timestamp: new Date().toISOString(),
                                read: false
                              };
                              setNotifications(prev => [activeNotif, ...prev]);
                            }}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all text-center block cursor-pointer active:scale-95 duration-200 ${userPlan === 'empresarial' ? 'bg-[#0D1117] border border-purple-500/20 text-slate-400' : 'bg-transparent border border-purple-500/30 text-purple-400 hover:bg-purple-500/10'}`}
                          >
                            {userPlan === 'empresarial' ? "Plano Ativo" : "Assinar Empresarial"}
                          </button>
                        </div>

                      </div>

                      {/* CONVERSÃO SOCIAL VALUE / INDICATORS */}
                      <div className="bg-[#111827] border border-purple-500/15 p-6 rounded-2xl shadow-sm mt-4">
                        <h4 className="text-xs font-sans font-extrabold uppercase text-slate-455 tracking-wider mb-4 text-center">Por que fazer parte de nossa comunidade premium?</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                          <div className="flex items-start gap-3">
                            <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 text-xs font-bold leading-none shrink-0 border border-purple-500/15">
                              🚀
                            </span>
                            <div>
                              <span className="text-[11px] font-bold text-white block">Alta Conversão</span>
                              <span className="text-[10px] text-slate-400 leading-normal block mt-0.5">Mais de 1.000 revendedores utilizam a nossa plataforma diariamente.</span>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 text-xs font-bold leading-none shrink-0 border border-purple-500/15">
                              📊
                            </span>
                            <div>
                              <span className="text-[11px] font-bold text-white block">Controle Total</span>
                              <span className="text-[10px] text-slate-400 leading-normal block mt-0.5">Visão unificada de faturamento, custos de frete, impostos e lucro líquido.</span>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 text-xs font-bold leading-none shrink-0 border border-purple-500/15">
                              🔒
                            </span>
                            <div>
                              <span className="text-[11px] font-bold text-white block">Dados Seguros</span>
                              <span className="text-[10px] text-slate-400 leading-normal block mt-0.5">Sincronização em tempo real e cópias de segurança criptografadas na nuvem.</span>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 text-xs font-bold leading-none shrink-0 border border-purple-500/15">
                              📈
                            </span>
                            <div>
                              <span className="text-[11px] font-bold text-white block">Giro Escalável</span>
                              <span className="text-[10px] text-slate-400 leading-normal block mt-0.5">Alavanque o giro estocável do seu negócio com métricas empresariais robustas.</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TELA 9: USER PROFILE / CONFIG PANEL */}
                  {activeTab === "perfil" && (
                    <div className="flex flex-col gap-4 animate-fade-in font-sans">
                      
                      {/* Avatar header card */}
                      <div className="bg-[#111827] border border-purple-500/15 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                        {userProfile?.picture ? (
                          <img 
                            src={userProfile.picture} 
                            alt={userProfile.name} 
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-2xl border border-purple-500/30 object-cover shrink-0 shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-sans font-bold text-2xl text-purple-400 shadow-sm shrink-0">
                            XB
                          </div>
                        )}
                        <div className="font-sans">
                          <div className="flex items-center gap-1.5 animate-fade-in">
                            <h3 className="font-sans font-extrabold text-lg text-white m-0">{userProfile?.name || "Xavier Brick"}</h3>
                            <span className="bg-purple-600 text-white font-sans text-[8.5px] uppercase font-bold px-2 py-0.5 rounded-md leading-none shadow-[0_0_8px_rgba(139, 92, 246,0.4)]">
                              {userPlan === "free" ? "Gratuito" : userPlan === "pro" ? "PRO" : userPlan === "premium" ? "Premium" : "Empresarial"}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 block mt-0.5 font-medium">{userProfile?.email || "Offline Local Cloud Sandbox"}</span>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5">
                            <span className="text-xs text-purple-400 font-bold">Total faturado: R$ {stats.totalVendidos.toLocaleString('pt-BR')}</span>
                            <span className="text-slate-600">|</span>
                            <button
                              onClick={() => { triggerAudio("click"); setActiveTab("planos"); }}
                              className="text-xs text-purple-400 hover:text-white font-bold flex items-center gap-1.5 cursor-pointer hover:underline transition-all"
                            >
                              <Rocket size={12} className="text-purple-400" />
                              <span>Gerenciar Plano</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* CLOUD DATABASE SYNC STATUS PANEL */}
                      <div className="bg-[#111827] border border-purple-500/15 p-5 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-purple-500/10">
                          <div className="flex items-center gap-2">
                            <Database size={16} className={isOnline ? "text-purple-500 animate-pulse" : "text-amber-500"} />
                            <span className="font-sans font-bold text-xs uppercase text-white tracking-wider">Banco de Dados Sincronizado</span>
                          </div>
                          {isOnline ? (
                            <div className="flex items-center gap-1.5 bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/20 animate-fade-in">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                              <span className="text-[9px] text-emerald-400 font-sans font-extrabold uppercase tracking-wide">Ativo</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-fade-in">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              <span className="text-[9px] text-amber-400 font-sans font-extrabold uppercase tracking-wide">Cache Offline</span>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3 font-medium">
                          {isOnline ? (
                            "Sua conta está integrada ao banco de dados em tempo real da nuvem. Todos os seus dados de estoque, produtos, metas, relatórios e notificações são salvos de forma protegida e síncrona automaticamente."
                          ) : (
                            "Você está offline. O RevendaX está operando em cache local offline ultra seguro via IndexedDB. Suas alterações pendentes serão sincronizadas automaticamente com a nuvem assim que sua internet for reestabelecida."
                          )}
                        </p>

                        <div className="bg-[#0D1117] border border-purple-500/10 rounded-xl p-3 flex flex-col gap-2 font-mono text-[10px] text-slate-400">
                          <div className="flex justify-between">
                            <span>Status Conexão:</span>
                            <span className={isOnline ? "text-emerald-400 font-bold font-sans" : "text-amber-500 font-bold font-sans"}>
                              {isOnline ? "CONECTADO" : "NÃO DETECTADA (OFFLINE)"}
                            </span>
                          </div>
                          <div className="flex justify-between font-sans text-slate-400">
                            <span>Sincronia Múltiplos Dispositivos:</span>
                            <span className="text-white font-sans font-medium">
                              {isOnline ? "Ativada (Firestore)" : "Pendente (Fila local)"}
                            </span>
                          </div>
                        </div>

                        {/* Log out / system lock button */}
                        <button 
                          id="logout-btn"
                          onClick={handleLogout}
                          className="w-full border border-purple-600/20 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 py-3 rounded-xl font-sans font-bold text-xs transition-colors cursor-pointer mt-4 active:scale-98 shadow-sm"
                        >
                          Sair da Conta Google
                        </button>

                      </div>
                    </div>
                  )}

                </div>

                {/* Simulated Bottom Tabbar */}
                <div className="mt-auto border-t border-purple-500/15 bg-[#111827]/95 backdrop-blur-md shadow-2xl pt-2 px-3 pb-[calc(8px+env(safe-area-inset-bottom,0px))] flex justify-between items-center shrink-0 relative z-30 select-none">
                  
                  {/* Dashboard Tab Item */}
                  <button 
                    id="tab-dashboard"
                    onClick={() => { handleTabChange("dashboard"); }} 
                    className={`flex flex-col items-center flex-1 py-1 transition-all hover:scale-105 active:scale-95 cursor-pointer ${activeTab === 'dashboard' ? 'text-purple-500 font-extrabold filter drop-shadow-[0_0_5px_rgba(139,92,246,0.4)]' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Layers size={17} />
                    <span className="text-[9px] font-sans font-extrabold mt-1">Início</span>
                  </button>
 
                  {/* Stock Tab Item */}
                  <button 
                    id="tab-estoque"
                    onClick={() => { handleTabChange("estoque"); }} 
                    className={`flex flex-col items-center flex-1 py-1 transition-all hover:scale-105 active:scale-95 cursor-pointer ${activeTab === 'estoque' ? 'text-purple-500 font-extrabold filter drop-shadow-[0_0_5px_rgba(139, 92, 246,0.4)]' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Package size={17} />
                    <span className="text-[9px] font-sans font-extrabold mt-1">Estoque</span>
                  </button>
 
                  {/* Centered Floating '+' button - Adds product exactly requested! */}
                  <div className="flex-1 flex justify-center items-center w-12 h-12 relative -top-3">
                    <button 
                      id="floating-add-product-btn"
                      onClick={() => { triggerAudio("click"); setIsFormOpen(true); }}
                      className="absolute w-12 h-12 bg-purple-600 hover:bg-purple-700 border border-purple-400/25 text-white flex items-center justify-center rounded-full transition-all duration-300 transform active:scale-90 hover:scale-110 shadow-[0_0_15px_rgba(139, 92, 246,0.55)] cursor-pointer z-40 group"
                      title="Adicionar Novo Produto"
                    >
                      <Plus size={22} className="stroke-[3] transition-transform duration-300 group-hover:rotate-90" />
                    </button>
                  </div>
 
                  {/* Listings Tab Item */}
                  <button 
                    id="tab-produtos"
                    onClick={() => { handleTabChange("produtos"); }} 
                    className={`flex flex-col items-center flex-1 py-1 transition-all hover:scale-105 active:scale-95 cursor-pointer ${activeTab === 'produtos' ? 'text-purple-500 font-extrabold filter drop-shadow-[0_0_5px_rgba(139, 92, 246,0.4)]' : 'text-slate-400 hover:text-white'}`}
                  >
                    <ShoppingBag size={17} />
                    <span className="text-[9px] font-sans font-extrabold mt-1">Vendas</span>
                  </button>
 
                  {/* Reports Tab Item */}
                  <button 
                    id="tab-relatorios"
                    onClick={() => { handleTabChange("relatorios"); }} 
                    className={`flex flex-col items-center flex-1 py-1 transition-all hover:scale-105 active:scale-95 cursor-pointer ${activeTab === 'relatorios' ? 'text-purple-500 font-extrabold filter drop-shadow-[0_0_5px_rgba(139,92,246,0.4)]' : 'text-slate-400 hover:text-white'}`}
                  >
                    <PieIcon size={17} />
                    <span className="text-[9px] font-sans font-extrabold mt-1">Relatórios</span>
                  </button>
                </div>

                {/* SLIDING SIDEBAR PANEL DRAWER */}
                <AnimatePresence>
                  {isSidebarOpen && (
                    <>
                      {/* Dark Overlay backdrop - Fixed Viewport */}
                      <motion.div
                        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[98] cursor-pointer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                      />
                      {/* Sliding visual Drawer - Fixed Viewport to eliminate empty scroll gaps */}
                      <motion.div
                        className="fixed inset-y-0 left-0 w-[270px] bg-[#111827] border-r border-purple-500/15 pt-[calc(20px+env(safe-area-inset-top,0px))] px-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] flex flex-col justify-between z-[99] shadow-2xl"
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 24, stiffness: 220 }}
                      >
                        <div className="flex flex-col gap-5 select-none font-sans">
                          {/* Top row */}
                          <div className="flex items-center justify-between pb-3.5 border-b border-purple-500/10">
                            <BrandLogoCompact size="sm" />
                            <button
                              onClick={() => { triggerAudio("click"); setIsSidebarOpen(false); }}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-all"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          {/* Profile Widget */}
                          <div className="p-3 bg-[#0D1117] border border-purple-500/10 rounded-2xl flex items-center gap-3 shadow-sm">
                            {userProfile?.picture ? (
                              <img
                                src={userProfile.picture}
                                alt={userProfile.name}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-xl border border-purple-500/15 object-cover shrink-0 shadow-[0_0_6px_rgba(139, 92, 246,0.1)]"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-500 font-extrabold text-xs">
                                RX
                              </div>
                            )}
                            <div className="truncate flex-1 min-w-0">
                              <h4 className="text-xs font-sans font-bold text-white truncate leading-none mb-1">{userProfile?.name || "Xavier Brick"}</h4>
                              <p className="text-[10.5px] text-slate-450 truncate leading-none m-0 font-normal tracking-wide">{userProfile?.email || "usuario@revendax.com"}</p>
                            </div>
                          </div>

                          {/* Menu navigation */}
                          <nav className="flex flex-col gap-1.5 text-xs font-sans font-semibold text-slate-400 tracking-wide">
                            <button
                              onClick={() => { handleTabChange("dashboard"); }}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all border ${activeTab === 'dashboard' ? 'bg-purple-500/10 text-purple-400 border-purple-500/15 shadow-[0_0_10px_rgba(139,92,246,0.05)] font-bold' : 'border-transparent hover:bg-slate-800/40 hover:text-slate-200'}`}
                            >
                              <Layers size={15} />
                              <span>Início Dashboard</span>
                            </button>
                            <button
                              onClick={() => { handleTabChange("estoque"); }}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all border ${activeTab === 'estoque' ? 'bg-purple-500/10 text-purple-400 border-purple-500/15 shadow-[0_0_10px_rgba(139,92,246,0.05)] font-bold' : 'border-transparent hover:bg-slate-800/40 hover:text-slate-200'}`}
                            >
                              <Package size={15} />
                              <span>Estoque Ativo</span>
                            </button>
                            <button
                              onClick={() => { handleTabChange("produtos"); }}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all border ${activeTab === 'produtos' ? 'bg-purple-500/10 text-purple-400 border-purple-500/15 shadow-[0_0_10px_rgba(139,92,246,0.05)] font-bold' : 'border-transparent hover:bg-slate-800/40 hover:text-slate-200'}`}
                            >
                              <ShoppingBag size={15} />
                              <span>Vendas e Giro</span>
                            </button>
                            <button
                              onClick={() => { handleTabChange("relatorios"); }}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all border ${activeTab === 'relatorios' ? 'bg-purple-500/10 text-purple-400 border-purple-500/15 shadow-[0_0_10px_rgba(139,92,246,0.05)] font-bold' : 'border-transparent hover:bg-slate-800/40 hover:text-slate-200'}`}
                            >
                              <PieIcon size={15} />
                              <span>Relatórios de Margem</span>
                            </button>
                            <button
                              onClick={() => { handleTabChange("metas"); }}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all border ${activeTab === 'metas' ? 'bg-purple-500/10 text-purple-400 border-purple-500/15 shadow-[0_0_10px_rgba(139,92,246,0.05)] font-bold' : 'border-transparent hover:bg-slate-800/40 hover:text-slate-200'}`}
                            >
                              <Target size={15} />
                              <span>Metas Mensais</span>
                            </button>
                            <button
                              onClick={() => { handleTabChange("planos"); }}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all border ${activeTab === 'planos' ? 'bg-purple-500/10 text-purple-400 border-purple-500/15 shadow-[0_0_10px_rgba(139,92,246,0.05)] font-bold' : 'border-transparent hover:bg-slate-800/40 hover:text-slate-200'}`}
                            >
                              <Rocket size={15} />
                              <span>Planos & Assinatura</span>
                            </button>
                            <button
                              onClick={() => { handleTabChange("perfil"); }}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all border ${activeTab === 'perfil' ? 'bg-purple-500/10 text-purple-400 border-purple-500/15 shadow-[0_0_10px_rgba(139,92,246,0.05)] font-bold' : 'border-transparent hover:bg-slate-800/40 hover:text-slate-200'}`}
                            >
                              <Settings size={15} />
                              <span>Ajustes Gerais</span>
                            </button>
                          </nav>
                        </div>

                        {/* Extra drawer buttons at bottom - aligned tightly with physical screen bottom */}
                        <div className="flex flex-col gap-1.5 font-sans select-none border-t border-slate-800/50 pt-3.5 mb-2">
                          <button
                            onClick={() => { triggerAudio("click"); setShowInstallGuideModal(true); setIsSidebarOpen(false); }}
                            className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left text-purple-400 hover:bg-purple-500/5 cursor-pointer text-xs font-bold transition-all"
                          >
                            <Smartphone size={15} className="text-purple-500 animate-pulse" />
                            <span>Instalar no Celular</span>
                          </button>
                          
                          <button
                            onClick={() => { setIsSidebarOpen(false); handleLogout(); }}
                            className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left text-slate-500 hover:text-white hover:bg-slate-800/60 cursor-pointer text-xs font-bold transition-all"
                          >
                            <ChevronRight size={15} />
                            <span>Terminar Sessão</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* VISUAL PWA INSTALAR SMARTPHONE MODAL (AS DETAILED IN USER REQUIREMENTS - "como faz" guide) */}
                <AnimatePresence>
                  {showInstallGuideModal && (
                    <motion.div
                      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[110] select-none font-sans"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="bg-[#111827] border border-purple-500/15 rounded-3xl p-5 w-full max-w-[280px] relative shadow-2xl"
                        initial={{ scale: 0.93 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.93 }}
                        transition={{ type: "spring", damping: 25 }}
                      >
                        <button
                          onClick={() => { triggerAudio("click"); setShowInstallGuideModal(false); }}
                          className="absolute top-3.5 right-3.5 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-all"
                        >
                          <X size={14} />
                        </button>

                        <div className="text-center mb-4">
                          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-2.5">
                            <Smartphone size={18} className="animate-bounce" />
                          </div>
                          <h4 className="font-display font-black text-white text-xs uppercase tracking-wider">Instalar no iPhone</h4>
                          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                            Para instalar o app no seu iPhone ou dispositivo móvel compatível, siga as etapas abaixo:
                          </p>
                        </div>

                        {/* Step items (Exact replica of photo styling) */}
                        <div className="flex flex-col gap-2.5 mb-4 text-[10px] text-slate-300">
                          
                          <div className="flex gap-2.5 p-2.5 bg-slate-900 border border-purple-500/5 rounded-xl items-start">
                            <div className="w-5 h-5 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 font-extrabold text-[9px] shrink-0">
                              1
                            </div>
                            <div>
                              <span className="font-extrabold text-white block">Toque em Compartilhar</span>
                              <span className="text-[9px] text-slate-450 mt-0.5 block leading-normal">
                                Ícone na barra inferior do Safari (quadrado com seta para cima).
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2.5 p-2.5 bg-slate-900 border border-purple-500/5 rounded-xl items-start">
                            <div className="w-5 h-5 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 font-extrabold text-[9px] shrink-0">
                              2
                            </div>
                            <div>
                              <span className="font-extrabold text-white block">Adicionar à Tela de Início</span>
                              <span className="text-[9px] text-slate-450 mt-0.5 block leading-normal">
                                Role para baixo o menu e toque nesta opção correspondente.
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2.5 p-2.5 bg-slate-900 border border-purple-500/5 rounded-xl items-start">
                            <div className="w-5 h-5 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 font-extrabold text-[9px] shrink-0">
                              3
                            </div>
                            <div>
                              <span className="font-extrabold text-white block">Confirme a Instalação</span>
                              <span className="text-[9px] text-slate-450 mt-0.5 block leading-normal">
                                Toque em "Adicionar" no canto superior direito para finalizar.
                              </span>
                            </div>
                          </div>

                        </div>

                        <button
                          onClick={() => { triggerAudio("click"); setShowInstallGuideModal(false); }}
                          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-sans text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer shadow-md shadow-purple-600/15"
                        >
                          Entendi
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* AUTH PAIRING QR CODE MODAL */}
                <AnimatePresence>
                  {isQrModalOpen && (
                    <motion.div
                      className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none font-sans text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="bg-[#111827] border border-purple-500/15 rounded-3xl p-5 w-full max-w-[270px] relative shadow-2xl"
                        initial={{ scale: 0.93 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.93 }}
                        transition={{ type: "spring", damping: 25 }}
                      >
                        <button
                          onClick={() => { triggerAudio("click"); setIsQrModalOpen(false); }}
                          className="absolute top-3.5 right-3.5 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-all"
                        >
                          <X size={14} />
                        </button>

                        <h4 className="font-display font-black text-white text-xs uppercase tracking-wider mb-1.5 mt-1">Sincronia QR Code</h4>
                        <p className="text-[10px] text-slate-400 px-2 leading-relaxed mb-4">
                          Espelhe seu estoque e acompanhe as vendas lendo este código de segurança em outro smartphone:
                        </p>

                        {/* Visual simulated QR graphic with high fidelity design elements */}
                        <div className="w-36 h-36 bg-white p-2.5 rounded-2xl mx-auto flex items-center justify-center relative border border-slate-700 shadow-md mb-4 overflow-hidden">
                          <div className="w-full h-full border border-slate-150 relative flex flex-col justify-between p-1">
                            {/* Brackets */}
                            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-3 border-l-3 border-purple-500"></div>
                            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-3 border-r-3 border-purple-500"></div>
                            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-3 border-l-3 border-purple-500"></div>
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-3 border-r-3 border-purple-500"></div>
                            <div className="w-full h-full flex flex-col gap-1 justify-center opacity-90">
                              <div className="flex justify-between">
                                <div className="w-5 h-5 bg-slate-900 border-2 border-slate-900 rounded-[1px]"></div>
                                <div className="flex-1 px-1 flex flex-col gap-0.5">
                                  <div className="h-1 bg-slate-900 rounded-[1px]"></div>
                                  <div className="h-1 bg-slate-900 rounded-[1px]"></div>
                                </div>
                                <div className="w-5 h-5 bg-slate-900 border-2 border-slate-900 rounded-[1px]"></div>
                              </div>
                              <div className="flex-1 flex gap-1">
                                <div className="flex-1 flex flex-col justify-between">
                                  <div className="h-1 bg-slate-900 rounded-[1px]"></div>
                                  <div className="h-1 bg-slate-900 bg-purple-600 rounded-[1px] animate-pulse"></div>
                                </div>
                                <div className="w-6 h-6 bg-slate-900 rounded-[1px] mt-auto"></div>
                                <div className="flex-1 flex flex-col justify-end gap-1">
                                  <div className="h-1 bg-slate-900 rounded-[1px]"></div>
                                </div>
                              </div>
                              <div className="flex justify-between items-end">
                                <div className="w-5 h-5 bg-slate-900 border-2 border-slate-900 rounded-[1px]"></div>
                                <div className="flex-1 px-1 flex flex-col justify-end gap-1">
                                  <div className="h-1 bg-slate-900 rounded-[1px]"></div>
                                </div>
                                <div className="w-4 h-4 bg-slate-900 rounded-[1px]"></div>
                              </div>
                            </div>
                            <div className="absolute left-0 right-0 h-0.5 bg-purple-600 top-0 animate-bounce"></div>
                          </div>
                        </div>

                        <div className="bg-[#0D1117] px-3 py-2 rounded-xl border border-purple-500/5 text-center mb-4.5">
                          <span className="font-mono text-[9px] text-slate-500 block uppercase tracking-wide">Código de Sincronia</span>
                          <span className="font-mono text-xs font-bold text-slate-300 block tracking-widest mt-0.5">FLXP-{firebaseUid ? "LIVE" : "DEMO"}</span>
                        </div>

                        <button
                          onClick={() => { triggerAudio("click"); setIsQrModalOpen(false); }}
                          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-sans text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer shadow-md shadow-purple-600/15"
                        >
                          Fechar
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* DYNAMIC CUSTOM DATE INTERVAL SELECTION MODAL */}
                <AnimatePresence>
                  {isCustomDateModalOpen && (
                    <motion.div
                      className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none font-sans"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="bg-[#111827] border border-purple-500/15 rounded-3xl p-5 w-full max-w-[270px] relative shadow-2xl text-center"
                        initial={{ scale: 0.93 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.93 }}
                        transition={{ type: "spring", damping: 25 }}
                      >
                        <button
                          onClick={() => { triggerAudio("click"); setIsCustomDateModalOpen(false); }}
                          className="absolute top-3.5 right-3.5 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-all"
                          title="Fechar"
                        >
                          <X size={14} />
                        </button>

                        <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-2.5">
                          <Calendar size={18} />
                        </div>
                        <h4 className="font-display font-black text-white text-xs uppercase tracking-wider mb-1.5">Intervalo Customizado</h4>
                        <p className="text-[10px] text-slate-400 px-2 leading-relaxed mb-4">
                          Defina o período desejado para filtrar os resultados do seu faturamento e estoque:
                        </p>

                        <div className="flex flex-col gap-3 mb-4 text-left">
                          <div>
                            <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Data Inicial</label>
                            <input 
                              type="date"
                              value={customStartDate}
                              onChange={(e) => setCustomStartDate(e.target.value)}
                              className="w-full bg-[#0D1117] border border-purple-500/10 focus:border-purple-500/30 text-white rounded-xl px-3 py-2 text-xs font-sans outline-none font-medium text-center focus:ring-0"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Data Final</label>
                            <input 
                              type="date"
                              value={customEndDate}
                              onChange={(e) => setCustomEndDate(e.target.value)}
                              className="w-full bg-[#0D1117] border border-purple-500/10 focus:border-purple-500/30 text-white rounded-xl px-3 py-2 text-xs font-sans outline-none font-medium text-center focus:ring-0"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              triggerAudio("click");
                              if (!customStartDate && !customEndDate) {
                                setTimeFilter("Mês");
                              } else {
                                setTimeFilter("Personalizado");
                              }
                              setIsCustomDateModalOpen(false);
                            }}
                            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-sans text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer shadow-md shadow-purple-600/15"
                          >
                            Filtrar
                          </button>
                          <button
                            onClick={() => {
                              triggerAudio("click");
                              setCustomStartDate("");
                              setCustomEndDate("");
                              setTimeFilter("Mês");
                              setIsCustomDateModalOpen(false);
                            }}
                            className="px-3.5 py-2.5 bg-[#0D1117] hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white font-sans text-[10px] font-bold uppercase rounded-xl transition-all active:scale-95 cursor-pointer"
                          >
                            Limpar
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

            </div>
          )}


      {/* ---------------------------------------------------- */}
        {/* MODAL 1: ADD / EDIT PRODUCT */}
        {isFormOpen && (
          <motion.div 
            className="fixed inset-0 bg-[#07090D]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-[#111827] border border-purple-500/15 rounded-3xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto relative animate-slide-up shadow-xl"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="flex justify-between items-center mb-5 font-sans">
                <h3 className="font-sans font-extrabold text-base text-white m-0">
                  {editingProduct ? "Editar Produto" : "Novo Produto"}
                </h3>
                <button 
                  onClick={() => { triggerAudio("click"); setIsFormOpen(false); setEditingProduct(null); clearFormFields(); }}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-purple-500/10 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="flex flex-col gap-4 text-xs font-sans">
                
                <div>
                  <label className="text-slate-400 uppercase tracking-widest block mb-1.5 font-sans font-bold text-[10px]">Nome do Produto</label>
                  <input 
                    id="form-product-name"
                    required
                    type="text" 
                    placeholder="Ex: iPhone 15 Pro Max 256GB" 
                    value={formName}
                    onChange={(e) => { setFormName(e.target.value); triggerAudio("click"); }}
                    className="w-full bg-[#0D1117] border border-purple-500/15 py-3 px-3.5 rounded-xl focus:outline-none focus:border-purple-500 text-white font-semibold focus:bg-[#0D1117] transition-all text-xs placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-widest block mb-1.5 font-sans font-bold text-[10px]">Categoria</label>
                  <select 
                    id="form-product-category"
                    value={formCategory}
                    onChange={(e) => { setFormCategory(e.target.value as ProductCategory); triggerAudio("click"); }}
                    className="w-full bg-[#0D1117] border border-purple-500/15 py-3 px-3.5 rounded-xl text-white focus:outline-none focus:border-purple-500 font-semibold cursor-pointer text-xs"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="bg-[#111827] text-white">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 uppercase tracking-widest block mb-1.5 font-sans font-bold text-[10px]">Valor Investido (R$)</label>
                    <input 
                      id="form-product-cost"
                      required
                      type="number" 
                      placeholder="0.00" 
                      value={formValorInvestido}
                      onChange={(e) => { setFormValorInvestido(e.target.value); triggerAudio("click"); }}
                      className="w-full bg-[#0D1117] border border-purple-500/15 py-3 px-3.5 rounded-xl focus:outline-none focus:border-purple-500 text-white font-semibold focus:bg-[#0D1117] transition-all text-xs font-mono placeholder-slate-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-slate-400 uppercase tracking-widest block font-sans font-bold text-[10px]">Venda (R$)</label>
                      <button 
                        id="form-product-ai-suggest"
                        type="button"
                        disabled={isSuggestingPrice}
                        onClick={handleAISuggestPrice}
                        className="text-[9.5px] text-purple-400 font-sans font-extrabold uppercase tracking-widest flex items-center gap-0.5 cursor-pointer hover:text-purple-300 transition-all"
                        title="Perguntar preço sugerido por IA"
                      >
                        <Brain size={10} /> {isSuggestingPrice ? "Lendo..." : "IA"}
                      </button>
                    </div>
                    <input 
                      id="form-product-price"
                      required
                      type="number" 
                      placeholder="0.00" 
                      value={formValorVenda}
                      onChange={(e) => { setFormValorVenda(e.target.value); triggerAudio("click"); }}
                      className="w-full bg-[#0D1117] border border-purple-500/15 py-3 px-3.5 rounded-xl focus:outline-none focus:border-purple-500 text-white font-semibold focus:bg-[#0D1117] transition-all text-xs font-mono placeholder-slate-600"
                    />
                  </div>
                </div>

                {suggestedCost.price > 0 && (
                  <div className="p-3 bg-purple-500/5 border border-purple-500/15 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1 text-purple-400 font-sans font-extrabold text-[10px] uppercase tracking-wider">
                      <Brain size={11} className="filter drop-shadow-[0_0_2px_rgba(139, 92, 246,0.4)]" /> Sugestão IA Pronta
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed mb-0 font-sans font-medium">{suggestedCost.explanation}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 uppercase tracking-widest block mb-1.5 font-sans font-bold text-[10px]">Frete Adicional (R$)</label>
                    <input 
                      id="form-product-frete"
                      type="number" 
                      placeholder="Até frete" 
                      value={formFrete}
                      onChange={(e) => { setFormFrete(e.target.value); triggerAudio("click"); }}
                      className="w-full bg-[#0D1117] border border-purple-500/15 py-3 px-3.5 rounded-xl focus:outline-none focus:border-purple-500 text-white font-semibold focus:bg-[#0D1117] transition-all text-xs font-mono placeholder-slate-600"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 uppercase tracking-widest block mb-1.5 font-sans font-bold text-[10px]">Taxas/Overhead (R$)</label>
                    <input 
                      id="form-product-taxas"
                      type="number" 
                      placeholder="Impostos/Maquininha" 
                      value={formTaxas}
                      onChange={(e) => { setFormTaxas(e.target.value); triggerAudio("click"); }}
                      className="w-full bg-[#0D1117] border border-purple-500/15 py-3 px-3.5 rounded-xl focus:outline-none focus:border-purple-500 text-white font-semibold focus:bg-[#0D1117] transition-all text-xs font-mono placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Dynamically computes net return projections */}
                {(() => {
                  const inv = parseFloat(formValorInvestido) || 0;
                  const vend = parseFloat(formValorVenda) || 0;
                  const fr = parseFloat(formFrete) || 0;
                  const tax = parseFloat(formTaxas) || 0;
                  const totalC = inv + fr + tax;
                  const netReturn = vend - totalC;
                  const marginPct = vend > 0 ? (netReturn / vend) * 100 : 0;
                  const roiPercent = totalC > 0 ? (netReturn / totalC) * 100 : 0;

                  return (
                    <div className="bg-[#0D1117] border border-purple-500/15 p-4 rounded-2xl flex justify-between text-xs font-sans shadow-sm">
                      <div>
                        <span className="text-[9px] text-slate-405 block uppercase tracking-wider font-extrabold mb-1">Lucro Líquido Previsto</span>
                        <span className={`text-base font-black ${netReturn >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                          R$ {netReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-405 block uppercase tracking-wider font-extrabold mb-1">Margem / ROI</span>
                        <span className="text-xs text-slate-200 font-extrabold block">{marginPct.toFixed(0)}% margem</span>
                        <span className="text-[10px] text-emerald-400 font-extrabold block">+{roiPercent.toFixed(0)}% ROI</span>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="text-slate-400 uppercase tracking-widest block mb-1.5 font-sans font-bold text-[10px]">Status do Produto</label>
                  <select 
                    id="form-product-status"
                    value={formStatus}
                    onChange={(e) => { setFormStatus(e.target.value as ProductStatus); triggerAudio("click"); }}
                    className="w-full bg-[#0D1117] border border-purple-500/15 py-3 px-3.5 rounded-xl text-white focus:outline-none focus:border-purple-500 font-semibold cursor-pointer text-xs"
                  >
                    <option value="Em estoque" className="bg-[#111827] text-white">Em estoque (Pronta Entrega)</option>
                    <option value="Reservado" className="bg-[#111827] text-white">Reservado (Com Sinal Pago)</option>
                    <option value="Vendido" className="bg-[#111827] text-white">Vendido (Concluído)</option>
                  </select>
                </div>

                {/* Show client fields only if Sold or Reserved */}
                {formStatus !== "Em estoque" && (
                  <div className="grid grid-cols-2 gap-3 animate-slide-up">
                    <div>
                      <label className="text-slate-400 uppercase tracking-widest block mb-1.5 font-sans font-bold text-[10px]">Comprador/Cliente</label>
                      <input 
                        id="form-product-cliente"
                        type="text" 
                        placeholder="Nome do cliente" 
                        value={formCliente}
                        onChange={(e) => { setFormCliente(e.target.value); triggerAudio("click"); }}
                        className="w-full bg-[#0D1117] border border-purple-500/15 py-3 px-3.5 rounded-xl focus:outline-none focus:border-purple-500 text-white text-xs font-semibold focus:bg-[#0D1117] placeholder-slate-650"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 uppercase tracking-widest block mb-1.5 font-sans font-bold text-[10px]">Forma Pagamento</label>
                      <input 
                        id="form-product-pagamento"
                        type="text" 
                        placeholder="Ex: Pix, Cartão" 
                        value={formFormaPagamento}
                        onChange={(e) => { setFormFormaPagamento(e.target.value); }}
                        className="w-full bg-[#0D1117] border border-purple-500/15 py-2.5 px-3 rounded-xl focus:outline-none focus:border-purple-500 text-white text-xs font-semibold focus:bg-[#0D1117] mb-2 placeholder-slate-650"
                      />
                      <div className="flex gap-1.5">
                        {["Pix", "Cartão", "Dinheiro"].map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => { setFormFormaPagamento(method); triggerAudio("click"); }}
                            className={`flex-1 py-1 rounded-lg text-[9.5px] font-sans border transition-all cursor-pointer ${
                              formFormaPagamento && formFormaPagamento.toLowerCase() === method.toLowerCase()
                                ? "bg-purple-500/10 border-purple-500/25 text-purple-400 font-bold animate-pulse"
                                : "bg-[#0D1117] border-purple-500/10 text-slate-400 hover:text-white hover:bg-[#111827]"
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-slate-400 uppercase tracking-widest block mb-1.5 font-sans font-bold text-[10px]">Foto do Produto</label>
                  
                  {formImageUrl ? (
                    <div className="bg-[#0D1117] border border-purple-500/15 p-3 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-12 h-12 rounded-lg bg-[#111827] border border-purple-500/10 overflow-hidden shrink-0 flex items-center justify-center">
                          <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="overflow-hidden bg-transparent">
                          <span className="text-[10px] text-emerald-400 font-sans font-bold block">Foto carregada!</span>
                          <span className="text-[9px] text-slate-450 font-sans block">Sincronizada no inventário</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { triggerAudio("click"); setFormImageUrl(""); }}
                        className="text-[11px] bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 py-1.5 px-2.5 rounded-lg font-sans font-bold cursor-pointer transition-all"
                      >
                        Remover Foto
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      <label className="border border-dashed border-purple-500/15 hover:border-purple-500/25 bg-[#0D1117] hover:bg-purple-500/5 transition-all rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer text-center relative group">
                        <input 
                          id="form-product-file-upload"
                          type="file" 
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/15 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform duration-200">
                          <Camera size={16} />
                        </div>
                        <div>
                          <span className="block font-sans font-bold text-xs text-slate-350">Tirar Foto ou Upload</span>
                          <span className="block text-[10px] text-slate-500 font-sans mt-0.5">Upar direto do seu celular (Fotos otimizadas)</span>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Accordion link option to manually supply an image URL if they want */}
                  <div className="mt-2.5">
                    <details className="group">
                      <summary className="text-[10px] text-slate-450 hover:text-white font-sans font-bold tracking-wide cursor-pointer list-none flex items-center gap-1 leading-none select-none">
                        <span className="inline-block transition-transform duration-200 group-open:rotate-90 text-[8px]">▶</span>
                        Ou usar link da internet...
                      </summary>
                      <div className="mt-2 pl-2 border-l border-purple-500/10 animate-fade-in">
                        <input 
                          id="form-product-image"
                          type="text" 
                          placeholder="https://suafoto.com/imagem.png" 
                          value={formImageUrl}
                          onChange={(e) => { setFormImageUrl(e.target.value); }}
                          className="w-full bg-[#0D1117] border border-purple-500/15 py-2 px-3 rounded-lg focus:outline-none focus:border-purple-500 text-white text-[11px] font-semibold placeholder-slate-600"
                        />
                      </div>
                    </details>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-widest block mb-1.5 font-sans font-bold text-[10px]">Observações adicionais</label>
                  <textarea 
                    id="form-product-obs"
                    placeholder="Ex: Peguei de fornecedor em SP, bateria 98%..." 
                    value={formObservacoes}
                    onChange={(e) => { setFormObservacoes(e.target.value); triggerAudio("click"); }}
                    rows={2}
                    className="w-full bg-[#0D1117] border border-purple-500/15 py-2.5 px-3 rounded-xl text-white focus:outline-none text-xs font-semibold focus:bg-[#0D1117] transition-all shadow-inner placeholder-slate-600"
                  />
                </div>

                <div className="flex gap-2.5 mt-2">
                  <button 
                    id="form-product-save"
                    type="submit"
                    disabled={isSavingProduct}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-75 disabled:cursor-not-allowed text-white py-3 rounded-xl font-sans font-bold transition-all flex-1 cursor-pointer shadow-md shadow-purple-600/10 active:scale-95 duration-200 flex justify-center items-center gap-2"
                  >
                    {isSavingProduct ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{editingProduct ? "Salvando..." : "Cadastrando..."}</span>
                      </>
                    ) : (
                      editingProduct ? "Salvar Mudanças" : "Finalizar Cadastro"
                    )}
                  </button>
                  <button 
                    id="form-product-cancel"
                    type="button"
                    disabled={isSavingProduct}
                    onClick={() => { triggerAudio("click"); setIsFormOpen(false); setEditingProduct(null); clearFormFields(); }}
                    className="bg-transparent hover:bg-purple-600/5 disabled:opacity-40 disabled:cursor-not-allowed border border-purple-500/15 text-slate-400 py-3 rounded-xl transition-all font-sans px-4 cursor-pointer text-xs font-bold"
                  >
                    Cancelar
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL 2: ADJUST PLAN / GOALS */}
        {isGoalFormOpen && (
          <motion.div 
            className="fixed inset-0 bg-[#07090D]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-[#111827] border border-purple-500/15 rounded-3xl p-6 w-full max-w-sm relative animate-slide-up shadow-xl"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-sans font-extrabold text-base text-white m-0">
                  {editingGoal ? "Editar Meta de Lucro" : "Criar Nova Meta de Lucro"}
                </h3>
                <button 
                  onClick={() => { triggerAudio("click"); setIsGoalFormOpen(false); setGoalTargetAmount(""); setGoalTitle(""); setEditingGoal(null); }} 
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-purple-500/10 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="flex flex-col gap-4 text-xs font-sans">
                <div>
                  <label className="text-slate-400 uppercase tracking-widest block mb-1.5 font-sans font-bold text-[10px]">Título da Meta (Opcional)</label>
                  <input 
                    id="form-goal-desc"
                    type="text" 
                    placeholder="Ex: Lucro deste mês" 
                    value={goalTitle}
                    onChange={(e) => { setGoalTitle(e.target.value); }}
                    className="w-full bg-[#0D1117] border border-purple-500/15 py-2.5 px-3 rounded-xl focus:outline-none focus:border-purple-500 text-white text-xs font-semibold placeholder-slate-600 focus:bg-[#0D1117]"
                  />
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-widest block mb-1.5 font-sans font-bold text-[10px]">Valor Objetivo (R$)</label>
                  <input 
                    id="form-goal-target"
                    required
                    type="number" 
                    placeholder="Ex: 5000" 
                    value={goalTargetAmount}
                    onChange={(e) => { setGoalTargetAmount(e.target.value); triggerAudio("click"); }}
                    className="w-full bg-[#0D1117] border border-purple-500/15 py-3 px-3.5 rounded-xl focus:outline-none focus:border-purple-500 text-center text-white text-lg font-mono font-bold focus:bg-[#0D1117] placeholder-slate-600"
                  />
                  <span className="text-[10px] text-slate-500 block mt-2 text-center leading-normal font-sans">
                    Este valor será adicionado no seu indicador de visualização principal e comparado ao faturamento real das suas transações.
                  </span>
                </div>

                <button 
                  id="form-goal-submit"
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-sans font-bold transition-all cursor-pointer shadow-md shadow-purple-600/10 active:scale-95 duration-200 text-center block"
                >
                  {editingGoal ? "Salvar Alterações" : "Estabelecer Nova Meta"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL 3: FULL DETAILS FLIP AND HISTORY OVERLAY */}
        {selectedProduct && (
          <motion.div 
            className="fixed inset-0 bg-[#07090D]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-[#111827] border border-purple-500/15 rounded-3xl p-6 w-full max-w-sm relative max-h-[85vh] overflow-y-auto animate-slide-up shadow-xl"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] uppercase font-sans tracking-wider text-slate-400 font-extrabold">Ficha Técnica do Item</span>
                <button 
                  onClick={() => { triggerAudio("click"); setSelectedProduct(null); }} 
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-purple-500/10 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Product Picture Cover */}
              <div className="h-40 w-full rounded-2xl bg-[#0D1117] border border-purple-500/10 overflow-hidden relative mb-4">
                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-[#111827]/95 border border-purple-500/15 px-2.5 py-1 rounded-lg text-[9.5px] font-sans font-bold text-white shadow-sm">
                  {selectedProduct.category}
                </div>
              </div>

              <h3 className="font-sans font-extrabold text-base text-white mt-1 pr-6 tracking-tight line-clamp-2 leading-snug">{selectedProduct.name}</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal m-0 italic mb-4 font-sans font-medium">"{selectedProduct.observacoes || 'Nenhuma nota de conservação anotada.'}"</p>

              {/* Breakdown analytical details metrics container */}
              <div className="bg-[#0D1117] border border-purple-500/10 p-4 rounded-2xl flex flex-col gap-3 font-sans text-xs shadow-inner">
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Status</span>
                  <span className={`px-2.5 py-1 rounded-lg text-[9.5px] uppercase font-sans font-bold ${
                    selectedProduct.status === 'Vendido' ? 'bg-[#10B981]/15 border border-[#10B981]/25 text-emerald-400' :
                    selectedProduct.status === 'Reservado' ? 'bg-[#F59E0B]/15 border border-[#F59E0B]/25 text-amber-400' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}>{selectedProduct.status}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium font-sans">Valor Investido Custo</span>
                  <span className="font-mono text-white font-bold">R$ {selectedProduct.valorInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                {selectedProduct.frete > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium font-sans">Despesa com Frete</span>
                    <span className="font-mono text-white font-bold">R$ {selectedProduct.frete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {selectedProduct.taxas > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium font-sans">Taxas / Overhead</span>
                    <span className="font-mono text-white font-bold">R$ {selectedProduct.taxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2.5 border-t border-purple-500/10">
                  <span className="text-slate-400 font-sans font-medium">Proposta de Venda</span>
                  <span className="font-mono font-bold text-white">R$ {selectedProduct.valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Net ROI computation */}
                {(() => {
                  const totC = selectedProduct.valorInvestido + selectedProduct.frete + selectedProduct.taxas;
                  const netProf = selectedProduct.valorVenda - totC;
                  const roiPct = totC > 0 ? (netProf / totC) * 100 : 0;

                  return (
                    <div className="flex justify-between pt-2 border-t border-dashed border-purple-500/10 text-sm">
                      <span className="text-slate-300 font-sans font-bold block">Lucro Líquido Realizado</span>
                      <div className="text-right">
                        <span className="font-mono font-black text-emerald-400 block">R$ {netProf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] text-emerald-450 font-sans font-extrabold block">+{roiPct.toFixed(1)}% ROI</span>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* TIMELINE SECTION */}
              <div className="mt-5">
                <span className="text-[10px] font-sans font-extrabold uppercase text-slate-400 tracking-wider block mb-3.5">Histórico & Timeline</span>
                <div className="flex flex-col gap-3 font-sans text-xs">
                  
                  <div className="flex gap-4 items-start relative pb-2 border-l-2 border-purple-500/10 pl-4 ml-2">
                    <span className="absolute -left-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <div>
                      <div className="font-bold text-slate-200">Aquisição Regular</div>
                      <div className="text-[10.5px] text-slate-450 mt-0.5">Cadastrado no estoque em {selectedProduct.dataEntrada}</div>
                    </div>
                  </div>

                  {selectedProduct.status === "Reservado" && (
                    <div className="flex gap-4 items-start relative pb-2 border-l-2 border-purple-500/10 pl-4 ml-2">
                      <span className="absolute -left-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                      <div>
                        <div className="font-bold text-slate-200">Reserva de Compra</div>
                        <div className="text-[10.5px] text-slate-455 mt-0.5">Sinal registrado para o comprador {selectedProduct.cliente || 'não informado.'}</div>
                      </div>
                    </div>
                  )}

                  {selectedProduct.status === "Vendido" && (
                    <div className="flex gap-4 items-start relative pl-4 ml-2 animate-fade-in">
                      <span className="absolute -left-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <div>
                        <div className="font-bold text-slate-100">Transação Consolidada 🏆</div>
                        <div className="text-[10.5px] text-slate-450 mt-0.5">Completo em {selectedProduct.dataVenda || selectedProduct.dataEntrada}</div>
                        <div className="text-[10.5px] text-emerald-400 font-extrabold mt-1">Comprador: {selectedProduct.cliente} • {selectedProduct.formaPagamento}</div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              <div className="flex gap-2 mt-[22px] pt-4 border-t border-purple-500/10">
                <button 
                  onClick={() => {
                    const backup = selectedProduct;
                    setSelectedProduct(null);
                    startEditProduct(backup);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-sans font-bold flex-1 cursor-pointer text-xs shadow-md shadow-purple-600/10 active:scale-95 duration-200"
                >
                  Editar Informações
                </button>
                <button 
                  onClick={() => {
                    const id = selectedProduct.id;
                    setSelectedProduct(null);
                    handleDeleteProduct(id);
                  }}
                  className="bg-transparent hover:bg-purple-500/5 border border-purple-500/15 text-red-400 py-2.5 rounded-xl transition-all font-sans font-semibold px-4 cursor-pointer text-xs"
                >
                  Excluir
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}

        {/* MODAL 4: DELETE CONFIRMATION OVERLAY */}
        {productToDelete && (
          <motion.div 
            className="fixed inset-0 bg-[#07090D]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-[#111827] border border-purple-500/15 p-6 rounded-2xl w-full max-w-sm shadow-xl relative animate-slide-up"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-red-500 mb-4 border border-purple-500/20">
                  <Trash2 size={20} />
                </div>
                <h3 className="font-sans font-extrabold text-base text-white mb-2">Excluir Produto?</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6 font-sans">
                  Deseja realmente remover este produto de seu inventário? Esta alteração é definitiva e não pode ser desfeita.
                </p>
                <div className="flex gap-3 text-xs font-sans">
                  <button
                    id="cancel-delete-modal-btn"
                    onClick={() => {
                      triggerAudio("click");
                      setProductToDelete(null);
                    }}
                    className="flex-1 bg-transparent hover:bg-purple-500/5 border border-purple-500/15 text-slate-400 font-bold py-2.5 rounded-xl cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    id="confirm-delete-modal-btn"
                    onClick={() => {
                      const target = products.find(p => p.id === productToDelete);
                      if (target) {
                        if (firebaseUid) {
                          deleteDoc(doc(db, "products", productToDelete))
                            .catch(err => handleFirestoreError(err, OperationType.DELETE, `products/${productToDelete}`));
                          
                          const newNotif: TradeNotification = {
                            id: `delete-${Date.now()}`,
                            title: "Produto Removido",
                            message: `"${target.name}" foi excluído permanentemente da plataforma.`,
                            type: "warning",
                            timestamp: new Date().toISOString(),
                            read: false
                          };
                          setDoc(doc(db, "notifications", newNotif.id), { ...newNotif, ownerId: firebaseUid })
                            .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${newNotif.id}`));
                        } else {
                          setProducts(prev => prev.filter(p => p.id !== productToDelete));
                          
                          const newNotif: TradeNotification = {
                            id: `delete-${Date.now()}`,
                            title: "Produto Removido",
                            message: `"${target.name}" foi excluído permanentemente da plataforma.`,
                            type: "warning",
                            timestamp: new Date().toISOString(),
                            read: false
                          };
                          setNotifications(prev => [newNotif, ...prev]);
                        }
                        
                        if (selectedProduct && selectedProduct.id === productToDelete) {
                          setSelectedProduct(null);
                        }
                        triggerAudio("click");
                      }
                      setProductToDelete(null);
                    }}
                    className="flex-1 bg-red-650 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 duration-200"
                  >
                    Confirmar Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Safe Custom Goal Deletion Confirmation Modal inside Sandbox Iframe */}
        {goalToDelete && (
          <motion.div 
            className="fixed inset-0 bg-[#07090D]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-[#111827] border border-purple-500/15 p-6 rounded-2xl w-full max-w-sm shadow-xl relative animate-slide-up"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-red-500 mb-4 border border-purple-500/20">
                  <Trash2 size={20} />
                </div>
                <h3 className="font-sans font-extrabold text-base text-white mb-2">Excluir Meta?</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6 font-sans">
                  Deseja realmente apagar esta meta financeira de seu painel? Esta ação é irreversível.
                </p>
                <div className="flex gap-3 text-xs font-sans">
                  <button
                    id="cancel-delete-goal-modal-btn"
                    onClick={() => {
                      triggerAudio("click");
                      setGoalToDelete(null);
                    }}
                    className="flex-1 bg-transparent hover:bg-purple-500/5 border border-purple-500/15 text-slate-400 font-bold py-2.5 rounded-xl cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    id="confirm-delete-goal-modal-btn"
                    onClick={() => handleConfirmDeleteGoal(goalToDelete)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 duration-200"
                  >
                    Confirmar Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SUBSCRIPTION LIMIT MODAL PROMPT */}
        {showLimitModal && (
          <motion.div 
            className="fixed inset-0 bg-[#07090D]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-[#111827] border-2 border-purple-500 p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-slide-up overflow-hidden"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              {/* Background glowing particles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12"></div>
              
              <div className="text-center relative z-10 font-sans">
                {/* Header Icon badge */}
                <div className="mx-auto w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 shadow-[0_0_15px_rgba(139, 92, 246,0.22)] animate-bounce-subtle">
                  <Rocket size={24} className="stroke-[2.5]" />
                </div>

                <h3 className="font-display font-black text-lg text-white mb-2 tracking-tight">Tudo pronto para crescer 🚀</h3>
                
                <p className="text-slate-350 text-xs leading-relaxed mb-6 font-medium">
                  {limitModalType === "products" ? (
                    "Você atingiu o limite de 3 produtos do plano gratuito. Assine o Plano PRO para cadastrar produtos ilimitados, gerar relatórios completos e acompanhar seu crescimento sem restrições."
                  ) : (
                    "Você atingiu o limite de 3 vendas do plano gratuito. Assine o Plano PRO para cadastrar vendas ilimitadas, gerar relatórios completos e acompanhar seu crescimento sem restrições."
                  )}
                </p>

                {/* Grid for core benefits summary inside prompt */}
                <div className="bg-[#0D1117] border border-purple-500/5 rounded-xl p-3.5 mb-6 text-left flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[10.5px] text-slate-350 font-bold">
                    <span className="text-emerald-500">✓</span>
                    <span>Produtos e Vendas Ilimitadas</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10.5px] text-slate-350 font-bold">
                    <span className="text-emerald-500">✓</span>
                    <span>Relatórios e Análises sem bloqueios</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10.5px] text-slate-350 font-bold">
                    <span className="text-emerald-500">✓</span>
                    <span>Backup Automático na Nuvem</span>
                  </div>
                </div>

                <div className="flex gap-3 text-xs font-sans">
                  <button
                    id="limit-modal-now-not-btn"
                    onClick={() => {
                      triggerAudio("click");
                      setShowLimitModal(false);
                    }}
                    className="flex-1 bg-transparent hover:bg-neutral-800 border border-purple-500/15 text-slate-400 font-extrabold py-3 rounded-xl cursor-pointer transition-all duration-200"
                  >
                    Agora Não
                  </button>
                  <button
                    id="limit-modal-go-plans-btn"
                    onClick={() => {
                      triggerAudio("click");
                      setActiveTab("planos");
                      setShowLimitModal(false);
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black py-3 rounded-xl cursor-pointer transition-all duration-200 active:scale-95 shadow-lg shadow-purple-600/15"
                  >
                    Ver Planos
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
