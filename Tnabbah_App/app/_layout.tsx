import { Stack } from "expo-router";
import { AuthProvider } from "../providers/AuthProvider";
import {
  ThemeProvider as NavigationThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <NavigationThemeProvider
        value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
      >
        <Stack
          initialRouteName="index"
          screenOptions={{
            headerShown: false,
            animation: "fade",
            animationDuration: 250,
            contentStyle: {
              backgroundColor: "#F8EEEE",
            },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="start" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />

          <Stack.Screen name="bluetooth-setup" />
          <Stack.Screen name="connection-success" />

          <Stack.Screen name="auth/reset-password" />
          <Stack.Screen name="auth/new-password" />

          <Stack.Screen name="(tabs)" />
        </Stack>

        <StatusBar style="auto" />
      </NavigationThemeProvider>
    </AuthProvider>
  );
}