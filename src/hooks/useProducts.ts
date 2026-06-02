import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc } from "firebase/firestore";
import { db, OperationType, handleFirestoreError } from "../firebase";
import { Product, TradeNotification, CATEGORY_IMAGES } from "../types";
import { triggerAudio } from "./useGoals"; // We can define a generic triggerAudio here or let useGoals export it

export function useProducts(
  firebaseUid: string | null,
  userPlan: "free" | "pro" | "premium" | "empresarial",
  soundEnabled: boolean,
  addNotification: (title: string, message: string, type: "success" | "warning" | "goal" | "info") => Promise<void>
) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Sync products in real-time
  useEffect(() => {
    if (!firebaseUid) {
      // Load from localStorage if offline / not logged in
      const saved = localStorage.getItem("revendax_products");
      setProducts(saved ? JSON.parse(saved) : []);
      setIsLoadingProducts(false);
      return;
    }

    setIsLoadingProducts(true);
    const q = query(collection(db, "products"), where("ownerId", "==", firebaseUid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Product[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Product);
        });
        setProducts(list.sort((a, b) => b.dataEntrada.localeCompare(a.dataEntrada)));
        setIsLoadingProducts(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `products`);
        setIsLoadingProducts(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUid]);

  // Save changes to localStorage when not logged in
  useEffect(() => {
    if (!firebaseUid && products.length > 0) {
      localStorage.setItem("revendax_products", JSON.stringify(products));
    }
  }, [products, firebaseUid]);

  const saveProduct = async (
    formValues: {
      id?: string;
      name: string;
      category: any;
      valorInvestido: number;
      valorVenda: number;
      frete: number;
      taxas: number;
      cliente: string;
      formaPagamento: string;
      status: any;
      observacoes: string;
      imageUrl: string;
    },
    editingProduct: Product | null,
    onLimitExceeded: (type: "products" | "sales") => void
  ): Promise<boolean> => {
    // Subscription limits validation
    if (userPlan === "free") {
      if (!editingProduct) {
        // Creating new product
        if (products.length >= 3) {
          onLimitExceeded("products");
          triggerAudio("stagnation", soundEnabled);
          return false;
        }
        if (formValues.status === "Vendido") {
          const soldCount = products.filter((p) => p.status === "Vendido").length;
          if (soldCount >= 3) {
            onLimitExceeded("sales");
            triggerAudio("stagnation", soundEnabled);
            return false;
          }
        }
      } else {
        // Editing existing product
        const wasSoldBefore = editingProduct.status === "Vendido";
        if (!wasSoldBefore && formValues.status === "Vendido") {
          const soldCount = products.filter((p) => p.status === "Vendido").length;
          if (soldCount >= 3) {
            onLimitExceeded("sales");
            triggerAudio("stagnation", soundEnabled);
            return false;
          }
        }
      }
    }

    setIsSavingProduct(true);

    try {
      const savedImg = formValues.imageUrl.trim() || CATEGORY_IMAGES[formValues.category];

      const prodData: Product = {
        id: editingProduct?.id || `prod-${Date.now()}`,
        name: formValues.name,
        category: formValues.category,
        valorInvestido: formValues.valorInvestido,
        valorVenda: formValues.valorVenda,
        frete: formValues.frete,
        taxas: formValues.taxas,
        cliente: formValues.cliente,
        formaPagamento: formValues.formaPagamento,
        status: formValues.status,
        dataEntrada: editingProduct?.dataEntrada || new Date().toISOString().split("T")[0],
        imageUrl: savedImg,
        observacoes: formValues.observacoes,
      };

      if (formValues.status === "Vendido") {
        prodData.dataVenda = editingProduct?.dataVenda || new Date().toISOString().split("T")[0];
      }

      if (editingProduct) {
        // Modify
        if (firebaseUid) {
          await setDoc(doc(db, "products", prodData.id), { ...prodData, ownerId: firebaseUid });
          await addNotification(
            "Produto Atualizado",
            `As especificações de "${formValues.name}" foram modificadas com sucesso.`,
            "info"
          );
        } else {
          setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? prodData : p)));
          await addNotification(
            "Produto Atualizado",
            `As especificações de "${formValues.name}" foram modificadas com sucesso.`,
            "info"
          );
        }
      } else {
        // Create new
        if (firebaseUid) {
          await setDoc(doc(db, "products", prodData.id), { ...prodData, ownerId: firebaseUid });
          await addNotification(
            formValues.status === "Vendido" ? "🏆 Nova Venda Registrada!" : "Estoque Adicionado",
            formValues.status === "Vendido"
              ? `Arbitragem concluída para "${formValues.name}". Lucro gerado imediato!`
              : `Item "${formValues.name}" integrado nas prateleiras virtuais.`,
            formValues.status === "Vendido" ? "success" : "info"
          );
        } else {
          setProducts((prev) => [prodData, ...prev]);
          await addNotification(
            formValues.status === "Vendido" ? "🏆 Nova Venda Registrada!" : "Estoque Adicionado",
            formValues.status === "Vendido"
              ? `Arbitragem concluída para "${formValues.name}". Lucro gerado imediato!`
              : `Item "${formValues.name}" integrado nas prateleiras virtuais.`,
            formValues.status === "Vendido" ? "success" : "info"
          );
        }

        if (formValues.status === "Vendido") {
          triggerAudio("success", soundEnabled);
        }
      }
      return true;
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      return false;
    } finally {
      setIsSavingProduct(false);
    }
  };

  const deleteProduct = async (id: string, name: string) => {
    try {
      if (firebaseUid) {
        await deleteDoc(doc(db, "products", id));
        await addNotification(
          "Produto Removido",
          `"${name}" foi excluído permanentemente da plataforma.`,
          "warning"
        );
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        await addNotification(
          "Produto Removido",
          `"${name}" foi excluído permanentemente da plataforma.`,
          "warning"
        );
      }
      triggerAudio("click", soundEnabled);
    } catch (err) {
      console.error("Erro ao deletar produto:", err);
    }
  };

  return {
    products,
    setProducts,
    isLoadingProducts,
    isSavingProduct,
    saveProduct,
    deleteProduct,
  };
}
