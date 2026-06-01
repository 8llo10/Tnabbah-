import { ReactNode, useMemo } from "react";
import { useAppSettings } from "./AppSettingsProvider";

export type AppThemeMode = "light" | "dark";

export const APP_COLORS = {
  light: {
    mode: "light" as AppThemeMode,

    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceAlt: "#F6F6F6",
    border: "#DCDCDC",
    divider: "#E4E4E4",

    textPrimary: "#1D1D1F",
    textSecondary: "#707070",

    tabBarBackground: "#EBEBEB",
    tabInactive: "#5F5F5F",

    accent: "#871B17",
    accentPressed: "#761713",
    accentShadow: "rgba(135,27,23,0.26)",
  },

  dark: {
    mode: "dark" as AppThemeMode,

    background: "#151515",
    surface: "#202020",
    surfaceAlt: "#292929",
    border: "#3A3A3A",
    divider: "#343434",

    textPrimary: "#FFFFFF",
    textSecondary: "#C7C7C7",

    tabBarBackground: "#202020",
    tabInactive: "#C7C7C7",

    // لون أحمر أوضح في الدارك مود ويطابق هوية بوكس الحساب في الإعدادات
    accent: "#D64A43",
    accentPressed: "#B73A34",
    accentShadow: "rgba(214,74,67,0.34)",
  },
};

export function useAppTheme() {
  const { darkModeEnabled } = useAppSettings();

  return useMemo(
    () => ({
      isDark: darkModeEnabled,
      theme: darkModeEnabled ? APP_COLORS.dark : APP_COLORS.light,
    }),
    [darkModeEnabled]
  );
}

// وجود هذا المكوّن اختياري، فقط عشان لو حبيتي تلفين التطبيق باسم ThemeProvider.
// الألوان نفسها تُقرأ من useAppTheme مباشرة.
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
