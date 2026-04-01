import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// VAPID public key — must match the one in edge function secrets
const VAPID_PUBLIC_KEY = "BDsm_AgrpCM_xlGVORMMzdFPMB_yfKgVRkxfQqLnjuisBe1mFnx2W-eVBsMixOePUZagJd2yFkJk6hmAqftl8JLw";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function isPreviewEnvironment(): boolean {
  if (typeof window === "undefined") return true;
  // Don't register SW in iframes or Lovable preview
  if (window.self !== window.top) return true;
  if (window.location.hostname.includes("id-preview--")) return true;
  return false;
}

export type PushPermissionState = "prompt" | "granted" | "denied" | "unsupported" | "preview";

export function usePushSubscription(userId: string | undefined) {
  const [permission, setPermission] = useState<PushPermissionState>("prompt");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check current state on mount
  useEffect(() => {
    if (isPreviewEnvironment()) {
      setPermission("preview");
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }

    // Check current Notification permission
    setPermission(Notification.permission as PushPermissionState);

    // Check if already subscribed
    if (userId && Notification.permission === "granted") {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      });
    }
  }, [userId]);

  // Register service worker on mount (if supported)
  useEffect(() => {
    if (isPreviewEnvironment()) return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("SW registration failed:", err);
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!userId || isPreviewEnvironment()) return false;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

    setLoading(true);
    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermissionState);
      if (perm !== "granted") {
        setLoading(false);
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      
      // Subscribe to push
      const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey.buffer as ArrayBuffer,
      });

      const subJson = sub.toJSON();
      const keys = subJson.keys!;

      // Save to database
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: userId,
          endpoint: subJson.endpoint!,
          p256dh: keys.p256dh!,
          auth: keys.auth!,
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) {
        console.error("Error saving push subscription:", error);
        setLoading(false);
        return false;
      }

      setIsSubscribed(true);
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Push subscribe error:", err);
      setLoading(false);
      return false;
    }
  }, [userId]);

  const unsubscribe = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        // Remove from DB
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", userId)
          .eq("endpoint", endpoint);
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe error:", err);
    }
    setLoading(false);
  }, [userId]);

  return { permission, isSubscribed, loading, subscribe, unsubscribe };
}
