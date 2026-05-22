import React, { createContext, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

export const NotificationsContext = createContext(null);

export function NotificationsProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { session } = useAuth();
    const checkingRef = useRef(false);

    const checkNotifications = async () => {
        if (checkingRef.current) return;

        const userId = session?.user?.id;
        if (!userId) return;

        checkingRef.current = true;

        try {
            const { data: settings, error: settingsError } = await supabase
                .from("user_settings")
                .select("notifications_enabled")
                .eq("user_id", userId)
                .maybeSingle();

            if (settingsError) throw settingsError;

            if (settings && settings.notifications_enabled === false) return;

            const { data: rows, error } = await supabase
                .from("notifications")
                /* .select("notification_id, title, body") */
                .select("id, title, body")
                .eq("user_id", userId)
                .eq("delivered_locally", false)
                .order("created_at", { ascending: true })
                .limit(5);

            if (error) throw error;
            if (!rows?.length) return;

            for (const item of rows) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: item.title || "تنبيه من تنبّه",
                        body: item.body || "لديك إشعار جديد",
                        sound: true,
                    },
                    trigger: null,
                });

                const { error: updateError } = await supabase
                    .from("notifications")
                    .update({
                        delivered_locally: true,
                    })
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

    useEffect(() => {
        checkNotifications();

        const interval = setInterval(checkNotifications, 30000);

        return () => clearInterval(interval);
    }, [session?.user?.id]);

    return (
        <NotificationsContext.Provider value={null}>
            {children}
        </NotificationsContext.Provider>
    );
}