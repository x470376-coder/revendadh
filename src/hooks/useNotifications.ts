import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc } from "firebase/firestore";
import { db, OperationType, handleFirestoreError } from "../firebase";
import { TradeNotification } from "../types";

export function useNotifications(firebaseUid: string | null) {
  const [notifications, setNotifications] = useState<TradeNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  // Sync notifications in real-time
  useEffect(() => {
    if (!firebaseUid) {
      // Mock / Offline base notification
      setNotifications([
        {
          id: "notif-1",
          title: "Boas-vindas ao Xavier Brick!",
          message: "Cadastre seus produtos de iPhones, eletrônicos ou veículos para monitorar seus lucros.",
          type: "info",
          timestamp: new Date().toISOString(),
          read: false,
        },
      ]);
      setIsLoadingNotifications(false);
      return;
    }

    setIsLoadingNotifications(true);
    const q = query(collection(db, "notifications"), where("ownerId", "==", firebaseUid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: TradeNotification[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as TradeNotification);
        });
        setNotifications(list.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
        setIsLoadingNotifications(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `notifications`);
        setIsLoadingNotifications(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUid]);

  const addNotification = async (
    title: string,
    message: string,
    type: "success" | "warning" | "goal" | "info"
  ) => {
    const newNotif: TradeNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };

    if (firebaseUid) {
      await setDoc(doc(db, "notifications", newNotif.id), { ...newNotif, ownerId: firebaseUid });
    } else {
      setNotifications((prev) => [newNotif, ...prev]);
    }
  };

  const markNotificationAsRead = async (notifId: string) => {
    const target = notifications.find((n) => n.id === notifId);
    if (!target) return;

    const updated = { ...target, read: true };

    if (firebaseUid) {
      await setDoc(doc(db, "notifications", notifId), { ...updated, ownerId: firebaseUid });
    } else {
      setNotifications((prev) => prev.map((n) => (n.id === notifId ? updated : n)));
    }
  };

  const markAllAsRead = async () => {
    if (firebaseUid) {
      const promises = notifications
        .filter((n) => !n.read)
        .map((n) =>
          setDoc(doc(db, "notifications", n.id), { ...n, read: true, ownerId: firebaseUid })
        );
      await Promise.all(promises);
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const clearNotifications = async () => {
    if (firebaseUid) {
      const promises = notifications.map((n) => deleteDoc(doc(db, "notifications", n.id)));
      await Promise.all(promises);
    } else {
      setNotifications([]);
    }
  };

  return {
    notifications,
    setNotifications,
    isLoadingNotifications,
    addNotification,
    markNotificationAsRead,
    markAllAsRead,
    clearNotifications,
  };
}
