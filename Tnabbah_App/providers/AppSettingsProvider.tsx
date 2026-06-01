import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const APP_DARK_MODE_KEY = "app_dark_mode_enabled";
const APP_LANGUAGE_KEY = "app_language";
const APP_NOTIFICATIONS_KEY = "app_notifications_enabled";

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

  const realUserId = session?.user?.id;

  const loadLocalSettings = async () => {
    try {
      const [localDarkMode, localLanguage, localNotifications] =
        await Promise.all([
          AsyncStorage.getItem(APP_DARK_MODE_KEY),
          AsyncStorage.getItem(APP_LANGUAGE_KEY),
          AsyncStorage.getItem(APP_NOTIFICATIONS_KEY),
        ]);

      if (localDarkMode === "true" || localDarkMode === "false") {
        setDarkModeEnabled(localDarkMode === "true");
      }

      if (localLanguage === "AR" || localLanguage === "EN") {
        setSelectedLanguage(localLanguage);
      }

      if (localNotifications === "true" || localNotifications === "false") {
        setNotificationsEnabled(localNotifications === "true");
      }
    } catch (error) {
      console.log("Load local settings error:", error);
    }
  };

  const loadUserSettings = async () => {
    setSettingsLoading(true);

    await loadLocalSettings();

    if (!realUserId) {
      setSettingsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("language, dark_mode_enabled, notifications_enabled, last_car_id")
        .eq("user_id", realUserId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const defaultSettings = {
          user_id: realUserId,
          language: selectedLanguage,
          dark_mode_enabled: darkModeEnabled,
          notifications_enabled: notificationsEnabled,
          last_car_id: null,
          updated_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from("user_settings")
          .insert(defaultSettings);

        if (insertError) throw insertError;

        setSelectedLanguage(defaultSettings.language);
        setDarkModeEnabled(defaultSettings.dark_mode_enabled);
        setNotificationsEnabled(defaultSettings.notifications_enabled);

        await Promise.all([
          AsyncStorage.setItem(APP_LANGUAGE_KEY, defaultSettings.language),
          AsyncStorage.setItem(
            APP_DARK_MODE_KEY,
            String(defaultSettings.dark_mode_enabled)
          ),
          AsyncStorage.setItem(
            APP_NOTIFICATIONS_KEY,
            String(defaultSettings.notifications_enabled)
          ),
        ]);

        return;
      }

      const dbLanguage: AppLanguage = data.language === "EN" ? "EN" : "AR";
      const dbDarkMode = !!data.dark_mode_enabled;
      const dbNotifications = !!data.notifications_enabled;

      setSelectedLanguage(dbLanguage);
      setDarkModeEnabled(dbDarkMode);
      setNotificationsEnabled(dbNotifications);

      await Promise.all([
        AsyncStorage.setItem(APP_LANGUAGE_KEY, dbLanguage),
        AsyncStorage.setItem(APP_DARK_MODE_KEY, String(dbDarkMode)),
        AsyncStorage.setItem(APP_NOTIFICATIONS_KEY, String(dbNotifications)),
      ]);
    } catch (error) {
      console.log("Load user settings error:", error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveUserSettings = async (updates: SaveUserSettingsUpdates) => {
    if (updates.language) {
      setSelectedLanguage(updates.language);
      await AsyncStorage.setItem(APP_LANGUAGE_KEY, updates.language);
    }

    if (typeof updates.dark_mode_enabled === "boolean") {
      setDarkModeEnabled(updates.dark_mode_enabled);
      await AsyncStorage.setItem(
        APP_DARK_MODE_KEY,
        String(updates.dark_mode_enabled)
      );
    }

    if (typeof updates.notifications_enabled === "boolean") {
      setNotificationsEnabled(updates.notifications_enabled);
      await AsyncStorage.setItem(
        APP_NOTIFICATIONS_KEY,
        String(updates.notifications_enabled)
      );
    }

    if (!realUserId) return;

    setSavingSettings(true);

    try {
      const { error } = await supabase.from("user_settings").upsert(
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
    await saveUserSettings({ dark_mode_enabled: value });
  };

  const handleLanguageChange = async (value: AppLanguage) => {
    await saveUserSettings({ language: value });

    try {
      if (realUserId) {
        await supabase.auth.updateUser({
          data: {
            language: value,
          },
        });
      }
    } catch (error) {
      console.log("Update auth language error:", error);
    }
  };

  useEffect(() => {
    loadUserSettings();
  }, [realUserId]);

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
