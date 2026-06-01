import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

export type AppLanguage = "AR" | "EN";

type SaveUserSettingsUpdates = {
    language?: AppLanguage;
    dark_mode_enabled?: boolean;
    notifications_enabled?: boolean;
    last_car_id?: string | null;
};

type AppSettingsContextType = {
    settingsLoading: boolean;
    savingSettings: boolean;

    selectedLanguage: AppLanguage;
    darkModeEnabled: boolean;
    notificationsEnabled: boolean;

    setSelectedLanguage: React.Dispatch<React.SetStateAction<AppLanguage>>;
    setDarkModeEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    setNotificationsEnabled: React.Dispatch<React.SetStateAction<boolean>>;

    loadUserSettings: () => Promise<void>;
    saveUserSettings: (updates: SaveUserSettingsUpdates) => Promise<void>;

    handleLanguageChange: (value: AppLanguage) => Promise<void>;
    handleDarkModeChange: (value: boolean) => Promise<void>;
};

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

export function AppSettingsProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { session } = useAuth();

    const [settingsLoading, setSettingsLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>("AR");

    const loadUserSettings = async () => {
        const realUserId = session?.user?.id;

        if (!realUserId) {
            setSettingsLoading(false);
            return;
        }

        setSettingsLoading(true);

        try {
            const { data, error } = await supabase
                .from("user_settings")
                .select("language, dark_mode_enabled, notifications_enabled, last_car_id")
                .eq("user_id", realUserId)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                const { error: insertError } = await supabase
                    .from("user_settings")
                    .insert({
                        user_id: realUserId,
                        language: "AR",
                        dark_mode_enabled: false,
                        notifications_enabled: true,
                        last_car_id: null,
                    });

                if (insertError) throw insertError;
                return;
            }

            setSelectedLanguage(data.language === "EN" ? "EN" : "AR");
            setDarkModeEnabled(!!data.dark_mode_enabled);
            setNotificationsEnabled(!!data.notifications_enabled);
        } catch (error) {
            console.log("Load user settings error:", error);
        } finally {
            setSettingsLoading(false);
        }
    };

    const saveUserSettings = async (updates: SaveUserSettingsUpdates) => {
        const realUserId = session?.user?.id;
        if (!realUserId) return;

        setSavingSettings(true);

        try {
            const { error } = await supabase
                .from("user_settings")
                .upsert(
                    {
                        user_id: realUserId,
                        ...updates,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "user_id" }
                );

            if (error) throw error;
        } catch (error) {
            console.log("Save user settings error:", error);
            throw error;
        } finally {
            setSavingSettings(false);
        }
    };

    const handleDarkModeChange = async (value: boolean) => {
        setDarkModeEnabled(value);
        await saveUserSettings({ dark_mode_enabled: value });
    };

    const handleLanguageChange = async (value: AppLanguage) => {
        setSelectedLanguage(value);
        await saveUserSettings({ language: value });
    };

    useEffect(() => {
        loadUserSettings();
    }, [session?.user?.id]);

    return (
        <AppSettingsContext.Provider
            value={{
                settingsLoading,
                savingSettings,

                selectedLanguage,
                darkModeEnabled,
                notificationsEnabled,

                setSelectedLanguage,
                setDarkModeEnabled,
                setNotificationsEnabled,

                loadUserSettings,
                saveUserSettings,

                handleLanguageChange,
                handleDarkModeChange,
            }}
        >
            {children}
        </AppSettingsContext.Provider>
    );
}

export function useAppSettings() {
    const context = useContext(AppSettingsContext);

    if (!context) {
        throw new Error("useAppSettings must be used inside AppSettingsProvider");
    }

    return context;
}