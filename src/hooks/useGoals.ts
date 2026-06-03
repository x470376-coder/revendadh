import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc } from "firebase/firestore";
import { db, OperationType, handleFirestoreError } from "../firebase";
import { Goal } from "../types";
import { triggerAudio } from "../utils/audioUtils";

export function useGoals(
  firebaseUid: string | null,
  soundEnabled: boolean,
  currentLucroRealizado: number,
  addNotification: (title: string, message: string, type: "success" | "warning" | "goal" | "info") => Promise<void>
) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);

  // Sync goals in real-time
  useEffect(() => {
    if (!firebaseUid) {
      // Load from localStorage if offline / not logged in
      const saved = localStorage.getItem("revendax_goals");
      setGoals(saved ? JSON.parse(saved) : []);
      setIsLoadingGoals(false);
      return;
    }

    setIsLoadingGoals(true);
    const q = query(collection(db, "goals"), where("ownerId", "==", firebaseUid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Goal[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Goal);
        });
        setGoals(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        setIsLoadingGoals(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `goals`);
        setIsLoadingGoals(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUid]);

  const saveGoal = async (title: string, targetAmount: number, editingGoal: Goal | null) => {
    const titleText = title.trim() || `Ganhar R$ ${targetAmount.toLocaleString("pt-BR")} este mês`;
    const now = new Date();
    const currentMonthStr = String(now.getMonth() + 1).padStart(2, "0");
    const currentYearStr = String(now.getFullYear());

    if (editingGoal) {
      const updatedGoal: Goal = {
        ...editingGoal,
        title: titleText,
        targetAmount: targetAmount,
        achievedAmount: currentLucroRealizado,
      };

      if (firebaseUid) {
        await setDoc(doc(db, "goals", updatedGoal.id), { ...updatedGoal, ownerId: firebaseUid });
        await addNotification(
          "🎯 Meta Atualizada",
          `Sua meta "${titleText}" foi atualizada para R$ ${targetAmount.toLocaleString("pt-BR")}.`,
          "info"
        );
      } else {
        setGoals((prev) => {
          const next = prev.map((g) => (g.id === editingGoal.id ? updatedGoal : g));
          localStorage.setItem("revendax_goals", JSON.stringify(next));
          return next;
        });
        await addNotification(
          "🎯 Meta Atualizada",
          `Sua meta "${titleText}" foi atualizada para R$ ${targetAmount.toLocaleString("pt-BR")}.`,
          "info"
        );
      }
    } else {
      const newGoal: Goal = {
        id: `goal-${Date.now()}`,
        title: titleText,
        targetAmount: targetAmount,
        achievedAmount: currentLucroRealizado,
        deadlineMonth: currentMonthStr,
        deadlineYear: currentYearStr,
        createdAt: new Date().toISOString(),
      };

      if (firebaseUid) {
        await setDoc(doc(db, "goals", newGoal.id), { ...newGoal, ownerId: firebaseUid });
        await addNotification(
          "🎯 Meta Criada",
          `Sua nova meta de faturamento é "${titleText}" de R$ ${targetAmount.toLocaleString("pt-BR")}. Rumo ao topo!`,
          "info"
        );
      } else {
        setGoals((prev) => {
          const next = [newGoal, ...prev];
          localStorage.setItem("revendax_goals", JSON.stringify(next));
          return next;
        });
        await addNotification(
          "🎯 Meta Criada",
          `Sua nova meta de faturamento é "${titleText}" de R$ ${targetAmount.toLocaleString("pt-BR")}. Rumo ao topo!`,
          "info"
        );
      }
    }

    triggerAudio("goal", soundEnabled);
  };

  const deleteGoal = async (goalId: string) => {
    if (firebaseUid) {
      await deleteDoc(doc(db, "goals", goalId));
      await addNotification(
        "🗑️ Meta Apagada",
        "Uma meta financeira foi removida do seu painel.",
        "warning"
      );
    } else {
      setGoals((prev) => {
        const next = prev.filter((g) => g.id !== goalId);
        localStorage.setItem("revendax_goals", JSON.stringify(next));
        return next;
      });
      await addNotification(
        "🗑️ Meta Apagada",
        "Uma meta financeira foi removida do seu painel.",
        "warning"
      );
    }
    triggerAudio("click", soundEnabled);
  };

  return {
    goals,
    setGoals,
    isLoadingGoals,
    saveGoal,
    deleteGoal,
  };
}
