import React, { createContext, useContext, useEffect, useRef } from "react";

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { useAppSettings } from "./AppSettingsProvider";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

type NotificationsContextValue = {
  checkNotifications: () => Promise<void>;
  handleNotificationsChange: (value: boolean) => Promise<void>;
};

export const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const checkingRef = useRef(false);

  const { setNotificationsEnabled, saveUserSettings } = useAppSettings();

  const checkNotifications = async () => {
    if (checkingRef.current) return;

    const userId = session?.user?.id;
    if (!userId) return;

    checkingRef.current = true;

    try {
      const { data: settings, error: settingsError } = await supabase
        .from("user_settings")
        .select("notifications_enabled, language")
        .eq("user_id", userId)
        .maybeSingle();

      if (settingsError) throw settingsError;

      if (settings && settings.notifications_enabled === false) return;

      const { data: rows, error } = await supabase
        .from("notifications")
        .select("id, title, body, title_ar, body_ar, title_en, body_en")
        .eq("user_id", userId)
        .eq("delivered_locally", false)
        .order("created_at", { ascending: true })
        .limit(5);

      if (error) throw error;
      if (!rows?.length) return;

      for (const item of rows) {
        const isEnglish = settings?.language === "EN";

        const title = isEnglish
          ? item.title_en || item.title || "TNABBAH Alert"
          : item.title_ar || item.title || "تنبيه من تنبَّه";

        const body = isEnglish
          ? item.body_en || item.body || "You have a new notification"
          : item.body_ar || item.body || "لديك إشعار جديد";
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: true,
          },
          trigger: null,
        });

        const { error: updateError } = await supabase
          .from("notifications")
          .update({ delivered_locally: true })
          .eq("id", item.id)
          .eq("user_id", userId);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.log("Local notification check error:", error);
    } finally {
      checkingRef.current = false;
    }
  };

  const handleNotificationsChange = async (value: boolean) => {
    if (value) {
      const permission = await Notifications.getPermissionsAsync();
      let finalStatus = permission.status;

      if (finalStatus !== "granted") {
        const requested = await Notifications.requestPermissionsAsync();
        finalStatus = requested.status;
      }

      if (finalStatus !== "granted") {
        setNotificationsEnabled(false);
        await saveUserSettings({ notifications_enabled: false });
        return;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      setNotificationsEnabled(true);
      await saveUserSettings({ notifications_enabled: true });
      await checkNotifications();
      return;
    }

    setNotificationsEnabled(false);
    await saveUserSettings({ notifications_enabled: false });
  };

  /* useEffect(() => {
    checkNotifications();

    const interval = setInterval(checkNotifications, 5000);

    return () => clearInterval(interval);
  }, [session?.user?.id]); */

  return (
    <NotificationsContext.Provider
      value={{ checkNotifications, handleNotificationsChange }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error("useNotifications must be used inside NotificationsProvider");
  }

  return context;
}
