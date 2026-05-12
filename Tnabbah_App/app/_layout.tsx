import { Stack } from "expo-router";
import { AuthProvider } from "../providers/AuthProvider";

import {
  ThemeProvider as NavigationThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { elmBluetoothService } from "@/services/elmBluetoothService";
import { vehicleScannerService } from "@/services/vehicleScannerService";

function ObdConnectionWatcher() {
  useEffect(() => {
    elmBluetoothService.onDisconnected(async (reason?: string) => {
      console.log("OBD disconnected from RootLayout:", reason);

      try {
        await vehicleScannerService.stopAutoScan();
      } catch (error) {
        console.log("Failed to stop scanner after OBD disconnect:", error);
      }
    });
  }, []);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ObdConnectionWatcher />

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

          <Stack.Screen name="connection-intro" />
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