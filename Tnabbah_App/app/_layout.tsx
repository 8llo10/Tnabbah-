import { Stack } from "expo-router";
import { AuthProvider } from "../providers/AuthProvider";
import * as SplashScreen from "expo-splash-screen";
import { Asset } from "expo-asset";

import {
  ThemeProvider as NavigationThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";

const APP_BACKGROUND = "#EFE7DE";

SplashScreen.preventAutoHideAsync();

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: APP_BACKGROUND,
    card: APP_BACKGROUND,
    border: "transparent",
  },
};

const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: APP_BACKGROUND,
    card: APP_BACKGROUND,
    border: "transparent",
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        await Promise.all([
          Asset.fromModule(
            require("../assets/images/start-background.png")
          ).downloadAsync(),

          Asset.fromModule(
            require("../assets/images/logo-arabic.png")
          ).downloadAsync(),

          Asset.fromModule(
            require("../assets/images/logo-english.png")
          ).downloadAsync(),

          Asset.fromModule(
            require("../assets/images/splash-logo.png")
          ).downloadAsync(),
        ]);
      } catch (error) {
        console.warn("Asset loading error:", error);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepareApp();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={styles.root}>
      <AuthProvider>
        <NavigationThemeProvider
          value={colorScheme === "dark" ? AppDarkTheme : LightTheme}
        >
          <Stack
            initialRouteName="index"
            screenOptions={{
              headerShown: false,
              animation: "none",
              contentStyle: {
                backgroundColor: APP_BACKGROUND,
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

          <StatusBar style="dark" backgroundColor={APP_BACKGROUND} />
        </NavigationThemeProvider>
      </AuthProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  },
});