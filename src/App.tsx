import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Menu, 
  WifiOff, 
  Brain, 
  Camera, 
  Calendar, 
  Layers,
  Package,
  ShoppingBag,
  PieChart,
  Target,
  Plus
} from "lucide-react";

import { auth } from "./firebase";
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import { Product, ProductCategory, ProductStatus, Goal, TradeNotification } from "./types";
import { BrandLogoBig, BrandLogoCompact } from "./components/BrandLogo";

import { Sidebar } from "./components/Sidebar";
import { LimitModal } from "./components/LimitModal";
import { PwaInstallModal } from "./components/PwaInstallModal";
import { NotificationsDrawer } from "./components/NotificationsDrawer";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";

import { Dashboard } from "./pages/Dashboard";
import { Produtos } from "./pages/Produtos";
import { Estoque } from "./pages/Estoque";
import { Relatorios } from "./pages/Relatorios";
import { Metas } from "./pages/Metas";
import { Planos } from "./pages/Planos";
import { Perfil } from "./pages/Perfil";

import { calcStats } from "./utils/calcStats";
import { useNotifications } from "./hooks/useNotifications";
import { useProducts } from "./hooks/useProducts";
import { useGoals } from "./hooks/useGoals";
import { triggerAudio } from "./utils/audioUtils";
import { CATEGORIES } from "./types";

export default function App() {
  // Navigation & Shell States
  const [isSplashLoading, setIsSplashLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [splashPhase, setSplashPhase] = useState("Iniciando painel...");
  const [isTabChanging, setIsTabChanging] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("revendax_logged_in") === "true";
  });
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; picture: string } | null>(() => {
    const saved = localStorage.getItem("revendax_user");
    return saved ? JSON.parse(saved) : null;
  });
  const isMasterAccount = useMemo(() => userProfile?.email === "wleal0131@gmail.com", [userProfile]);

  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<any>(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(() => {
    return localStorage.getItem("revendax_pwa_dismissed") !== "true";
  });
  const [activeTab, setActiveTab] = useState<"dashboard" | "produtos" | "estoque" | "relatorios" | "metas" | "perfil" | "planos">("dashboard");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showValues, setShowValues] = useState(() => {
    return localStorage.getItem("revendax_show_values") !== "false";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter States
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("Todas");
  const [productStatusFilter, setProductStatusFilter] = useState("Todos");
  const [timeFilter, setTimeFilter] = useState<"Hoje" | "Semana" | "Mês" | "Ano" | "Personalizado">("Mês");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);

  // Dynamic Details & Deletion state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  // Plan State
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "premium" | "empresarial">(() => {
    return (localStorage.getItem("revendax_user_plan") as "free" | "pro" | "premium" | "empresarial") || "free";
  });
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalType, setLimitModalType] = useState<"products" | "sales">("products");
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);
  const [plusHovered, setPlusHovered] = useState(false);

  // Forms States (Create / Edit product & Goal)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

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

  const [goalTitle, setGoalTitle] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");

  // IA intelligence States
  const [aiReport, setAiReport] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedCost, setSuggestedCost] = useState({ name: "", category: "Apple/iPhones" as ProductCategory, price: 0, margin: 0, explanation: "" });
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Network offline state
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    localStorage.setItem("revendax_show_values", showValues ? "true" : "false");
  }, [showValues]);

  // Sync state & connection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUid(user ? user.uid : null);
      if (user) {
        setIsLoggedIn(true);
        setIsSigningIn(false); // Ensura a remoção do overlay entrando
        localStorage.setItem("revendax_logged_in", "true");
        const profile = {
          name: user.displayName || "Usuário RevendaX Premium",
          email: user.email || "",
          picture: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
        };
        setUserProfile(profile);
        localStorage.setItem("revendax_user", JSON.stringify(profile));
      }
    });

    // Fases de carregamento progressivas e mais lentas (Premium Visual Feel)
    const phaseTimer1 = setTimeout(() => {
      setSplashPhase("Sincronizando prateleiras virtuais...");
    }, 1100);

    const phaseTimer2 = setTimeout(() => {
      setSplashPhase("Carregando o ecossistema premium...");
    }, 2200);

    const timer = setTimeout(() => {
      setIsSplashLoading(false);
    }, 3300);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      clearTimeout(timer);
    };
  }, []);

  // Sync hooks
  const {
    notifications,
    setNotifications,
    addNotification,
    markNotificationAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications(firebaseUid);

  const {
    products,
    setProducts,
    isSavingProduct,
    saveProduct,
    deleteProduct,
  } = useProducts(firebaseUid, userPlan, soundEnabled, addNotification);

  // Calculate generic sales statistics
  const stats = useMemo(() => calcStats(products), [products]);

  const {
    goals,
    setGoals,
    saveGoal,
    deleteGoal,
  } = useGoals(firebaseUid, soundEnabled, stats.lucroRealizado, addNotification);

  const activeGoal = goals[0] || null;

  // Track page navigation changes
  const tabTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTabChange = (tab: "dashboard" | "produtos" | "estoque" | "relatorios" | "metas" | "perfil" | "planos") => {
    if (tab === "planos" && !isMasterAccount) {
      if (activeTab !== "dashboard") {
        handleTabChange("dashboard");
      }
      return;
    }
    if (tab !== "dashboard") {
      setCustomStartDate("");
      setCustomEndDate("");
      if (timeFilter === "Personalizado") {
        setTimeFilter("Mês");
      }
    }
    if (activeTab === tab) return;
    if (tabTimerRef.current) clearTimeout(tabTimerRef.current);
    triggerAudio("click", soundEnabled);
    setIsSidebarOpen(false);
    setIsCustomDateModalOpen(false); // Fecha modal de data ao trocar de aba
    setIsTabChanging(true);
    tabTimerRef.current = setTimeout(() => {
      setActiveTab(tab);
      setIsTabChanging(false);
      tabTimerRef.current = null;
    }, 380);
  };

  // Google OAuth Logins
  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      triggerAudio("click", soundEnabled);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const profile = {
        name: user.displayName || "Usuário RevendaX Premium",
        email: user.email || "",
        picture: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      };

      setUserProfile(profile);
      setIsLoggedIn(true);
      localStorage.setItem("revendax_logged_in", "true");
      localStorage.setItem("revendax_user", JSON.stringify(profile));

      await addNotification(
        `Olá, ${profile.name}! 👋`,
        "Autenticação Google realizada com sucesso. Bem-vindo de volta ao seu painel premium RevendaX.",
        "success"
      );
      triggerAudio("success", soundEnabled);
      setIsSigningIn(false);
    } catch (firebaseErr: any) {
      console.warn("Firebase sign in failed, calling manual fallback", firebaseErr);
      try {
        const response = await fetch("/api/auth/url");
        if (!response.ok) throw new Error("Falha ao obter URL de autenticação");
        const { url } = await response.json();

        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const authWindow = window.open(
          url,
          "oauth_popup",
          `width=${width},height=${height},left=${left},top=${top}`
        );

        if (!authWindow) {
          setIsSigningIn(false);
          alert("Por favor, permita popups neste site para efetuar login com o Google.");
        } else {
          const checkClosed = setInterval(() => {
            if (authWindow.closed) {
              clearInterval(checkClosed);
              setIsSigningIn(false);
            }
          }, 1000);
        }
      } catch (error) {
        setIsSigningIn(false);
        console.error("Google OAuth trigger failed:", error);
        alert("Erro inesperado ao iniciar autenticação Google.");
      }
    }
  };

  const handleLogout = () => {
    triggerAudio("click", soundEnabled);
    setLoadingAction("Encerrando sessão...");

    setTimeout(() => {
      signOut(auth).catch((err) => console.error("Sign out from Firebase failed:", err));
      setIsLoggedIn(false);
      setUserProfile(null);
      localStorage.removeItem("revendax_logged_in");
      localStorage.removeItem("revendax_user");

      setProducts([]);
      setGoals([]);
      clearNotifications();
      setLoadingAction(null);
    }, 750);
  };

  // Listen to postMessage callbacks
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      const isGoogleRunApp = origin.endsWith(".run.app");
      const isStrictLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin);
      if (!isGoogleRunApp && !isStrictLocalhost) {
        return;
      }
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        const user = event.data?.user;
        if (user) {
          setUserProfile(user);
          setIsLoggedIn(true);
          setIsSigningIn(false);
          localStorage.setItem("revendax_logged_in", "true");
          localStorage.setItem("revendax_user", JSON.stringify(user));

          setProducts([]);
          setGoals([]);

          addNotification(
            `Olá, ${user.name}! 👋`,
            "Autenticação Google realizada com sucesso. Bem-vindo de volta ao seu painel premium RevendaX.",
            "success"
          );
          triggerAudio("success", soundEnabled);
        }
      }
    };

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setPwaInstallPrompt(e);
    };

    window.addEventListener("message", handleOAuthMessage);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      if (tabTimerRef.current) clearTimeout(tabTimerRef.current);
      window.removeEventListener("message", handleOAuthMessage);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [soundEnabled]);

  const handlePwaInstall = async () => {
    triggerAudio("click", soundEnabled);
    setShowInstallGuideModal(true);
    if (pwaInstallPrompt) {
      try {
        pwaInstallPrompt.prompt();
        const { outcome } = await pwaInstallPrompt.userChoice;
        if (outcome === "accepted") {
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
    triggerAudio("click", soundEnabled);
    setShowPwaPrompt(false);
    localStorage.setItem("revendax_pwa_dismissed", "true");
  };

  // Live image compression
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerAudio("click", soundEnabled);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
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

  // Product Listings filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.cliente || "").toLowerCase().includes(productSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.observacoes || "").toLowerCase().includes(productSearch.toLowerCase());

      const matchesCategory = productCategoryFilter === "Todas" || p.category === productCategoryFilter;
      const matchesStatus = productStatusFilter === "Todos" || p.status === productStatusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, productSearch, productCategoryFilter, productStatusFilter]);

  // Dashboard filtering of products
  const dashboardProducts = useMemo(() => {
    const todayLocal = new Date();
    const todayYear = todayLocal.getFullYear();
    const todayMonth = String(todayLocal.getMonth() + 1).padStart(2, '0');
    const todayDay = String(todayLocal.getDate()).padStart(2, '0');
    const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

    return products.filter((p) => {
      if (timeFilter === "Ano") {
        return true;
      }

      const targetDateStr = p.status === "Vendido" ? p.dataVenda || p.dataEntrada : p.dataEntrada;
      if (!targetDateStr) return timeFilter !== "Personalizado";

      const parts = targetDateStr.split("-");
      const itemDateLocal = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      itemDateLocal.setHours(0, 0, 0, 0);

      if (timeFilter === "Personalizado") {
        if (customStartDate) {
          const startParts = customStartDate.split("-");
          const start = new Date(Number(startParts[0]), Number(startParts[1]) - 1, Number(startParts[2]));
          start.setHours(0, 0, 0, 0);
          if (itemDateLocal < start) return false;
        }
        if (customEndDate) {
          const endParts = customEndDate.split("-");
          const end = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]));
          end.setHours(23, 59, 59, 999);
          if (itemDateLocal > end) return false;
        }
        return true;
      }

      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);

      const diffMs = todayMidnight.getTime() - itemDateLocal.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (timeFilter === "Hoje") {
        return targetDateStr === todayStr;
      }
      if (timeFilter === "Semana") {
        return diffDays >= 0 && diffDays <= 7;
      }
      if (timeFilter === "Mês") {
        return diffDays >= 0 && diffDays <= 30;
      }
      return true;
    });
  }, [products, timeFilter, customStartDate, customEndDate]);

  // Multi-tier statistics summary
  const dashboardStats = useMemo(() => calcStats(dashboardProducts), [dashboardProducts]);

  // Category distribution
  const categoryChartData = useMemo(() => {
    const data: Record<string, { name: string; value: number }> = {};
    dashboardProducts.forEach((p) => {
      if (p.status !== "Vendido") {
        const cat = p.category;
        if (!data[cat]) data[cat] = { name: cat, value: 0 };
        data[cat].value += 1;
      }
    });
    return Object.values(data);
  }, [dashboardProducts]);

  // Profit timeline charting
  const profitTimelineData = useMemo(() => {
    const sortedSold = dashboardProducts
      .filter((p) => p.status === "Vendido" && p.dataVenda)
      .sort((a, b) => new Date(a.dataVenda!).getTime() - new Date(b.dataVenda!).getTime());

    let runningProfit = 0;
    return sortedSold.map((p, idx) => {
      const profit = p.valorVenda - p.valorInvestido - p.frete - p.taxas;
      runningProfit += profit;
      return {
        date: p.dataVenda
          ? new Date(p.dataVenda).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
          : `Item ${idx + 1}`,
        lucro: runningProfit,
        profitItem: profit,
        name: p.name,
      };
    });
  }, [dashboardProducts]);

  // Goal updates
  const goalProgressPercent = useMemo(() => {
    if (!activeGoal) return 0;
    const currentProfit = stats.lucroRealizado;
    const pct = (currentProfit / activeGoal.targetAmount) * 100;
    return Math.min(100, Math.max(0, parseFloat(pct.toFixed(1))));
  }, [activeGoal, stats.lucroRealizado]);

  // AI intelligence triggers
  const handlePortfolioAIAnalysis = async () => {
    triggerAudio("click", soundEnabled);
    setIsAnalyzing(true);
    setAiReport("");
    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Email": userProfile?.email || ""
        },
        body: JSON.stringify({
          products: products,
          goal: activeGoal?.targetAmount || 5000,
          currentMonthSalesCount: stats.vendasCount,
          currentMonthSalesCost: products
            .filter((p) => p.status === "Vendido")
            .reduce((acc, c) => acc + (c.valorInvestido + c.frete + c.taxas), 0),
          currentMonthSalesRevenue: stats.totalVendidos,
        }),
      });

      const resData = await response.json();
      if (resData.success) {
        setAiReport(resData.analysis);
      } else {
        setAiReport(`### ❌ Falha na Análise\nOcorreu um erro: ${resData.error}`);
      }
    } catch (err: any) {
      setAiReport(`### ❌ Erro de Conexão\nNão foi possível conectar: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAISuggestPrice = async () => {
    triggerAudio("click", soundEnabled);
    if (!formName) return alert("Por favor, preencha o Nome do Produto antes de solicitar sugestão de IA.");
    setIsSuggestingPrice(true);

    try {
      const response = await fetch("/api/gemini/suggest-price", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Email": userProfile?.email || ""
        },
        body: JSON.stringify({
          name: formName,
          category: formCategory,
          cost: Number(formValorInvestido) || 0,
          frete: Number(formFrete) || 0,
          taxas: Number(formTaxas) || 0,
        }),
      });

      const resData = await response.json();
      if (resData.success) {
        setFormValorVenda(resData.suggestedPrice.toString());
        setSuggestedCost({
          name: formName,
          category: formCategory,
          price: resData.suggestedPrice,
          margin: resData.margin,
          explanation: resData.explanation,
        });

        await addNotification(
          "💡 Sugestão de Preço Inteligente",
          `IA recomendou R$ ${resData.suggestedPrice} para o item ${formName}, alegando margem líquida de ${resData.margin}%.`,
          "success"
        );
        triggerAudio("success", soundEnabled);
      }
    } catch (err: any) {
      console.error("AI Price suggestions offline or unreachable:", err);
    } finally {
      setIsSuggestingPrice(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerAudio("click", soundEnabled);

    const costVal = parseFloat(formValorInvestido) || 0;
    const saleVal = parseFloat(formValorVenda) || 0;
    const freteVal = parseFloat(formFrete) || 0;
    const taxesVal = parseFloat(formTaxas) || 0;

    const values = {
      name: formName,
      category: formCategory,
      valorInvestido: costVal,
      valorVenda: saleVal,
      frete: freteVal,
      taxas: taxesVal,
      cliente: formCliente,
      formaPagamento: formFormaPagamento,
      status: formStatus,
      observacoes: formObservacoes,
      imageUrl: formImageUrl,
    };

    let cleanValues = values;
    if (formStatus === "Em estoque") {
      // Limpa campos de cliente e pagamento que não se aplicam ao status Em Estoque
      cleanValues = {
        ...values,
        cliente: "",
        formaPagamento: "",
      };
    }

    setLoadingAction(editingProduct ? "Atualizando item..." : "Criando item...");

    const success = await saveProduct(cleanValues, editingProduct, (type) => {
      setLimitModalType(type);
      setShowLimitModal(true);
    });

    setLoadingAction(null);

    if (success) {
      setIsFormOpen(false);
      setEditingProduct(null);
      clearFormFields();
    }
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

  const startEditProduct = (prod: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerAudio("click", soundEnabled);
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

  const handleDeleteProduct = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProductToDelete(id);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const target = products.find((p) => p.id === productToDelete);
    if (target) {
      await deleteProduct(productToDelete, target.name);
      if (selectedProduct && selectedProduct.id === productToDelete) {
        setSelectedProduct(null);
      }
    }
    setProductToDelete(null);
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerAudio("click", soundEnabled);
    const amountNum = parseFloat(goalTargetAmount) || 0;
    if (amountNum <= 0) return alert("Por favor, digite um valor de meta maior que zero.");

    await saveGoal(goalTitle, amountNum, editingGoal);

    setIsGoalFormOpen(false);
    setGoalTargetAmount("");
    setGoalTitle("");
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    triggerAudio("click", soundEnabled);
    setGoalToDelete(goalId);
  };

  const handleConfirmDeleteGoal = async (goalId: string) => {
    await deleteGoal(goalId);
    setGoalToDelete(null);
  };

  const handleEditGoalClick = (goal: Goal) => {
    triggerAudio("click", soundEnabled);
    setEditingGoal(goal);
    setGoalTitle(goal.title);
    setGoalTargetAmount(goal.targetAmount.toString());
    setIsGoalFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#07090D] text-slate-100 flex flex-col font-sans overflow-x-hidden relative selection:bg-purple-500 selection:text-white">
      {/* 1. INITIAL LOAD SPLASH SCREEN */}
      <AnimatePresence>
        {isSplashLoading && (
          <motion.div
            id="splash-loading-container"
            className="fixed inset-0 bg-[#07090D] z-[9999] flex flex-col items-center justify-center select-none"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            <div className="absolute inset-x-0 top-1/4 h-[350px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-subtle"></div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center justify-center text-center p-6 relative z-10"
            >
              <BrandLogoBig className="mb-8" />
              <div className="w-56 h-[4px] bg-slate-950 border border-purple-500/15 rounded-full overflow-hidden relative shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                <div className="absolute top-0 bottom-0 h-full bg-gradient-to-r from-purple-600 via-purple-400 to-purple-500 rounded-full animate-loadingBar w-full" />
              </div>

              <AnimatePresence mode="wait">
                <motion.span
                  key={splashPhase}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.35 }}
                  className="text-[9.5px] font-sans font-bold uppercase tracking-[0.2em] text-purple-400 mt-4 filter drop-shadow-[0_0_4px_rgba(139,92,246,0.2)]"
                >
                  {splashPhase}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1.5. SIGNING IN GOOGLE LOADING OVERLAY */}
      <AnimatePresence>
        {isSigningIn && (
          <motion.div
            id="signing-in-overlay"
            className="fixed inset-0 bg-[#07090D] z-[9998] flex flex-col items-center justify-center select-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="absolute inset-x-0 top-1/4 h-[300px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-subtle"></div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center justify-center text-center p-6 relative z-10"
            >
              <div className="relative shrink-0 mb-6">
                <div className="absolute -inset-3 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative w-16 h-16 bg-[#111827] border border-purple-500/30 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                  <svg className="animate-spin-slow h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-15" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>

              <h3 className="text-white text-md font-display font-medium tracking-wide mb-1 uppercase">Entrando...</h3>
              <p className="text-slate-400 text-[10.5px] font-sans max-w-xs leading-relaxed">
                Autenticando e sincronizando suas credenciais do Google...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab transition loader bar */}
      <AnimatePresence>
        {isTabChanging && (
          <>
            <div className="fixed inset-0 bg-transparent z-[9997] cursor-wait" />
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

      {/* Centralized Action loader dialogue */}
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
                <div className="absolute -inset-1.5 bg-purple-500/15 rounded-full blur animate-pulse animate-pulse-subtle"></div>
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

      {/* Decorative top background gradient */}
      <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none z-0"></div>

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center relative z-10 h-full">
        {!isLoggedIn ? (
          /* PRE-AUTHENTICATION SCREEN WITH HIGH ACCURACY PRESETS */
          <div className="w-full min-h-[85vh] flex flex-col justify-center items-center px-4 relative">
            <div className="w-full max-w-md bg-[#111827]/80 backdrop-blur-xl border border-purple-500/20 shadow-[0_0_40px_rgba(139,92,246,0.15)] rounded-3xl p-10 flex flex-col justify-center items-center relative overflow-hidden animate-fade-in glow-purple">
              
              <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col items-center justify-center mb-8 relative z-10">
                <BrandLogoBig />
              </div>

              <p className="text-center text-slate-300 text-xs md:text-sm font-sans mb-8 leading-relaxed max-w-xs relative z-10">
                Boas-vindas ao RevendaX. Monitore seus lucros, ordens e estoque com controle total em um só lugar.
              </p>

              {!isOnline && (
                <div className="w-full mb-5 bg-amber-500/15 border border-amber-500/20 text-amber-500 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-semibold relative z-10 animate-fade-in font-sans">
                  <WifiOff size={16} className="shrink-0 animate-pulse text-amber-400" />
                  <span>Você está desconectado. Conecte-se à internet para realizar login com o Google.</span>
                </div>
              )}

              <button
                id="login-google-btn"
                onClick={handleGoogleLogin}
                disabled={!isOnline}
                className="w-full py-4 px-6 bg-white hover:bg-slate-105 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(139,92,246,0.3)] rounded-2xl transition-all duration-300 flex items-center justify-center gap-3.5 cursor-pointer font-sans font-bold text-sm transform hover:-translate-y-0.5 enabled:active:scale-95 group relative z-10"
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
                RevendaX Security Protocol • v3.9.4
              </div>
            </div>
          </div>
        ) : (
          /* POST-AUTHENTICATION VIEWPORT (COMPACT SIMULATOR FRAME) */
          <div className="w-full h-screen flex relative overflow-hidden bg-[#07090D]">
            {/* INLINE CUSTOM SIDEBAR REPLACEMENT */}
            <Sidebar 
              activeTab={activeTab}
              handleTabChange={handleTabChange}
              handleLogout={handleLogout}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              userProfile={userProfile}
              soundEnabled={soundEnabled}
              onOpenInstallGuide={() => setShowInstallGuideModal(true)}
              userPlan={userPlan}
              isMaster={isMasterAccount}
            />

            {/* MAIN SHELL VIEWPORT */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
              
              {/* COMPACT MODERN ACCENT TOP BAR HEADER */}
              <header className="h-[64px] border-b border-purple-500/10 shrink-0 flex items-center justify-between px-5 bg-[#0D1117] z-30 font-sans">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { triggerAudio("click", soundEnabled); setIsSidebarOpen(true); }}
                    className="p-1 px-1.5 text-slate-400 hover:text-white hover:bg-purple-500/10 rounded-lg cursor-pointer"
                  >
                    <Menu size={18} />
                  </button>
                  <BrandLogoCompact />
                </div>
                
                {/* Visual Actions buttons */}
                <div className="flex items-center gap-3">
                  {/* Status network connectivity */}
                  <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-purple-500/10 py-1.5 px-3 rounded-full text-[10px] font-sans font-semibold">
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-red-500 animate-pulse"}`} />
                    <span className="text-slate-400 uppercase tracking-widest">{isOnline ? "Online" : "Offline"}</span>
                  </div>

                  <button
                    id="show-notif-btn"
                    onClick={() => { triggerAudio("click", soundEnabled); setIsNotificationsOpen(true); }}
                    className="p-2 border border-purple-500/10 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl shadow-sm cursor-pointer transition relative"
                    title="Notificações"
                  >
                    {notifications.some(n => !n.read) && (
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 absolute top-1.5 right-1.5 ring-2 ring-[#0D1117]" />
                    )}
                    <svg className="w-[16px] h-[16px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </button>
                </div>
              </header>

              {/* INNER SCROLLABLE ACTIVE WRAPPER VIEWPORT */}
              <div className="flex-1 overflow-y-auto">
                <main className="p-5 md:p-7 pb-24 lg:pb-7 relative z-10 max-w-5xl mx-auto w-full">
                <AnimatePresence mode="wait">
                  {activeTab === "dashboard" && (
                    <Dashboard
                      key="dashboard"
                      timeFilter={timeFilter}
                      setTimeFilter={setTimeFilter}
                      setIsCustomDateModalOpen={setIsCustomDateModalOpen}
                      customStartDate={customStartDate}
                      customEndDate={customEndDate}
                      setCustomStartDate={setCustomStartDate}
                      setCustomEndDate={setCustomEndDate}
                      showValues={showValues}
                      setShowValues={setShowValues}
                      dashboardStats={dashboardStats}
                      handlePortfolioAIAnalysis={handlePortfolioAIAnalysis}
                      isAnalyzing={isAnalyzing}
                      aiReport={aiReport}
                      profitTimelineData={profitTimelineData}
                      categoryChartData={categoryChartData}
                      stats={stats}
                      setActiveTab={handleTabChange}
                      soundEnabled={soundEnabled}
                    />
                  )}

                  {activeTab === "produtos" && (
                    <Produtos
                      key="produtos"
                      filteredProducts={filteredProducts}
                      setIsFormOpen={setIsFormOpen}
                      productSearch={productSearch}
                      setProductSearch={setProductSearch}
                      productCategoryFilter={productCategoryFilter}
                      setProductCategoryFilter={setProductCategoryFilter}
                      productStatusFilter={productStatusFilter}
                      setProductStatusFilter={setProductStatusFilter}
                      startEditProduct={startEditProduct}
                      handleDeleteProduct={handleDeleteProduct}
                      setSelectedProduct={setSelectedProduct}
                      soundEnabled={soundEnabled}
                    />
                  )}

                  {activeTab === "estoque" && (
                    <Estoque
                      key="estoque"
                      products={products}
                      stats={stats}
                      setSelectedProduct={setSelectedProduct}
                      soundEnabled={soundEnabled}
                    />
                  )}

                  {activeTab === "relatorios" && (
                    <Relatorios
                      key="relatorios"
                      products={products}
                      stats={stats}
                      soundEnabled={soundEnabled}
                    />
                  )}

                  {activeTab === "metas" && (
                    <Metas
                      key="metas"
                      setEditingGoal={setEditingGoal}
                      setGoalTitle={setGoalTitle}
                      setGoalTargetAmount={setGoalTargetAmount}
                      setIsGoalFormOpen={setIsGoalFormOpen}
                      activeGoal={activeGoal}
                      handleEditGoalClick={handleEditGoalClick}
                      handleDeleteGoal={handleDeleteGoal}
                      goalProgressPercent={goalProgressPercent}
                      stats={stats}
                      goals={goals}
                      soundEnabled={soundEnabled}
                    />
                  )}

                  {activeTab === "planos" && isMasterAccount && (
                    <Planos
                      key="planos"
                      userPlan={userPlan}
                      setUserPlan={(plan) => {
                        triggerAudio("success", soundEnabled);
                        setUserPlan(plan);
                        localStorage.setItem("revendax_user_plan", plan);
                      }}
                      setNotifications={setNotifications}
                      soundEnabled={soundEnabled}
                    />
                  )}

                  {activeTab === "perfil" && (
                    <Perfil
                      key="perfil"
                      userProfile={userProfile}
                      userPlan={userPlan}
                      stats={stats}
                      setActiveTab={handleTabChange}
                      handleLogout={handleLogout}
                      isOnline={isOnline}
                      soundEnabled={soundEnabled}
                      setSoundEnabled={setSoundEnabled}
                      isMasterAccount={isMasterAccount}
                    />
                  )}
                </AnimatePresence>
              </main>
            </div>
          </div>

            {/* MOBILE BOTTOM NAVIGATION BAR */}
            <div className="fixed bottom-0 left-0 right-0 h-[68px] bg-[#0D1117]/95 backdrop-blur-md border-t border-purple-500/10 lg:hidden flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)] z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
              {/* TAB 1: Início */}
              <button
                onClick={() => handleTabChange("dashboard")}
                className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-all ${
                  activeTab === "dashboard"
                    ? "text-purple-500"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span
                  style={{
                    display: "inline-block",
                    transformOrigin: "center",
                    animation: activeTab === "dashboard" ? "navPulse 2s ease-in-out infinite" : "none"
                  }}
                >
                  <Layers
                    size={20}
                    className={activeTab === "dashboard" ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : ""}
                  />
                </span>
                <span className="text-[10px] font-sans font-semibold mt-1">Início</span>
              </button>

              {/* TAB 2: Estoque */}
              <button
                onClick={() => handleTabChange("estoque")}
                className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-all ${
                  activeTab === "estoque"
                    ? "text-purple-500"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span
                  style={{
                    display: "inline-block",
                    transformOrigin: "center",
                    animation: activeTab === "estoque" ? "navWiggle 0.4s ease-in-out" : "none"
                  }}
                >
                  <Package
                    size={20}
                    className={activeTab === "estoque" ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : ""}
                  />
                </span>
                <span className="text-[10px] font-sans font-semibold mt-1">Estoque</span>
              </button>

              {/* ADD FLOAT BUTTON (MIDDLE) */}
              <div className="flex-1 flex justify-center h-full relative">
                <button
                  onClick={() => {
                    triggerAudio("click", soundEnabled);
                    setIsFormOpen(true);
                  }}
                  className="w-13 h-13 rounded-full bg-gradient-to-tr from-purple-700 to-purple-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.55)] border-4 border-[#07090D] transform active:scale-90 transition-all -translate-y-4 cursor-pointer hover:shadow-[0_0_25px_rgba(168,85,247,0.8)]"
                  title="Cadastrar Novo Produto"
                >
                  <span
                    style={{
                      display: "inline-flex",
                      transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                      transform: plusHovered ? "rotate(90deg)" : "rotate(0deg)"
                    }}
                    onMouseEnter={() => setPlusHovered(true)}
                    onMouseLeave={() => setPlusHovered(false)}
                  >
                    <Plus size={24} strokeWidth={2.5} />
                  </span>
                </button>
              </div>

              {/* TAB 3: Vendas */}
              <button
                onClick={() => handleTabChange("produtos")}
                className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-all ${
                  activeTab === "produtos"
                    ? "text-purple-500"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span
                  style={{
                    display: "inline-block",
                    transformOrigin: "center",
                    animation: activeTab === "produtos" ? "navBounce 0.5s cubic-bezier(0.34,1.56,0.64,1)" : "none"
                  }}
                >
                  <ShoppingBag
                    size={20}
                    className={activeTab === "produtos" ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : ""}
                  />
                </span>
                <span className="text-[10px] font-sans font-semibold mt-1">Vendas</span>
              </button>

              {/* TAB 4: Metas */}
              <button
                onClick={() => handleTabChange("metas")}
                className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-all ${
                  activeTab === "metas"
                    ? "text-purple-500"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span
                  style={{
                    display: "inline-block",
                    transformOrigin: "center",
                    animation: activeTab === "metas" ? "navBounce 0.5s ease-in-out" : "none"
                  }}
                >
                  <Target
                    size={20}
                    className={activeTab === "metas" ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : ""}
                  />
                </span>
                <span className="text-[10px] font-sans font-semibold mt-1">Metas</span>
              </button>
            </div>

            {/* ------------------ MODALS AND NOTIFICATIONS DRAWERS ----------------- */}
            <NotificationsDrawer
              isNotificationsOpen={isNotificationsOpen}
              setIsNotificationsOpen={setIsNotificationsOpen}
              notifications={notifications}
              markNotificationAsRead={markNotificationAsRead}
              markAllAsRead={markAllAsRead}
              clearNotifications={clearNotifications}
            />

            <LimitModal
              showLimitModal={showLimitModal}
              setShowLimitModal={setShowLimitModal}
              limitModalType={limitModalType}
              setActiveTab={handleTabChange}
              soundEnabled={soundEnabled}
              isMasterAccount={isMasterAccount}
            />

            <DeleteConfirmModal
              isOpen={!!productToDelete}
              onClose={() => setProductToDelete(null)}
              onConfirm={handleConfirmDeleteProduct}
              title="Excluir Produto"
              description="Tem certeza de que deseja excluir este produto? Esta ação não poderá ser desfeita e removerá permanentemente o item do estoque."
              soundEnabled={soundEnabled}
              confirmBtnId="confirm-delete-product-btn"
            />

            <DeleteConfirmModal
              isOpen={!!goalToDelete}
              onClose={() => setGoalToDelete(null)}
              onConfirm={() => {
                if (goalToDelete) {
                  handleConfirmDeleteGoal(goalToDelete);
                }
              }}
              title="Excluir Meta"
              description="Tem certeza de que deseja excluir esta meta?"
              soundEnabled={soundEnabled}
              confirmBtnId="confirm-delete-goal-btn"
            />

            {/* PRODUCT DETAIL / FICHA TECNICA DIALOG OVERLAY */}
            <AnimatePresence>
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
                        onClick={() => { triggerAudio("click", soundEnabled); setSelectedProduct(null); }} 
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-purple-500/10 transition-all cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="h-40 w-full rounded-2xl bg-[#0D1117] border border-purple-500/10 overflow-hidden relative mb-4">
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 bg-[#111827]/95 border border-purple-500/15 px-2.5 py-1 rounded-lg text-[9.5px] font-sans font-bold text-white shadow-sm">
                        {selectedProduct.category}
                      </div>
                    </div>

                    <h3 className="font-sans font-extrabold text-base text-white mt-1 pr-6 tracking-tight line-clamp-2 leading-snug">{selectedProduct.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal m-0 italic mb-4 font-sans font-medium">"{selectedProduct.observacoes || 'Nenhuma nota de conservação anotada.'}"</p>

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
                          <div className="flex gap-4 items-start relative pl-4 ml-2 animate-fade-in animate-slide-up">
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
                        className="bg-transparent hover:bg-purple-500/5 border border-purple-500/15 text-red-500/80 py-2.5 rounded-xl transition-all font-sans font-semibold px-4 cursor-pointer text-xs"
                      >
                        Excluir
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ADD / EDIT PRODUCT DIALOG MODAL */}
            {isFormOpen && (
              <motion.div 
                className="fixed inset-0 bg-[#07090D]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div 
                  className="bg-[#111827] border border-purple-500/15 rounded-3xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto relative animate-slide-up shadow-xl animate-fade-in"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                >
                  <div className="flex justify-between items-center mb-5 font-sans">
                    <h3 className="font-sans font-extrabold text-base text-white m-0">
                      {editingProduct ? "Editar Produto" : "Novo Produto"}
                    </h3>
                    <button 
                      onClick={() => { triggerAudio("click", soundEnabled); setIsFormOpen(false); setEditingProduct(null); clearFormFields(); }}
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
                        onChange={(e) => { setFormName(e.target.value); triggerAudio("click", soundEnabled); }}
                        className="w-full bg-[#0D1117] border border-purple-500/15 py-3 px-3.5 rounded-xl focus:outline-none focus:border-purple-500 text-white font-semibold focus:bg-[#0D1117] transition-all text-xs placeholder-slate-650"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 uppercase tracking-widest block mb-1.5 font-sans font-bold text-[10px]">Categoria</label>
                      <select 
                        id="form-product-category"
                        value={formCategory}
                        onChange={(e) => { setFormCategory(e.target.value as ProductCategory); triggerAudio("click", soundEnabled); }}
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
                          onChange={(e) => { setFormValorInvestido(e.target.value); triggerAudio("click", soundEnabled); }}
                          className="w-full bg-[#0D1117] border border-purple-500/15 py-3 px-3.5 rounded-xl focus:outline-none focus:border-purple-500 text-white font-semibold focus:bg-[#0D1117] transition-all text-xs font-mono placeholder-slate-650"
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
                          onChange={(e) => { setFormValorVenda(e.target.value); triggerAudio("click", soundEnabled); }}
                          className="w-full bg-[#0D1117] border border-purple-500/15 py-3 px-3.5 rounded-xl focus:outline-none focus:border-purple-500 text-white font-semibold focus:bg-[#0D1117] transition-all text-xs font-mono placeholder-slate-650"
                        />
                      </div>
                    </div>

                    {suggestedCost.price > 0 && (
                      <div className="p-3 bg-purple-500/5 border border-purple-500/15 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-1 text-purple-400 font-sans font-extrabold text-[10px] uppercase tracking-wider">
                          <Brain size={11} className="filter drop-shadow-[0_0_2px_rgba(139,92,246,0.4)]" /> Sugestão IA Pronta
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
                          onChange={(e) => { setFormFrete(e.target.value); triggerAudio("click", soundEnabled); }}
                          className="w-full bg-[#0D1117] border border-purple-500/15 py-3 px-3.5 rounded-xl focus:outline-none focus:border-purple-500 text-white font-semibold focus:bg-[#0D1117] transition-all text-xs font-mono placeholder-slate-650"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 uppercase tracking-widest block mb-1.5 font-sans font-bold text-[10px]">Taxas/Overhead (R$)</label>
                        <input 
                          id="form-product-taxas"
                          type="number" 
                          placeholder="Impostos/Maquininha" 
                          value={formTaxas}
                          onChange={(e) => { setFormTaxas(e.target.value); triggerAudio("click", soundEnabled); }}
                          className="w-full bg-[#0D1117] border border-purple-500/15 py-3 px-3.5 rounded-xl focus:outline-none focus:border-purple-500 text-white font-semibold focus:bg-[#0D1117] transition-all text-xs font-mono placeholder-slate-650"
                        />
                      </div>
                    </div>

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
                            <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-extrabold mb-1">Lucro Líquido Previsto</span>
                            <span className={`text-base font-black ${netReturn >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                              R$ {netReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-450 block uppercase tracking-wider font-extrabold mb-1">Margem / ROI</span>
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
                        onChange={(e) => { setFormStatus(e.target.value as ProductStatus); triggerAudio("click", soundEnabled); }}
                        className="w-full bg-[#0D1117] border border-purple-500/15 py-3 px-3.5 rounded-xl text-white focus:outline-none focus:border-purple-500 font-semibold cursor-pointer text-xs"
                      >
                        <option value="Em estoque" className="bg-[#111827] text-white">Em estoque (Pronta Entrega)</option>
                        <option value="Reservado" className="bg-[#111827] text-white">Reservado (Com Sinal)</option>
                        <option value="Vendido" className="bg-[#111827] text-white">Vendido (Concluído)</option>
                      </select>
                    </div>

                    {formStatus !== "Em estoque" && (
                      <div className="grid grid-cols-2 gap-3 animate-slide-up">
                        <div>
                          <label className="text-slate-400 uppercase tracking-widest block mb-1.5 font-sans font-bold text-[10px]">Comprador/Cliente</label>
                          <input 
                            id="form-product-cliente"
                            type="text" 
                            placeholder="Nome do cliente" 
                            value={formCliente}
                            onChange={(e) => { setFormCliente(e.target.value); triggerAudio("click", soundEnabled); }}
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
                                onClick={() => { setFormFormaPagamento(method); triggerAudio("click", soundEnabled); }}
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
                          <div className="flex items-center gap-3 overflow-hidden bg-transparent">
                            <div className="w-12 h-12 rounded-lg bg-[#111827] border border-purple-500/10 overflow-hidden shrink-0 flex items-center justify-center">
                              <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <div className="overflow-hidden bg-transparent">
                              <span className="text-[10px] text-emerald-400 font-sans font-bold block">Foto carregada!</span>
                              <span className="text-[9px] text-slate-400 font-sans block">Sincronizada no inventário</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => { triggerAudio("click", soundEnabled); setFormImageUrl(""); }}
                            className="text-[11px] bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 py-1.5 px-2.5 rounded-lg font-sans font-bold cursor-pointer transition-all shrink-0"
                          >
                            Remover
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
                              <span className="block text-[10px] text-slate-500 font-sans mt-0.5">Upar direto do seu celular</span>
                            </div>
                          </label>
                        </div>
                      )}

                      <div className="mt-2.5">
                        <details className="group">
                          <summary className="text-[10px] text-slate-450 hover:text-white font-sans font-bold tracking-wide cursor-pointer list-none flex items-center gap-1 leading-none select-none">
                            <span className="inline-block transition-transform duration-200 group-open:rotate-90 text-[8px]">▶</span>
                            Ou usar link da internet...
                          </summary>
                          <div className="mt-2 pl-2 border-l border-purple-500/10 animate-fade-in animate-slide-up">
                            <input 
                              id="form-product-image"
                              type="text" 
                              placeholder="https://suafoto.com/imagem.png" 
                              value={formImageUrl}
                              onChange={(e) => { setFormImageUrl(e.target.value); }}
                              className="w-full bg-[#0D1117] border border-purple-500/15 py-2 px-3 rounded-lg focus:outline-none focus:border-purple-500 text-white text-[11px] font-semibold placeholder-slate-650"
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
                        onChange={(e) => { setFormObservacoes(e.target.value); triggerAudio("click", soundEnabled); }}
                        rows={2}
                        className="w-full bg-[#0D1117] border border-purple-500/15 py-2.5 px-3 rounded-xl text-white focus:outline-none text-xs font-semibold focus:bg-[#0D1117] transition-all shadow-inner placeholder-slate-650"
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
                            <span>Salvando...</span>
                          </>
                        ) : (
                          editingProduct ? "Salvar Mudanças" : "Finalizar Cadastro"
                        )}
                      </button>
                      <button 
                        id="form-product-cancel"
                        type="button"
                        disabled={isSavingProduct}
                        onClick={() => { triggerAudio("click", soundEnabled); setIsFormOpen(false); setEditingProduct(null); clearFormFields(); }}
                        className="bg-transparent hover:bg-purple-600/5 disabled:opacity-40 disabled:cursor-not-allowed border border-purple-500/15 text-slate-400 py-3 rounded-xl transition-all font-sans px-4 cursor-pointer text-xs font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}

            {/* ADJUST PLAN / GOALS DIALOG MODAL */}
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
                  <div className="flex justify-between items-center mb-4 font-sans">
                    <h3 className="font-sans font-extrabold text-base text-white m-0">
                      {editingGoal ? "Editar Meta de Lucro" : "Criar Nova Meta de Lucro"}
                    </h3>
                    <button 
                      onClick={() => { triggerAudio("click", soundEnabled); setIsGoalFormOpen(false); setGoalTargetAmount(""); setGoalTitle(""); setEditingGoal(null); }} 
                      className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-purple-500/10 transition cursor-pointer"
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
                        className="w-full bg-[#0D1117] border border-purple-500/15 py-2.5 px-3 rounded-xl focus:outline-none focus:border-purple-500 text-white text-xs font-semibold placeholder-slate-650 focus:bg-[#0D1117]"
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
                        onChange={(e) => { setGoalTargetAmount(e.target.value); triggerAudio("click", soundEnabled); }}
                        className="w-full bg-[#0D1117] border border-purple-500/15 py-3 px-3.5 rounded-xl focus:outline-none focus:border-purple-500 text-center text-white text-lg font-mono font-bold focus:bg-[#0D1117] placeholder-slate-650"
                      />
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

            {/* HIGH FIDELITY PERIOD CUSTOM INTERVAL MODAL */}
            <AnimatePresence>
             {isCustomDateModalOpen && (
               <motion.div
                 className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 select-none font-sans flex items-center justify-center animate-fade-in"
                 style={{ padding: '16px' }}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
               >
                 <motion.div
                   className="bg-[#111827] border border-purple-500/15 rounded-3xl relative shadow-2xl text-center w-full"
                   style={{ maxWidth: 'min(300px, calc(100vw - 32px))', width: '100%' }}
                   initial={{ scale: 0.93, y: 10 }}
                   animate={{ scale: 1, y: 0 }}
                   exit={{ scale: 0.93, y: 10 }}
                   transition={{ type: "spring", damping: 25 }}
                 >
                   {/* Padding interno separado para não conflitar com largura */}
                   <div className="p-5">

                     {/* Botão fechar */}
                     <button
                       onClick={() => { triggerAudio("click", soundEnabled); setIsCustomDateModalOpen(false); }}
                       className="absolute top-3.5 right-3.5 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-all"
                       title="Fechar"
                     >
                       <X size={14} />
                     </button>

                     {/* Ícone */}
                     <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-2.5">
                       <Calendar size={18} />
                     </div>

                     {/* Título */}
                     <h4 className="font-sans font-black text-white text-xs uppercase tracking-wider mb-1.5">
                       Intervalo Customizado
                     </h4>
                     <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                       Defina o período desejado para filtrar os resultados:
                     </p>

                     {/* Campos de data */}
                     <div className="flex flex-col gap-3 mb-4 text-left">
                       <div>
                         <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                           Data Inicial
                         </label>
                         <div className="relative w-full block">
                           <input
                             type="date"
                             value={customStartDate}
                             onChange={(e) => setCustomStartDate(e.target.value)}
                             className="w-full bg-[#0D1117] border border-purple-500/10 focus:border-purple-500/30 rounded-xl px-3 py-2 text-xs font-sans outline-none font-medium text-center box-border block relative overflow-hidden cursor-pointer"
                             style={{
                               colorScheme: "dark",
                               color: customStartDate ? "#ffffff" : "#6B7280",
                               maxWidth: "100%",
                               width: "100%",
                               display: "block",
                               minHeight: "unset",
                               height: "36px",
                               lineHeight: "normal",
                               WebkitAppearance: "none",
                               appearance: "none",
                               boxSizing: "border-box",
                             }}
                           />
                         </div>
                       </div>

                       <div>
                         <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">
                           Data Final
                         </label>
                         <div className="relative w-full block">
                           <input
                             type="date"
                             value={customEndDate}
                             onChange={(e) => setCustomEndDate(e.target.value)}
                             className="w-full bg-[#0D1117] border border-purple-500/10 focus:border-purple-500/30 rounded-xl px-3 py-2 text-xs font-sans outline-none font-medium text-center box-border block relative overflow-hidden cursor-pointer"
                             style={{
                               colorScheme: "dark",
                               color: customEndDate ? "#ffffff" : "#6B7280",
                               maxWidth: "100%",
                               width: "100%",
                               display: "block",
                               minHeight: "unset",
                               height: "36px",
                               lineHeight: "normal",
                               WebkitAppearance: "none",
                               appearance: "none",
                               boxSizing: "border-box",
                             }}
                           />
                         </div>
                       </div>
                     </div>

                     {/* Botões */}
                     <div className="flex gap-2">
                       <button
                         onClick={() => {
                           triggerAudio("click", soundEnabled);
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
                           triggerAudio("click", soundEnabled);
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

                   </div>
                 </motion.div>
               </motion.div>
             )}
            </AnimatePresence>

          </div>
        )}
      </div>

      <PwaInstallModal
        showPwaPrompt={showPwaPrompt}
        handlePwaInstall={handlePwaInstall}
        dismissPwaPrompt={dismissPwaPrompt}
        showInstallGuideModal={showInstallGuideModal}
        setShowInstallGuideModal={setShowInstallGuideModal}
        soundEnabled={soundEnabled}
      />
    </div>
  );
}
