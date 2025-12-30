import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

// VAPID public key - to be configured in app_config
const VAPID_PUBLIC_KEY_CONFIG = "vapid_public_key";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const checkSupport = async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
        await checkSubscription();
      }
      setIsLoading(false);
    };
    
    checkSupport();
  }, [user]);

  const checkSubscription = async () => {
    if (!user) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking push subscription:", error);
    }
  };

  const getVapidPublicKey = async (): Promise<string | null> => {
    const { data, error } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", VAPID_PUBLIC_KEY_CONFIG)
      .single();
    
    if (error || !data?.value) {
      console.error("VAPID public key not configured");
      return null;
    }
    return data.value;
  };

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user || !isSupported) return false;
    
    setIsLoading(true);
    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== "granted") {
        toast.error("Permission refusée pour les notifications");
        return false;
      }

      // Get VAPID key
      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) {
        toast.error("Configuration des notifications non disponible");
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const subscriptionJson = subscription.toJSON();
      
      // Save to database
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscriptionJson.keys?.p256dh || "",
          auth: subscriptionJson.keys?.auth || "",
        }, {
          onConflict: "user_id,endpoint"
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success("Notifications push activées");
      return true;
    } catch (error) {
      console.error("Error subscribing to push:", error);
      toast.error("Erreur lors de l'activation des notifications");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from database
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint);
      }

      setIsSubscribed(false);
      toast.success("Notifications push désactivées");
      return true;
    } catch (error) {
      console.error("Error unsubscribing from push:", error);
      toast.error("Erreur lors de la désactivation des notifications");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const toggle = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (enabled) {
      return subscribe();
    } else {
      return unsubscribe();
    }
  }, [subscribe, unsubscribe]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    toggle,
  };
}
